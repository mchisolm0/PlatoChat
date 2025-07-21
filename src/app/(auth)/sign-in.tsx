import { useState } from "react"
import { View } from "react-native"
import { Link, useRouter } from "expo-router"
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo"
import { ClerkAPIError } from "@clerk/types"
import { KeyboardToolbar } from "react-native-keyboard-controller"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { spacing } from "@/theme/spacing"

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<ClerkAPIError[]>([])

  const onSignInPress = async () => {
    if (!isLoaded) return

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace("/(drawer)/")
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setErrors(error.errors)
      } else {
        console.error(JSON.stringify(error, null, 2))
      }
    }
  }

  return (
    <>
      <Screen
        preset="fixed"
        contentContainerStyle={{ flex: 1, paddingHorizontal: spacing.lg }}
        safeAreaEdges={["top"]}
      >
        <View style={{ position: "absolute", top: spacing.md, left: spacing.md, zIndex: 1 }}>
          <PressableIcon icon="back" onPress={() => router.back()} size={24} />
        </View>
        <View
          style={{
            paddingVertical: spacing.xl,
            alignItems: "center",
            minHeight: spacing.md,
          }}
        >
          <Text tx="common:appName" preset="heading" />
          <Text tx="common:appTagline" preset="subheading" />
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              width: "100%",
              gap: spacing.md,
              alignItems: "center",
            }}
          >
            <Text tx="auth:signInTitle" preset="subheading" />
            <TextField
              autoCapitalize="none"
              value={emailAddress}
              placeholderTx="auth:emailPlaceholder"
              onChangeText={(emailAddress: string) => setEmailAddress(emailAddress)}
              inputWrapperStyle={{ width: "100%" }}
            />
            <TextField
              value={password}
              placeholderTx="auth:passwordPlaceholder"
              secureTextEntry={true}
              onChangeText={(password: string) => setPassword(password)}
              inputWrapperStyle={{ width: "100%" }}
            />
            <View style={{ minHeight: spacing.xl, justifyContent: "center" }}>
              {errors.map((error) => (
                <Text key={error.code} text={error.message} preset="error" />
              ))}
            </View>
          </View>
          <View style={{ width: "100%", alignItems: "center" }}>
            <Button tx="auth:signin" onPress={onSignInPress} style={{ width: "100%" }} />
            <View style={{ flexDirection: "row", gap: spacing.xs }}>
              <Text tx="auth:noAccount" />
              <Link href="/sign-up" onPress={() => router.replace("/sign-up")}>
                <Text tx="auth:signup" />
              </Link>
            </View>
          </View>
        </View>
      </Screen>
      <KeyboardToolbar showArrows={true} insets={{ left: 16, right: 0 }} />
    </>
  )
}

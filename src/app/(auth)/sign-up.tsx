import { useState } from "react"
import { View, Platform } from "react-native"
import { Link, useRouter } from "expo-router"
import { KeyboardAvoidingView } from "react-native-keyboard-controller"
import { isClerkAPIResponseError, useSignUp } from "@clerk/clerk-expo"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { spacing } from "@/theme/spacing"
import { ClerkAPIError } from "@clerk/types"

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<ClerkAPIError[]>([])

  const onSignUpPress = async () => {
    if (!isLoaded) return

    try {
      await signUp.create({
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setPendingVerification(true)
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setErrors(error.errors)
      }
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace("/")
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setErrors(error.errors)
      }
    }
  }

  if (pendingVerification) {
    return (
      <>
        <Text tx="auth:verifyEmail" />
        <TextField
          value={code}
          placeholderTx="auth:verifyEmailCode"
          onChangeText={(code: string) => setCode(code)}
        />
        <Button tx="auth:verifyEmailCode" onPress={onVerifyPress} />
      </>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={{ flex: 1 }} safeAreaEdges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ paddingVertical: spacing.xl * 2, alignItems: "center" }}>
          <Text tx="common:appName" preset="heading" />
          <Text tx="common:appTagline" preset="subheading" />
        </View>

        <View style={{
          paddingHorizontal: spacing.lg,
          gap: spacing.md,
          alignItems: "center",
        }}>
          <Text tx="auth:createAccountTitle" preset="subheading" />
          <Text tx="auth:createAccountSubTitle" />
          <TextField
            autoCapitalize="none"
            value={emailAddress}
            placeholderTx="auth:emailPlaceholder"
            onChangeText={(email: string) => setEmailAddress(email)}
            inputWrapperStyle={{ width: "100%" }}
          />
          <TextField
            value={password}
            placeholderTx="auth:passwordPlaceholder"
            secureTextEntry={true}
            onChangeText={(password: string) => setPassword(password)}
            inputWrapperStyle={{ width: "100%" }}
          />
          <TextField
            value={confirmPassword}
            placeholderTx="auth:confirmPassword"
            secureTextEntry={true}
            onChangeText={(confirmPassword: string) => setConfirmPassword(confirmPassword)}
            inputWrapperStyle={{ width: "100%" }}
          />
          <View style={{ minHeight: spacing.xl * 2, justifyContent: "center" }}>
            {errors.map((error) => (
              <Text key={error.code} text={error.message} preset="error" />
            ))}
          </View>
          <Button tx="common:continue" onPress={onSignUpPress} style={{ width: "100%" }} />
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            <Text tx="auth:haveAccount" />
            <Link href="/sign-in">
              <Text tx="auth:signin" />
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

import { useState, useCallback, useRef } from "react"
import { View } from "react-native"
import { Link, useRouter } from "expo-router"
import { isClerkAPIResponseError, useSignUp } from "@clerk/clerk-expo"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { spacing } from "@/theme/spacing"
import { ClerkAPIError } from "@clerk/types"
import { KeyboardToolbar } from "react-native-keyboard-controller"

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [formData, setFormData] = useState({
    emailAddress: "",
    password: "",
    confirmPassword: "",
  })
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const [errors, setErrors] = useState<ClerkAPIError[]>([])

  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const updateField = useCallback((field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const onSignUpPress = async () => {
    if (!isLoaded) return

    try {
      await signUp.create({
        emailAddress: formData.emailAddress,
        password: formData.password,
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
    <>
      <Screen preset="fixed" contentContainerStyle={{ flex: 1, paddingHorizontal: spacing.lg }} safeAreaEdges={["top"]}>
        <View style={{
          paddingVertical: spacing.xl,
          alignItems: "center",
          minHeight: spacing.lg
        }}>
          <Text tx="common:appName" preset="heading" />
          <Text tx="common:appTagline" preset="subheading" />
        </View>

        <View style={{
          flex: 1,
          justifyContent: "space-between",
          minHeight: spacing.xl * 10
        }}>
          <View style={{
            width: "100%",
            gap: spacing.md,
            alignItems: "center",
          }}>
            <Text tx="auth:createAccountSubTitle" />

            <TextField
              autoCapitalize="none"
              value={formData.emailAddress}
              placeholderTx="auth:emailPlaceholder"
              onChangeText={updateField("emailAddress")}
              inputWrapperStyle={{ width: "100%" }}
            />
            <TextField
              ref={passwordRef}
              value={formData.password}
              placeholderTx="auth:passwordPlaceholder"
              secureTextEntry={true}
              onChangeText={updateField("password")}
              inputWrapperStyle={{ width: "100%" }}
            />
            <TextField
              ref={confirmPasswordRef}
              value={formData.confirmPassword}
              placeholderTx="auth:confirmPassword"
              secureTextEntry={true}
              onChangeText={updateField("confirmPassword")}
              inputWrapperStyle={{ width: "100%" }}
            />
          </View>
          <View style={{ minHeight: spacing.xl * 2, justifyContent: "center", alignItems: "center" }}>
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
        </View>
      </Screen>
      <KeyboardToolbar
        showArrows={true}
        insets={{ left: 16, right: 0 }}

      />
    </>
  )
}

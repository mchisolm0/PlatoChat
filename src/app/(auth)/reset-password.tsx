import { useState } from "react"
import { View } from "react-native"
import { Link, useRouter } from "expo-router"
import { useSignUp } from "@clerk/clerk-expo"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")

  const onSignUpPress = async () => {
    if (!isLoaded) return

    try {
      await signUp.create({
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setPendingVerification(true)
    } catch (err) {
      // todo: See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
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
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
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
    <View>
      <>
        <Text>Sign up</Text>
        <TextField
          autoCapitalize="none"
          value={emailAddress}
          placeholderTx="auth:emailPlaceholder"
          onChangeText={(email: string) => setEmailAddress(email)}
        />
        <TextField
          value={password}
          placeholderTx="auth:passwordPlaceholder"
          secureTextEntry={true}
          onChangeText={(password: string) => setPassword(password)}
        />
        <Button tx="common:continue" onPress={onSignUpPress} />
        <View style={{ display: "flex", flexDirection: "row", gap: 3 }}>
          <Text tx="auth:haveAccount" />
          <Link href="/sign-in">
            <Text tx="auth:signin" />
          </Link>
        </View>
      </>
    </View>
  )
}

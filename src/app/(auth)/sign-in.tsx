import { useState } from "react"
import { View } from "react-native"
import { Link, useRouter } from "expo-router"
import { useSignIn } from "@clerk/clerk-expo"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")

  const onSignInPress = async () => {
    if (!isLoaded) return

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace("/")
      } else {
        // todo: If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <View>
      <Text tx="auth:signin" />
      <TextField
        autoCapitalize="none"
        value={emailAddress}
        placeholderTx="auth:emailPlaceholder"
        onChangeText={(emailAddress: string) => setEmailAddress(emailAddress)}
      />
      <TextField
        value={password}
        placeholderTx="auth:passwordPlaceholder"
        secureTextEntry={true}
        onChangeText={(password: string) => setPassword(password)}
      />
      <Button tx="auth:signin" onPress={onSignInPress} />
      <View style={{ display: "flex", flexDirection: "row", gap: 3 }}>
        <Text tx="auth:noAccount" />
        <Link href="/sign-up" asChild>
          <Text tx="auth:signup" />
        </Link>
      </View>
    </View>
  )
}

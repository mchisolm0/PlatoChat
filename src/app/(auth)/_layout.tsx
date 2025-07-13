import { Redirect, Stack } from "expo-router"
import { useConvexAuth } from "convex/react"

export default function GuestLayout() {
  const { isAuthenticated } = useConvexAuth()

  if (isAuthenticated) {
    return <Redirect href="/" />
  }

  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
    </Stack>
  )
}

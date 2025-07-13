import { Redirect, Stack } from "expo-router"
import { useConvexAuth } from "convex/react"

export default function SettingsLayout() {
  const { isAuthenticated } = useConvexAuth()

  if (!isAuthenticated) {
    return <Redirect href="/" />
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ presentation: "modal" }} />
    </Stack>
  )
}

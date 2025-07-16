import { Redirect, Stack } from "expo-router"
import { useConvexAuth } from "convex/react"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { useRouter } from "expo-router"

export default function SettingsLayout() {
  const { isAuthenticated } = useConvexAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    return <Redirect href="/" />
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerLeft: () => (
            <Button style={{}} onPress={() => router.back()}>
              <Icon icon="back" />
            </Button>
          ),
        }}
      />
      <Stack.Screen name="reset-password" options={{ presentation: "modal" }} />
    </Stack>
  )
}

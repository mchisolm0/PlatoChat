import { Stack } from 'expo-router/stack'
import { useRouter } from 'expo-router'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'

export default function Layout() {
  const router = useRouter()

  return <Stack>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="chat" options={{
      headerShown: true,
      title: "New Chat",
      headerLeft: () => <Button onPress={() => router.back()}>
        <Icon icon="back" />
      </Button>,
    }} />
  </Stack>
}
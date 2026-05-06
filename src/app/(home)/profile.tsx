import { UserProfileView } from '@clerk/expo/native'
import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function ProfileScreen() {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
  const router = useRouter()

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/(auth)/sign-in')
    }
  }, [isSignedIn])

  return <UserProfileView style={{ flex: 1 }} />
}

import { useState, useCallback } from "react"
import { ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQuery, useConvexAuth } from "convex/react"
import { Drawer } from "expo-router/drawer"

import { api } from "convex/_generated/api"

import CustomDrawer from "@/components/CustomDrawer"
import { PressableIcon } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import { getAnonymousUserId } from "@/utils/anonymousUser"
import { reportCrash, ErrorType } from "@/utils/crashReporting"

interface CreateThreadIconProps {
  isCreatingThread: boolean
  color: string
  onPress: () => void
}

const CreateThreadIcon: React.FC<CreateThreadIconProps> = ({
  isCreatingThread,
  color,
  onPress,
}) => {
  return isCreatingThread ? (
    <ActivityIndicator size="small" color={color} style={{ marginRight: spacing.md }} />
  ) : (
    <PressableIcon
      icon="plus"
      size={spacing.lg}
      color={color}
      style={{ marginRight: spacing.md }}
      onPress={onPress}
    />
  )
}

export default function Layout() {
  const { theme } = useAppTheme()
  const { isAuthenticated } = useConvexAuth()
  const createThread = useMutation(api.chat.createThread)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatingThread, setIsCreatingThread] = useState(false)

  const anonymousUserId = !isAuthenticated ? getAnonymousUserId() : undefined

  const userThreads = useQuery(
    api.chat.listUserThreads,
    isAuthenticated || anonymousUserId
      ? {
          query: searchQuery,
          limit: 20,
          paginationOpts: { cursor: null, numItems: 20 },
          ...(anonymousUserId && { anonymousUserId }),
        }
      : "skip",
  )

  const router = useRouter()

  const handleLogin = () => {
    router.push("/(auth)/sign-in")
  }

  const handleThreadPress = useCallback(
    (navigation: any) => (threadId: string) => {
      router.push({ pathname: "/(drawer)/[threadId]", params: { threadId } })
      navigation.closeDrawer()
    },
    [router],
  )

  const handleCreateThreadPress = useCallback(async () => {
    if (isCreatingThread) return

    setIsCreatingThread(true)

    try {
      const threadArgs = isAuthenticated ? {} : { anonymousUserId }
      const threadId = await createThread(threadArgs)

      router.replace({ pathname: "/(drawer)/[threadId]", params: { threadId } })
    } catch (error) {
      console.error("Failed to create thread:", error)
      reportCrash(error as Error, ErrorType.HANDLED)
    } finally {
      setIsCreatingThread(false)
    }
  }, [isCreatingThread, isAuthenticated, anonymousUserId, createThread, router])

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerRight: () => (
          <CreateThreadIcon
            isCreatingThread={isCreatingThread}
            color={theme.colors.palette.primary500}
            onPress={handleCreateThreadPress}
          />
        ),
        headerTitleStyle: {
          color: theme.colors.text,
        },
      }}
      drawerContent={(props) => (
        <CustomDrawer
          {...props}
          chatThreads={userThreads}
          handleThreadPress={handleThreadPress(props.navigation)}
          onLogin={handleLogin}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
        />
      )}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "New Chat",
        }}
      />
      <Drawer.Screen
        name="[threadId]"
        options={({ route }) => {
          const threadId = (route.params as any)?.threadId as string
          const thread = userThreads?.find((t: any) => t._id === threadId)
          return {
            title: thread?.title || "Chat",
          }
        }}
      />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  )
}

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "expo-router"
import * as Sentry from "@sentry/react-native"
import { useMutation, useQuery, useConvexAuth } from "convex/react"
import { Drawer } from "expo-router/drawer"

import { api } from "convex/_generated/api"

import CustomDrawer from "@/components/CustomDrawer"
import { PressableIcon } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import { getAnonymousUserId } from "@/utils/anonymousUser"

export default function Layout() {
  const { theme } = useAppTheme()
  const { isAuthenticated } = useConvexAuth()
  const createThread = useMutation(api.chat.createThread)
  const createThreadAnonymous = useMutation(api.chat.createThreadAnonymous)
  const [searchQuery, setSearchQuery] = useState("")

  const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null)

  useEffect(() => {
    const id = getAnonymousUserId()
    setAnonymousUserId(id)
  }, [])
  const authenticatedThreads = useQuery(
    api.chat.listUserThreads,
    isAuthenticated
      ? {
        query: searchQuery,
        limit: 20,
        paginationOpts: { cursor: null, numItems: 20 },
      }
      : "skip",
  )

  const anonymousThreads = useQuery(
    api.chat.listUserThreadsAnonymous,
    !isAuthenticated && anonymousUserId
      ? {
        anonymousUserId,
        query: searchQuery,
        limit: 20,
        paginationOpts: { cursor: null, numItems: 20 },
      }
      : "skip",
  )

  const threads = isAuthenticated ? authenticatedThreads : anonymousThreads
  const router = useRouter()

  const handleLogin = () => {
    router.push("/sign-in")
  }

  const handleThreadPress = useCallback(
    (navigation: any) => (threadId: string) => {
      router.push({ pathname: "/[threadId]", params: { threadId } })
      navigation.closeDrawer()
    },
    [router],
  )

  const handleCreateThreadPress = useCallback(() => {
    if (isAuthenticated) {
      createThread().then((threadId) =>
        router.replace({ pathname: "/[threadId]", params: { threadId } }),
      )
    } else if (anonymousUserId) {
      createThreadAnonymous({ anonymousUserId }).then((threadId) =>
        router.replace({ pathname: "/[threadId]", params: { threadId } }),
      )
    } else {
      Sentry.captureException(
        new Error("Cannot create thread: anonymous user ID not yet initialized"),
      )
      console.warn("Cannot create thread: anonymous user ID not yet initialized")
    }
  }, [isAuthenticated, createThread, createThreadAnonymous, anonymousUserId, router])

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTitleStyle: {
          color: theme.colors.text,
        },
      }}
      drawerContent={(props) => (
        <CustomDrawer
          {...props}
          chatThreads={threads}
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
          headerRight: () => (
            <PressableIcon
              icon="plus"
              size={spacing.lg}
              color={theme.colors.palette.primary500}
              style={{ marginRight: spacing.md }}
              onPress={handleCreateThreadPress}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="[threadId]"
        options={({ route }) => {
          const threadId = (route.params as any)?.threadId as string
          const thread = threads?.find((t: any) => t._id === threadId)
          return {
            title: thread?.title || "Chat",
            headerRight: () => (
              <PressableIcon
                icon="plus"
                size={spacing.lg}
                color={theme.colors.palette.primary500}
                style={{ marginRight: spacing.md }}
                onPress={handleCreateThreadPress}
              />
            ),
          }
        }}
      />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  )
}

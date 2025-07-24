import { useState, useCallback } from "react"
import { useRouter } from "expo-router"
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
  const [searchQuery, setSearchQuery] = useState("")

  const userThreads = useQuery(
    api.chat.listUserThreads,
    isAuthenticated
      ? {
          query: searchQuery,
          limit: 20,
          paginationOpts: { cursor: null, numItems: 20 },
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

  const handleCreateThreadPress = useCallback(() => {
    const threadArgs = isAuthenticated ? {} : { anonymousUserId: getAnonymousUserId() }
    createThread(threadArgs).then((threadId) =>
      router.replace({ pathname: "/(drawer)/[threadId]", params: { threadId } }),
    )
  }, [createThread, router, isAuthenticated])

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
          const thread = userThreads?.find((t: any) => t._id === threadId)
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

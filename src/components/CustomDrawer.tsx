// components/CustomDrawer.tsx
import { useRef, useState } from "react"
import { View, ViewStyle, TextStyle, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useClerk, useUserProfileModal } from "@clerk/expo"
import { AuthView, UserButton } from "@clerk/expo/native"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"

import { Button } from "@/components/Button"
import { ListView, ListViewRef } from "@/components/ListView"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

import { Text } from "./Text"
import { TextField } from "./TextField"

interface ChatThread {
  _creationTime: number
  _id: string
  status: "active" | "archived"
  userId?: string
  title?: string
  summary?: string
}

interface CustomDrawerProps {
  chatThreads: ChatThread[] | undefined
  handleThreadPress: (threadId: string) => void
  onSearchChange: (query: string) => void
  searchQuery: string
}

export default function CustomDrawer({
  chatThreads,
  handleThreadPress,
  onSearchChange,
  searchQuery,
}: CustomDrawerProps) {
  const { themed } = useAppTheme()
  const { user } = useClerk()
  const { presentUserProfile } = useUserProfileModal()
  const insets = useSafeAreaInsetsStyle(["top", "bottom"])

  const [authOpen, setAuthOpen] = useState(false)
  const [authKey, setAuthKey] = useState(0)

  const openAuth = () => {
    setAuthOpen(false)
    requestAnimationFrame(() => {
      setAuthKey((k) => k + 1)
      setAuthOpen(true)
    })
  }

  const listRef = useRef<ListViewRef<ChatThread>>(null)

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true })
  }

  const ThreadItem = ({ thread }: { thread: ChatThread }) => {
    return <Button text={thread.title} onPress={() => handleThreadPress(thread._id)} />
  }

  const renderChatThread = ({ item }: { item: ChatThread }) => <ThreadItem thread={item} />

  return (
    <View style={[themed($container), insets]}>
      <View style={themed($topSection)}>
        <View style={themed($searchContainer)}>
          <TextField
            placeholder="Search chats…"
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholderTextColor="#666"
          />
        </View>
        <View style={themed($listSection)}>
          <ListView
            ref={listRef}
            data={chatThreads}
            keyExtractor={(t: ChatThread) => t._id}
            renderItem={renderChatThread}
            estimatedItemSize={56}
            showsVerticalScrollIndicator={true}
            scrollEnabled
            contentInsetAdjustmentBehavior="automatic"
            onContentSizeChange={scrollToTop}
          />
        </View>
      </View>
      <View style={themed($userSection)}>
        <Authenticated>
          <View style={themed($bottomSection)}>
            <View style={themed($userButton)}>
              <UserButton />
            </View>
            <Text text={user?.firstName || "Anonymous"} />
          </View>
        </Authenticated>
        <AuthLoading>
          <ActivityIndicator size={"small"} style={themed($activityIndicator)} />
        </AuthLoading>
        <Unauthenticated>
          <Button tx="auth:signin" onPress={openAuth} />
          {authOpen ? <AuthView key={authKey} mode="signInOrUp" isDismissable={true} /> : null}
        </Unauthenticated>
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  backgroundColor: theme.colors.palette.neutral100,
  justifyContent: "space-between",
})

const $searchContainer: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.xs,
})

const $activityIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
})

const $topSection: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $listSection: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  paddingHorizontal: theme.spacing.xs,
})

const $userSection: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.md,
  borderTopWidth: 1,
  borderTopColor: theme.colors.palette.neutral300,
})

const $bottomSection: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $userButton: ThemedStyle<ViewStyle> = (theme) => ({
  height: theme.spacing.lg,
  width: theme.spacing.lg,
  borderRadius: theme.spacing.lg,
  overflow: "hidden",
})

const $signOutContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "stretch",
})

const $loadingContainer: ThemedStyle<ViewStyle> = (theme) => ({
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing.lg,
})

const $loadingText: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.textDim,
  fontSize: 16,
})

const $userName: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 16,
  fontWeight: "600",
  color: theme.colors.palette.neutral800,
  marginBottom: theme.spacing.xxs,
})

const $userEmail: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 14,
  color: theme.colors.palette.neutral600,
  marginBottom: theme.spacing.sm,
})

const $loginButton: ThemedStyle<ViewStyle> = (theme) => ({
  backgroundColor: theme.colors.palette.primary500,
  paddingVertical: theme.spacing.sm,
  paddingHorizontal: theme.spacing.lg,
  borderRadius: theme.spacing.sm,
  alignItems: "center",
})

const $loginText: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.palette.neutral100,
  fontSize: 16,
  fontWeight: "600",
})

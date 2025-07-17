// components/CustomDrawer.tsx
import { useRef } from "react"
import { View, TouchableOpacity, ViewStyle, TextStyle } from "react-native"
import { Link } from "expo-router"
import { useClerk } from "@clerk/clerk-expo"
import { DrawerContentComponentProps } from "@react-navigation/drawer"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"

import { Button } from "@/components/Button"
import { ListView, ListViewRef } from "@/components/ListView"
import { SignOutButton } from "@/components/SignOutButton"
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

interface CustomDrawerProps extends DrawerContentComponentProps {
  chatThreads: ChatThread[] | undefined
  handleThreadPress: (threadId: string) => void
  onLogin: () => void
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
  const insets = useSafeAreaInsetsStyle(["top", "bottom"])

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
          <View style={themed($userProfileContainer)}>
            <View style={themed($userAvatar)}>
              <Text style={themed($userAvatarText)}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <View style={themed($userDetails)}>
              <Text style={themed($userName)} numberOfLines={1}>
                {user?.fullName || "User"}
              </Text>
              <Text style={themed($userEmail)} numberOfLines={1}>
                {user?.emailAddresses?.[0]?.emailAddress || "No email"}
              </Text>
            </View>
          </View>
          <View style={themed($signOutContainer)}>
            <SignOutButton />
          </View>
        </Authenticated>
        <AuthLoading>
          <View style={themed($loadingContainer)}>
            <Text style={themed($loadingText)}>Loading...</Text>
          </View>
        </AuthLoading>
        <Unauthenticated>
          <Link href="/sign-in" asChild>
            <TouchableOpacity style={themed($loginButton)}>
              <Text style={themed($loginText)}>Sign In</Text>
            </TouchableOpacity>
          </Link>
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

const $userProfileContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing.sm,
  backgroundColor: theme.colors.palette.neutral100,
  borderRadius: theme.spacing.md,
  marginBottom: theme.spacing.sm,
})

const $userAvatar: ThemedStyle<ViewStyle> = (theme) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: theme.colors.palette.primary500,
  alignItems: "center",
  justifyContent: "center",
  marginRight: theme.spacing.sm,
})

const $userAvatarText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 20,
  fontWeight: "600",
  color: theme.colors.palette.neutral100,
})

const $userDetails: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
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

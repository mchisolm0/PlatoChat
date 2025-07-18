import { useState, useCallback, useRef } from "react"
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"
import { useThreadMessages } from "@convex-dev/agent/react"
import { useConvexAuth } from "convex/react"

import { api } from "convex/_generated/api"

import { useAppTheme } from "@/theme/context"
import { getAnonymousUserId } from "@/utils/anonymousUser"

import { Button } from "./Button"
import { Card } from "./Card"
import { Text } from "./Text"

type MessageContent =
  | string
  | Array<{
      text?: string
      type: string
      [key: string]: any
    }>

type BaseMessage = {
  _id?: string
  _creationTime?: number
  agentName?: string
  embeddingId?: string
  message?: {
    content?: MessageContent
    role?: "user" | "assistant" | "system" | "tool"
    [key: string]: any
  }
  order?: number
  status?: string
  stepOrder?: number
  text?: string
  threadId?: string
  tool?: boolean
  userId?: string
  streaming?: boolean
  [key: string]: any
}

type AssistantMessage = BaseMessage & {
  finishReason?: string
  model?: string
  provider?: string
  providerMetadata?: {
    openai?: {
      acceptedPredictionTokens: number
      cachedPromptTokens: number
      reasoningTokens: number
      rejectedPredictionTokens: number
    }
  }
  reasoningDetails?: any[]
  sources?: any[]
  usage?: {
    completionTokens: number
    promptTokens: number
    totalTokens: number
  }
  warnings?: any[]
}

type Response = BaseMessage | AssistantMessage

interface PaginationOptions {
  cursor?: string | null
  numItems: number
}

interface Props {
  threadId: string
  optimisticMessages?: Response[]
  pageSize?: number
}

const MessageItem: React.FC<{ response: Response }> = ({ response }) => {
  const role = response.role || response.message?.role || "assistant"
  let contentText = ""
  const content = response.message?.content || response.text

  const { theme } = useAppTheme()

  if (Array.isArray(content)) {
    contentText = content
      .filter((part) => part.type === "text" && part.text)
      .map((part) => part.text || "")
      .join("\n")
  } else if (typeof content === "string") {
    contentText = content
  }

  const isUser = role === "user"
  const $baseStyle: ViewStyle = {
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xxs,
    borderRadius: theme.spacing.md,
    maxWidth: "80%",
  }
  const $userStyle: ViewStyle = {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.palette.primary400,
    marginRight: theme.spacing.md,
  }
  const $assistantStyle: ViewStyle = {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.palette.neutral400,
    marginLeft: theme.spacing.md,
  }
  const $messageStyle = { ...$baseStyle, ...(isUser ? $userStyle : $assistantStyle) }

  return (
    <Card
      heading={role.charAt(0).toUpperCase() + role.slice(1)}
      content={contentText || "(No content)"}
      style={$messageStyle}
    />
  )
}

export const MessageList: React.FC<Props> = ({ threadId, pageSize = 10 }) => {
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [retryCount, setRetryCount] = useState<number>(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const { isAuthenticated } = useConvexAuth()
  const router = useRouter()

  const isValidThreadId = threadId && threadId !== "chat" && threadId.length >= 10

  // Use retryCount as dependency to force re-evaluation of anonymous ID
  const anonymousUserId = !isAuthenticated ? getAnonymousUserId() : null
  // retryCount is used to trigger re-renders when user clicks "Try Again"
  const _retryTrigger = retryCount

  const {
    results: authenticatedMessages,
    status: authenticatedStatus,
    loadMore: authenticatedLoadMore,
  } = useThreadMessages(
    api.chat.listThreadMessages,
    isValidThreadId && isAuthenticated ? { threadId: threadId as any } : "skip",
    { initialNumItems: pageSize, stream: true },
  )

  const {
    results: anonymousMessages,
    status: anonymousStatus,
    loadMore: anonymousLoadMore,
  } = useThreadMessages(
    api.chat.listThreadMessagesAnonymous,
    isValidThreadId && !isAuthenticated && anonymousUserId
      ? { threadId: threadId as any, anonymousUserId }
      : "skip",
    { initialNumItems: pageSize, stream: true },
  )

  const messagesResult = isAuthenticated ? authenticatedMessages : anonymousMessages
  const status = isAuthenticated ? authenticatedStatus : anonymousStatus
  const loadMore = isAuthenticated ? authenticatedLoadMore : anonymousLoadMore

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent
      const isNearTop = contentOffset.y < 100
      if (isNearTop && status === "CanLoadMore" && !isLoadingMore) {
        setIsLoadingMore(true)
        try {
          loadMore(pageSize)
        } catch (error) {
          console.error(error)
        } finally {
          setIsLoadingMore(false)
        }
      }
    },
    [status, isLoadingMore, pageSize, loadMore],
  )

  if (!isValidThreadId) {
    return (
      <View style={{ flex: 1 }}>
        <Text>Invalid thread ID</Text>
      </View>
    )
  }

  if (!isAuthenticated && !anonymousUserId) {
    const handleRetry = () => {
      setRetryCount((prev) => prev + 1)
      // Force re-render to try getting anonymous ID again
    }

    const handleSignIn = () => {
      router.push("/sign-in")
    }

    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg }}
      >
        <Text style={{ textAlign: "center", marginBottom: spacing.md }}>
          Unable to load messages. Please try again or sign in for the best experience.
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Button text="Try Again" onPress={handleRetry} />
          <Button text="Sign In" onPress={handleSignIn} />
        </View>
      </View>
    )
  }

  const serverMessages = messagesResult || []

  if (serverMessages.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <Text>No messages</Text>
      </View>
    )
  }

  return (
    <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={400}>
      {serverMessages.map((item, index) => (
        <MessageItem key={item._id ?? item.id ?? index} response={item} />
      ))}
    </ScrollView>
  )
}

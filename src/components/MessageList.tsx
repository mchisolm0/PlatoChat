import { useState, useCallback, useRef } from "react"
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
  ViewStyle,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { useThreadMessages, toUIMessages, useSmoothText } from "@convex-dev/agent/react"
import { useConvexAuth, useMutation } from "convex/react"

import { api } from "convex/_generated/api"

import { useAppTheme } from "@/theme/context"
import { getAnonymousUserId } from "@/utils/anonymousUser"
import { useResponsive } from "@/utils/useResponsive"

import { Button } from "./Button"
import { Card } from "./Card"
import { MessageActions } from "./MessageActions"
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

interface UIMessage {
  key: string
  role?: "user" | "assistant" | "system" | "tool" | "data"
  content?: string | Array<{ text?: string; type: string; [key: string]: any }>
  parts?: Array<{ text?: string; type: string; [key: string]: any }>
  _id?: string
  _creationTime?: number
  agentName?: string
  text?: string
  streaming?: boolean
  [key: string]: any
}

interface PaginationOptions {
  cursor?: string | null
  numItems: number
}

interface Props {
  threadId: string
  optimisticMessages?: Response[]
  pageSize?: number
}

interface MessageItemProps {
  response: UIMessage
  threadId: string
  isLastUserMessage: boolean
  isActionsVisible: boolean
  onEdit: (messageId: string, newText: string) => void
  onRetry: (messageId: string, modelId?: string) => void
  onMessageTap: (messageId: string) => void
  onLongPress: (messageId: string) => void
  showBottomSheet: boolean
  onBottomSheetClose: () => void
  onHoverStart?: (messageId: string) => void
  onHoverEnd?: (messageId: string) => void
}

const MessageItem: React.FC<MessageItemProps> = ({
  response,
  threadId,
  isLastUserMessage,
  isActionsVisible,
  onEdit,
  onRetry,
  onMessageTap,
  onLongPress,
  showBottomSheet,
  onBottomSheetClose,
  onHoverStart,
  onHoverEnd,
}) => {
  const { theme } = useAppTheme()
  const { isSmall } = useResponsive()

  const role = response.role || "assistant"

  let contentText = ""

  if (response.content && typeof response.content === "string") {
    contentText = response.content
  } else if (response.parts && Array.isArray(response.parts)) {
    contentText = response.parts
      .filter((part: any) => part.type === "text" && part.text)
      .map((part: any) => part.text)
      .join("\n")
  }

  const [visibleText] = useSmoothText(contentText)

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

  const handleMessageTap = () => {
    onMessageTap(response.key)
  }

  const handleLongPress = () => {
    onLongPress(response.key)
  }

  const handleHoverIn = () => {
    if (!isSmall && onHoverStart) {
      onHoverStart(response.key)
    }
  }

  const handleHoverOut = () => {
    if (!isSmall && onHoverEnd) {
      onHoverEnd(response.key)
    }
  }

  const messageCard = (
    <Card
      heading={role.charAt(0).toUpperCase() + role.slice(1)}
      content={visibleText || "(No content)"}
      style={$messageStyle}
    />
  )

  return (
    <View>
      <Pressable
        onPress={handleMessageTap}
        onLongPress={isSmall ? handleLongPress : undefined}
        onHoverIn={!isSmall ? handleHoverIn : undefined}
        onHoverOut={!isSmall ? handleHoverOut : undefined}
      >
        {messageCard}
      </Pressable>
      <MessageActions
        messageId={response._id}
        messageText={contentText}
        role={role as "user" | "assistant" | "system" | "tool"}
        isLastUserMessage={isLastUserMessage}
        threadId={threadId}
        isVisible={isActionsVisible}
        onEdit={onEdit}
        onRetry={onRetry}
        showBottomSheet={showBottomSheet}
        onBottomSheetClose={onBottomSheetClose}
      />
    </View>
  )
}

export const MessageList: React.FC<Props> = ({ threadId, pageSize = 10 }) => {
  const { theme } = useAppTheme()
  const { isAuthenticated } = useConvexAuth()
  const router = useRouter()
  const scrollViewRef = useRef<ScrollView>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [visibleActionsMessageId, setVisibleActionsMessageId] = useState<string | null>(null)
  const [bottomSheetMessageId, setBottomSheetMessageId] = useState<string | null>(null)

  // Mutation handlers
  const editMessage = useMutation(api.chat.editMessage)
  const retryMessage = useMutation(api.chat.retryMessage)

  // Callback handlers for message actions
  const handleEditMessage = useCallback(
    async (messageId: string, newText: string) => {
      try {
        const anonymousUserId = !isAuthenticated ? getAnonymousUserId() : null
        await editMessage({
          messageId,
          threadId,
          newText,
          anonymousUserId: anonymousUserId || undefined,
        })
      } catch (error) {
        console.error("Failed to edit message:", error)
        Alert.alert(
          "Edit Failed",
          error instanceof Error ? error.message : "Failed to edit message",
        )
      }
    },
    [editMessage, threadId, isAuthenticated],
  )

  const handleRetryMessage = useCallback(
    async (messageId: string, modelId?: string) => {
      try {
        const anonymousUserId = !isAuthenticated ? getAnonymousUserId() : null
        await retryMessage({
          messageId,
          threadId,
          modelId,
          anonymousUserId: anonymousUserId || undefined,
        })
      } catch (error) {
        console.error("Failed to retry message:", error)
        Alert.alert(
          "Retry Failed",
          error instanceof Error ? error.message : "Failed to retry message",
        )
      }
    },
    [retryMessage, threadId, isAuthenticated],
  )

  const handleMessageTap = useCallback(
    (messageId: string) => {
      // If tapping the same message that's already visible, hide it first then show it again
      if (visibleActionsMessageId === messageId) {
        setVisibleActionsMessageId(null)
        // Use a small delay to ensure the state change is processed
        setTimeout(() => {
          setVisibleActionsMessageId(messageId)
        }, 50)
      } else {
        setVisibleActionsMessageId(messageId)
      }
    },
    [visibleActionsMessageId],
  )

  const handleLongPress = useCallback((messageId: string) => {
    setBottomSheetMessageId(messageId)
  }, [])

  const handleBottomSheetClose = useCallback(() => {
    setBottomSheetMessageId(null)
  }, [])

  const handleHoverStart = useCallback((messageId: string) => {
    setVisibleActionsMessageId(messageId)
  }, [])

  const handleHoverEnd = useCallback(() => {
    // Add a delay before hiding actions to allow time for clicking action buttons
    setTimeout(() => {
      setVisibleActionsMessageId(null)
    }, 2000)
  }, [])

  const isValidThreadId = threadId && threadId !== "chat" && threadId.length >= 10

  const anonymousUserId = !isAuthenticated ? getAnonymousUserId() : null
  const _retryTrigger = retryCount

  const { results, status, loadMore } = useThreadMessages(
    api.chat.listThreadMessages,
    {
      threadId,
      anonymousUserId: anonymousUserId || undefined,
    },
    { initialNumItems: pageSize, stream: true },
  )

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
    }

    const handleSignIn = () => {
      router.push("/sign-in")
    }

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing.lg,
        }}
      >
        <Text style={{ textAlign: "center", marginBottom: theme.spacing.md }}>
          Unable to load messages. Please try again or sign in for the best experience.
        </Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <Button text="Try Again" onPress={handleRetry} />
          <Button text="Sign In" onPress={handleSignIn} />
        </View>
      </View>
    )
  }

  const serverMessages = results || []

  if (serverMessages.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text preset="subheading" tx="chat:noMessages" />
      </View>
    )
  }

  return (
    <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={400}>
      {toUIMessages(serverMessages).map((item, index) => {
        const isLastUserMessage =
          item.role === "user" &&
          index ===
            serverMessages.findLastIndex(
              (msg) => (msg as any).message?.role === "user" || (msg as any).role === "user",
            )

        return (
          <MessageItem
            key={item.key}
            response={item}
            threadId={threadId}
            isLastUserMessage={isLastUserMessage}
            isActionsVisible={visibleActionsMessageId === item.key}
            onEdit={handleEditMessage}
            onRetry={handleRetryMessage}
            onMessageTap={handleMessageTap}
            onLongPress={handleLongPress}
            showBottomSheet={bottomSheetMessageId === item.key}
            onBottomSheetClose={handleBottomSheetClose}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
          />
        )
      })}
    </ScrollView>
  )
}

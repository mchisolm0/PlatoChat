import { useState, useCallback, useRef, useEffect } from "react"
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
  ViewStyle,
  TextStyle,
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
import { PressableIcon } from "./Icon"
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

function formatTimestamp(ms?: number): string | undefined {
  if (!ms) return undefined
  try {
    const d = new Date(ms)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return undefined
  }
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
  // Prefer stable database id for interactions; fall back to UI key if missing
  const messageId = response._id ?? response.key

  const handleMessageTap = () => {
    onMessageTap(messageId)
  }

  const handleLongPress = () => {
    onLongPress(messageId)
  }

  const handleHoverIn = () => {
    if (!isSmall && onHoverStart) {
      onHoverStart(messageId)
    }
  }

  const handleHoverOut = () => {
    if (!isSmall && onHoverEnd) {
      onHoverEnd(messageId)
    }
  }

  const timestamp = formatTimestamp(response._creationTime)

  const messageCard = (
    <Card
      heading={role.charAt(0).toUpperCase() + role.slice(1)}
      content={visibleText || "(No content)"}
      footer={timestamp}
      FooterTextProps={{ style: { color: theme.colors.textDim } }}
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
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const isAtBottomRef = useRef(true)

  const $flexFill: ViewStyle = { flex: 1 }
  const $centerContent: ViewStyle = {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
  const $unauthContainer: ViewStyle = {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  }
  const $unauthMessageText: TextStyle = {
    textAlign: "center",
    marginBottom: theme.spacing.md,
  }
  const $buttonRow: ViewStyle = {
    flexDirection: "row",
    gap: theme.spacing.md,
  }

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
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
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

      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height)
      const isNearBottom = distanceFromBottom < 100
      isAtBottomRef.current = isNearBottom
      setShowScrollToBottom(!isNearBottom)
    },
    [status, isLoadingMore, pageSize, loadMore],
  )

  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
    isAtBottomRef.current = true
    setShowScrollToBottom(false)
  }, [])

  // Ensure on first render we start at bottom after layout
  useEffect(() => {
    const id = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false })
      isAtBottomRef.current = true
      setShowScrollToBottom(false)
    }, 0)
    return () => clearTimeout(id)
  }, [])

  if (!isValidThreadId) {
    return (
      <View style={$flexFill}>
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
      <View style={$unauthContainer}>
        <Text style={$unauthMessageText}>
          Unable to load messages. Please try again or sign in for the best experience.
        </Text>
        <View style={$buttonRow}>
          <Button text="Try Again" onPress={handleRetry} />
          <Button text="Sign In" onPress={handleSignIn} />
        </View>
      </View>
    )
  }

  const serverMessages = results || []

  if (serverMessages.length === 0) {
    return (
      <View style={$centerContent}>
        <Text preset="subheading" tx="chat:noMessages" />
      </View>
    )
  }

  const uiMessages = toUIMessages(serverMessages)
  const isAssistantStreaming = uiMessages.some(
    (m) => (m.role ?? "assistant") === "assistant" && (m as any).streaming,
  )
  const typingDots = ".".repeat(Math.floor(Date.now() / 400) % 4)

  const $typingBubbleStyle: ViewStyle = {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.palette.neutral400,
    marginLeft: theme.spacing.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xxs,
    borderRadius: theme.spacing.md,
    maxWidth: "80%",
  }

  const $fabStyle: ViewStyle = {
    position: "absolute",
    right: theme.spacing.md,
    bottom: theme.spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.palette.accent500,
    shadowColor: theme.colors.palette.neutral900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  }

  return (
    <View style={$flexFill}>
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={100}
      >
        {uiMessages.map((item, index) => {
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
              isActionsVisible={visibleActionsMessageId === ((item as any)._id ?? item.key)}
              onEdit={handleEditMessage}
              onRetry={handleRetryMessage}
              onMessageTap={handleMessageTap}
              onLongPress={handleLongPress}
              showBottomSheet={bottomSheetMessageId === ((item as any)._id ?? item.key)}
              onBottomSheetClose={handleBottomSheetClose}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
            />
          )
        })}

        {isAssistantStreaming && (
          <View>
            <Card heading="Assistant" content={`Typing${typingDots}`} style={$typingBubbleStyle} />
          </View>
        )}
      </ScrollView>

      {showScrollToBottom && (
        <Pressable onPress={scrollToBottom} style={$fabStyle}>
          <PressableIcon
            icon="chevronDownOutline"
            size={20}
            color={theme.colors.palette.neutral100}
          />
        </Pressable>
      )}
    </View>
  )
}

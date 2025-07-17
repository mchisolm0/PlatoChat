import { useState, useCallback, useRef } from "react"
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View, ViewStyle } from "react-native"
import { useThreadMessages } from "@convex-dev/agent/react"

import { api } from "convex/_generated/api"

import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

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
    padding: spacing.md,
    marginVertical: spacing.xxs,
    borderRadius: spacing.md,
    maxWidth: "80%",
  }
  const $userStyle: ViewStyle = {
    alignSelf: "flex-end",
    backgroundColor: colors.palette.primary600,
    marginRight: spacing.md,
  }
  const $assistantStyle: ViewStyle = {
    alignSelf: "flex-start",
    backgroundColor: colors.palette.neutral600,
    marginLeft: spacing.md,
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
  const scrollViewRef = useRef<ScrollView>(null)

  const isValidThreadId = threadId && threadId !== "chat" && threadId.length >= 10

  const {
    results: messagesResult,
    status,
    loadMore,
  } = useThreadMessages(
    api.chat.listThreadMessages,
    isValidThreadId ? { threadId: threadId as any } : "skip",
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

import { View, ViewStyle } from "react-native"
import { Text } from "./Text"
import { useThreadMessages } from "@convex-dev/agent/react"
import { api } from "convex/_generated/api"
import { Card } from "./Card"
import { spacing } from "@/theme/spacing"
import { colors } from "@/theme/colors"
import { FlashList } from "@shopify/flash-list"

type MessageContent =
  | string
  | Array<{
      text?: string;
      type: string;
      [key: string]: any;
    }>;

type BaseMessage = {
  _id?: string;
  _creationTime?: number;
  agentName?: string;
  embeddingId?: string;
  message?: {
    content?: MessageContent;
    role?: 'user' | 'assistant' | 'system' | 'tool';
    [key: string]: any;
  };
  order?: number;
  status?: string;
  stepOrder?: number;
  text?: string;
  threadId?: string;
  tool?: boolean;
  userId?: string;
  streaming?: boolean;
  [key: string]: any;
};

type AssistantMessage = BaseMessage & {
  finishReason?: string;
  model?: string;
  provider?: string;
  providerMetadata?: {
    openai?: {
      acceptedPredictionTokens: number;
      cachedPromptTokens: number;
      reasoningTokens: number;
      rejectedPredictionTokens: number;
    };
  };
  reasoningDetails?: any[];
  sources?: any[];
  usage?: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  };
  warnings?: any[];
};

type Response = BaseMessage | AssistantMessage;


interface Props {
  threadId: string
}

const MessageItem: React.FC<{ response: Response }> = ({ response }) => {
  const role = response.role || response.message?.role || 'assistant';
  let contentText = '';
  const content = response.message?.content || response.text;

  if (Array.isArray(content)) {
    contentText = content
      .filter(part => part.type === 'text' && part.text)
      .map(part => part.text || '')
      .join('\n');
  } else if (typeof content === 'string') {
    contentText = content;
  }

  const isUser = role === "user";
  const $baseStyle: ViewStyle = {
    padding: spacing.md,
    marginVertical: spacing.xxs,
    borderRadius: spacing.md,
    maxWidth: '80%'
  };
  const $userStyle: ViewStyle = {
    alignSelf: "flex-end",
    backgroundColor: colors.palette.primary600,
    marginRight: spacing.md,
  };
  const $assistantStyle: ViewStyle = {
    alignSelf: "flex-start",
    backgroundColor: colors.palette.neutral600,
    marginLeft: spacing.md
  };
  const $messageStyle = { ...$baseStyle, ...(isUser ? $userStyle : $assistantStyle) };

  return (
    <Card
      heading={role.charAt(0).toUpperCase() + role.slice(1)}
      content={contentText || '(No content)'}
      style={$messageStyle}
    />
  );
};

export const MessageList: React.FC<Props> = ({ threadId }) => {
  const messagesResult = useThreadMessages(
    api.chat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }

  )

  if (!messagesResult || messagesResult.results.length === 0) {
    return <Text>No messages</Text>
  }

  return (
    <FlashList
      data={messagesResult.results}
      renderItem={({ item }) => <MessageItem response={item} />}
      keyExtractor={(item, index) => item.id ?? index.toString()}
      estimatedItemSize={100}
      scrollEventThrottle={16}
    />
  )
}
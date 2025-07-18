import { useState } from "react"
import { View } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useAction } from "convex/react"

import { api } from "convex/_generated/api"

import { spacing } from "@/theme/spacing"
import { getAnonymousUserId } from "@/utils/anonymousUser"

import { Button } from "./Button"
import { MessageList } from "./MessageList"
import { Text } from "./Text"
import { TextField } from "./TextField"

interface Props {
  threadId: string
}

export const ThreadView: React.FC<Props> = ({ threadId }) => {
  const [message, setMessage] = useState<string>("")
  const [response, setResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { user } = useUser()

  const sendMessageToAgent = useAction(api.chat.sendMessageToAgent)
  const sendMessageToAgentAnonymous = useAction(api.chat.sendMessageToAgentAnonymous)

  const isAuthenticated = !!user

  if (!threadId || threadId === "chat" || threadId.length < 10) {
    return (
      <View style={{ flex: 1, gap: spacing.md }}>
        <Text preset="subheading" tx="chat:invalidThreadId" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <MessageList threadId={threadId} />
      {isLoading && <Text>Loading...</Text>}
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
        <TextField
          value={message}
          editable={!isLoading}
          onChangeText={setMessage}
          placeholderTx="chat:inputPlaceholder"
          onSubmitEditing={async () => {
            if (!message.trim()) return
            setIsLoading(true)
            try {
              if (isAuthenticated) {
                await sendMessageToAgent({ threadId, prompt: message })
              } else {
                const anonymousUserId = getAnonymousUserId()
                await sendMessageToAgentAnonymous({ threadId, prompt: message, anonymousUserId })
              }
              setMessage("")
            } catch (error) {
              console.error(error)
              // Show user-friendly error message for rate limits
              if (error instanceof Error && error.message.includes("rate limit")) {
                alert(error.message)
              }
            } finally {
              setIsLoading(false)
            }
          }}
        />
        <Button
          text="Send"
          disabled={isLoading || !message.trim()}
          onPress={async () => {
            if (!message.trim()) return
            setIsLoading(true)
            try {
              if (isAuthenticated) {
                await sendMessageToAgent({ threadId, prompt: message })
              } else {
                const anonymousUserId = getAnonymousUserId()
                await sendMessageToAgentAnonymous({ threadId, prompt: message, anonymousUserId })
              }
              setMessage("")
            } catch (error) {
              console.error(error)
              // Show user-friendly error message for rate limits
              if (error instanceof Error && error.message.includes("rate limit")) {
                alert(error.message)
              }
            } finally {
              setIsLoading(false)
            }
          }}
        />
      </View>
    </View>
  )
}

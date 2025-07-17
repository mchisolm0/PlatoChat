import { useState } from "react"
import { View } from "react-native"
import { useAction } from "convex/react"

import { api } from "convex/_generated/api"

import { spacing } from "@/theme/spacing"

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

  const sendMessageToAgent = useAction(api.chat.sendMessageToAgent)

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
            try {
              sendMessageToAgent({ threadId, prompt: message })
              setMessage("")
            } catch (error) {
              console.error(error)
            } finally {
              setIsLoading(false)
            }
          }}
        />
        <Button
          text="Send"
          disabled={isLoading}
          onPress={async () => {
            if (!message.trim()) return
            setIsLoading(true)
            try {
              sendMessageToAgent({ threadId, prompt: message })
              setMessage("")
            } catch (error) {
              console.error(error)
            } finally {
              setIsLoading(false)
            }
          }}
        />
      </View>
    </View>
  )
}

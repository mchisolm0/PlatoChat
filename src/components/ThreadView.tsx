import { useState } from "react"
import { TextField } from "./TextField"
import { useAction } from "convex/react"
import { api } from "convex/_generated/api"
import { View } from "react-native"
import { Text } from "./Text"
import { Button } from "./Button"
import { spacing } from "@/theme/spacing"
import { MessageList } from "./MessageList"

interface Props {
  threadId: string
}

export const ThreadView: React.FC<Props> = ({ threadId }) => {
  const [message, setMessage] = useState<string>("")
  const [response, setResponse] = useState<string | null>(null)
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const sendMessageToAgent = useAction(api.chat.sendMessageToAgent)

  return (
    <View style={{ flex: 1, gap: spacing.md }}>
      <MessageList threadId={threadId} optimisticMessages={optimisticMessages} />
      {isLoading && <Text preset="subheading">Loading...</Text>}
      <TextField
        value={message}
        editable={!isLoading}
        onChangeText={setMessage}
        placeholder="Ask the agent..."
        onSubmitEditing={async () => {
          if (!message.trim()) return
          const tempMessage = {
            _id: `temp-${Date.now()}`,
            role: "user",
            text: message,
            threadId,
          } as any
          setOptimisticMessages((prev) => [...prev, tempMessage])
          setMessage("")
          setIsLoading(true)
          try {
            const response = await sendMessageToAgent({ threadId, prompt: tempMessage.text })
            setResponse(response)
          } catch (error) {
            console.error(error)
          } finally {
            setIsLoading(false)
            setOptimisticMessages([])
          }
        }}
      />
      <Button
        text="Send"
        disabled={isLoading}
        onPress={async () => {
          if (!message.trim()) return
          const tempMessage = {
            _id: `temp-${Date.now()}`,
            role: "user",
            text: message,
            threadId,
          } as any
          setOptimisticMessages((prev) => [...prev, tempMessage])
          setMessage("")
          setIsLoading(true)
          try {
            const response = await sendMessageToAgent({ threadId, prompt: tempMessage.text })
            setResponse(response)
          } catch (error) {
            console.error(error)
          } finally {
            setIsLoading(false)
            setOptimisticMessages([])
          }
        }}
      />
    </View>
  )
}

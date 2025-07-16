import { useState } from "react";
import { TextField } from "./TextField";
import { useAction } from "convex/react";
import { api } from "convex/_generated/api";
import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";
import { spacing } from "@/theme/spacing";
import { MessageList } from "./MessageList";

interface Props {
  threadId: string;
}

export const ThreadView: React.FC<Props> = ({ threadId }) => {
  const [message, setMessage] = useState<string>("")
  const [response, setResponse] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const sendMessageToAgent = useAction(api.chat.sendMessageToAgent)

  return (
    <View style={{ flex: 1, gap: spacing.md }}>
      {isLoading && <Text preset='subheading'>Loading...</Text>}
      <MessageList threadId={threadId} />
      <TextField
        value={message}
        editable={!isLoading}
        onChangeText={setMessage}
        placeholder="Ask the agent..."
        onSubmitEditing={async () => {
          setIsLoading(true)
          try {
            const response = await sendMessageToAgent({ threadId, prompt: message })
            setResponse(response)
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
          setIsLoading(true)
          try {
            const response = await sendMessageToAgent({ threadId, prompt: message })
            setResponse(response)
          } catch (error) {
            console.error(error)
          } finally {
            setIsLoading(false)
          }
        }}
      />
    </View>
  )
}
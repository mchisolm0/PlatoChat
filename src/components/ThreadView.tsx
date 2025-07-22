import { useState, useEffect } from "react"
import { View } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useAction } from "convex/react"

import { api } from "convex/_generated/api"

import { useAppTheme } from "@/theme/context"
import { getAnonymousUserId } from "@/utils/anonymousUser"
import {
  getEffectiveModelForThread,
  setThreadModelOverride,
  getUserModelPreference,
} from "@/utils/modelPreferences"

import { Button } from "./Button"
import { MessageList } from "./MessageList"
import { ModelSelector } from "./ModelSelector"
import { Text } from "./Text"
import { TextField } from "./TextField"

interface Props {
  threadId: string
}

export const ThreadView: React.FC<Props> = ({ threadId }) => {
  const { theme } = useAppTheme()
  const [message, setMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedModelId, setSelectedModelId] = useState<string>(getUserModelPreference())
  const { user } = useUser()

  const sendMessageToAgent = useAction(api.chat.sendMessageToAgent)
  const sendMessageToAgentAnonymous = useAction(api.chat.sendMessageToAgentAnonymous)

  const isAuthenticated = !!user

  useEffect(() => {
    const effectiveModel = getEffectiveModelForThread(threadId)
    setSelectedModelId(effectiveModel)
  }, [threadId])

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId)
    setThreadModelOverride(threadId, modelId)
  }

  if (!threadId || threadId === "chat" || threadId.length < 10) {
    return (
      <View style={{ flex: 1, gap: theme.spacing.md }}>
        <Text preset="subheading" tx="chat:invalidThreadId" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <MessageList threadId={threadId} />
      {isLoading && <Text>Loading...</Text>}
      <View style={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.md }}>
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
                await sendMessageToAgent({ threadId, prompt: message, modelId: selectedModelId })
              } else {
                const anonymousUserId = getAnonymousUserId()
                await sendMessageToAgentAnonymous({
                  threadId,
                  prompt: message,
                  anonymousUserId,
                  modelId: selectedModelId,
                })
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={handleModelChange}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <Button
            text="Send"
            preset="small"
            disabled={isLoading || !message.trim()}
            onPress={async () => {
              if (!message.trim()) return
              setIsLoading(true)
              try {
                if (isAuthenticated) {
                  await sendMessageToAgent({ threadId, prompt: message, modelId: selectedModelId })
                } else {
                  const anonymousUserId = getAnonymousUserId()
                  await sendMessageToAgentAnonymous({
                    threadId,
                    prompt: message,
                    anonymousUserId,
                    modelId: selectedModelId,
                  })
                }
                setMessage("")
              } catch (error) {
                console.error(error)
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
    </View>
  )
}

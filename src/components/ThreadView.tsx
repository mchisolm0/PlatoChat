import { useState, useEffect } from "react"
import { View } from "react-native"
import type { ViewStyle } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { optimisticallySendMessage } from "@convex-dev/agent/react"
import { useMutation } from "convex/react"

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

  const sendMessage = useMutation(api.chat.sendMessage).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.listThreadMessages),
  )

  const isAuthenticated = !!user

  const $flexFill: ViewStyle = { flex: 1 }
  const $invalidThreadContainer: ViewStyle = { flex: 1, gap: theme.spacing.md }
  const $composerContainer: ViewStyle = {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  }
  const $row: ViewStyle = { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }

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
      <View style={$invalidThreadContainer}>
        <Text preset="subheading" tx="chat:invalidThreadId" />
      </View>
    )
  }

  return (
    <View style={$flexFill}>
      <MessageList threadId={threadId} />
      <View style={$composerContainer}>
        <TextField
          value={message}
          editable={!isLoading}
          onChangeText={setMessage}
          placeholderTx="chat:inputPlaceholder"
          onSubmitEditing={async () => {
            if (!message.trim()) return
            setIsLoading(true)
            try {
              const anonymousUserId = isAuthenticated ? undefined : getAnonymousUserId()
              await sendMessage({
                threadId,
                prompt: message,
                modelId: selectedModelId,
                anonymousUserId,
              })
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
        <View style={$row}>
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={handleModelChange}
            disabled={isLoading}
            style={$flexFill}
          />
          <Button
            text="Send"
            preset="small"
            disabled={isLoading || !message.trim()}
            onPress={async () => {
              if (!message.trim()) return
              setIsLoading(true)
              try {
                const anonymousUserId = isAuthenticated ? undefined : getAnonymousUserId()
                await sendMessage({
                  threadId,
                  prompt: message,
                  modelId: selectedModelId,
                  anonymousUserId,
                })
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

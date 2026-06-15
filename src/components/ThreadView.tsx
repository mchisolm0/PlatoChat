import { useState, useEffect } from "react"
import { View } from "react-native"
import type { TextStyle, ViewStyle } from "react-native"
import { useUser } from "@clerk/expo"
import { optimisticallySendMessage } from "@convex-dev/agent/react"
import { useMutation } from "convex/react"

import { api } from "convex/_generated/api"

import { useAppTheme } from "@/theme/context"
import { getAnonymousUserId } from "@/utils/anonymousUser"
import { getChatErrorMessage } from "@/utils/chatErrors"
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
  const $errorText: TextStyle = {
    color: theme.colors.error,
  }

  useEffect(() => {
    const effectiveModel = getEffectiveModelForThread(threadId)
    setSelectedModelId(effectiveModel)
  }, [threadId])

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId)
    setThreadModelOverride(threadId, modelId)
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    setErrorMessage(null)

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
      setErrorMessage(getChatErrorMessage(error, "Unable to send message. Please try again."))
    } finally {
      setIsLoading(false)
    }
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
          onSubmitEditing={handleSendMessage}
        />
        {errorMessage ? <Text preset="formHelper" text={errorMessage} style={$errorText} /> : null}
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
            onPress={handleSendMessage}
          />
        </View>
      </View>
    </View>
  )
}

import { useState, useEffect } from "react"
import { KeyboardAvoidingView, Platform, View } from "react-native"
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
    marginHorizontal: theme.spacing.md,
    marginBottom: -theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.palette.neutral300,
    borderRadius: theme.spacing.md,
    backgroundColor: theme.colors.palette.neutral100,
    shadowColor: theme.colors.palette.neutral800,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  }
  const $row: ViewStyle = { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }
  const $modelRow: ViewStyle = { ...$row, justifyContent: "space-between", marginBottom: 0 }
  const $modelSelectorWrapper: ViewStyle = { flex: 1, minWidth: 0 }
  const $sendButton: ViewStyle = { minWidth: 84, borderRadius: theme.spacing.sm }
  const $inputWrapper: ViewStyle = {
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.palette.neutral200,
    borderColor: errorMessage ? theme.colors.error : theme.colors.palette.neutral300,
  }
  const $inputStyle: TextStyle = {
    minHeight: 48,
    maxHeight: 120,
    lineHeight: 22,
  }
  const $composerMeta: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }
  const $helperText: TextStyle = { color: theme.colors.textDim }
  const $modelLabel: TextStyle = { color: theme.colors.textDim }
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

  const handleMessageChange = (nextMessage: string) => {
    setMessage(nextMessage)
    if (errorMessage) {
      setErrorMessage(null)
    }
  }

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const anonymousUserId = isAuthenticated ? undefined : getAnonymousUserId()
      await sendMessage({
        threadId,
        prompt: trimmedMessage,
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={$composerContainer}>
          <TextField
            value={message}
            editable={!isLoading}
            multiline
            returnKeyType="send"
            blurOnSubmit
            onChangeText={handleMessageChange}
            placeholderTx="chat:inputPlaceholder"
            onSubmitEditing={handleSendMessage}
            inputWrapperStyle={$inputWrapper}
            style={$inputStyle}
          />
          <View style={$composerMeta}>
            <Text
              preset="formHelper"
              text={isLoading ? "Plato is thinking…" : "Return sends the message"}
              style={$helperText}
            />
            <Text preset="formHelper" text={`${message.trim().length} chars`} style={$helperText} />
          </View>
          {errorMessage ? (
            <Text preset="formHelper" text={errorMessage} style={$errorText} />
          ) : null}
          <View style={$modelRow}>
            <Text preset="formHelper" text="Model" style={$modelLabel} />
            <View style={$modelSelectorWrapper}>
              <ModelSelector
                selectedModelId={selectedModelId}
                onModelChange={handleModelChange}
                disabled={isLoading}
                style={$flexFill}
              />
            </View>
            <Button
              text={isLoading ? "Sending" : "Send"}
              preset="small"
              disabled={isLoading || !message.trim()}
              style={$sendButton}
              onPress={handleSendMessage}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

import { useState, useEffect, useRef } from "react"
import { View, ViewStyle, Alert, Animated } from "react-native"

import { useAppTheme } from "@/theme/context"
import clipboard from "@/utils/clipboard"
import { useResponsive } from "@/utils/useResponsive"

import { PressableIcon } from "./Icon"
import { MessageActionsBottomSheet } from "./MessageActionsBottomSheet"
import { Text } from "./Text"

interface MessageActionsProps {
  messageId?: string
  messageText: string
  role: "user" | "assistant" | "system" | "tool"
  isLastUserMessage?: boolean
  threadId: string
  isVisible: boolean
  onEdit?: (messageId: string, newText: string) => void
  onRetry?: (messageId: string, modelId?: string) => void
  onCopy?: () => void
  // New props for mobile bottom sheet
  showBottomSheet?: boolean
  onBottomSheetClose?: () => void
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  messageText,
  role,
  isLastUserMessage = false,
  threadId: _threadId,
  isVisible,
  onEdit,
  onRetry,
  onCopy,
  showBottomSheet = false,
  onBottomSheetClose,
}) => {
  const { theme } = useAppTheme()
  const { isSmall } = useResponsive()
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">("idle")
  const fadeAnim = useRef(new Animated.Value(0)).current

  const handleCopy = async () => {
    setCopyState("copying")
    try {
      if (clipboard.setString) {
        await clipboard.setString(messageText)
      }
      setCopyState("copied")
      if (onCopy) {
        onCopy()
      }

      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopyState("idle")
      }, 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      Alert.alert("Copy Failed", "Unable to copy message to clipboard")
      setCopyState("idle")
    }
  }

  const handleBottomSheetCopy = () => {
    handleCopy()
  }

  const handleBottomSheetEdit = () => {
    handleEdit()
  }

  const handleBottomSheetRetry = () => {
    handleRetry()
  }

  const handleEdit = () => {
    if (!onEdit) return

    // Ensure we have a valid database ID (not a UIMessage key)
    if (!hasValidDbId) {
      Alert.alert("Edit Error", "Cannot edit this message. Please try refreshing the page.")
      return
    }

    Alert.prompt(
      "Edit Message",
      "Edit your message:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (newText) => {
            if (newText && newText.trim() !== messageText.trim()) {
              onEdit(messageId, newText.trim())
            }
          },
        },
      ],
      "plain-text",
      messageText,
    )
  }

  const handleRetry = () => {
    if (!onRetry) return

    // Ensure we have a valid database ID (not a UIMessage key)
    if (!hasValidDbId) {
      Alert.alert("Retry Error", "Cannot retry this message. Please try refreshing the page.")
      return
    }

    // For now, just retry with the same model
    // TODO: Add model selection dialog
    onRetry(messageId)
  }

  const showCopyButton = messageText.trim().length > 0
  // Show edit button for last user message only (even if no DB ID yet)
  const showEditButton = role === "user" && isLastUserMessage
  // Show retry button for assistant messages (even if no DB ID yet)
  const showRetryButton = role === "assistant"

  // Check if we have a valid database ID for backend operations
  const hasValidDbId = messageId && messageId.match(/^[a-z0-9]{32}$/)

  const $containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    paddingTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  }

  const $buttonStyle: ViewStyle = {
    padding: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
    backgroundColor: theme.colors.palette.neutral300,
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  }

  const $copiedIconContainerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  }

  const $copiedTextStyle = {
    fontSize: 12,
    color: theme.colors.palette.accent100,
    fontWeight: "600" as const,
  }

  // Fade in when visible, fade out when hidden
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isVisible, fadeAnim])

  // Auto-fade after 3 seconds when visible
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }, 3000)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [isVisible, fadeAnim])

  // On small screens, don't render the inline actions - use bottom sheet instead
  if (isSmall) {
    return (
      <MessageActionsBottomSheet
        isVisible={showBottomSheet}
        onClose={onBottomSheetClose || (() => {})}
        messageText={messageText}
        role={role}
        isLastUserMessage={isLastUserMessage}
        onCopy={handleBottomSheetCopy}
        onEdit={showEditButton ? handleBottomSheetEdit : undefined}
        onRetry={showRetryButton ? handleBottomSheetRetry : undefined}
      />
    )
  }

  // On larger screens, show inline actions with hover/click behavior
  if (!showCopyButton && !showEditButton && !showRetryButton) {
    return null
  }

  return (
    <Animated.View
      style={[
        $containerStyle,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {showCopyButton &&
        (copyState === "copied" ? (
          <View
            style={[
              $buttonStyle,
              { backgroundColor: theme.colors.palette.accent300 },
              $copiedIconContainerStyle,
            ]}
          >
            <PressableIcon icon="check" size={16} color={theme.colors.palette.accent100} />
            <Text style={$copiedTextStyle}>Copied!</Text>
          </View>
        ) : (
          <PressableIcon
            icon="copyOutline"
            size={16}
            color={theme.colors.text}
            onPress={handleCopy}
            disabled={copyState === "copying"}
            containerStyle={$buttonStyle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          />
        ))}

      {showEditButton && (
        <PressableIcon
          icon="createOutline"
          size={16}
          color={theme.colors.text}
          onPress={handleEdit}
          containerStyle={$buttonStyle}
        />
      )}

      {showRetryButton && (
        <PressableIcon
          icon="refreshOutline"
          size={16}
          color={theme.colors.text}
          onPress={handleRetry}
          containerStyle={$buttonStyle}
        />
      )}
    </Animated.View>
  )
}

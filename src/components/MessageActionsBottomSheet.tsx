import { useEffect, useState } from "react"
import { View, ViewStyle, Modal, Pressable } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAppTheme } from "@/theme/context"

import { PressableIcon } from "./Icon"
import { Text } from "./Text"

interface MessageActionsBottomSheetProps {
  isVisible: boolean
  onClose: () => void
  messageText: string
  role: "user" | "assistant" | "system" | "tool"
  isLastUserMessage?: boolean
  onCopy: () => void
  onEdit?: () => void
  onRetry?: () => void
  onDismiss?: () => void
}

export const MessageActionsBottomSheet: React.FC<MessageActionsBottomSheetProps> = ({
  isVisible,
  onClose,
  messageText,
  role,
  isLastUserMessage = false,
  onCopy,
  onEdit,
  onRetry,
  onDismiss,
}) => {
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()

  const translateY = useSharedValue(300)
  const opacity = useSharedValue(0)
  const [rendered, setRendered] = useState(isVisible)

  const showCopyButton = messageText.trim().length > 0
  const showEditButton = role === "user" && isLastUserMessage
  const showRetryButton = role === "assistant"

  // Animation for showing/hiding the bottom sheet
  useEffect(() => {
    if (isVisible) {
      // Ensure the modal is rendered before playing the show animation
      setRendered(true)
      opacity.value = withTiming(1, { duration: 200 })
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      })
    } else {
      opacity.value = withTiming(0, { duration: 200 })
      translateY.value = withTiming(300, { duration: 200 }, (finished) => {
        if (finished) {
          // After the hide animation completes, stop rendering the modal
          runOnJS(setRendered)(false)
          // Optionally notify parent that the sheet has fully dismissed
          if (onDismiss) runOnJS(onDismiss)()
        }
      })
    }
  }, [isVisible, opacity, translateY, onDismiss])

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const bottomSheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  const $backdropStyle: ViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  }

  const $bottomSheetStyle: ViewStyle = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
    shadowColor: theme.colors.palette.neutral900,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  }

  const $handleStyle: ViewStyle = {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.palette.neutral400,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  }

  const $titleStyle = {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: "center" as const,
  }

  const $actionButtonStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    backgroundColor: theme.colors.palette.neutral100,
    marginBottom: theme.spacing.sm,
  }

  const $actionTextStyle = {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    fontWeight: "500" as const,
  }

  const $cancelButtonStyle: ViewStyle = {
    ...$actionButtonStyle,
    backgroundColor: theme.colors.palette.neutral200,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  }

  const $modalContainerStyle: ViewStyle = {
    flex: 1,
  }

  const $backdropPressableStyle: ViewStyle = {
    flex: 1,
  }

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={$modalContainerStyle}>
        <Animated.View style={[$backdropStyle, backdropAnimatedStyle]}>
          <Pressable style={$backdropPressableStyle} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[$bottomSheetStyle, bottomSheetAnimatedStyle]}>
          <View style={$handleStyle} />

          <Text style={$titleStyle}>Message Actions</Text>

          {showCopyButton && (
            <Pressable style={$actionButtonStyle} onPress={() => handleAction(onCopy)}>
              <PressableIcon icon="copyOutline" size={20} color={theme.colors.text} />
              <Text style={$actionTextStyle}>Copy Message</Text>
            </Pressable>
          )}

          {showEditButton && onEdit && (
            <Pressable style={$actionButtonStyle} onPress={() => handleAction(onEdit)}>
              <PressableIcon icon="createOutline" size={20} color={theme.colors.text} />
              <Text style={$actionTextStyle}>Edit Message</Text>
            </Pressable>
          )}

          {showRetryButton && onRetry && (
            <Pressable style={$actionButtonStyle} onPress={() => handleAction(onRetry)}>
              <PressableIcon icon="refreshOutline" size={20} color={theme.colors.text} />
              <Text style={$actionTextStyle}>Retry Message</Text>
            </Pressable>
          )}

          <Pressable style={$cancelButtonStyle} onPress={onClose}>
            <PressableIcon icon="x" size={20} color={theme.colors.text} />
            <Text style={$actionTextStyle}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

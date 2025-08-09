import { useState } from "react"
import { View, TouchableOpacity, Alert, ViewStyle, ScrollView, TextStyle } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"

import { ALL_MODELS, ModelConfig, getModelById } from "@/config/models"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"

import { Button } from "./Button"
import { Icon } from "./Icon"
import { Text } from "./Text"

interface Props {
  selectedModelId: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
  style?: ViewStyle
}

export const ModelSelector: React.FC<Props> = ({
  selectedModelId,
  onModelChange,
  disabled,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const isAuthenticated = !!user
  const { theme, themed } = useAppTheme()

  const selectedModel = getModelById(selectedModelId)

  // Animation values
  const BUTTON_HEIGHT = 44
  const MAX_DROPDOWN_HEIGHT = 360
  const animatedOpacity = useSharedValue(0)
  const backgroundOpacity = useSharedValue(0)

  const handleModelSelect = (model: ModelConfig) => {
    if (model.tier === "pro" && !isAuthenticated) {
      Alert.alert(
        "Sign in Required",
        "Sign in to access premium models with advanced features and higher limits.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => {
              // TODO: Navigate to sign in screen
              console.log("Navigate to sign in")
            },
          },
        ],
      )
      return
    }

    onModelChange(model.id)
    closeDropdown()
  }

  const openDropdown = () => {
    setIsOpen(true)
    animatedOpacity.value = withTiming(1, { duration: 200 })
    backgroundOpacity.value = withTiming(0.3, { duration: 200 })
  }

  const closeDropdown = () => {
    animatedOpacity.value = withTiming(0, { duration: 150 })
    backgroundOpacity.value = withTiming(0, { duration: 150 })
    setTimeout(() => setIsOpen(false), 150)
  }

  const renderTierIcon = (tier: "free" | "pro") => {
    if (tier === "free") {
      return <Icon icon="giftOutline" size={12} color={theme.colors.palette.success500} />
    }
    return <Icon icon="diamondOutline" size={12} color={theme.colors.palette.accent500} />
  }

  // Animated styles
  const animatedDropdownStyle = useAnimatedStyle(() => ({ opacity: animatedOpacity.value }))

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    }
  })

  // Themed styles (follow Button.tsx approach)
  const $container = themed<ViewStyle>(() => ({}))
  const $backdrop = themed<ViewStyle>(() => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1000,
  }))
  const $menu = themed<ViewStyle>(({ colors, spacing }) => ({
    position: "absolute",
    bottom: BUTTON_HEIGHT + spacing.xs,
    left: 0,
    right: 0,
    backgroundColor: colors.palette.neutral200,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.palette.neutral500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
    overflow: "hidden",
  }))
  const $title = themed<ViewStyle>(({ spacing }) => ({ marginBottom: spacing.md }))
  const $list = themed<ViewStyle>(() => ({ maxHeight: MAX_DROPDOWN_HEIGHT }))
  const $listContent = themed<ViewStyle>(({ spacing }) => ({ paddingBottom: spacing.xs }))
  const $option = themed<ViewStyle>(({ spacing }) => ({
    ...$styles.row,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  }))
  const $labelContainer = themed<ViewStyle>(({ spacing }) => ({ flex: 1, marginLeft: spacing.sm }))
  const $labelText = themed<TextStyle>(({ typography, colors }) => ({
    fontSize: 16,
    fontFamily: typography.primary.medium,
    color: colors.text,
  }))
  const $featuresText = themed<TextStyle>(({ typography, colors }) => ({
    fontSize: 12,
    fontFamily: typography.primary.normal,
    color: colors.textDim,
    marginTop: 2,
  }))
  const $optionDisabled = themed<ViewStyle>(() => ({ opacity: 0.6 }))
  const $cancelButton = themed<ViewStyle>(({ spacing }) => ({
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  }))
  const $cancelText = themed<TextStyle>(({ typography, colors }) => ({
    fontSize: 16,
    fontFamily: typography.primary.medium,
    color: colors.palette.accent500,
  }))

  return (
    <View style={[$container, style]}>
      <Button
        onPress={openDropdown}
        disabled={disabled}
        preset="small"
        LeftAccessory={() => renderTierIcon(selectedModel.tier)}
        RightAccessory={() => (
          <Icon icon="chevronDownOutline" size={12} color={theme.colors.textDim} />
        )}
      >
        {selectedModel.shortName}
      </Button>

      {isOpen && (
        <>
          <Animated.View style={[$backdrop, animatedBackgroundStyle]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDropdown} activeOpacity={1} />
          </Animated.View>
          <Animated.View
            style={[$menu, animatedDropdownStyle]}
            onStartShouldSetResponder={() => true}
          >
            <View style={$title}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: theme.typography.primary.bold,
                  color: theme.colors.text,
                  textAlign: "center",
                }}
              >
                Select Model
              </Text>
            </View>

            <ScrollView style={$list} contentContainerStyle={$listContent}>
              {ALL_MODELS.map((model) => {
                const isSelected = model.id === selectedModelId
                const isDisabled = model.tier === "pro" && !isAuthenticated

                return (
                  <TouchableOpacity
                    key={model.id}
                    onPress={() => handleModelSelect(model)}
                    style={[
                      $option,
                      isDisabled && $optionDisabled,
                      isSelected &&
                        themed(({ colors }) => ({ backgroundColor: colors.palette.neutral200 })),
                    ]}
                  >
                    {renderTierIcon(model.tier)}

                    <View style={$labelContainer}>
                      <Text style={$labelText}>{model.displayName}</Text>
                      {model.features && (
                        <Text style={$featuresText}>{model.features.join(" • ")}</Text>
                      )}
                    </View>

                    {isDisabled && (
                      <Ionicons name="lock-closed" size={16} color={theme.colors.textDim} />
                    )}

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.palette.accent500}
                      />
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <TouchableOpacity onPress={closeDropdown} style={$cancelButton}>
              <Text style={$cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  )
}

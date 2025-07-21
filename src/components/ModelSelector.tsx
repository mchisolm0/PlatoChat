import { useState } from "react"
import { View, TouchableOpacity, Alert, ViewStyle } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated"

import { ALL_MODELS, ModelConfig, getModelById } from "@/config/models"
import { useAppTheme } from "@/theme/context"

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
  const { theme } = useAppTheme()

  const selectedModel = getModelById(selectedModelId)

  // Animation values - start from button height (44px)
  const BUTTON_HEIGHT = 44
  const DROPDOWN_HEIGHT = 280
  const animatedHeight = useSharedValue(BUTTON_HEIGHT)
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
    animatedHeight.value = withSpring(DROPDOWN_HEIGHT, { damping: 15, stiffness: 150 })
    animatedOpacity.value = withTiming(1, { duration: 200 })
    backgroundOpacity.value = withTiming(0.3, { duration: 200 })
  }

  const closeDropdown = () => {
    animatedHeight.value = withSpring(BUTTON_HEIGHT, { damping: 15, stiffness: 150 })
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
  const animatedDropdownStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      opacity: animatedOpacity.value,
    }
  })

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    }
  })

  return (
    <View style={style}>
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
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
                zIndex: 1000,
              },
              animatedBackgroundStyle,
            ]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDropdown} activeOpacity={1} />
          </Animated.View>
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: BUTTON_HEIGHT + theme.spacing.xs,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.palette.neutral200,
                borderRadius: 12,
                padding: theme.spacing.md,
                shadowColor: theme.colors.palette.neutral500,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 5,
                zIndex: 1001,
                overflow: "hidden",
              },
              animatedDropdownStyle,
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: theme.typography.primary.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.md,
                textAlign: "center",
              }}
            >
              Select Model
            </Text>

            {ALL_MODELS.map((model) => {
              const isSelected = model.id === selectedModelId
              const isDisabled = model.tier === "pro" && !isAuthenticated

              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => handleModelSelect(model)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.sm,
                    borderRadius: 8,
                    backgroundColor: isSelected ? theme.colors.palette.neutral200 : "transparent",
                    opacity: isDisabled ? 0.6 : 1,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {renderTierIcon(model.tier)}

                  <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: theme.typography.primary.medium,
                        color: theme.colors.text,
                      }}
                    >
                      {model.displayName}
                    </Text>

                    {model.features && (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: theme.typography.primary.normal,
                          color: theme.colors.textDim,
                          marginTop: 2,
                        }}
                      >
                        {model.features.join(" • ")}
                      </Text>
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

            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={{
                marginTop: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.typography.primary.medium,
                  color: theme.colors.palette.accent500,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  )
}

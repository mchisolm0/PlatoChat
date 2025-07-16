import { View, ViewStyle, StyleProp, TextStyle } from "react-native"
import { Text } from "./Text"
import { TxKeyPath } from "@/i18n"
import { spacing } from "@/theme/spacing"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"

export interface SectionProps {
  /**
   * Translation key for the section title
   */
  titleTx?: TxKeyPath
  /**
   * Optional style overrides for the section container
   */
  style?: StyleProp<ViewStyle>
  /**
   * Optional style overrides for the title
   */
  titleStyle?: StyleProp<TextStyle>
  /**
   * The content of the section
   */
  children?: React.ReactNode
}

/**
 * A reusable section component with a translated title
 */
export function Section({ titleTx, style, titleStyle, children }: SectionProps) {
  const { theme } = useAppTheme()

  return (
    <View
      style={[
        {
          marginTop: spacing.lg,
          backgroundColor: theme.colors.background,
          borderRadius: spacing.sm,
          padding: spacing.xs,
        },
        style,
      ]}
    >
      <Text
        tx={titleTx}
        preset="subheading"
        style={[{ marginBottom: spacing.xs, color: theme.colors.text }, titleStyle]}
      />
      {children}
    </View>
  )
}

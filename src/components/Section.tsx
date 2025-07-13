import { View, ViewStyle, StyleProp, TextStyle } from "react-native"
import { Text } from "./Text"
import { TxKeyPath } from "@/i18n"
import { spacing } from "@/theme/spacing"

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
  return (
    <View style={[{ marginTop: spacing.lg }, style]}>
      <Text
        tx={titleTx}
        preset="subheading"
        style={[{ marginBottom: spacing.xs }, titleStyle]}
      />
      {children}
    </View>
  )
}

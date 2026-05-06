import { View } from "react-native"
import type { ViewStyle, ImageStyle, TextStyle } from "react-native"
import { useUser } from "@clerk/expo"

import { AutoImage } from "@/components/AutoImage"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Section } from "@/components/Section"
import { SignOutButton } from "@/components/SignOutButton"
import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

export default function SettingsScreen() {
  const { user } = useUser()

  const hasEmail = !!(user?.emailAddresses && user.emailAddresses.length > 0)
  const isVerified = !!user?.hasVerifiedEmailAddress

  const $container: ViewStyle = { flex: 1, padding: spacing.lg }
  const $header: ViewStyle = { alignItems: "center" }
  const $avatar: ImageStyle = {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.sm,
  }
  const $cardStyle: ViewStyle = { padding: spacing.md }
  const $footerStyle: TextStyle = { color: isVerified ? colors.success : colors.error }

  return (
    <Screen preset="scroll" contentContainerStyle={$container}>
      <View style={$header}>
        <AutoImage source={{ uri: user?.imageUrl || undefined }} style={$avatar} />
        <Text size="lg" preset="bold">
          {user?.fullName}
        </Text>
      </View>

      <Section titleTx="settings:accountInformation">
        {user?.emailAddresses && user?.emailAddresses.length > 0 ? (
          <Card
            preset="default"
            headingTx="settings:email"
            content={user?.emailAddresses[0]?.emailAddress}
            footerTx={
              user?.hasVerifiedEmailAddress ? "settings:emailVerified" : "settings:emailNotVerified"
            }
            footerStyle={$footerStyle}
            style={$cardStyle}
          />
        ) : (
          <Text tx="settings:noEmail" />
        )}
      </Section>

      <Section titleTx="settings:actions">
        <SignOutButton />
      </Section>
    </Screen>
  )
}

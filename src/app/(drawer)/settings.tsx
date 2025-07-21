import { View } from "react-native"
import { useUser } from "@clerk/clerk-expo"

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

  return (
    <Screen preset="scroll" contentContainerStyle={{ flex: 1, padding: spacing.lg }}>
      <View style={{ alignItems: "center" }}>
        <AutoImage
          source={{ uri: user?.imageUrl }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            marginBottom: spacing.sm,
          }}
        />
        <Text size="lg" preset="bold">
          {user?.fullName}
        </Text>
      </View>

      <Section titleTx="settings:accountInformation">
        <Card
          preset="default"
          headingTx="settings:email"
          content={user?.emailAddresses[0].emailAddress}
          footerTx={
            user?.hasVerifiedEmailAddress ? "settings:emailVerified" : "settings:emailNotVerified"
          }
          footerStyle={{ color: user?.hasVerifiedEmailAddress ? colors.success : colors.error }}
          style={{ padding: spacing.md }}
        />
      </Section>

      <Section titleTx="settings:actions">
        <SignOutButton />
      </Section>
    </Screen>
  )
}

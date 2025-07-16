import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useUser } from "@clerk/clerk-expo"
import { SignOutButton } from "@/components/SignOutButton"
import { View } from "react-native"
import { spacing } from "@/theme/spacing"
import { colors } from "@/theme/colors"
import { AutoImage } from "@/components/AutoImage"
import { Section } from "@/components/Section"
import { Card } from "@/components/Card"
import { useAppTheme } from "@/theme/context"

export default function SettingsScreen() {
  const { user } = useUser()

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{ flex: 1, padding: spacing.lg }}
      safeAreaEdges={["top"]}
    >
      <Text preset="heading" style={{ marginBottom: spacing.xl }} tx="settings:settings" />

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
        <Text preset="bold" style={{ fontSize: 18 }}>
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

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useUser } from "@clerk/clerk-expo"
import { SignOutButton } from "@/components/SignOutButton"
import { View } from "react-native"
import { spacing } from "@/theme/spacing"
import { colors } from "@/theme/colors"
import { AutoImage } from "@/components/AutoImage"
import { Section } from "@/components/Section"

export default function SettingsScreen() {
  const { user } = useUser()

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{ flex: 1, padding: spacing.lg }}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text preset="heading" style={{ marginBottom: spacing.xl }}>Settings</Text>

      {/* Profile Section */}
      <View style={{
        alignItems: "center",
        backgroundColor: colors.background,
        padding: spacing.lg,
        borderRadius: 12,
        marginBottom: spacing.xl,
      }}>
        <AutoImage
          source={{ uri: user?.imageUrl }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            marginBottom: spacing.md,
          }}
        />
        <Text preset="bold" style={{ fontSize: 18 }}>{user?.fullName}</Text>
      </View>

      {/* Account Section */}
      <Section titleTx="settings:accountInformation">
        <View style={{ backgroundColor: colors.background, padding: spacing.md, borderRadius: 8 }}>
          <View style={{ marginBottom: spacing.sm }}>
            <Text tx="settings:email" preset="bold" />
            <Text>{user?.emailAddresses[0].emailAddress}</Text>
            <Text
              tx={user?.hasVerifiedEmailAddress ? "settings:emailVerified" : "settings:emailNotVerified"}
              style={{ color: user?.hasVerifiedEmailAddress ? colors.success : colors.error }}
            />
          </View>
        </View>
      </Section>

      {/* Actions Section */}
      <Section titleTx="settings:actions">
        <View style={{ backgroundColor: colors.background, padding: spacing.md, borderRadius: 8 }}>
          <SignOutButton />
        </View>
      </Section>
    </Screen>
  )
}
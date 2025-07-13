import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { Link } from "expo-router"
import { useUser } from "@clerk/clerk-expo"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"

import { Screen } from "@/components/Screen"
import { SignOutButton } from "@/components/SignOutButton"
import { Text } from "@/components/Text"
import { isRTL } from "@/i18n"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { Button } from "@/components/Button"

const welcomeLogo = require("@assets/images/logo.png")
const welcomeFace = require("@assets/images/welcome-face.png")

export default function WelcomeScreen() {
  const { themed, theme } = useAppTheme()
  const { user } = useUser()

  const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"])

  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
      <View style={themed($topContainer)}>
        <Image style={themed($welcomeLogo)} source={welcomeLogo} resizeMode="contain" />
        <Text
          testID="welcome-heading"
          style={themed($welcomeHeading)}
          tx="chat:newChat"
          preset="heading"
        />
        <Text tx="chat:chatInputPlaceholder" preset="subheading" />
        <Image
          style={$welcomeFace}
          source={welcomeFace}
          resizeMode="contain"
          tintColor={theme.colors.palette.neutral900}
        />
      </View>

      <View style={themed([$bottomContainer, $bottomContainerInsets])}>
        <Authenticated>
          <Text>{user?.emailAddresses[0].emailAddress}</Text>
          <Link href="/(settings)">
            <Text tx="settings:settings" />
          </Link>
          <SignOutButton />
        </Authenticated>
        <Unauthenticated>
          <Link href="/sign-in">
            <Text tx="auth:signin" />
          </Link>
          <Link href="/sign-up">
            <Text tx="auth:signup" />
          </Link>
        </Unauthenticated>
        <AuthLoading>
          <Text>Loading...</Text>
        </AuthLoading>
      </View>
    </Screen>
  )
}

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexShrink: 1,
  flexGrow: 1,
  flexBasis: "57%",
  justifyContent: "center",
  paddingHorizontal: spacing.lg,
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexShrink: 1,
  flexGrow: 0,
  flexBasis: "43%",
  backgroundColor: colors.palette.neutral100,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingHorizontal: spacing.lg,
  justifyContent: "space-around",
})

const $welcomeLogo: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 88,
  width: "100%",
  marginBottom: spacing.xxl,
})

const $welcomeFace: ImageStyle = {
  height: 169,
  width: 269,
  position: "absolute",
  bottom: -47,
  right: -80,
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}

const $welcomeHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

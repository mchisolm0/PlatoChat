import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { Link, useRouter } from "expo-router"
import { useUser } from "@clerk/clerk-expo"
import { Authenticated, Unauthenticated, AuthLoading, useMutation } from "convex/react"

import { api } from "convex/_generated/api"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { isRTL } from "@/i18n"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"
import { getAnonymousUserId } from "@/utils/anonymousUser"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

const welcomeLogo = require("@assets/images/logo.png")
const welcomeFace = require("@assets/images/welcome-face.png")

export default function WelcomeScreen() {
  const { themed, theme } = useAppTheme()
  const { user } = useUser()
  const createThread = useMutation(api.chat.createThread)
  const createThreadAnonymous = useMutation(api.chat.createThreadAnonymous)
  const router = useRouter()

  const handleNewChat = () => {
    createThread().then((threadId) =>
      router.push({ pathname: "/[threadId]", params: { threadId } }),
    )
  }

  const handleNewChatAnonymous = () => {
    const anonymousUserId = getAnonymousUserId()
    createThreadAnonymous({ anonymousUserId }).then((threadId) =>
      router.push({ pathname: "/[threadId]", params: { threadId } }),
    )
  }

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
          <Link href="/settings">
            <Text tx="settings:settings" />
          </Link>
          <Button tx="chat:newChat" onPress={handleNewChat} />
        </Authenticated>
        <Unauthenticated>
          <Text preset="subheading" text="Try PlatoChat" style={themed($anonymousHeading)} />
          <Button
            text="Start Anonymous Chat (5 messages/day)"
            onPress={handleNewChatAnonymous}
            style={themed($anonymousButton)}
          />
          <Text
            preset="formHelper"
            text="Sign up for more generous access (100 messages/day on free tier, 500 messages/day on pro tier):"
            style={themed($anonymousSubtext)}
          />
          <View style={themed($linkContainer)}>
            <Link href="/sign-in">
              <Text tx="auth:signin" style={{ color: theme.colors.tint }} />
            </Link>
            <Link href="/sign-up">
              <Text tx="auth:signup" style={{ color: theme.colors.tint }} />
            </Link>
          </View>
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

const $anonymousHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $anonymousButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $anonymousSubtext: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $linkContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  justifyContent: "center",
})

import { useEffect, useState } from "react"
import { Slot, SplashScreen } from "expo-router"
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo"
import { useFonts } from "@expo-google-fonts/space-grotesk"
import * as Sentry from "@sentry/react-native"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { initI18n } from "@/i18n"
import { ThemeProvider } from "@/theme/context"
import { customFontsToLoad } from "@/theme/typography"
import { tokenCache } from "@/utils/cache"
import { initCrashReporting } from "@/utils/crashReporting"
import { loadDateFnsLocale } from "@/utils/formatDate"

SplashScreen.preventAutoHideAsync()

initCrashReporting()

if (__DEV__) {
  require("src/devtools/ReactotronConfig.ts")
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL

if (!publishableKey) throw new Error("Missing Clerk publishable key")
if (!convexUrl) throw new Error("Missing Convex URL")

const convexClient = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
})

export { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary"

function Root() {
  const [fontsLoaded, fontError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [])

  const loaded = fontsLoaded && isI18nInitialized

  useEffect(() => {
    if (fontError) throw fontError
  }, [fontError])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <ThemeProvider>
              <KeyboardProvider>
                <Slot />
              </KeyboardProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  )
}

export default Sentry.wrap(Root)

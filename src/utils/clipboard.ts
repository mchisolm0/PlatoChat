// utils/clipboard.js
import { Platform } from "react-native"

interface ClipboardImplementation {
  getString: () => Promise<string>
  setString: (text: string) => Promise<void>
  hasString: () => Promise<boolean>
}

let clipboardImplementation: ClipboardImplementation

if (Platform.OS === "web") {
  const Sentry = require("@sentry/browser")
  // SSR safety: guard access to global objects
  const hasWindow = typeof window !== "undefined"
  const hasNavigator = typeof navigator !== "undefined"
  clipboardImplementation = {
    setString: async (text: string) => {
      if (hasNavigator && hasWindow && navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          // Log to Sentry but don't treat as critical error
          Sentry.addBreadcrumb({
            message: "Clipboard write failed",
            level: "warning",
            data: { error: errorMessage },
          })
          throw new Error("Failed to copy to clipboard")
        }
      } else {
        // Log environment info to Sentry for debugging
        Sentry.addBreadcrumb({
          message: "Clipboard API not available",
          level: "info",
          data: {
            hasClipboard: hasNavigator ? !!navigator.clipboard : false,
            isSecureContext: hasWindow ? window.isSecureContext : undefined,
            protocol: hasWindow ? window.location.protocol : undefined,
            userAgent: hasNavigator ? navigator.userAgent.substring(0, 100) : undefined, // Truncate for privacy
          },
        })

        if (!hasWindow) {
          throw new Error("Clipboard not available during server-side rendering")
        }

        throw new Error(
          window.isSecureContext
            ? "Clipboard not supported in this browser"
            : "Clipboard requires HTTPS. Please use a secure connection.",
        )
      }
    },

    getString: async (): Promise<string> => {
      if (hasNavigator && hasWindow && navigator.clipboard && window.isSecureContext) {
        try {
          return await navigator.clipboard.readText()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          // Reading clipboard often fails due to permissions - don't spam Sentry
          Sentry.addBreadcrumb({
            message: "Clipboard read failed (likely permissions)",
            level: "info",
            data: { error: errorMessage },
          })
          return ""
        }
      } else {
        return ""
      }
    },

    hasString: async () => {
      try {
        const text = await clipboardImplementation.getString()
        return text.length > 0
      } catch {
        return false
      }
    },
  }
} else {
  const Sentry = require("@sentry/react-native")
  const Clipboard = require("@react-native-clipboard/clipboard").default
  clipboardImplementation = {
    setString: async (text: string) => {
      try {
        await Clipboard.setString(text)
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "clipboard" },
          extra: { platform: Platform.OS, textLength: text.length },
        })
        throw error
      }
    },

    getString: async (): Promise<string> => {
      try {
        return await Clipboard.getString()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        Sentry.addBreadcrumb({
          message: "Native clipboard read failed",
          level: "warning",
          data: { error: errorMessage, platform: Platform.OS },
        })
        return ""
      }
    },

    hasString: Clipboard.hasString,
  }
}

export default clipboardImplementation

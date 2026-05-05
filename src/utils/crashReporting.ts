/**
 *   Expo https://docs.expo.dev/guides/using-sentry/
 */
import * as Sentry from "@sentry/react-native"

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN

export const initCrashReporting = () => {
  if (!dsn) {
    if (__DEV__) {
      console.warn("Sentry disabled: missing EXPO_PUBLIC_SENTRY_DSN")
    }
    return
  }

  Sentry.init({
    dsn,
    debug: __DEV__,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? "development" : "production"),

    sendDefaultPii: false,
    enableLogs: true,
    enableCaptureFailedRequests: true,
    tracesSampleRate: __DEV__ ? 1 : 0.1,
    profilesSampleRate: 1,

    // Session Replay is most useful when paired with baseline tracing.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  })
}

/**
 * Error classifications used to sort errors on error reporting services.
 */
export enum ErrorType {
  /**
   * An error that would normally cause a red screen in dev
   * and force the user to sign out and restart.
   */
  FATAL = "Fatal",
  /**
   * An error caught by try/catch where defined using Reactotron.tron.error.
   */
  HANDLED = "Handled",
}

/**
 * Manually report a handled error.
 */
export const reportCrash = (
  error: Error,
  type: ErrorType = ErrorType.FATAL,
  errorInfo?: { componentStack?: string },
) => {
  if (__DEV__) {
    // Log to console and Reactotron in development
    const message = error.message || "Unknown"
    console.error(error)
    console.log(message, type)
    if (errorInfo?.componentStack) {
      console.log("Component stack:", errorInfo.componentStack)
    }
  } else {
    // Add extra context for React component errors
    if (errorInfo?.componentStack) {
      Sentry.withScope((scope) => {
        scope.setContext("errorBoundary", {
          componentStack: errorInfo.componentStack,
        })
        scope.setTag("errorType", type)
        Sentry.captureException(error)
      })
    } else {
      Sentry.withScope((scope) => {
        scope.setTag("errorType", type)
        Sentry.captureException(error)
      })
    }
  }
}

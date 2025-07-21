/**
 *   Expo https://docs.expo.dev/guides/using-sentry/
 */
import * as Sentry from "@sentry/react-native"

export const initCrashReporting = () => {
  Sentry.init({
    dsn: "https://02c59ce23297a578c341f7f2e46069b2@o4507118738669568.ingest.us.sentry.io/4509701281873920",

    sendDefaultPii: false,

    // Configure Session Replay
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

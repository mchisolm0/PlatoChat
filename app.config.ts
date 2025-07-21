import { withSentry } from "@sentry/react-native/expo"
import { ExpoConfig, ConfigContext } from "expo/config"

/**
 * Use ts-node here so we can use TypeScript for our Config Plugins
 * and not have to compile them to JavaScript
 */
require("ts-node/register")

const IS_DEV = process.env.APP_VARIANT === "development"
const IS_PREVIEW = process.env.APP_VARIANT === "preview"

const getAppName = () => {
  if (IS_DEV) {
    return "PlatoChat (Dev)"
  }
  if (IS_PREVIEW) {
    return "PlatoChat (Preview)"
  }
  return "PlatoChat"
}

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.platochat.dev"
  }
  if (IS_PREVIEW) {
    return "com.platochat.preview"
  }
  return "com.platochat"
}

const getAppScheme = () => {
  if (IS_DEV) {
    return "platochat-dev"
  }
  if (IS_PREVIEW) {
    return "platochat-preview"
  }
  return "platochat"
}

/**
 * @param config ExpoConfig coming from the static config app.json if it exists
 *
 * You can read more about Expo's Configuration Resolution Rules here:
 * https://docs.expo.dev/workflow/configuration/#configuration-resolution-rules
 */
module.exports = ({ config }: ConfigContext): ExpoConfig => {
  const existingPlugins = config.plugins ?? []

  const expoConfig: ExpoConfig = {
    ...config,
    name: getAppName(),
    slug: "PlatoChat",
    scheme: getAppScheme(),
    version: config.version || "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/images/app-icon-all.png",
    updates: {
      url: "https://u.expo.dev/0a5ec96e-6e3e-4d44-a355-f825a2debc4a",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    newArchEnabled: true,
    jsEngine: "hermes",
    assetBundlePatterns: ["**/*"],

    ios: {
      ...config.ios,
      bundleIdentifier: getUniqueIdentifier(),
      icon: "./assets/images/app-icon-ios.png",
      supportsTablet: true,
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
          },
        ],
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      ...config.android,
      package: getUniqueIdentifier(),
      icon: "./assets/images/app-icon-android-legacy.png",
      adaptiveIcon: {
        foregroundImage: "./assets/images/app-icon-android-adaptive-foreground.png",
        backgroundImage: "./assets/images/app-icon-android-adaptive-background.png",
      },
      allowBackup: false,
      edgeToEdgeEnabled: true,
    },

    web: {
      favicon: "./assets/images/app-icon-web-favicon.png",
      bundler: "metro",
    },

    plugins: [
      ...existingPlugins,
      "expo-secure-store",
      "expo-web-browser",
      "expo-localization",
      "expo-font",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/app-icon-android-adaptive-foreground.png",
          imageWidth: 300,
          resizeMode: "contain",
          backgroundColor: "#191015",
        },
      ],
      require("./plugins/withSplashScreen").withSplashScreen,
    ],

    extra: {
      eas: {
        projectId: "0a5ec96e-6e3e-4d44-a355-f825a2debc4a",
      },
    },
  }

  return withSentry(expoConfig, {
    url: "https://sentry.io/",
    project: "plato-chat",
    organization: "matthew-chisolm",
  })
}

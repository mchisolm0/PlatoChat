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

const getUpdateUrl = () => {
  if (IS_DEV) {
    return "https://u.expo.dev/9fc16c8d-01c5-4f05-ade8-e7296feb94f2"
  }
  if (IS_PREVIEW) {
    return "https://u.expo.dev/a6fe3120-816c-4d4b-9e6a-f4261d3412c7"
  }
  return "https://u.expo.dev/5dbd8fd1-d3e1-41cf-8d69-6d9d57e633fb"
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
      fallbackToCacheTimeout: 0,
      url: getUpdateUrl(),
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

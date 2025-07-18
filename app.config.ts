import { ExpoConfig, ConfigContext } from "@expo/config"

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
module.exports = ({ config }: ConfigContext): Partial<ExpoConfig> => {
  const existingPlugins = config.plugins ?? []

  return {
    ...config,
    name: getAppName(),
    // Keep original slug to match EAS projectId
    scheme: getAppScheme(),
    ios: {
      ...config.ios,
      bundleIdentifier: getUniqueIdentifier(),
      // This privacyManifests is to get you started.
      // See Expo's guide on apple privacy manifests here:
      // https://docs.expo.dev/guides/apple-privacy/
      // You may need to add more privacy manifests depending on your app's usage of APIs.
      // More details and a list of "required reason" APIs can be found in the Apple Developer Documentation.
      // https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"], // CA92.1 = "Access info from same app, per documentation"
          },
        ],
      },
    },
    android: {
      ...config.android,
      package: getUniqueIdentifier(),
    },
    plugins: [
      ...existingPlugins,
      "expo-secure-store",
      "expo-web-browser",
      require("./plugins/withSplashScreen").withSplashScreen,
    ],
  }
}

import * as SecureStore from "expo-secure-store"
import { TokenCache } from "@clerk/clerk-expo"
import { Platform } from "react-native"

const createTokenCache = (): TokenCache => {
  return {
    async getToken(key: string) {
      try {
        const token = await SecureStore.getItemAsync(key)
        if (token) console.log(`Token found in cache: ${token}`)
        else console.log(`Token not found in cache: ${key}`)
        return token
      } catch (error) {
        console.error(`Error getting token from cache: ${error}`)
        return undefined
      }
    },
    async saveToken(key: string, value: string) {
      return await SecureStore.setItemAsync(key, value)
    },
  }
}

export const tokenCache = Platform.OS !== "web" ? createTokenCache() : undefined
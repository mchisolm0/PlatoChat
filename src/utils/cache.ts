import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"
import { TokenCache } from "@clerk/clerk-expo"

const createTokenCache = (): TokenCache => {
  return {
    async getToken(key: string) {
      try {
        const token = await SecureStore.getItemAsync(key)
        if (token) console.log(`Token found in cache: ${token.slice(0, 10)}`)
        else console.log(`Token not found in cache: ${key.slice(0, 10)}`)
        return token
      } catch (error) {
        console.error(`Error getting token from cache: ${error}`)
        return undefined
      }
    },
    async saveToken(key: string, value: string) {
      return await SecureStore.setItemAsync(key, value)
    },
    async clearToken(key: string) {
      console.log(`Clearing token from cache: ${key.slice(0, 10)}`)
      return await SecureStore.deleteItemAsync(key)
    },
  }
}

export const tokenCache = Platform.OS !== "web" ? createTokenCache() : undefined

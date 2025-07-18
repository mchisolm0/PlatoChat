/**
 * Utility functions for handling anonymous users
 */

import * as Crypto from "expo-crypto"

import { loadString, saveString, remove } from "./storage"

/**
 * Gets or creates an anonymous user ID stored in MMKV
 * @returns Anonymous user ID with "anon_" prefix
 */
export const getAnonymousUserId = (): string => {
  try {
    let anonymousId = loadString("anonymousUserId")
    if (!anonymousId) {
      anonymousId = `anon_${Crypto.randomUUID()}`
      saveString("anonymousUserId", anonymousId)
    }
    return anonymousId
  } catch (error) {
    console.warn("Failed to access MMKV storage, generating new UUID:", error)
    // Even on error, generate a proper UUID (just don't persist it)
    return `anon_${Crypto.randomUUID()}`
  }
}

/**
 * Clears the anonymous user ID (useful when user signs up)
 * Should eventually also migrate any anonymous data to the new user
 */
export const clearAnonymousUserId = (): void => {
  try {
    remove("anonymousUserId")
  } catch (error) {
    console.warn("Failed to clear anonymous user ID:", error)
  }
}

/**
 * Checks if a user ID is anonymous
 */
export const isAnonymousUser = (userId?: string): boolean => {
  return userId?.startsWith("anon_") ?? false
}

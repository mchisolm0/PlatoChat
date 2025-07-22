import { storage } from "./storage"
import { DEFAULT_MODEL_ID, isValidModelId } from "../config/models"

const MODEL_PREFERENCE_KEY = "user.modelPreference"
const THREAD_MODEL_PREFIX = "thread.model."

export function getUserModelPreference(): string {
  try {
    const stored = storage.getString(MODEL_PREFERENCE_KEY)
    if (stored && isValidModelId(stored)) {
      return stored
    }
  } catch (error) {
    console.warn("Failed to get user model preference from MMKV:", error)
  }
  return DEFAULT_MODEL_ID
}

export function setUserModelPreference(modelId: string): void {
  try {
    if (isValidModelId(modelId)) {
      storage.set(MODEL_PREFERENCE_KEY, modelId)
    } else {
      console.warn("Invalid model ID, not saving preference:", modelId)
    }
  } catch (error) {
    console.warn("Failed to save user model preference to MMKV:", error)
  }
}

export function getThreadModelOverride(threadId: string): string | null {
  try {
    const stored = storage.getString(`${THREAD_MODEL_PREFIX}${threadId}`)
    if (stored && isValidModelId(stored)) {
      return stored
    }
  } catch (error) {
    console.warn("Failed to get thread model override from MMKV:", error)
  }
  return null
}

export function setThreadModelOverride(threadId: string, modelId: string): void {
  try {
    if (isValidModelId(modelId)) {
      storage.set(`${THREAD_MODEL_PREFIX}${threadId}`, modelId)
    } else {
      console.warn("Invalid model ID, not saving thread override:", modelId)
    }
  } catch (error) {
    console.warn("Failed to save thread model override to MMKV:", error)
  }
}

export function clearThreadModelOverride(threadId: string): void {
  try {
    storage.delete(`${THREAD_MODEL_PREFIX}${threadId}`)
  } catch (error) {
    console.warn("Failed to clear thread model override from MMKV:", error)
  }
}

export function getEffectiveModelForThread(threadId: string): string {
  const threadOverride = getThreadModelOverride(threadId)
  if (threadOverride) {
    return threadOverride
  }
  return getUserModelPreference()
}

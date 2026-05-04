export interface ModelConfig {
  id: string
  displayName: string
  shortName: string
  provider: "openai" | "google" | "minimax"
  tier: "free" | "pro"
  features?: string[]
  maxTokens?: number
}

export const FREE_MODEL: ModelConfig = {
  id: "google/gemini-2.0-flash-001",
  displayName: "Gemini 2.0 Flash",
  shortName: "Gemini 2.0",
  provider: "google",
  tier: "pro",
  features: ["chat", "advanced-reasoning", "multimodal"],
  maxTokens: 8192,
}

export const PAID_MODELS: ModelConfig[] = [
  {
    id: "minimax/minimax-m2.5:free",
    displayName: "MiniMax M2.5",
    shortName: "M2.5",
    provider: "minimax",
    tier: "free",
    features: ["chat", "improved-reasoning"],
    maxTokens: 8192,
  },
  {
    id: "openai/gpt-5-nano",
    displayName: "GPT-5 Nano",
    shortName: "GPT-5 Nano",
    provider: "openai",
    tier: "pro",
    features: ["chat", "fast-response", "improved-reasoning"],
    maxTokens: 8192,
  },
  {
    id: "openai/gpt-oss-20b",
    displayName: "GPT-OSS 20B",
    shortName: "OSS 20B",
    provider: "openai",
    tier: "free",
    features: ["chat", "fast-response"],
    maxTokens: 32000,
  },
  {
    id: "openai/gpt-oss-120b",
    displayName: "GPT-OSS 120B",
    shortName: "OSS 120B",
    provider: "openai",
    tier: "pro",
    features: ["chat", "fast-response"],
    maxTokens: 32000,
  },
]

export const ALL_MODELS: ModelConfig[] = [FREE_MODEL, ...PAID_MODELS]

export const DEFAULT_MODEL_ID = FREE_MODEL.id

export function getModelById(modelId: string): ModelConfig {
  const model = ALL_MODELS.find((m) => m.id === modelId)
  return model || FREE_MODEL
}

export function isValidModelId(modelId: string): boolean {
  return ALL_MODELS.some((m) => m.id === modelId)
}

export function isProModel(modelId: string): boolean {
  const model = getModelById(modelId)
  return model.tier === "pro"
}

export function validateModelId(modelId?: string): string {
  if (!modelId || !isValidModelId(modelId)) {
    return DEFAULT_MODEL_ID
  }
  return modelId
}

export function validateModelIdForAnonymousUser(_modelId?: string): string {
  // Anonymous users can only use the free model, regardless of what they request
  return DEFAULT_MODEL_ID
}

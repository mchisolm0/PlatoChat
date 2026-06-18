export interface ModelConfig {
  id: string
  displayName: string
  shortName: string
  provider: "openai" | "google" | "anthropic" | "deepseek"
  tier: "free" | "pro"
  features?: string[]
  maxTokens?: number
}

export const FREE_MODEL: ModelConfig = {
  id: "deepseek/deepseek-v4-flash",
  displayName: "DeepSeek V4 Flash",
  shortName: "V4 Flash",
  provider: "deepseek",
  tier: "free",
  features: ["chat", "low-cost", "reasoning", "1M context"],
  maxTokens: 1048576,
}

export const PAID_MODELS: ModelConfig[] = [
  {
    id: "google/gemini-3.5-flash",
    displayName: "Gemini 3.5 Flash",
    shortName: "Gemini 3.5",
    provider: "google",
    tier: "pro",
    features: ["chat", "reasoning", "multimodal", "1M context"],
    maxTokens: 65536,
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    displayName: "Claude Sonnet 4.6",
    shortName: "Sonnet 4.6",
    provider: "anthropic",
    tier: "pro",
    features: ["chat", "coding", "writing", "1M context"],
    maxTokens: 128000,
  },
  {
    id: "deepseek/deepseek-v4-pro",
    displayName: "DeepSeek V4 Pro",
    shortName: "V4 Pro",
    provider: "deepseek",
    tier: "pro",
    features: ["chat", "deep reasoning", "coding", "1M context"],
    maxTokens: 384000,
  },
  {
    id: "openai/gpt-5.4-mini",
    displayName: "GPT-5.4 Mini",
    shortName: "GPT-5.4 Mini",
    provider: "openai",
    tier: "pro",
    features: ["chat", "reasoning", "coding", "tool use"],
    maxTokens: 128000,
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

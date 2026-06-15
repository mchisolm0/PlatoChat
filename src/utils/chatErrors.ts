const RATE_LIMIT_MESSAGE_REGEX = /(?:AI\s+)?rate limited\. Please try again in \d+ seconds\./i

function extractErrorMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return null
}

export function getChatErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const message = extractErrorMessage(error)
  if (!message) return fallback

  const rateLimitMessage = message.match(RATE_LIMIT_MESSAGE_REGEX)?.[0]
  if (rateLimitMessage) {
    return rateLimitMessage.charAt(0).toUpperCase() + rateLimitMessage.slice(1)
  }

  if (message.toLowerCase().includes("rate limited")) {
    return "You're sending messages too quickly. Please wait a moment and try again."
  }

  return message
}

import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter"

import { components } from "./_generated/api"

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiRequests: {
    kind: "token bucket",
    rate: 60, // 60 requests per minute
    period: MINUTE,
    capacity: 10,
  },

  aiTokens: {
    kind: "token bucket",
    rate: 50000, // 50k tokens per minute
    period: MINUTE,
    capacity: 10000, // Allow bursts of 10k tokens
    shards: 5,
  },

  sendMessage: {
    kind: "token bucket",
    rate: 30, // 30 messages per minute (1 every 2 seconds)
    period: MINUTE,
    capacity: 5,
  },

  createThread: {
    kind: "fixed window",
    rate: 10, // 10 new threads per hour
    period: HOUR,
  },

  authAttempts: {
    kind: "token bucket",
    rate: 5, // 5 attempts per minute
    period: MINUTE,
    capacity: 3,
  },

  heavyOperations: {
    kind: "fixed window",
    rate: 100,
    period: MINUTE,
    shards: 3,
  },

  anonymousMessages: {
    kind: "fixed window",
    rate: 5, // 5 messages per day
    period: 24 * HOUR,
  },

  anonymousThreads: {
    kind: "fixed window",
    rate: 2, // 2 threads per day
    period: 24 * HOUR,
  },

  anonymousAiRequests: {
    kind: "fixed window",
    rate: 5, // 5 AI requests per day
    period: 24 * HOUR,
  },
})

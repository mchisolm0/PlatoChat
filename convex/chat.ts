import { Agent, vStreamArgs, saveMessage, listMessages, syncStreams } from "@convex-dev/agent"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { components } from "./_generated/api"
import { internal } from "./_generated/api"
import { mutation, query, ActionCtx, internalAction } from "./_generated/server"
import { rateLimiter } from "./limiter"
import {
  DEFAULT_MODEL_ID,
  validateModelId,
  validateModelIdForAnonymousUser,
  ALL_MODELS,
} from "./models"

const chatAgents = new Map<string, Agent<any>>()

for (const model of ALL_MODELS) {
  chatAgents.set(
    model.id,
    new Agent(components.agent, {
      name: `chat-agent-${model.id}`,
      chat: openrouter.chat(model.id),
      instructions: "You are a helpful assistant. Be concise and friendly in your responses.",
      maxSteps: 10,
    }),
  )
}

function getChatAgent(modelId: string, isAnonymous: boolean = false): Agent<any> {
  const effectiveModelId = isAnonymous
    ? validateModelIdForAnonymousUser(modelId)
    : validateModelId(modelId)

  const agent = chatAgents.get(effectiveModelId)
  if (!agent) {
    const defaultAgent = chatAgents.get(DEFAULT_MODEL_ID)
    if (!defaultAgent) {
      throw new Error(
        `Critical error: Default model '${DEFAULT_MODEL_ID}' not found in chat agents. This should never happen.`,
      )
    }
    return defaultAgent
  }
  return agent
}

function getEffectiveUserId(userId: any, anonymousUserId?: string): string {
  if (userId?.tokenIdentifier) {
    return userId.tokenIdentifier
  }
  if (anonymousUserId) {
    return anonymousUserId
  }
  throw new Error("Must be signed in or provide anonymous user ID")
}

function isAnonymousUser(effectiveUserId: string): boolean {
  return effectiveUserId.startsWith("anon_")
}

export const createThread = mutation({
  args: {
    modelId: v.optional(v.string()),
    anonymousUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    const effectiveUserId = getEffectiveUserId(userId, args.anonymousUserId)
    const isAnonymous = isAnonymousUser(effectiveUserId)

    console.log(
      "createThread - effectiveUserId:",
      effectiveUserId ? effectiveUserId.slice(0, 20) + "..." : "null",
      "isAnonymous:",
      isAnonymous,
    )

    const rateLimitConfig = isAnonymous ? "anonymousThreads" : "createThread"
    const { ok, retryAfter } = await rateLimiter.limit(ctx, rateLimitConfig, {
      key: effectiveUserId,
    })
    if (!ok) {
      throw new Error(`Rate limited. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`)
    }

    const validatedModelId = isAnonymous
      ? validateModelIdForAnonymousUser(args.modelId)
      : validateModelId(args.modelId)
    const chatAgent = getChatAgent(validatedModelId, isAnonymous)

    const { threadId } = await chatAgent.createThread(ctx, {
      userId: effectiveUserId,
    })
    return threadId
  },
})

async function generateThreadTitle(
  ctx: ActionCtx,
  threadId: string,
  prompt: string,
  messages: any,
) {
  const messageCount = messages.page.length

  const shouldGenerateTitle = (() => {
    if (messageCount === 2) return true
    const titleGenerationPoints = [2, 6, 14, 30, 62, 126, 254]
    return titleGenerationPoints.includes(messageCount)
  })()

  if (shouldGenerateTitle) {
    try {
      const { generateText } = await import("ai")

      const maxMessagesForTitle = Math.min(messageCount, 10)
      const recentMessages = messages.page.slice(-maxMessagesForTitle)

      const messageTexts = recentMessages
        .map((msg: any) => msg.text || "")
        .filter((text: string) => text.length > 0)

      const conversationContent = [...messageTexts, prompt].join("\n")

      const titleResult = await generateText({
        model: openrouter(DEFAULT_MODEL_ID),
        prompt: `Based on this conversation content, suggest a concise title (max 50 characters): ${conversationContent}\nTitle:`,
      })

      await ctx.runMutation(components.agent.threads.updateThread, {
        threadId: threadId,
        patch: { title: titleResult.text.trim() },
      })
    } catch (error) {
      console.error("Error in generateThreadTitle:", error)
      throw error
    }
  }
}

export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    modelId: v.optional(v.string()),
    anonymousUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    const effectiveUserId = getEffectiveUserId(userId, args.anonymousUserId)
    const isAnonymous = isAnonymousUser(effectiveUserId)

    console.log(
      "sendMessage - effectiveUserId:",
      effectiveUserId ? effectiveUserId.slice(0, 20) + "..." : "null",
      "isAnonymous:",
      isAnonymous,
    )

    const sendRateLimitConfig = isAnonymous ? "anonymousMessages" : "sendMessage"
    const { ok: sendOk, retryAfter: sendRetryAfter } = await rateLimiter.limit(
      ctx,
      sendRateLimitConfig,
      {
        key: effectiveUserId,
      },
    )
    if (!sendOk) {
      throw new Error(
        `Rate limited. Please try again in ${Math.ceil(sendRetryAfter / 1000)} seconds.`,
      )
    }

    const aiRateLimitConfig = isAnonymous ? "anonymousAiRequests" : "aiRequests"
    const { ok: aiOk, retryAfter: aiRetryAfter } = await rateLimiter.limit(ctx, aiRateLimitConfig, {
      key: effectiveUserId,
    })
    if (!aiOk) {
      throw new Error(
        `AI rate limited. Please try again in ${Math.ceil(aiRetryAfter / 1000)} seconds.`,
      )
    }

    const validatedModelId = isAnonymous
      ? validateModelIdForAnonymousUser(args.modelId)
      : validateModelId(args.modelId)
    const chatAgent = getChatAgent(validatedModelId, isAnonymous)

    const messages = await chatAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: { numItems: 1, cursor: null },
      excludeToolMessages: true,
    })

    if (messages.page.length > 0 && effectiveUserId !== messages.page[0]?.userId) {
      throw new Error("Unauthorized access to thread")
    }

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      userId: effectiveUserId,
      prompt: args.prompt,
    })

    await ctx.scheduler.runAfter(0, internal.chat.streamResponseAsync, {
      threadId: args.threadId,
      promptMessageId: messageId,
      modelId: validatedModelId,
      effectiveUserId,
      isAnonymous,
      prompt: args.prompt,
    })
  },
})

export const streamResponseAsync = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    modelId: v.string(),
    effectiveUserId: v.string(),
    isAnonymous: v.boolean(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const chatAgent = getChatAgent(args.modelId, args.isAnonymous)

      const result = await chatAgent.streamText(
        ctx,
        { threadId: args.threadId },
        { promptMessageId: args.promptMessageId },
        {
          saveStreamDeltas: true,
        },
      )

      await result.consumeStream()
      console.log("streamText completed")

      const messages = await chatAgent.listMessages(ctx, {
        threadId: args.threadId,
        paginationOpts: { numItems: 20, cursor: null },
        excludeToolMessages: true,
      })

      try {
        await generateThreadTitle(ctx, args.threadId, args.prompt, messages)
      } catch (titleError) {
        console.error("Error generating thread title:", titleError)
      }
    } catch (error) {
      console.error("Error generating AI response:", error)
      throw error
    }
  },
})

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
    anonymousUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    const effectiveUserId = getEffectiveUserId(userId, args.anonymousUserId)

    const paginated = await listMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
      excludeToolMessages: true,
    })

    if (paginated.page.length > 0 && effectiveUserId !== paginated.page[0]?.userId) {
      throw new Error("Unauthorized access to thread")
    }

    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    })

    return {
      ...paginated,
      streams,
    }
  },
})

export const listUserThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
    anonymousUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    const effectiveUserId = getEffectiveUserId(userId, args.anonymousUserId)

    console.log(
      "listUserThreads - effectiveUserId:",
      effectiveUserId ? effectiveUserId.slice(0, 20) + "..." : "null",
    )

    if (args.query && args.query.trim() !== "") {
      return await ctx.runQuery(components.agent.threads.searchThreadTitles, {
        query: args.query,
        userId: effectiveUserId,
        limit: args.limit ?? 10,
      })
    }
    const paginated = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId: effectiveUserId,
      order: "desc",
      paginationOpts: args.paginationOpts,
    })
    return paginated.page
  },
})

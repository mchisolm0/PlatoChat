import { Agent, vStreamArgs } from "@convex-dev/agent"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { components } from "./_generated/api"
import { mutation, action, query, ActionCtx } from "./_generated/server"
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
      name: `chat-agent-${model.provider}`,
      chat: openrouter.chat(model.id),
      instructions: "You are a helpful assistant. Be concise and friendly in your responses.",
      maxSteps: 10,
    }),
  )
}

function getChatAgent(modelId: string): Agent<any> {
  const agent = chatAgents.get(modelId)
  if (!agent) {
    return chatAgents.get(DEFAULT_MODEL_ID)!
  }
  return agent
}

export const createThread = mutation({
  args: {
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    console.log(
      "createThread - userId:",
      userId ? "exists" : "null",
      userId?.tokenIdentifier ? `token: ${userId.tokenIdentifier.slice(0, 20)}...` : "no token",
    )
    if (!userId) {
      console.log("Unauthorized. Please sign in.")
      throw new Error("Unauthorized. Please sign in.")
    } else if (!userId?.tokenIdentifier) {
      console.log("Something is wrong with your sign in. Please contact support.")
      throw new Error("Something is wrong with your sign in. Please contact support.")
    }

    const { ok, retryAfter } = await rateLimiter.limit(ctx, "createThread", {
      key: userId.tokenIdentifier,
    })
    if (!ok) {
      throw new Error(`Rate limited. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`)
    }

    const validatedModelId = validateModelId(args.modelId)
    const chatAgent = getChatAgent(validatedModelId)

    const { threadId } = await chatAgent.createThread(ctx, {
      userId: userId?.tokenIdentifier,
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
  if (messages.page.length === 0 || messages.page.length === 4) {
    const { generateText } = await import("ai")

    let conversationContent = ""
    if (messages.page.length === 0) {
      conversationContent = prompt
    } else {
      const messageTexts = messages.page
        .map((msg: any) => msg.text || "")
        .filter((text: string) => text.length > 0)
      conversationContent = [...messageTexts, prompt].join("\n")
    }

    const titleResult = await generateText({
      model: openrouter(DEFAULT_MODEL_ID),
      prompt: `Based on this conversation content, suggest a concise title (max 50 characters): ${conversationContent}\nTitle:`,
    })

    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId: threadId,
      patch: { title: titleResult.text.trim() },
    })
  }
}

export const sendMessageToAgent = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    console.log(
      "sendMessageToAgent - userId:",
      userId ? "exists" : "null",
      userId?.tokenIdentifier ? `token: ${userId.tokenIdentifier.slice(0, 20)}...` : "no token",
    )
    if (!userId) {
      console.log("Unauthorized. Please sign in.")
      throw new Error("Unauthorized. Please sign in.")
    } else if (!userId?.tokenIdentifier) {
      console.log("Something is wrong with your sign in. Please contact support.")
      throw new Error("Something is wrong with your sign in. Please contact support.")
    }

    const { ok, retryAfter } = await rateLimiter.limit(ctx, "sendMessage", {
      key: userId.tokenIdentifier,
    })
    if (!ok) {
      throw new Error(
        `Rate limited. Please wait ${Math.ceil(retryAfter / 1000)} seconds before sending another message.`,
      )
    }

    const aiRequestLimit = await rateLimiter.limit(ctx, "aiRequests", {
      key: userId.tokenIdentifier,
    })
    if (!aiRequestLimit.ok) {
      throw new Error(
        `AI request rate limit exceeded. Please try again in ${Math.ceil(aiRequestLimit.retryAfter / 1000)} seconds.`,
      )
    }
    const validatedModelId = validateModelId(args.modelId)
    const chatAgent = getChatAgent(validatedModelId)

    const messages = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
      threadId: args.threadId,
      order: "asc",
      excludeToolMessages: true,
      paginationOpts: { cursor: null, numItems: 10 },
    })

    if (messages.page.length > 0 && userId?.tokenIdentifier !== messages.page[0]?.userId) {
      console.log("Unauthorized. Please sign in.")
      throw new Error("Unauthorized. Please sign in.")
    }

    const { thread } = await chatAgent.continueThread(ctx, {
      threadId: args.threadId,
    })
    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: { chunking: "word" } },
    )

    await generateThreadTitle(ctx, args.threadId, args.prompt, messages)

    return result.consumeStream()
  },
})

export const createThreadAnonymous = mutation({
  args: {
    anonymousUserId: v.string(),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "anonymousThreads", {
      key: args.anonymousUserId,
    })
    if (!ok) {
      throw new Error(
        `Anonymous user limit reached. Try again in ${Math.ceil(retryAfter / (1000 * 60 * 60))} hours. If you sign in, you can create more threads and send more messages.`,
      )
    }

    const validatedModelId = validateModelIdForAnonymousUser(args.modelId)
    const chatAgent = getChatAgent(validatedModelId)

    const { threadId } = await chatAgent.createThread(ctx, {
      userId: args.anonymousUserId,
    })
    return threadId
  },
})

export const sendMessageToAgentAnonymous = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    anonymousUserId: v.string(),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "anonymousMessages", {
      key: args.anonymousUserId,
    })
    if (!ok) {
      const hoursLeft = Math.ceil(retryAfter / (1000 * 60 * 60))
      throw new Error(
        `Daily message limit reached. Try again in ${hoursLeft} hours or sign in to increase how many messages you can send.`,
      )
    }

    const aiRequestLimit = await rateLimiter.limit(ctx, "anonymousAiRequests", {
      key: args.anonymousUserId,
    })
    if (!aiRequestLimit.ok) {
      const hoursLeft = Math.ceil(aiRequestLimit.retryAfter / (1000 * 60 * 60))
      throw new Error(
        `Daily AI request limit reached. Try again in ${hoursLeft} hours or sign in to increase how many AI requests you can make.`,
      )
    }

    const validatedModelId = validateModelIdForAnonymousUser(args.modelId)
    const chatAgent = getChatAgent(validatedModelId)

    const messages = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
      threadId: args.threadId,
      order: "asc",
      excludeToolMessages: true,
      paginationOpts: { cursor: null, numItems: 10 },
    })

    if (messages.page.length > 0 && args.anonymousUserId !== messages.page[0]?.userId) {
      throw new Error("Unauthorized access to thread")
    }

    const { thread } = await chatAgent.continueThread(ctx, {
      threadId: args.threadId,
    })
    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: { chunking: "line" } },
    )

    await generateThreadTitle(ctx, args.threadId, args.prompt, messages)

    return result.consumeStream()
  },
})

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    if (!userId) {
      console.log("Unauthorized. Please sign in.")
      throw new Error("Unauthorized. Please sign in.")
    } else if (!userId?.tokenIdentifier) {
      console.log("Something is wrong with your sign in. Please contact support.")
      throw new Error("Something is wrong with your sign in. Please contact support.")
    }
    const defaultAgent = getChatAgent(DEFAULT_MODEL_ID)
    const paginated = await defaultAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
      excludeToolMessages: true,
    })

    if (paginated.page.length > 0 && userId?.tokenIdentifier !== paginated.page[0]?.userId) {
      console.log("Unauthorized. Please sign in.")
      throw new Error("Unauthorized. Please sign in.")
    }

    const streams = await defaultAgent.syncStreams(ctx, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    })

    return {
      ...paginated,
      streams,
    }
  },
})

export const listThreadMessagesAnonymous = query({
  args: {
    threadId: v.string(),
    anonymousUserId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const defaultAgent = getChatAgent(DEFAULT_MODEL_ID)
    const paginated = await defaultAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
      excludeToolMessages: true,
    })

    if (paginated.page.length > 0 && args.anonymousUserId !== paginated.page[0]?.userId) {
      throw new Error("Unauthorized access to thread")
    }

    const streams = await defaultAgent.syncStreams(ctx, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    })

    return {
      ...paginated,
      streams,
    }
  },
})

export const listUserThreadsAnonymous = query({
  args: {
    anonymousUserId: v.string(),
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.query && args.query.trim() !== "") {
      return await ctx.runQuery(components.agent.threads.searchThreadTitles, {
        query: args.query,
        userId: args.anonymousUserId,
        limit: args.limit ?? 10,
      })
    }
    const paginated = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId: args.anonymousUserId,
      order: "desc",
      paginationOpts: args.paginationOpts,
    })
    return paginated.page
  },
})

export const listUserThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity()
    console.log(
      "listUserThreads - userId:",
      userId ? "exists" : "null",
      userId?.tokenIdentifier ? `token: ${userId.tokenIdentifier.slice(0, 20)}...` : "no token",
    )
    if (!userId) {
      console.log("Unauthorized. Please sign in.")
      throw new Error("Unauthorized. Please sign in.")
    } else if (!userId?.tokenIdentifier) {
      console.log("Something is wrong with your sign in. Please contact support.")
      throw new Error("Something is wrong with your sign in. Please contact support.")
    }
    if (args.query && args.query.trim() !== "") {
      return await ctx.runQuery(components.agent.threads.searchThreadTitles, {
        query: args.query,
        userId: userId?.tokenIdentifier,
        limit: args.limit ?? 10,
      })
    }
    const paginated = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId: userId?.tokenIdentifier,
      order: "desc",
      paginationOpts: args.paginationOpts,
    })
    return paginated.page
  },
})

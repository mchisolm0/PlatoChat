import { Agent, vStreamArgs } from "@convex-dev/agent"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { components } from "./_generated/api"
import { mutation, action, query } from "./_generated/server"

const chatAgent = new Agent(components.agent, {
  name: "chat-agent",
  chat: openrouter.chat("openai/gpt-4.1-nano"),
  instructions: "You are a helpful assistant. Be concise and friendly in your responses.",
  maxSteps: 10,
})

export const createThread = mutation({
  args: {},
  handler: async (ctx) => {
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
    const { threadId } = await chatAgent.createThread(ctx, {
      userId: userId?.tokenIdentifier,
    })
    return threadId
  },
})

export const sendMessageToAgent = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
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
      { saveStreamDeltas: { chunking: "line" } },
    )

    if (messages.page.length === 0 || messages.page.length === 4) {
      const { generateText } = await import("ai")

      let conversationContent = ""
      if (messages.page.length === 0) {
        conversationContent = args.prompt
      } else {
        const messageTexts = messages.page
          .map((msg) => msg.text || "")
          .filter((text) => text.length > 0)
        conversationContent = [...messageTexts, args.prompt].join("\n")
      }

      const titleResult = await generateText({
        model: openrouter("openai/gpt-4.1-nano"),
        prompt: `Based on this conversation content, suggest a concise title (max 50 characters): ${conversationContent}\nTitle:`,
      })

      await ctx.runMutation(components.agent.threads.updateThread, {
        threadId: args.threadId,
        patch: { title: titleResult.text.trim() },
      })
    }

    return result.consumeStream()
  },
})

export const sendMessageToAgentAnonymous = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    return "Thank you for your interest! For now, please sign in to continue. We will add signed out access soon. Thanks!"
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
    const paginated = await chatAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
      excludeToolMessages: true,
    })

    if (paginated.page.length > 0 && userId?.tokenIdentifier !== paginated.page[0]?.userId) {
      console.log("Unauthorized. Please sign in.")
      throw new Error("Unauthorized. Please sign in.")
    }

    const streams = await chatAgent.syncStreams(ctx, {
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

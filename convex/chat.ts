import { Agent, vStreamArgs } from "@convex-dev/agent"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { components } from "./_generated/api"
import { mutation, action, query } from "./_generated/server"

const DEMO_USER_ID = "user-123"

const chatAgent = new Agent(components.agent, {
  name: "chat-agent",
  chat: openrouter.chat("openai/gpt-4.1-nano"),
  instructions: "You are a helpful assistant. Be concise and friendly in your responses.",
  maxSteps: 10,
})

export const createThread = mutation({
  args: {},
  handler: async (ctx) => {
    const { threadId } = await chatAgent.createThread(ctx, {
      userId: DEMO_USER_ID,
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
    const messages = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
      threadId: args.threadId,
      order: "asc",
      excludeToolMessages: true,
      paginationOpts: { cursor: null, numItems: 10 },
    })

    const userMessages = messages.page.filter((msg) => msg.message?.role === "user")

    const { thread } = await chatAgent.continueThread(ctx, {
      threadId: args.threadId,
    })
    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: { chunking: "line" } },
    )

    if (userMessages.length === 0) {
      const title = args.prompt.length > 50 ? args.prompt.substring(0, 47) + "..." : args.prompt

      await ctx.runMutation(components.agent.threads.updateThread, {
        threadId: args.threadId,
        patch: { title },
      })
    }

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
    const paginated = await chatAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
      excludeToolMessages: true,
    })

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

import { Agent, vStreamArgs } from "@convex-dev/agent"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { components } from "./_generated/api"
import { mutation, action, query } from "./_generated/server"
import { v } from "convex/values"
import { paginationOptsValidator } from "convex/server"

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
    const { thread } = await chatAgent.continueThread(ctx, {
      threadId: args.threadId,
    })
    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: { chunking: "line" } },
    )
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

import { components } from "./_generated/api"
import { internalAction } from "./_generated/server"

export const cleanupAnonymousData = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Anonymous data cleanup started...")

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      console.log(`Cleaning up anonymous data older than: ${new Date(sevenDaysAgo).toISOString()}`)

      let deletedThreads = 0
      let deletedMessages = 0
      let processedUsers = 0

      // Get all users with threads to check for anonymous ones
      let cursor: string | null = null
      let hasMore = true

      while (hasMore) {
        const usersResult: {
          page: string[]
          isDone: boolean
          continueCursor: string
        } = await ctx.runQuery(components.agent.users.listUsersWithThreads, {
          paginationOpts: {
            cursor,
            numItems: 100,
          },
        })

        console.log(`Processing batch of ${usersResult.page.length} users...`)

        for (const userId of usersResult.page) {
          processedUsers++

          if (userId.startsWith("anon_")) {
            let threadCursor: string | null = null
            let hasMoreThreads = true

            while (hasMoreThreads) {
              const userThreads: {
                page: Array<{ _id: string; _creationTime: number }>
                isDone: boolean
                continueCursor: string
              } = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
                userId,
                order: "asc",
                paginationOpts: {
                  cursor: threadCursor,
                  numItems: 50,
                },
              })

              for (const thread of userThreads.page) {
                // Only delete threads older than 7 days
                if (thread._creationTime < sevenDaysAgo) {
                  console.log(`Deleting old thread: ${thread._id}`)

                  try {
                    // First, delete all messages in this thread
                    let messageCursor: string | null = null
                    let hasMoreMessages = true

                    while (hasMoreMessages) {
                      const messagesResult: {
                        page: Array<{ _id: string }>
                        isDone: boolean
                        continueCursor: string
                      } = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
                        threadId: thread._id,
                        paginationOpts: {
                          cursor: messageCursor,
                          numItems: 100,
                        },
                        order: "asc",
                        excludeToolMessages: false,
                      })

                      // Delete each message using the deleteByIds function
                      if (messagesResult.page.length > 0) {
                        const messageIds = messagesResult.page.map((msg) => msg._id)
                        await ctx.runMutation(components.agent.messages.deleteByIds, {
                          messageIds: messageIds,
                        })
                        deletedMessages += messageIds.length
                      }

                      hasMoreMessages = !messagesResult.isDone
                      messageCursor = messagesResult.continueCursor
                    }

                    await ctx.runMutation(components.agent.threads.updateThread, {
                      threadId: thread._id,
                      patch: { status: "archived" },
                    })
                    deletedThreads++
                  } catch (deleteError) {
                    console.error(`Error deleting thread ${thread._id}:`, deleteError)
                    // Continue with other threads even if one fails
                  }
                } else {
                  console.log(`Skipping recent thread: ${thread._id}`)
                }
              }

              hasMoreThreads = !userThreads.isDone
              threadCursor = userThreads.continueCursor
            }
          }
        }

        hasMore = !usersResult.isDone
        cursor = usersResult.continueCursor
      }

      console.log(`Cleanup completed. Processed ${processedUsers} users total.`)
      console.log(`Deleted ${deletedThreads} old threads and ${deletedMessages} messages.`)

      return {
        success: true,
        deletedThreads: deletedThreads,
        deletedMessages: deletedMessages,
        cleanupDate: new Date().toISOString(),
        note: "Cleanup completed successfully",
      }
    } catch (error) {
      console.error("Error during cleanup:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        cleanupDate: new Date().toISOString(),
      }
    }
  },
})

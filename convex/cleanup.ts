import { cronJobs } from "convex/server"

import { internal } from "./_generated/api"

const crons = cronJobs()

// Run cleanup every day at 2 AM
crons.daily(
  "cleanup anonymous data",
  { hourUTC: 2, minuteUTC: 0 },
  internal.cleanupImpl.cleanupAnonymousData,
)

export default crons

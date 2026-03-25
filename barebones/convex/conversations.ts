import { mutation } from "./_generated/server"
import { v } from "convex/values"

export const createConversation = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      createdAt: Date.now(),
    })
  },
})
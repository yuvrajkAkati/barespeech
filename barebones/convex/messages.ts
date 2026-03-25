import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(
        v.literal("user"),
        v.literal("agentA"),
        v.literal("agentB")
    ),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    })
  },
})

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect()
  },
})
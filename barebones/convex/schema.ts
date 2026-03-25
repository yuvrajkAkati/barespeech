import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  conversations: defineTable({
    userId: v.string(),
    createdAt: v.number(),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("agentA"),
      v.literal("agentB")
    ),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),
})
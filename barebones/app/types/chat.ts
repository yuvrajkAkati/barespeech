export type Role = "user" | "agentA" | "agentB"

export type Message = {
  id: string
  role: Role
  content: string
}
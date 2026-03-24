import { Message } from "../types/chat"

export const MessageBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user"

  const label =
    msg.role === "agentA"
      ? "Agent A"
      : msg.role === "agentB"
      ? "Agent B"
      : "You"

      const bg =
    msg.role === "user"
    ? "bg-blue-500 ml-auto"
    : msg.role === "agentA"
    ? "bg-purple-600"
    : "bg-green-600"

  return (
    <div
      className={`p-3 rounded-lg max-w-xl ${bg}`}
    >
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p>{msg.content}</p>
    </div>
  )
}
import { Message } from "../types/chat"

export const MessageBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user"

  return (
    <div className={`p-3 rounded-lg max-w-xl ${
      isUser ? "bg-blue-500 ml-auto" : "bg-gray-700"
    }`}>
      <p>{msg.content}</p>
    </div>
  )
}
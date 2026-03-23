import { Message } from "../types/chat"
import { MessageBubble } from "./MessageBubble"

export const MessageList = ({ messages }: { messages: Message[] }) => {
  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
    </div>
  )
}
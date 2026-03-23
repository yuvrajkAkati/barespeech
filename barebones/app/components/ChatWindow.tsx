import { Message } from "../types/chat"
import { MessageList } from "./MessageList"
import { InputBox } from "./InputBox"

export const ChatWindow = ({
  messages,
  onSend,
}: {
  messages: Message[]
  onSend: (text: string) => void
}) => {
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <InputBox onSend={onSend} />
    </div>
  )
}
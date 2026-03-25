import { Message } from "../types/chat"
import { MessageList } from "./MessageList"
import { InputBox } from "./InputBox"
import { useEffect, useRef } from "react"

export const ChatWindow = ({
  messages,
  onSend,
}: {
  messages: Message[]
  onSend: (text: string) => void
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = bottomRef.current?.parentElement
    if (!container) return

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView()
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <MessageList messages={messages} />
        <div ref={bottomRef} />
      </div>
      <InputBox onSend={onSend} />
    </div>
  )
}
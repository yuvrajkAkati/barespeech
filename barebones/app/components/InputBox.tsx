import { useState } from "react"

export const InputBox = ({ onSend }: { onSend: (text: string) => void }) => {
  const [input, setInput] = useState("")

  return (
    <div className="p-4 flex gap-2">
      <input
        className="flex-1 p-2 border"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={() => {
          if (!input.trim()) return
          onSend(input)
          setInput("")
        }}
      >
        Send
      </button>
    </div>
  )
}
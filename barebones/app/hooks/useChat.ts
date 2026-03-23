import { useEffect, useRef, useState } from "react"
import { Message } from "../types/chat"
import { useVoice } from "./useVoice"

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  // 🎙 voice integration
  const { speak, stopSpeaking } = useVoice((text) => {
    sendMessage(text)
  })

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001")

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "hello", sessionId: "default" }))
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === "token") {
        handleToken(msg)

        // 🔊 speak alongside streaming
        speak(msg.text, msg.role)
      }

      if (msg.type === "audio_stop") {
        stopSpeaking()
      }
    }

    ws.onerror = () => {
      console.error("WebSocket error")
    }

    ws.onclose = () => {
      console.log("WebSocket closed")
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [])

  const handleToken = (msg: any) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]

      // ✅ append to same speaker
      if (last && last.role === msg.role) {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + msg.text },
        ]
      }

      // ✅ new message block
      return [
        ...prev,
        {
          id: Date.now().toString(),
          role: msg.role,
          content: msg.text,
        },
      ]
    })
  }

  const sendMessage = (text: string) => {
    if (!text.trim()) return

    wsRef.current?.send(
      JSON.stringify({
        type: "user_message",
        text,
      })
    )

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: text,
      },
    ])
  }

  const interrupt = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: "interrupt",
      })
    )

    // 🔥 VERY IMPORTANT
    stopSpeaking()
  }

  return {
    messages,
    sendMessage,
    interrupt,
  }
}
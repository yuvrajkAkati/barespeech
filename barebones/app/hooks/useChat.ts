import { useEffect, useRef, useState } from "react"
import { Message, Role } from "../types/chat"
import { useVoice } from "./useVoice"
import { useMutation } from "convex/react"




export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([])





  const wsRef = useRef<WebSocket | null>(null)
  const cancelRef = useRef(false)
  const sentenceBufferRef = useRef("")
  const sentenceQueueRef = useRef<{ text: string; role: Role }[]>([])
  const isProcessingRef = useRef(false)
  const currentAgentMessageIdRef = useRef<string | null>(null)

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
      if (msg.type === "agent_start") {
        const id = Date.now().toString()

        currentAgentMessageIdRef.current = id

        setMessages((prev) => [
          ...prev,
          {
            id,
            role: msg.role,
            content: "",
          },
        ])

        return
      }

      if (msg.type === "agent_end") {

        if (sentenceBufferRef.current.trim()) {
          sentenceQueueRef.current.push({
            text: sentenceBufferRef.current.trim(),
            role: msg.role,
          })

          sentenceBufferRef.current = ""

          processQueue()
        }

        currentAgentMessageIdRef.current = null
        return
      }


      if (msg.type === "token") {
        const currentId = currentAgentMessageIdRef.current

        if (!currentId) return

        setMessages((prev) =>
          prev.map((message) =>
            message.id === currentId
              ? {
                ...message,
                content: message.content + msg.text,
              }
              : message
          )
        )

        sentenceBufferRef.current += msg.text

        if (
          sentenceBufferRef.current.length > 120 ||
          /[.!?]\s*$/.test(sentenceBufferRef.current)
        ) {
          sentenceQueueRef.current.push({
            text: sentenceBufferRef.current.trim(),
            role: msg.role,
          })

          sentenceBufferRef.current = ""

          processQueue()
        }

        return
      }


      if (msg.type === "audio_stop") {
        stopSpeaking()
        sentenceQueueRef.current = []
        sentenceBufferRef.current = ""
        isProcessingRef.current = false
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

  const sendMessage = async (text: string) => {
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

    cancelRef.current = true

    wsRef.current?.send(
      JSON.stringify({
        type: "interrupt",
      })
    )

    stopSpeaking()
    sentenceQueueRef.current = []
    sentenceBufferRef.current = ""
    isProcessingRef.current = false
  }

  const processQueue = async () => {
    if (isProcessingRef.current) return
    cancelRef.current = false
    isProcessingRef.current = true

    while (sentenceQueueRef.current.length > 0) {
      const { text, role } = sentenceQueueRef.current.shift()!
      await speakSentence(text, role)
    }

    isProcessingRef.current = false
  }

  const speakSentence = async (text: string, role: Role) => {
    if (role === "agentA" || role === "agentB") {
      await speak(text, role)
    }
  }

  // const revealText = async (text: string, role: Role) => {
  //   setMessages((prev) => [
  //     ...prev,
  //     {
  //       id: Date.now().toString(),
  //       role,
  //       content: "",
  //     },
  //   ])

  //   let partial = ""

  //   for (let i = 0; i < text.length; i++) {
  //     if (cancelRef.current) break  // ✅ break, not return

  //     await new Promise((r) => setTimeout(r, 50))

  //     if (cancelRef.current) break

  //     partial += text[i]

  //     setMessages((prev) => {
  //       const last = prev[prev.length - 1]
  //       if (!last) return prev

  //       return [
  //         ...prev.slice(0, -1),
  //         { ...last, content: partial },
  //       ]
  //     })
  //   }
  // }

  return {
    messages,
    sendMessage,
    interrupt,
  }
}

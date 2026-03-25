"use client"

import { Sidebar } from "./components/Sidebar"
import { ChatWindow } from "./components/ChatWindow"
import { RecorderControls } from "./components/RecorderControls"

import { useChat } from "./hooks/useChat"
import { useVoice } from "./hooks/useVoice"

export default function Home() {
  const { messages, sendMessage, interrupt } = useChat()
  const { startRecording, stopRecording, transcript } = useVoice(sendMessage)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0">
          <ChatWindow messages={messages} onSend={sendMessage} />
        </div>

        <div className="p-4 flex items-center gap-4 border-t shrink-0 bg-black">
          <RecorderControls
            startRecording={startRecording}
            stopRecording={stopRecording}
            interrupt={interrupt}
          />

          <p className="text-sm text-gray-400">
            {transcript || "Hold mic and speak..."}
          </p>

          <button
            className="bg-red-500 px-4 py-2 rounded"
            onClick={interrupt}
          >
            Interrupt
          </button>
        </div>
      </div>
    </div>
  )
}
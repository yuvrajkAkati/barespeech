"use client"

import { Sidebar } from "./components/Sidebar"
import { ChatWindow } from "./components/ChatWindow"
import { RecorderControls } from "./components/RecorderControls"

import { useChat } from "./hooks/useChat"
import { useVoice } from "./hooks/useVoice"

export default function Home() {
  const { messages, sendMessage, interrupt } = useChat()

  // 🎙 voice input (mic → text → chat)
  const { startRecording, stopRecording, transcript } = useVoice(sendMessage)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Chat */}
        <ChatWindow messages={messages} onSend={sendMessage} />

        {/* Bottom Controls */}
        <div className="p-4 flex items-center gap-4 border-t">

          {/* 🎙 Recorder */}
          <RecorderControls
            startRecording={startRecording}
            stopRecording={stopRecording}
          />

          {/* 🧠 Live transcript */}
          <p className="text-sm text-gray-400">
            {transcript || "Hold mic and speak..."}
          </p>

          {/* 🛑 Interrupt */}
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
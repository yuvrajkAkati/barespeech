import { useState } from "react"

export const RecorderControls = ({
  startRecording,
  stopRecording,
}: {
  startRecording: () => void
  stopRecording: () => void
}) => {
  const [isRecording, setIsRecording] = useState(false)

  const handleStart = () => {
    setIsRecording(true)
    startRecording()
  }

  const handleStop = () => {
    setIsRecording(false)
    stopRecording()
  }

  return (
    <div className="flex items-center gap-3">
      {/* 🎙 Mic Button */}
      <button
        className={`h-14 w-14 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
          isRecording
            ? "bg-red-500 scale-110"
            : "bg-gray-600 hover:bg-gray-500"
        }`}
        onMouseDown={handleStart}
        onMouseUp={handleStop}
        onMouseLeave={handleStop}
        onTouchStart={handleStart}
        onTouchEnd={handleStop}
      >
        🎙
      </button>

      {/* 🔴 Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
          Recording...
        </div>
      )}
    </div>
  )
}
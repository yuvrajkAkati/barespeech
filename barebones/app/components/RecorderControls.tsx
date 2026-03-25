import { useState } from "react"

export const RecorderControls = ({
  startRecording,
  stopRecording,
  interrupt,
}: {
  startRecording: () => void
  stopRecording: () => void
  interrupt: () => void
}) => {
  const [isRecording, setIsRecording] = useState(false)

  const handleStart = () => {
    if (isRecording) return

    interrupt() 
    setIsRecording(true)
    startRecording()
  }

  const handleStop = () => {
    if (!isRecording) return

    setIsRecording(false)
    stopRecording()
  }

  return (
    <div className="flex items-center gap-3">

      <button
        className={`h-14 w-14 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
          isRecording
            ? "bg-red-500 scale-110"
            : "bg-gray-600 hover:bg-gray-500"
        }`}
        onPointerDown={handleStart}
        onPointerUp={handleStop}
        onPointerCancel={handleStop}
        onPointerLeave={handleStop}
      >
        🎙
      </button>

      
      {isRecording && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
          Recording...
        </div>
      )}
    </div>
  )
}
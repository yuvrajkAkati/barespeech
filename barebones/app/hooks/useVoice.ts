import { useEffect, useRef, useState } from "react"

export const useVoice = (onFinalTranscript: (text: string) => void) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const isRecordingRef = useRef(false)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>("")
  const [transcript, setTranscript] = useState("")


  const sentenceQueueRef = useRef<string[]>([])
  const isSpeakingRef = useRef(false)


  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      transcriptRef.current = text
      setTranscript(text)
    }

    recognitionRef.current = recognition
  }, [])


  const startRecording = async () => {
    stopSpeaking()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunks.current = []

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        audioChunks.current.push(e.data)
      }

      mediaRecorder.start()
      isRecordingRef.current = true
      recognitionRef.current?.start()
    } catch (err) {
      console.error("Mic permission denied")
    }
  }


  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) return

    isRecordingRef.current = false
    mediaRecorderRef.current.stop()
    recognitionRef.current?.stop()

    setTimeout(() => {
      const text = transcriptRef.current || transcript
      if (!text) return
      onFinalTranscript(text)
    }, 300)
  }


  const speak = (
    text: string,
    role: "agentA" | "agentB"
  ): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)

      utterance.lang = "en-US"
      utterance.rate = role === "agentA" ? 1.25 : 1.35

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      window.speechSynthesis.speak(utterance)
    })
  }

  const speakNext = () => {
    if (sentenceQueueRef.current.length === 0) return

    const sentence = sentenceQueueRef.current.shift()
    if (!sentence) return

    isSpeakingRef.current = true

    const utterance = new SpeechSynthesisUtterance(sentence)
    utterance.lang = "en-US"
    utterance.rate = 1.25

    utterance.onend = () => {
      isSpeakingRef.current = false
      speakNext()
    }

    utterance.onerror = () => {
      isSpeakingRef.current = false
      speakNext()
    }

    window.speechSynthesis.speak(utterance)
  }


  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    sentenceQueueRef.current = []
    isSpeakingRef.current = false
  }

  return {
    transcript,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
  }
}
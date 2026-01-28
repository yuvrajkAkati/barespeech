"use client"

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useEffect, useRef } from "react"

export default function Home() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const isRecordingRef = useRef(false)
  const audioUrlRef = useRef<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>("")


  useEffect(()=>{
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if(!SpeechRecognition){
      console.log("snot suppoerted")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (e : any) => {
      const text = e.results[0][0].transcript
      console.log("TRANs : ",text)
    }

    recognition.onerror = (e :any) => {
      console.log("STT error",e)
    }

    recognitionRef.current = recognition
  },[])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio : true})
      console.log("permission granre",stream)
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunks.current = []

      mediaRecorder.ondataavailable = (e : BlobEvent) => {
        audioChunks.current.push(e.data)
        console.log("chunks")
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current,{
          type : "audio/webm",
        })
        const audioUrl = URL.createObjectURL(audioBlob)
        audioUrlRef.current = audioUrl
        console.log("audio blob == ",audioUrl)
      }


      mediaRecorder.start()
      isRecordingRef.current = true
      recognitionRef.current?.start()
      console.log("recording...")
    } catch (error) {
      console.log("mic permisson denied")
    }

  }
  
  const stopRecording = async() => {
    if(!mediaRecorderRef.current) return
    if(!isRecordingRef.current) return
    isRecordingRef.current = false
    mediaRecorderRef.current.stop()
    recognitionRef.current?.stop()
    console.log("recording stopped")
  }

  const playRecording = async() => {
    if(!audioUrlRef.current) return
    const audio = new Audio(audioUrlRef.current)
    audio.play()
  }


  return (
    <div className=" flex justify-center items-center h-screen gap-1">
      <button className="h-40 w-40 bg-slate-500 " 
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
      >record</button>
      <button className="bg-slate-600 h-40 w-40" onClick={playRecording}>play</button>
    </div>
  );
}

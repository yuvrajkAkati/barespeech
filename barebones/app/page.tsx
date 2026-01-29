  "use client"

  import { isRedirectError } from "next/dist/client/components/redirect-error"
  import { useSearchParams } from "next/navigation"
  import { useEffect, useRef, useState } from "react"

  export default function Home() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const isRecordingRef = useRef(false)
    const audioUrlRef = useRef<string | null>(null)
    const recognitionRef = useRef<any>(null)
    const transcriptRef = useRef<string>("")
    const [transcript,setTranscript] = useState("")
    const [aiReply,setAiReply] = useState("")
    
    
    //optimization
    const sentenceQueueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);


    const sendAi = async(text:string) => {
      setAiReply("")
      const res = await fetch("/api/ai",{
        method : "POST",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify({text})
      })
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let sentenceBuffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        chunk.split("\n").forEach((line) => {
          if (!line.trim()) return;

          const json = JSON.parse(line);
          
          if(!json.response) return;
          
          
          setAiReply((prev) => prev + json.response);
          sentenceBuffer += json.response
          const sentences = sentenceBuffer.match(/[^.!?]+[.!?]+/g)

          if(sentences){
            sentences.forEach(element => {
              sentenceQueueRef.current.push(element.trim())
            });
            sentenceBuffer = sentenceBuffer.replace(sentences.join(""),"")
            if(!isSpeakingRef.current){
              speakNext()
            }
          }

          
        });
      }
      if(sentenceBuffer.trim()){
        sentenceQueueRef.current.push(sentenceBuffer.trim())
        if(!isSpeakingRef.current){
          speakNext()
        }
      }

    }


    const speakNext = () => {
      if(sentenceQueueRef.current.length === 0) return
      const sentence = sentenceQueueRef.current.shift() 
      if(!sentence) return
      isSpeakingRef.current = true
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.lang = "en-US"

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
        setTranscript(text)
        sendAi(text)
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

    const speak = (text: string) => {
      if (!text) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";

      utterance.onend = () => {
        isSpeakingRef.current = false;
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    };

    const speakSentence = (text: string) => {
      if (!text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    };

    

    return (
      <div className="h-screen">
        <div className=" flex justify-center items-center  gap-1">
          <button className="h-40 w-40 bg-slate-500 " 
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >record</button>
          <button className="bg-slate-600 h-40 w-40" onClick={playRecording}>play</button>
          <button className="bg-slate-600 h-40 w-40" onClick={()=>speak(" hello yuvraj")}>test</button>
        </div>
        <p className="flex items-center justify-center ">
          {transcript || "speak"}
        </p>
        <p className="mt-4 text-blue-500">
          {aiReply || "AI thinking..."}
        </p>
      </div>
    );
  }

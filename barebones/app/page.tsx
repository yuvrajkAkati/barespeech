  "use client"
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
    const abortControllerRef = useRef<AbortController | null>(null)
    const generationRef = useRef(0);
    const aiInProgressRef = useRef(false)


    //voice lag
    const VOICE_CHUNK_SIZE = 50
    const MAX_VOICE_QUEUE = 2

    //voice lag

    //optimization
    const sentenceQueueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);
    
    
    //podcast
    const podcastPausedRef = useRef(false)
    const lastPodcastTextRef = useRef<string | null>(null)
    //podcast


    //prompts
    const AGENT_A_PROMPT =
    "You are Agent A, a podcast host. Speak briefly and ask follow-up questions.";
    
    const AGENT_B_PROMPT =
    "You are Agent B, a podcast co-host. Respond naturally to Agent A.";
    //prompts

    //test 
    const [topic, setTopic] = useState("")
    const startPodcastFromInput = () => {
      if (!topic.trim()) return
      if (aiInProgressRef.current) return 
      setAiAReply("")
      setAiBReply("")
      runPodcast(topic)
    }


    const [aiAReply, setAiAReply] = useState("")
    const [aiBReply, setAiBReply] = useState("")

    //tesst
    
    
    
    //ws  logic 
    const wsRef = useRef<WebSocket | null>(null)
    
    useEffect(()=>{
      const ws = new WebSocket("ws://localhost:3001")
      ws.onopen=()=>{
        ws.send(
          JSON.stringify({
            type : "hello",
            sessionId : "default"
          })
        )
      }
      
      ws.onmessage=(e)=>{
        const msg = JSON.parse(e.data)
        console.log("WS:",msg)
      }
      
      ws.onerror=(e)=>{
        console.error("error on frontend")
      }
      
      ws.onclose = (e) =>{
        console.log("closed")
      }
      
      wsRef.current = ws
      
      return ()=>{
        ws.close()
      }
      
    },[])
    
    const interrupt = () => {
      wsRef.current?.send(
        JSON.stringify({
          type : "interrupt"
        })
      )
    }
    
    
    //ws logic
    
    
    //podcast
    const runPodcast = async (startText: string) => {
  podcastPausedRef.current = false
  lastPodcastTextRef.current = startText

  let lastText = startText

  while (true) {
    if (podcastPausedRef.current) return   // ✅ ADD THIS

    const aReply = await sendAi(
      `${AGENT_A_PROMPT}\n\nTopic: ${lastText}`,
      setAiAReply
    )
    if (!aReply) return
    if( podcastPausedRef.current) return

    const bReply = await sendAi(
      `${AGENT_B_PROMPT}\n\n${aReply}`,
      setAiBReply
    )
    if (!bReply) return
    if(podcastPausedRef.current) return

    lastText = bReply
    lastPodcastTextRef.current = lastText
  }
    }

    


    //podcast
    
    
    
    const sendAi = async(text:string ,setReply: React.Dispatch<React.SetStateAction<string>>): Promise<string | undefined> => {
      let assistantReply = "" 
      aiInProgressRef.current = true;
      abortControllerRef.current = new AbortController()
      const currentGeneration = ++generationRef.current;

      const res = await fetch("/api/ai",{
        method : "POST",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify({text}),
        signal : abortControllerRef.current.signal
      })
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let sentenceBuffer = "";
      let jsonBuffer = ""
      let aborted = false
      try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        jsonBuffer += chunk;

        const lines = jsonBuffer.split("\n");
        jsonBuffer = lines.pop() || "";

        lines.forEach((line) => {
          if (!line.trim()) return;

          if (generationRef.current !== currentGeneration) {
            aborted = true;
            return;
          }

          const json = JSON.parse(line);
          if (!json.response) return;

          if (abortControllerRef.current?.signal.aborted) {
            aborted = true
            return 
          };

          assistantReply += json.response;

          setReply((prev) => prev + json.response);
          sentenceBuffer += json.response;

          if (sentenceBuffer.length >= VOICE_CHUNK_SIZE) {
            const splitIndex = sentenceBuffer.lastIndexOf(" ", VOICE_CHUNK_SIZE) || VOICE_CHUNK_SIZE

            const chunk = sentenceBuffer.slice(0, splitIndex)
            sentenceBuffer = sentenceBuffer.slice(splitIndex)
            sentenceQueueRef.current.push(chunk)

            if (!isSpeakingRef.current) {
              speakNext();
            }
          }
        });
        if(aborted) break
      }
      } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("AI stream aborted");
        return;
      }
        throw err;
      }finally{
        aiInProgressRef.current = false
        if (sentenceBuffer.trim()) {
          sentenceQueueRef.current.push(sentenceBuffer)
          sentenceBuffer = ""
          if (!isSpeakingRef.current) speakNext()
        }
        return assistantReply
      }

    }


    const speakNext = () => {
      if(sentenceQueueRef.current.length === 0) return
      const sentence = sentenceQueueRef.current.shift() 
      if(!sentence) return
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
        transcriptRef.current = text
        setTranscript(text)
        // sendAi(text)
        console.log("TRANs : ",text)
      }

      recognition.onerror = (e :any) => {
        console.log("STT error",e)
      }

      recognitionRef.current = recognition
    },[])

    const startRecording = async () => {
      podcastPausedRef.current = true
      // if (aiInProgressRef.current) {
      //   fetch("/api/reset", { method: "POST" });
      // }

      abortControllerRef.current?.abort()
      abortControllerRef.current = null

      window.speechSynthesis.cancel()
      sentenceQueueRef.current = []
      isSpeakingRef.current = false


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
      setTimeout(async () => {
        const userText = transcriptRef.current || transcript
        if(!userText) return
        await sendAi(`${AGENT_A_PROMPT}\n\nUser says: ${userText}`,setAiAReply)
        if(lastPodcastTextRef.current){
          podcastPausedRef.current = false
          runPodcast(lastPodcastTextRef.current)
        }
      }, 300);
    }

    // const playRecording = async() => {
    //   if(!audioUrlRef.current) return
    //   const audio = new Audio(audioUrlRef.current)
    //   audio.play()
    // }

    // const speak = (text: string) => {
    //   if (!text) return;

    //   window.speechSynthesis.cancel();

    //   const utterance = new SpeechSynthesisUtterance(text);
    //   utterance.lang = "en-US";

    //   utterance.onend = () => {
    //     isSpeakingRef.current = false;
    //   };

    //   utterance.onerror = () => {
    //     isSpeakingRef.current = false;
    //   };

    //   window.speechSynthesis.speak(utterance);
    // };

    // const speakSentence = (text: string) => {
    //   if (!text.trim()) return;
    //   window.speechSynthesis.cancel();
    //   const utterance = new SpeechSynthesisUtterance(text);
    //   utterance.lang = "en-US";
    //   window.speechSynthesis.speak(utterance);
    // };

    

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
          <button className="bg-slate-600 h-40 w-40" onClick={interrupt}>interrupt</button>
        </div>
        <p className="flex items-center justify-center ">
          {transcript || "speak"}
        </p>
        <div className="mt-4 space-y-4">
          <p className="text-blue-500">
            <strong>Agent A:</strong> {aiAReply || "thinking..."}
          </p>

          <p className="text-green-500">
            <strong>Agent B:</strong> {aiBReply || "thinking..."}
          </p>
        </div>


        <input
          className="border p-2 w-full"
          placeholder="Enter podcast topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          />

        <button
          className="bg-green-500 h-12 w-full mt-2"
          onClick={startPodcastFromInput}
        >
          start podcast
        </button>
      </div>
    );
  }

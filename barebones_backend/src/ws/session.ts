import { TokenQueue } from "./tokenQueue.js";
import type {WebSocket as WsWebSocket} from "ws";
import type { Message } from "./agents/types.js";

export class Session {

  socket: WsWebSocket;
  queue: TokenQueue;
  private controller?: AbortController | undefined;

  constructor(socket: WsWebSocket) {
    this.socket = socket;
    this.queue = new TokenQueue((tokens) => {
      tokens.forEach((text) => {
        this.socket.send(JSON.stringify({ type: "token", text }));
      });
    });
    this.queue.start();
  }

  startLLM(streamFn: (signal: AbortSignal) => Promise<void>) {
    this.controller = new AbortController();

    streamFn(this.controller.signal).catch((err) => {
      if (err.name === "AbortError") {
        console.log("LLM generation aborted cleanly");
        return;
      }
      console.error("LLM error:", err);
    });
  }

  interrupt(){
    console.log("Session interrupted");

    this.controller?.abort();
    this.controller = undefined;

    this.queue.stop();
    this.rollbackUncommitted();

    this.socket.send(JSON.stringify({ type: "audio_stop" }));
  }


  async runOllama(signal: AbortSignal){
    const messages = this.buildContext().map((m)=>({
      role : 
        m.role === "agentA" || m.role === "agentB" ? "assistant" : m.role,
      content : m.content
    }))

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages,
        stream: true,
      }),
      signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let assistantText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done || signal.aborted) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        const json = JSON.parse(line);
        if (json.response) {
          assistantText += json.response;
          this.queue.push(json.response);
        }
      }
    }

    if (!signal.aborted && assistantText.trim()) {
      this.addAgentMessage("agentA", assistantText);
      this.commitLastUserMessage();
    }
  }


  private conversation : Message[] = [
    {
      role : "system",
      content : "You are hosting an ai podcast.Stay concise and conversational"
    }
  ]

  addUserMessage(text : string){
    this.conversation.push({
      role : "user",
      content : text,
      committed : false
    })
  }

  addAgentMessage(role : "agentA" | "agentB" , text : string){
    this.conversation.push({
      role,
      content : text,
      committed : true
    })
  }

  commitLastUserMessage(){
    for (let i = this.conversation.length - 1; i >= 0; i--) {
      const msg = this.conversation[i] ;
      if (msg && msg.role === "user" && msg.committed === false ) {
        msg.committed = true;
        return;
      }
    }
  }


  rollbackUncommitted(){
    this.conversation = this.conversation.filter(
      (msg) => msg.committed !== false
    );
  }


  buildContext(maxMessages = 10): Message[]{
    const system = this.conversation.find(m => m.role === "system");
    const rest = this.conversation.filter(m => m.role !== "system").slice(-maxMessages);
    return system ? [system, ...rest] : rest;
  }


}



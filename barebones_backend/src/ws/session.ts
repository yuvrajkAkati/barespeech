import { TokenQueue } from "./tokenQueue.js";
import type {WebSocket as WsWebSocket} from "ws";
import type { WSOutgoing } from "./types.js";

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

  interrupt() {
    console.log("Session interrupted");

    this.controller?.abort();
    this.controller = undefined;

    
    this.queue.stop();

    
    this.socket.send(JSON.stringify({ type: "audio_stop" }));
  }


  async runOllama(prompt: string, signal: AbortSignal) {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: true,
      }),
      signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

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
          this.queue.push(json.response);
        }
      }
    }
  }


}



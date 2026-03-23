import { TokenQueue } from "./tokenQueue.js";
import type { WebSocket as WsWebSocket } from "ws";
import type { Message } from "./agents/types.js";
import { streamOllama } from "./ollama.js";
import { Orchestrator } from "./agents/orchestrator.js";
import { getAgentSystemPrompt } from "./agents/agentPrompt.js";

export class Session {
  socket: WsWebSocket;
  queue: TokenQueue;
  private controller?: AbortController | undefined;
  orchestrator: Orchestrator;

  constructor(socket: WsWebSocket) {
    this.socket = socket;

    this.queue = new TokenQueue((tokens) => {
      tokens.forEach(({ role, token }) => {
        this.socket.send(
          JSON.stringify({
            type: "token",
            role,
            text: token,
          })
        );
      });
    });

    this.queue.start();

    // ✅ FIX 1: initialize orchestrator
    this.orchestrator = new Orchestrator(this);
  }

  startLLM(streamFn: (signal: AbortSignal) => Promise<void>) {
    this.controller = new AbortController();

    // ✅ FIX 2: ensure queue always active
    this.queue.reset();

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

    this.queue.stop(); // fine because reset() will restart it later

    this.rollbackUncommitted();

    this.socket.send(JSON.stringify({ type: "audio_stop" }));

    this.orchestrator.stop()
  }

  async runLLM(role: "agentA" | "agentB", signal: AbortSignal) {
    console.log("llm is running")
    const messages = this.buildContext().map((m) => ({
      role:
        m.role === "agentA" || m.role === "agentB"
          ? "assistant"
          : m.role,
      content: m.content,
    }));

    // ✅ FIX 3: role-based behavior (VERY IMPORTANT)
    messages.unshift({
      role: "system",
      content: getAgentSystemPrompt(role),
    });

    const fullText = await streamOllama(
      messages,
      (token) => this.queue.push(role,token),
      signal
    );

    if (!signal.aborted && fullText.trim()) {
      this.addAgentMessage(role, fullText);
      this.commitLastUserMessage();
    }
  }

  private conversation: Message[] = [
    {
      role: "system",
      content:
        "You are hosting a podcast. Stay concise and conversational.",
    },
  ];

  addUserMessage(text: string) {
    this.conversation.push({
      role: "user",
      content: text,
      committed: false,
    });
  }

  addAgentMessage(role: "agentA" | "agentB", text: string) {
    this.conversation.push({
      role,
      content: text,
      committed: true,
    });
  }

  commitLastUserMessage() {
    for (let i = this.conversation.length - 1; i >= 0; i--) {
      const msg = this.conversation[i];
      if (msg && msg.role === "user" && msg.committed === false) {
        msg.committed = true;
        return;
      }
    }
  }

  rollbackUncommitted() {
    this.conversation = this.conversation.filter(
      (msg) => msg.committed !== false
    );
  }

  buildContext(maxMessages = 10): Message[] {
    const system = this.conversation.find((m) => m.role === "system");
    const rest = this.conversation
      .filter((m) => m.role !== "system")
      .slice(-maxMessages);

    return system ? [system, ...rest] : rest;
  }
}
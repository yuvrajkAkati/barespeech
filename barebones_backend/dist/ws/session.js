import { TokenQueue } from "./tokenQueue.js";
import { streamOllama } from "./ollama.js";
import { Orchestrator } from "./agents/orchestrator.js";
import { getAgentSystemPrompt } from "./agents/agentPrompt.js";
export class Session {
    socket;
    queue;
    controller;
    orchestrator;
    constructor(socket) {
        this.socket = socket;
        this.queue = new TokenQueue((tokens) => {
            tokens.forEach(({ role, token }) => {
                this.socket.send(JSON.stringify({
                    type: "token",
                    role,
                    text: token,
                }));
            });
        });
        this.queue.start();
        this.orchestrator = new Orchestrator(this);
    }
    startLLM(streamFn) {
        this.controller = new AbortController();
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
        this.queue.stop();
        this.rollbackUncommitted();
        this.socket.send(JSON.stringify({ type: "audio_stop" }));
        this.orchestrator.stop();
    }
    async runLLM(role, signal) {
        console.log("llm is running");
        const messages = this.buildContext().map((m) => ({
            role: m.role === "agentA" || m.role === "agentB"
                ? "assistant"
                : m.role,
            content: m.content,
        }));
        messages.unshift({
            role: "system",
            content: getAgentSystemPrompt(role),
        });
        const fullText = await streamOllama(messages, (token) => this.queue.push(role, token), signal);
        if (!signal.aborted && fullText.trim()) {
            this.addAgentMessage(role, fullText);
            this.commitLastUserMessage();
        }
    }
    conversation = [
        {
            role: "system",
            content: "You are hosting a podcast. Stay concise and conversational.",
        },
    ];
    addUserMessage(text) {
        this.conversation.push({
            role: "user",
            content: text,
            committed: false,
        });
    }
    addAgentMessage(role, text) {
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
        this.conversation = this.conversation.filter((msg) => msg.committed !== false);
    }
    buildContext(maxMessages = 10) {
        const system = this.conversation.find((m) => m.role === "system");
        const rest = this.conversation
            .filter((m) => m.role !== "system")
            .slice(-maxMessages);
        return system ? [system, ...rest] : rest;
    }
}
//# sourceMappingURL=session.js.map
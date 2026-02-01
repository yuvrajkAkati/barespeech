import { TokenQueue } from "./tokenQueue.js";
export class Session {
    socket;
    queue;
    controller;
    constructor(socket) {
        this.socket = socket;
        this.queue = new TokenQueue((tokens) => {
            tokens.forEach((text) => {
                this.socket.send(JSON.stringify({ type: "token", text }));
            });
        });
        this.queue.start();
    }
    startLLM(streamFn) {
        this.controller = new AbortController();
        streamFn(this.controller.signal).catch((err) => {
            // 🔑 THIS IS THE FIX
            if (err.name === "AbortError") {
                console.log("LLM generation aborted cleanly");
                return;
            }
            console.error("LLM error:", err);
        });
    }
    interrupt() {
        console.log("Session interrupted");
        // stop generation
        this.controller?.abort();
        this.controller = undefined;
        // stop tokens
        this.queue.stop();
        // tell client to stop audio
        this.socket.send(JSON.stringify({ type: "audio_stop" }));
    }
    async runOllama(prompt, signal) {
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
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done || signal.aborted)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                if (!line.trim())
                    continue;
                const json = JSON.parse(line);
                if (json.response) {
                    this.queue.push(json.response);
                }
            }
        }
    }
}
//# sourceMappingURL=session.js.map
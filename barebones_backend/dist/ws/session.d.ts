import { TokenQueue } from "./tokenQueue.js";
import type { WebSocket as WsWebSocket } from "ws";
import type { Message } from "./agents/types.js";
import { Orchestrator } from "./agents/orchestrator.js";
export declare class Session {
    socket: WsWebSocket;
    queue: TokenQueue;
    private controller?;
    orchestrator: Orchestrator;
    constructor(socket: WsWebSocket);
    startLLM(streamFn: (signal: AbortSignal) => Promise<void>): void;
    interrupt(): void;
    runLLM(role: "agentA" | "agentB", signal: AbortSignal): Promise<void>;
    private conversation;
    addUserMessage(text: string): void;
    addAgentMessage(role: "agentA" | "agentB", text: string): void;
    commitLastUserMessage(): void;
    rollbackUncommitted(): void;
    buildContext(maxMessages?: number): Message[];
}
//# sourceMappingURL=session.d.ts.map
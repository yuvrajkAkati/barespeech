import { TokenQueue } from "./tokenQueue.js";
import type { WebSocket as WsWebSocket } from "ws";
export declare class Session {
    socket: WsWebSocket;
    queue: TokenQueue;
    private controller?;
    constructor(socket: WsWebSocket);
    startLLM(streamFn: (signal: AbortSignal) => Promise<void>): void;
    interrupt(): void;
    runOllama(prompt: string, signal: AbortSignal): Promise<void>;
}
//# sourceMappingURL=session.d.ts.map
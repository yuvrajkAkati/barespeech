import type { WSMessage } from "./types.js";
import WebSocket from "ws";
type EventPayload = {
    socket: WebSocket;
    msg: WSMessage;
};
type Handler = (payload: EventPayload) => void;
export declare class EventBus {
    private handlers;
    on(type: WSMessage["type"], handler: Handler): void;
    emit(type: WSMessage["type"], payload: EventPayload): void;
}
export {};
//# sourceMappingURL=events.d.ts.map
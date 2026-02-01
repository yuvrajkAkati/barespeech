import type { WSMessage } from "./types.js";
type Handler = (payload: any) => void;
export declare class EventBus {
    private handlers;
    on(type: WSMessage["type"], handler: Handler): void;
    emit(type: WSMessage["type"], payload: any): void;
}
export {};
//# sourceMappingURL=events.d.ts.map
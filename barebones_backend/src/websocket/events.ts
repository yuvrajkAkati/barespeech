import type { WSMessage } from "./types.js";
import WebSocket from "ws";

type EventPayload = {
  socket: WebSocket;
  msg: WSMessage;
};

type Handler = (payload : EventPayload) => void;

export class EventBus {
  private handlers = new Map<string, Handler[]>();

  on(type: WSMessage["type"], handler: Handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  emit(type: WSMessage["type"], payload: EventPayload) {
    const handlers = this.handlers.get(type);
    if (!handlers) return;
    handlers.forEach((h) => h(payload));
  }
}


import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import type { WSMessage, WSOutgoing } from "./types.js";
import { EventBus } from "./events.js";
import { Session } from "./session.js";
import { constants } from "node:buffer";

function send(socket: WsWebSocket, payload: WSOutgoing) {
  socket.send(JSON.stringify(payload));
}

const sessions = new Map<string, Session>();
const socketToSession = new Map<WsWebSocket, Session>();


export function startWebServer(port = 3001) {
  const wss = new WebSocketServer({ port });
  const bus = new EventBus();

  wss.on("connection", (socket: WsWebSocket) => {
    console.log("connected");

    socket.on("message", (raw) => {
      try {
        const msg: WSMessage = JSON.parse(raw.toString());
        bus.emit(msg.type, { socket, msg });
      } catch {
        send(socket, { type: "error", message: "Invalid WS message" });
      }
    });

    socket.on("close", () => {
  const session = socketToSession.get(socket);

  if (session) {
    session.interrupt();
    session.orchestrator.stop();

    socketToSession.delete(socket);

    for (const [id, s] of sessions.entries()) {
      if (s === session) {
        sessions.delete(id);
        break;
      }
    }
  }

  console.log("disconnected");
});
  });

  // EVENTS 

  bus.on("hello", ({ socket, msg }) => {
  if (msg.type !== "hello") return;

  const session = new Session(socket);

  sessions.set(msg.sessionId, session);
  socketToSession.set(socket, session); // ✅ CRITICAL FIX

  console.log("Session:", msg.sessionId);

  send(socket, { type: "ack" });
});

  bus.on("interrupt", ({ socket }) => {
  const session = socketToSession.get(socket); // ✅ FIX
  if (!session) return;

  console.log("interrupted");
  session.interrupt();
});

  bus.on("user_message", ({ socket, msg }) => {
  console.log("user message got");

  if (msg.type !== "user_message") return;

  const session = socketToSession.get(socket); // ✅ FIX

  if (!session) {
    console.log("❌ NO SESSION FOUND");
    return;
  }

  session.orchestrator.onUserMessage(msg.text);
});


  console.log(`WS server running on ws://localhost:${port}`);
}

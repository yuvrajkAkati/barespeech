import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import type { WSMessage, WSOutgoing } from "./types.js";
import { EventBus } from "./events.js";
import { Session } from "./session.js";
import { constants } from "node:buffer";
import { db } from "../db.js";

function send(socket: WsWebSocket, payload: WSOutgoing) {
  socket.send(JSON.stringify(payload));
}

const sessions = new Map<string, Session>();
const socketToSession = new Map<WsWebSocket, Session>();
const sessionToConversation = new Map<Session, string | undefined>();

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
          sessionToConversation.delete(session);

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

  

  bus.on("hello", async ({ socket, msg }) => {
    if (msg.type !== "hello") return;

    const session = new Session(socket);

    sessions.set(msg.sessionId, session);
    socketToSession.set(socket, session);

    try {
      const convo = await db.conversation.create({
        data: {
          userId: "demo-user",
        },
      });

      // ✅ use convo INSIDE try
      sessionToConversation.set(session, convo.id);

      console.log("Session:", msg.sessionId, "Conversation:", convo.id);

    } catch (err) {
      console.error("DB error (conversation):", err);
    }

    send(socket, { type: "ack" });
  });

  bus.on("interrupt", ({ socket }) => {
    const session = socketToSession.get(socket); // ✅ FIX
    if (!session) return;

    console.log("interrupted");
    session.interrupt();
  });

  bus.on("user_message",async ({ socket, msg }) => {
    console.log("user message got");

    if (msg.type !== "user_message") return;

    const session = socketToSession.get(socket); 

    if (!session) {
      console.log(" NO SESSION FOUND");
      return;
    }

    const conversationId = sessionToConversation.get(session);
    try {
      if (conversationId) {
        db.message.create({
            data: {
              conversationId,
              role: "user",
              content: msg.text,
            },
          }).catch(err => console.error("DB error:", err));
      }
    } catch (err) {
      console.error("DB error (message):", err);
    }


    session.orchestrator.onUserMessage(msg.text,conversationId);
  });


  console.log(`WS server running on ws://localhost:${port}`);
}

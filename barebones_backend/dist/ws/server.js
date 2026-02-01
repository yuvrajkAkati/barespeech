import { WebSocketServer } from "ws";
import { EventBus } from "./events.js";
import { Session } from "./session.js";
function send(socket, payload) {
    socket.send(JSON.stringify(payload));
}
const sessions = new Map();
export function startWebServer(port = 3001) {
    const wss = new WebSocketServer({ port });
    const bus = new EventBus();
    wss.on("connection", (socket) => {
        console.log("connected");
        socket.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                bus.emit(msg.type, { socket, msg });
            }
            catch {
                send(socket, { type: "error", message: "Invalid WS message" });
            }
        });
        socket.on("close", () => {
            for (const [id, session] of sessions.entries()) {
                if (session.socket === socket) {
                    session.interrupt();
                    sessions.delete(id);
                    break;
                }
            }
            console.log("disconnected");
        });
    });
    // ---------------- EVENTS ----------------
    bus.on("hello", ({ socket, msg }) => {
        if (msg.type !== "hello")
            return;
        const session = new Session(socket);
        sessions.set(msg.sessionId, session);
        console.log("Session:", msg.sessionId);
        send(socket, { type: "ack" });
    });
    bus.on("interrupt", ({ socket }) => {
        const session = [...sessions.values()].find((s) => s.socket === socket);
        if (!session)
            return;
        console.log("interrupted");
        session.interrupt();
    });
    bus.on("user_message", ({ socket, msg }) => {
        if (msg.type !== "user_message")
            return;
        const session = [...sessions.values()].find((s) => s.socket === socket);
        if (!session)
            return;
        session.startLLM((signal) => session.runOllama(msg.text, signal));
    });
    console.log(`WS server running on ws://localhost:${port}`);
}
//# sourceMappingURL=server.js.map
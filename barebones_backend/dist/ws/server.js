import { WebSocketServer } from "ws";
import { EventBus } from "./events.js";
function send(socket, payload) {
    socket.send(JSON.stringify(payload));
}
export function startWebServer(port = 3001) {
    const wss = new WebSocketServer({ port });
    const bus = new EventBus();
    wss.on("connection", (socket) => {
        console.log("connect");
        socket.on("message", (r) => {
            try {
                const msg = JSON.parse(r.toString());
                bus.emit(msg.type, { socket, msg });
            }
            catch {
                send(socket, {
                    type: "error",
                    message: "Invalid"
                });
            }
        });
        socket.on("close", () => {
            console.log("discconected");
        });
    });
    bus.on("hello", ({ socket, msg }) => {
        console.log("Session", msg.sessionId);
        send(socket, { type: "ack" });
    });
    bus.on("interrupt", ({ socket }) => {
        console.log("interrupted");
        send(socket, { type: "audio_stop" });
    });
    bus.on("user_message", ({ msg }) => {
        console.log("User says:", msg.text);
    });
    console.log("ws server running");
}
//# sourceMappingURL=server.js.map
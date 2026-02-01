export type WSMessage = {
    type: "hello";
    sessionId: string;
} | {
    type: "user_message";
    text: string;
} | {
    type: "interrupt";
} | {
    type: "start_ai";
};
export type WSOutgoing = {
    type: "ack";
} | {
    type: "token";
    text: string;
} | {
    type: "audio_stop";
} | {
    type: "error";
    message: string;
};
//# sourceMappingURL=types.d.ts.map
import type { Session } from "../session.js";
export declare class Orchestrator {
    private session;
    private turn;
    private running;
    constructor(session: Session);
    onUserMessage(text: string): void;
    private nextTurn;
    stop(): void;
}
//# sourceMappingURL=orchestrator.d.ts.map
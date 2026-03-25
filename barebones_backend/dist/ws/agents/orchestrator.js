export class Orchestrator {
    session;
    turn = "agentA";
    running = false;
    constructor(session) {
        this.session = session;
    }
    onUserMessage(text) {
        console.log("orchestrator has reveived the message");
        this.session.interrupt();
        this.session.addUserMessage(text);
        if (!this.running) {
            this.running = true;
            this.turn = "agentA";
            this.nextTurn();
        }
    }
    nextTurn() {
        console.log("next turn working");
        if (!this.running)
            return;
        const role = this.turn;
        this.session.startLLM(async (signal) => {
            await this.session.runLLM(role, signal);
            if (signal.aborted) {
                this.running = false;
                return;
            }
            this.turn = this.turn === "agentA" ? "agentB" : "agentA";
            this.nextTurn();
        });
    }
    stop() {
        this.running = false;
    }
}
//# sourceMappingURL=orchestrator.js.map
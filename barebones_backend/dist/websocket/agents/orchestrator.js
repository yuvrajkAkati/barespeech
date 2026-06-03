export class Orchestrator {
    session;
    turn = "agentA";
    running = false;
    conversationId;
    constructor(session) {
        this.session = session;
    }
    onUserMessage(text, conversationId) {
        console.log("orchestrator has reveived the message");
        this.conversationId = conversationId;
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
            const fullResponse = await this.session.runLLM(role, signal);
            if (signal.aborted) {
                this.running = false;
                return;
            }
            // if (this.conversationId && fullResponse.trim()) {
            // }
            this.turn = this.turn === "agentA" ? "agentB" : "agentA";
            this.nextTurn();
        });
    }
    stop() {
        this.running = false;
    }
}

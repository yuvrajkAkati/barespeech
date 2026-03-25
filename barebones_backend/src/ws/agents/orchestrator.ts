import type { Session } from "../session.js";

type Turn = "agentA" | "agentB";

export class Orchestrator {
  private session: Session;
  private turn: Turn = "agentA";
  private running = false;

  constructor(session: Session) {
    this.session = session;
  }

  onUserMessage(text: string) {
    console.log("orchestrator has reveived the message")
    this.session.interrupt();
    this.session.addUserMessage(text);

    if (!this.running) {
      this.running = true;
      this.turn = "agentA";
      this.nextTurn();
    }
  }

  private nextTurn() {
    console.log("next turn working")
    if (!this.running) return;

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
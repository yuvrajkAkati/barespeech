import type { Session } from "../session.js";
import { db } from "../../db.js";

type Turn = "agentA" | "agentB";

export class Orchestrator {
  private session: Session;
  private turn: Turn = "agentA";
  private running = false;
  private conversationId? : string | undefined
 
  constructor(session: Session) {
    this.session = session;
  }

  onUserMessage(text: string,conversationId?: string) {
    console.log("orchestrator has reveived the message")
    this.conversationId = conversationId;
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
      const fullResponse = await this.session.runLLM(role, signal);

      if (signal.aborted) {
        this.running = false;
        return;
      }

      if (this.conversationId && fullResponse.trim()) {
        db.message.create({
          data: {
            conversationId: this.conversationId,
            role,
            content: fullResponse,
          },
        }).catch(err => console.error("DB error (assistant):", err));
      }

      this.turn = this.turn === "agentA" ? "agentB" : "agentA";

      this.nextTurn();
    });
  }

  stop() {
    this.running = false;
  }
}
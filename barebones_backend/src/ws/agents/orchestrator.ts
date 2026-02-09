import { sign } from "node:crypto";
import type { Session } from "../session.js";

type Turn = "agentA" | "agentB"

export class Orchestrator {
    private session : Session;
    private turn : Turn = "agentA"
    private running = false

    constructor(session : Session){
        this.session = session
    }

    onUserMessage(text : string){
        this.session.addUserMessage(text)

        if(!this.running){
            this.running = true
            this.turn = "agentA"
            this.nextTurn()
        }
    }

    private nextTurn(){
        if(!this.running) return
        const role = this.turn 

        this.session.startLLM(async(signal)=> {
            await this.session.runOllama(signal)
            
            if(signal.aborted){
                this.running = false
                return
            }

            this.turn = this.turn === "agentA" ? "agentB" : "agentA"

            this.nextTurn()
        })
    }

    stop(){
        this.running = false
    }
}
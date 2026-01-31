import type { Message } from "./types.js";

const conversations = new Map<string,Message[]>()

const SYSTEM_MESSAGE: Message = {
  role: "system",
  content:
    "Always respond ONLY to the most recent user message.Use previous conversation only as background context.Do not summarize or continue earlier answers unless explicitly asked."
};


export function getConversation(sessionId : string) : Message[]{
    if(!conversations.has(sessionId)){
        conversations.set(sessionId,[SYSTEM_MESSAGE])
    }
    return conversations.get(sessionId)!
}

export function appendConversation(sessionId:string,message : Message){
    const convo = getConversation(sessionId)
    convo.push(message)
}

export function buildContext(sessionId : string,maxMessages : number) : Message[]{
    const fullConversation = getConversation(sessionId)
    const systemMessage = fullConversation.find((msg) => msg.role === "system")
    if(!systemMessage){
        throw new Error("System message not found")
    }
    const nonSystemMessage = fullConversation.filter((msg, idx, arr) => {
    if (msg.role === "system") return false;

    // Always include the most recent user message
    if (
        msg.role === "user" &&
        idx === arr.length - 1
    ) {
        return true;
    }

    // Include only committed messages otherwise
    return msg.committed !== false;
    });  
    // const lastMessages = nonSystemMessage.slice(-maxMessages)
    const lastMessages = nonSystemMessage.slice(-maxMessages)
    console.log("asd")

    return [systemMessage,...lastMessages]
}

export function markLastUserMessage (sessionId : string){
    const convo = getConversation(sessionId)

    for(let i = convo.length -1; i >= 0 ;i--){
        if(convo[i].role == "user" && convo[i].committed === false){
            convo[i].committed = true;
            return
        }
    }
}

export function rollbackUncommitted(sessionId: string) {
  const convo = getConversation(sessionId);

  for (let i = convo.length - 1; i >= 1; i--) {
    if (convo[i].committed === false) {
      convo.splice(i, 1);
    }
  }
}
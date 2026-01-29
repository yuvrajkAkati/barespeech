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
    const nonSystemMessage = fullConversation.filter((msg)=>msg.role != "system")
    // const lastMessages = nonSystemMessage.slice(-maxMessages)
    const lastMessages = nonSystemMessage.slice(-maxMessages)
    console.log("asd")

    return [systemMessage,...lastMessages]
}
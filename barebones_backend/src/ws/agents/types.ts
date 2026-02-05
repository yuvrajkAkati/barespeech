export type Role = "user" | "agentA" | "agentB"

export type Message = {
    role : Role;
    content : string;
}

export type AgentInput = {
    llm : {
        stream : ( args : {
            messages : { role : string; content : string}[]
        }) => AsyncIterable<string>
    }
    prompt : string
    context : Message[]
}

export type AgentOutputChunk = 
| {type : "token";value : string}
| {type : "end"}
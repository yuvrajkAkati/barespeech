export type Role = "system" |"user" | "agentA" | "agentB"

export type Message = {
    role : Role;
    content : string;
    committed? : boolean;
}

export type AgentInput = {
  llm: {
    stream: (args: {
      messages: { role: string; content: string }[]
    }) => AsyncIterable<string>
  }
  messages: { role: string; content: string }[]
}


export type AgentOutputChunk = 
| {type : "token";value : string}
| {type : "end"}
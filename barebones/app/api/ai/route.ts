import { NextResponse } from "next/server";
import {getConversation,appendConversation,buildContext, markLastUserMessage} from "./conversationStore"

export async function POST(req: Request) {
  console.log("ai route hit")
  const { text } = await req.json();
  console.log(text)
  const sessionId = "default"
  appendConversation(sessionId,{
    role : "user",
    content : text,
    committed : false
  })
  console.log(getConversation(sessionId))
  
  const messages = buildContext(sessionId,10)
  const prompt = messages.
  map(m => {
    if(m.role === "system") return `SYSTEM : ${m.content}`;
    if(m.role === "user") return `USER : ${m.content}`;
    return `ASSISTANT : ${m.content}`
  })
  .join("\n")

  

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt,
      // prompt: `You are a podcast co-host. Reply conversationally.\nUser: ${text}`,
      stream: true
    }),
  });

  let assistantReply = ""
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          const json = JSON.parse(line);
          if (!json.response) continue;

          assistantReply += json.response;

          controller.enqueue(
            JSON.stringify({ response: json.response }) + "\n"
          );
        }
      }

      appendConversation(sessionId,{
        role : "assistant",
        content : assistantReply,
      })

      markLastUserMessage(sessionId);
      
      controller.close();
    },
  });

  return new Response(stream);
}



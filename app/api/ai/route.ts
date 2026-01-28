console.log("api routex")
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt: `You are a podcast co-host. Reply conversationally.\nUser: ${text}`,
      stream: true
    }),
  });

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        controller.enqueue(decoder.decode(value));
      }

      controller.close();
    },
  });

  return new Response(stream);
}

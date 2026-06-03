type OllamaMessage = {
  role: string;
  content: string;
};

type StreamHandler = (token: string) => void;

export async function streamOllama(
  messages: OllamaMessage[],
  onToken: StreamHandler,
  signal: AbortSignal
): Promise<string> {
  console.log("stream ollama function called inside ollama.ts")
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt: messages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n"),
      stream: true,
      options : {
        num_predict : 80
      }
      }),
        signal,
    });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done || signal.aborted) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      const json = JSON.parse(line);

      console.log("OLLAMA CHUNK:", json); 
      if (json.response) {
        fullText += json.response;
        onToken(json.response);
      }
    }
  }

  return fullText;
}
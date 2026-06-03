import type { AgentInput, AgentOutputChunk } from "./types.js";

type StreamFn = (chunk: AgentOutputChunk) => void;
type AbortSignalLike = { aborted: boolean };

export async function runAgent(
  input: AgentInput,
  stream: StreamFn,
  signal?: AbortSignalLike
) {
  const { llm, messages } = input;

  const response = await llm.stream({ messages });

  for await (const token of response) {
    if (signal?.aborted) return;
    stream({ type: "token", value: token });
  }

  stream({ type: "end" });
}

import type { AgentInput, AgentOutputChunk } from "./types.js";
type StreamFn = (chunk: AgentOutputChunk) => void;
type AbortSignalLike = {
    aborted: boolean;
};
export declare function runAgent(input: AgentInput, stream: StreamFn, signal?: AbortSignalLike): Promise<void>;
export {};
//# sourceMappingURL=agent.d.ts.map
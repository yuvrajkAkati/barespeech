type OllamaMessage = {
    role: string;
    content: string;
};
type StreamHandler = (token: string) => void;
export declare function streamOllama(messages: OllamaMessage[], onToken: StreamHandler, signal: AbortSignal): Promise<string>;
export {};
//# sourceMappingURL=ollama.d.ts.map
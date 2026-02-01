export declare class TokenQueue {
    private onTokens;
    private intervalMs;
    private batchSize;
    private queue;
    private active;
    private interval?;
    constructor(onTokens: (tokens: string[]) => void, intervalMs?: number, batchSize?: number);
    push(token: string): void;
    start(): void;
    stop(): void;
    reset(): void;
    isActive(): boolean;
}
//# sourceMappingURL=tokenQueue.d.ts.map
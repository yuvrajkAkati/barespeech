export class TokenQueue {
    onTokens;
    intervalMs;
    batchSize;
    queue = [];
    active = false;
    interval;
    constructor(onTokens, intervalMs = 30, batchSize = 3) {
        this.onTokens = onTokens;
        this.intervalMs = intervalMs;
        this.batchSize = batchSize;
    }
    push(token) {
        if (!this.active)
            return;
        this.queue.push(token);
    }
    start() {
        if (this.active)
            return;
        this.active = true;
        this.interval = setInterval(() => {
            if (!this.active)
                return;
            if (this.queue.length === 0)
                return;
            const batch = this.queue.splice(0, this.batchSize);
            this.onTokens(batch);
        }, this.intervalMs);
    }
    stop() {
        this.active = false;
        this.queue.length = 0;
        const interval = this.interval;
        this.interval = undefined;
        if (interval)
            clearInterval(interval);
    }
    reset() {
        this.stop();
        this.start();
    }
    isActive() {
        return this.active;
    }
}
//# sourceMappingURL=tokenQueue.js.map
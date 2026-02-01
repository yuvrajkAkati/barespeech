export class EventBus {
    handlers = new Map();
    on(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(handler);
    }
    emit(type, payload) {
        const handlers = this.handlers.get(type);
        if (!handlers)
            return;
        handlers.forEach(element => {
            element(payload);
        });
    }
}
//# sourceMappingURL=events.js.map
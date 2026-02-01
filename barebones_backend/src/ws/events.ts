import type { WSMessage } from "./types.js";

type Handler = (payload : any) => void;

export class EventBus {
    private handlers = new Map<string , Handler[]>()
    on(type : WSMessage["type"],handler : Handler){
        if(!this.handlers.has(type)){
            this.handlers.set(type,[])
        }
        this.handlers.get(type)!.push(handler)
    }
    emit(type : WSMessage["type"],payload : any){
        const handlers = this.handlers.get(type)
        if(!handlers) return
        handlers.forEach(element => {
            element(payload)
        });
    }
}

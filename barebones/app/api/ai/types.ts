export type Message = {
    role : "system" | "user" | "assistant";
    content : string;
    committed? : boolean
}
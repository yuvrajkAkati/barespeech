export async function runAgent(input, stream, signal) {
    const { llm, messages } = input;
    const response = await llm.stream({ messages });
    for await (const token of response) {
        if (signal?.aborted)
            return;
        stream({ type: "token", value: token });
    }
    stream({ type: "end" });
}

import { rollbackUncommitted } from "../ai/conversationStore";

export async function POST() {
  const sessionId = "default";
  rollbackUncommitted(sessionId);
  return new Response(null, { status: 200 });
}

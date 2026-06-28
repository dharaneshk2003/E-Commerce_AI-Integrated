import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { auth } from "@clerk/nextjs/server";
import { createShoppingAgent } from "@/lib/ai/shopping-agent";

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();
    const { userId } = await auth();
    const agent = createShoppingAgent({ userId });

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process chat request";
    return Response.json({ error: message }, { status: 500 });
  }
}
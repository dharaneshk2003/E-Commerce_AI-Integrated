import { ToolLoopAgent } from "ai";
import { getGoogleProvider } from "@/lib/ai/gemini";
import { searchProductsTool } from "@/lib/ai/tools/search-products";
import { createGetMyOrdersTool } from "@/lib/ai/tools/get-my-orders";

const SHOPPING_INSTRUCTIONS = `You are a helpful shopping assistant for a premium furniture e-commerce store.

Your capabilities:
- Search for furniture products by style, material, color, price, and category
- Help signed-in users check their order status and history

Guidelines:
- Be friendly, concise, and helpful
- When users ask about products, use the searchProducts tool
- When signed-in users ask about orders, use the getMyOrders tool
- Mention stock availability when relevant
- Prices are in GBP (£)
- Suggest alternatives if no products match
- Never make up product information — always use tools to find real data
- If a user asks about orders but is not signed in, ask them to sign in first`;

export function createShoppingAgent({ userId }: { userId: string | null }) {
  const getMyOrdersTool = createGetMyOrdersTool(userId);

  const tools = getMyOrdersTool
    ? { searchProducts: searchProductsTool, getMyOrders: getMyOrdersTool }
    : { searchProducts: searchProductsTool };

  return new ToolLoopAgent({
    model: getGoogleProvider()("gemini-2.5-flash"),
    instructions: SHOPPING_INSTRUCTIONS,
    tools,
  });
}

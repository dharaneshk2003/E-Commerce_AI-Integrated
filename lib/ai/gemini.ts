import { createGoogle } from "@ai-sdk/google";

export function getGeminiApiKey(): string {
  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_AI_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Add GEMINI_API_KEY, GOOGLE_AI_KEY, or GOOGLE_GENERATIVE_AI_API_KEY to .env.local",
    );
  }

  return apiKey;
}

let googleProvider: ReturnType<typeof createGoogle> | undefined;

export function getGoogleProvider() {
  if (!googleProvider) {
    googleProvider = createGoogle({
      apiKey: getGeminiApiKey(),
    });
  }

  return googleProvider;
}

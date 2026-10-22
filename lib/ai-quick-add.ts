import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import {
  QuickAddSchema,
  quickAddJsonSchema,
  quickAddSystemPrompt,
  validateQuickAdd,
  type QuickAddFields,
} from "@/lib/quick-add";

// Newest, cheapest stable Flash-Lite. Thinking is on at its "minimal" default,
// which is what a short extraction wants, so no thinking config is sent.
const MODEL = "gemini-3.5-flash-lite";

// The slice of the SDK we use, so tests can inject a fake.
export type GeminiClient = {
  models: {
    generateContent(params: {
      model: string;
      contents: string;
      config: Record<string, unknown>;
    }): Promise<{
      text?: string;
      promptFeedback?: { blockReason?: string };
    }>;
  };
};

// Short timeout: this runs while a person waits on a button.
function createClient(): GeminiClient {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { timeout: 20_000 },
  });
}

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const MANUAL = "Couldn't parse that — enter it manually";

/**
 * Free text → { description, amount, currency }. Language understanding only:
 * the model returns the amount as text, and everything it returns is parsed
 * with zod and re-validated by validateQuickAdd. Every failure is an `{ error }`
 * the UI can show, so the form always falls back to manual entry.
 */
export async function extractExpense(
  text: string,
  defaultCurrency: string,
  client: GeminiClient = createClient(),
): Promise<QuickAddFields | { error: string }> {
  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: text,
      config: {
        systemInstruction: quickAddSystemPrompt(defaultCurrency),
        responseMimeType: "application/json",
        responseJsonSchema: quickAddJsonSchema(),
        maxOutputTokens: 1024,
      },
    });

    if (response.promptFeedback?.blockReason || !response.text) {
      return { error: MANUAL };
    }

    // Never log the model's output or the user's text: both can contain it.
    let json: unknown;
    try {
      json = JSON.parse(response.text);
    } catch {
      return { error: MANUAL };
    }
    const parsed = QuickAddSchema.safeParse(json);
    if (!parsed.success) return { error: MANUAL };

    return validateQuickAdd(parsed.data);
  } catch (err) {
    if (err instanceof ApiError) {
      // Gemini reports a bad key as 400 "API key not valid", not 401.
      if (
        err.status === 401 ||
        err.status === 403 ||
        (err.status === 400 && /api key/i.test(err.message))
      ) {
        console.error("Gemini rejected GEMINI_API_KEY");
        return { error: "AI quick-add isn't set up — enter it manually" };
      }
      if (err.status === 429 || err.status >= 500) {
        return {
          error: "AI is busy right now — try again or enter it manually",
        };
      }
      // Request-level problem (status + API message, no user text).
      console.error(`AI quick-add failed: ${err.status} ${err.message}`);
      return { error: MANUAL };
    }
    if (
      err instanceof Error &&
      /fetch failed|timed? ?out|abort|ECONN|ENOTFOUND|network/i.test(
        err.message + err.name,
      )
    ) {
      return { error: "Couldn't reach the AI — enter it manually" };
    }
    console.error(
      "AI quick-add failed:",
      err instanceof Error ? err.name : "unknown error",
    );
    return { error: MANUAL };
  }
}

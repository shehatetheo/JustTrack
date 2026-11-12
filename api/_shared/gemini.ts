import { ApiError, type GoogleGenAI, type GoogleGenAIInteraction } from '@google/genai';

import { DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODELS } from '../../lib/scan/geminiPrompt';

/** The configured model first, then the fallbacks, without repeats. */
export function modelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  return [...new Set([primary, ...FALLBACK_GEMINI_MODELS])];
}

/** A model that is overloaded, rate limited, or withdrawn hands off to the next one in the chain. */
const HAND_OFF_STATUSES = new Set([503, 429, 404]);

type CreateParams = Omit<Parameters<GoogleGenAI['interactions']['create']>[0], 'model' | 'stream'>;

/** Runs the interaction on the first model in the chain that will take it; rethrows the last error otherwise. */
export async function interactWithFallback(client: GoogleGenAI, params: CreateParams): Promise<GoogleGenAIInteraction> {
  const models = modelChain();
  let lastError: unknown = null;
  for (const [index, model] of models.entries()) {
    try {
      return (await client.interactions.create({ ...params, model })) as GoogleGenAIInteraction;
    } catch (error) {
      lastError = error;
      const handOff = error instanceof ApiError && HAND_OFF_STATUSES.has(error.status);
      if (!handOff || index === models.length - 1) throw error;
      console.warn(`gemini: ${model} unavailable (${(error as ApiError).status}), trying ${models[index + 1]}`);
    }
  }
  throw lastError;
}

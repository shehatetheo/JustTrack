import { ApiError, GoogleGenAI } from '@google/genai';
import { z } from 'zod';

import { DEFAULT_GEMINI_MODEL, DESCRIBE_SYSTEM_PROMPT, describeQuestion, RESPONSE_SCHEMA } from '../lib/scan/geminiPrompt';
import { readApiKey } from './_shared/apiKey';

/**
 * POST /api/describe-meal — the server side of "Describe what you ate".
 *
 * Takes a short typed description ("2 eggs and toast, iced latte"), asks
 * Gemini to split it into foods with portions and nutrition, and returns
 * the same shape as the photo scanner so the review screen is shared. Runs
 * as a Vercel function so the web app never sees the API key; native builds
 * made with EXPO_PUBLIC_GEMINI_API_KEY ask Gemini directly instead.
 */

const MODEL = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
const MAX_TEXT = 500;

const EstimatedFoodSchema = z.object({
  name: z.string(),
  portionDescription: z.string(),
  estimatedGrams: z.number(),
  confidence: z.number(),
  chain: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const MealAnalysisSchema = z.object({ foods: z.array(EstimatedFoodSchema).max(12), note: z.string() });

const recent = new Map<string, number[]>();
const LIMIT_PER_MINUTE = 12;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (recent.get(ip) ?? []).filter((time) => now - time < 60_000);
  timestamps.push(now);
  recent.set(ip, timestamps);
  if (recent.size > 5000) recent.clear();
  return timestamps.length > LIMIT_PER_MINUTE;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function failure(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = readApiKey();
  if (!apiKey) {
    return failure(503, 'not_configured', 'Describing meals isn’t set up on this server yet: add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.');
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return failure(429, 'rate_limited', 'That’s a lot of meals in a row — give it a minute and try again.');
  }

  let body: { text?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return failure(400, 'bad_request', 'Expected a JSON body.');
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > MAX_TEXT) {
    return failure(400, 'bad_request', `Describe what you ate in up to ${MAX_TEXT} characters.`);
  }

  const client = new GoogleGenAI({ apiKey });
  try {
    const interaction = await client.interactions.create({
      model: MODEL,
      system_instruction: DESCRIBE_SYSTEM_PROMPT,
      input: [{ type: 'text', text: describeQuestion(text) }],
      response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
      store: false,
    });

    const parsed = MealAnalysisSchema.safeParse(interaction.output_text ? JSON.parse(interaction.output_text) : null);
    if (!parsed.success) {
      console.error('describe-meal: unparseable output', interaction.status, interaction.errors);
      return failure(502, 'bad_response', 'We couldn’t read the reply. Please try again.');
    }
    return json({ foods: parsed.data.foods, note: parsed.data.note.trim() || null });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) return failure(503, 'not_configured', 'The server’s AI key was rejected. Check GEMINI_API_KEY.');
      if (error.status === 429) return failure(429, 'rate_limited', 'The AI is busy right now. Try again in a minute.');
      if (error.status === 400 && /safety|blocked|prohibited/i.test(error.message)) return failure(422, 'declined', 'We couldn’t work with that description. Try naming the foods plainly.');
      console.error('describe-meal: API error', error.status, error.message);
      return failure(502, 'upstream_error', 'Something went wrong talking to the AI. Please try again.');
    }
    if (error instanceof SyntaxError) return failure(502, 'bad_response', 'We couldn’t read the reply. Please try again.');
    console.error('describe-meal: unexpected error', error);
    return failure(500, 'internal', 'Something went wrong on our end. Please try again.');
  }
}

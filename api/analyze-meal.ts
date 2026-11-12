import { ApiError, GoogleGenAI } from '@google/genai';
import { z } from 'zod';

import { RESPONSE_SCHEMA, SCAN_QUESTION, SYSTEM_PROMPT } from '../lib/scan/geminiPrompt';
import { readApiKey } from './_shared/apiKey';
import { interactWithFallback } from './_shared/gemini';

/**
 * POST /api/analyze-meal — the server side of the photo scanner.
 *
 * Takes a photo, asks Gemini what food is on the plate and roughly how much,
 * and returns per-item nutrition estimates for the user to review. Runs as a
 * Vercel function so the web app never sees the API key. (A native build made
 * with EXPO_PUBLIC_GEMINI_API_KEY skips this and asks Gemini directly; see
 * lib/scan/geminiDirect.ts.) The photo is sent with storage turned off and is
 * not kept anywhere.
 */

/** Base64 is 4/3 of the bytes: this is about a 2 MB image. The app sends ~300 KB. */
const MAX_IMAGE_CHARS = 2_800_000;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Validates the model's reply; the schema sent to Gemini lives in lib/scan/geminiPrompt.ts. */
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

const MealAnalysisSchema = z.object({
  foods: z.array(EstimatedFoodSchema).max(12),
  note: z.string(),
});

/** Best-effort per-IP limiter; each serverless instance keeps its own counts. */
const recent = new Map<string, number[]>();
const LIMIT_PER_MINUTE = 8;

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
    return failure(503, 'not_configured', 'The photo scanner isn’t set up on this server yet: add GEMINI_API_KEY in Vercel → Settings → Environment Variables (for Production and Preview), then redeploy.');
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return failure(429, 'rate_limited', 'That’s a lot of scans in a row — give it a minute and try again.');
  }

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return failure(400, 'bad_request', 'Expected a JSON body.');
  }
  const image = typeof body.image === 'string' ? body.image : '';
  const mediaType = MEDIA_TYPES.find((type) => type === body.mediaType);
  if (!image || !mediaType || image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return failure(400, 'bad_request', 'Send a JPEG, PNG, or WebP photo under 2 MB.');
  }

  const client = new GoogleGenAI({ apiKey });
  try {
    const interaction = await interactWithFallback(client, {
      system_instruction: SYSTEM_PROMPT,
      input: [
        { type: 'image', data: image, mime_type: mediaType },
        { type: 'text', text: SCAN_QUESTION },
      ],
      response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
      store: false,
    });

    const parsed = MealAnalysisSchema.safeParse(interaction.output_text ? JSON.parse(interaction.output_text) : null);
    if (!parsed.success) {
      console.error('analyze-meal: unparseable output', interaction.status, interaction.errors);
      return failure(502, 'bad_response', 'The photo scanner sent back something we couldn’t read. Please try again.');
    }
    return json({ foods: parsed.data.foods, note: parsed.data.note.trim() || null });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        return failure(503, 'not_configured', 'The server’s AI key was rejected. Check GEMINI_API_KEY.');
      }
      if (error.status === 429 || error.status === 503) {
        return failure(429, 'rate_limited', 'The photo scanner is busy right now. Try again in a minute.');
      }
      if (error.status === 400 && /safety|blocked|prohibited/i.test(error.message)) {
        return failure(422, 'declined', 'We couldn’t analyze that photo. Try a clearer shot of the food itself.');
      }
      console.error('analyze-meal: API error', error.status, error.message);
      return failure(502, 'upstream_error', 'The photo scanner had a problem. Please try again.');
    }
    if (error instanceof SyntaxError) {
      return failure(502, 'bad_response', 'The photo scanner sent back something we couldn’t read. Please try again.');
    }
    console.error('analyze-meal: unexpected error', error);
    return failure(500, 'internal', 'Something went wrong on our end. Please try again.');
  }
}

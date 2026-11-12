import { ScanError } from '@/lib/scan/errors';
import { DEFAULT_GEMINI_MODEL, DESCRIBE_SYSTEM_PROMPT, describeQuestion, FALLBACK_GEMINI_MODELS, RESPONSE_SCHEMA, SCAN_QUESTION, SYSTEM_PROMPT } from '@/lib/scan/geminiPrompt';

/**
 * The on-device scanner: the app calls Gemini itself when a build was made
 * with EXPO_PUBLIC_GEMINI_API_KEY (set as an EAS environment variable, never
 * in a file). Anyone who unpacks such a build can read that key, so this
 * exists for TestFlight and personal builds; the public web app keeps using
 * the server function, where the key stays private. Photos are sent with
 * storage off and are not kept by Google.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function clean(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, '') ?? '';
}

/** The key baked into this build, if any. Read at call time so tests can set it. */
export function directApiKey(): string | null {
  return clean(process.env.EXPO_PUBLIC_GEMINI_API_KEY) || null;
}

export function directModel(): string {
  return clean(process.env.EXPO_PUBLIC_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;
}

/** The configured model first, then the fallbacks, without repeats. */
export function modelChain(): string[] {
  return [...new Set([directModel(), ...FALLBACK_GEMINI_MODELS])];
}

interface InteractionResponse {
  status?: string;
  steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
  error?: { code?: number; status?: string; message?: string };
}

/** The model's text reply: the last `model_output` step's text parts joined. */
export function outputText(body: InteractionResponse): string {
  const outputs = (body.steps ?? []).filter((step) => step.type === 'model_output');
  const last = outputs[outputs.length - 1];
  return (last?.content ?? [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}

type InputPart = { type: 'image'; data: string; mime_type: string } | { type: 'text'; text: string };

/** Wording for errors, since the same client serves the photo scanner and the describe box. */
const PHOTO_WORDS = { busy: 'The photo scanner is busy right now. Try again in a minute.', declined: 'We couldn’t analyze that photo. Try a clearer shot of the food itself.', problem: 'The photo scanner had a problem. Please try again.', unreadable: 'The photo scanner sent back something we couldn’t read. Please try again.' };
const TEXT_WORDS = { busy: 'The AI is busy right now. Try again in a minute.', declined: 'We couldn’t work with that description. Try naming the foods plainly.', problem: 'The AI had a problem working that out. Please try again.', unreadable: 'The AI sent back something we couldn’t read. Please try again.' };

/** Asks Gemini directly about a photo and returns its parsed JSON reply, or throws a ScanError. */
export function analyzeWithGemini(image: { base64: string; mediaType: string }, apiKey: string, signal?: AbortSignal): Promise<unknown> {
  return interact(SYSTEM_PROMPT, [{ type: 'image', data: image.base64, mime_type: image.mediaType }, { type: 'text', text: SCAN_QUESTION }], apiKey, PHOTO_WORDS, signal);
}

/** Asks Gemini directly about a typed description of a meal. */
export function describeWithGemini(text: string, apiKey: string, signal?: AbortSignal): Promise<unknown> {
  return interact(DESCRIBE_SYSTEM_PROMPT, [{ type: 'text', text: describeQuestion(text) }], apiKey, TEXT_WORDS, signal);
}

/** A model that is overloaded, rate limited, or withdrawn hands off to the next one in the chain. */
const HAND_OFF_STATUSES = new Set([503, 429, 404]);

async function interact(systemPrompt: string, input: InputPart[], apiKey: string, words: typeof PHOTO_WORDS, signal?: AbortSignal): Promise<unknown> {
  const models = modelChain();
  let last: { status: number; body: InteractionResponse | null } = { status: 0, body: null };
  for (const [index, model] of models.entries()) {
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          model,
          system_instruction: systemPrompt,
          input,
          response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
          store: false,
        }),
        signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw new ScanError('network', 'You appear to be offline. Check your connection and try again.');
    }

    const body = (await response.json().catch(() => null)) as InteractionResponse | null;
    if (response.ok) {
      const text = body ? outputText(body) : '';
      try {
        return JSON.parse(text);
      } catch {
        throw new ScanError('bad_response', words.unreadable);
      }
    }
    last = { status: response.status, body };
    if (!HAND_OFF_STATUSES.has(response.status) || index === models.length - 1 || signal?.aborted) break;
  }

  const message = last.body?.error?.message ?? '';
  if (last.status === 401 || last.status === 403) {
    throw new ScanError('not_configured', 'This build’s AI key was rejected. Install the latest build or check the key in EAS.');
  }
  if (last.status === 429 || last.status === 503) {
    throw new ScanError('rate_limited', words.busy);
  }
  if (last.status === 400 && /safety|blocked|prohibited/i.test(message)) {
    throw new ScanError('declined', words.declined);
  }
  throw new ScanError('upstream_error', words.problem);
}

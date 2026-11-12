import { ScanError } from '@/lib/scan/errors';
import { analyzeWithGemini, describeWithGemini, directApiKey, directModel, outputText } from '@/lib/scan/geminiDirect';
import { DESCRIBE_SYSTEM_PROMPT, describeQuestion, RESPONSE_SCHEMA, SYSTEM_PROMPT } from '@/lib/scan/geminiPrompt';

const image = { base64: 'AAAA', mediaType: 'image/jpeg' };

function reply(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

describe('directApiKey', () => {
  const original = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    else process.env.EXPO_PUBLIC_GEMINI_API_KEY = original;
    delete process.env.EXPO_PUBLIC_GEMINI_MODEL;
  });

  it('is null when the build has no key', () => {
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    expect(directApiKey()).toBeNull();
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = '   ';
    expect(directApiKey()).toBeNull();
  });

  it('forgives pasted quotes and spaces', () => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = ' "abc" ';
    expect(directApiKey()).toBe('abc');
  });

  it('uses the default model unless one is set', () => {
    expect(directModel()).toBe('gemini-3.5-flash-lite');
    process.env.EXPO_PUBLIC_GEMINI_MODEL = 'gemini-3.8-flash';
    expect(directModel()).toBe('gemini-3.8-flash');
  });
});

describe('outputText', () => {
  it('joins the text parts of the last model_output step', () => {
    expect(
      outputText({
        steps: [
          { type: 'thought' },
          { type: 'model_output', content: [{ type: 'text', text: '{"a":' }, { type: 'text', text: '1}' }] },
        ],
      })
    ).toBe('{"a":1}');
  });

  it('is empty with no output', () => {
    expect(outputText({})).toBe('');
  });
});

describe('analyzeWithGemini', () => {
  const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('sends the shared prompt, schema, and the photo with storage off, and parses the reply', async () => {
    const analysis = { foods: [{ name: 'Waffle', portionDescription: 'one', estimatedGrams: 80, confidence: 0.9, chain: '', calories: 220, protein: 5, carbs: 30, fat: 9 }], note: '' };
    fetchMock.mockResolvedValue(reply(200, { status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify(analysis) }] }] }));

    await expect(analyzeWithGemini(image, 'key-123')).resolves.toEqual(analysis);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('key-123');
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ model: 'gemini-3.5-flash-lite', system_instruction: SYSTEM_PROMPT, store: false, response_format: { mime_type: 'application/json', schema: RESPONSE_SCHEMA } });
    expect(body.input[0]).toEqual({ type: 'image', data: 'AAAA', mime_type: 'image/jpeg' });
  });

  it('hands off to the next model when Gemini is overloaded', async () => {
    const analysis = { foods: [], note: '' };
    fetchMock.mockResolvedValueOnce(reply(503, { error: { message: 'high demand' } })).mockResolvedValueOnce(reply(200, { steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify(analysis) }] }] }));
    await expect(analyzeWithGemini(image, 'k')).resolves.toEqual(analysis);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).model).toBe('gemini-3.5-flash-lite');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).model).toBe('gemini-3.1-flash-lite');
  });

  it.each([
    [403, {}, 'not_configured'],
    [400, { error: { message: 'Request blocked for safety reasons' } }, 'declined'],
    [500, {}, 'upstream_error'],
  ])('maps HTTP %s to %s', async (status, body, code) => {
    fetchMock.mockResolvedValue(reply(status, body));
    await expect(analyzeWithGemini(image, 'k')).rejects.toMatchObject({ code });
  });

  it('reports busy once every model in the chain is rate limited', async () => {
    fetchMock.mockResolvedValue(reply(429, {}));
    await expect(analyzeWithGemini(image, 'k')).rejects.toMatchObject({ code: 'rate_limited' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not hand off on an error that is not about load', async () => {
    fetchMock.mockResolvedValue(reply(500, {}));
    await expect(analyzeWithGemini(image, 'k')).rejects.toMatchObject({ code: 'upstream_error' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('describes a typed meal with the describe prompt and only text input', async () => {
    const analysis = { foods: [], note: '' };
    fetchMock.mockResolvedValue(reply(200, { steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify(analysis) }] }] }));
    await expect(describeWithGemini('2 eggs and toast', 'k')).resolves.toEqual(analysis);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.system_instruction).toBe(DESCRIBE_SYSTEM_PROMPT);
    expect(body.input).toEqual([{ type: 'text', text: describeQuestion('2 eggs and toast') }]);
  });

  it('rejects an unreadable reply', async () => {
    fetchMock.mockResolvedValue(reply(200, { steps: [{ type: 'model_output', content: [{ type: 'text', text: 'not json' }] }] }));
    await expect(analyzeWithGemini(image, 'k')).rejects.toMatchObject({ code: 'bad_response' });
  });
});

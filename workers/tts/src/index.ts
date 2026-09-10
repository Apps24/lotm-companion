type AiBinding = {
  run(model: string, input: Record<string, unknown>): Promise<ReadableStream<Uint8Array> | Response>;
};

type RateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

interface Env {
  AI: AiBinding;
  TTS_RATE_LIMITER: RateLimiter;
}

const MODEL = '@cf/deepgram/aura-2-en';
const MAX_TEXT_LENGTH = 2200;
const SPEAKERS = new Set([
  'amalthea','andromeda','apollo','arcas','aries','asteria','athena','atlas','aurora','callista','cora','cordelia','delia','draco','electra','harmonia','helena','hera','hermes','hyperion','iris','janus','juno','jupiter','luna','mars','minerva','neptune','odysseus','ophelia','orion','orpheus','pandora','phoebe','pluto','saturn','thalia','theia','vesta','zeus',
]);

function originAllowed(origin: string | null) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && (url.hostname === 'lotm-companion.pages.dev' || url.hostname.endsWith('.lotm-companion.pages.dev'));
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const headers = new Headers({
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (originAllowed(origin)) {
    headers.set('Access-Control-Allow-Origin', origin!);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Reader-Id');
    headers.set('Access-Control-Max-Age', '86400');
  }
  return headers;
}

function json(message: string, status: number, origin: string | null) {
  const headers = corsHeaders(origin);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      if (!originAllowed(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response('ok', { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }

    if (request.method !== 'POST' || url.pathname !== '/tts') return json('Not found.', 404, origin);
    if (!originAllowed(origin)) return json('Origin is not allowed.', 403, origin);

    const readerId = (request.headers.get('X-Reader-Id') ?? '').trim().slice(0, 96);
    if (!readerId) return json('Missing reader identifier.', 400, origin);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const rate = await env.TTS_RATE_LIMITER.limit({ key: `${readerId}:${ip}` });
    if (!rate.success) return json('Narration rate limit reached. Use browser voice briefly, then try again.', 429, origin);

    let body: { text?: unknown; speaker?: unknown };
    try {
      body = await request.json();
    } catch {
      return json('Invalid JSON body.', 400, origin);
    }

    const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
    if (!text) return json('Text is required.', 400, origin);
    if (text.length > MAX_TEXT_LENGTH) return json(`Text must be ${MAX_TEXT_LENGTH} characters or fewer.`, 413, origin);

    const requestedSpeaker = typeof body.speaker === 'string' ? body.speaker.toLowerCase() : 'luna';
    const speaker = SPEAKERS.has(requestedSpeaker) ? requestedSpeaker : 'luna';

    try {
      const result = await env.AI.run(MODEL, {
        text,
        speaker,
        encoding: 'mp3',
      });

      if (result instanceof Response) {
        const headers = corsHeaders(origin);
        headers.set('Content-Type', result.headers.get('Content-Type') || 'audio/mpeg');
        return new Response(result.body, { status: result.status, headers });
      }

      const headers = corsHeaders(origin);
      headers.set('Content-Type', 'audio/mpeg');
      return new Response(result, { status: 200, headers });
    } catch (error) {
      console.error('Workers AI TTS failed', error);
      return json('AI narration failed. Browser voice remains available.', 502, origin);
    }
  },
};

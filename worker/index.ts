interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

interface GeminiImproveRequest {
  action: 'improve';
  text: string;
  context?: string;
  apiKey?: string;
}

interface GeminiSummaryRequest {
  action: 'summary';
  role: string;
  skills: string[];
  apiKey?: string;
}

type GeminiRequest = GeminiImproveRequest | GeminiSummaryRequest;

type JsonObject = Record<string, unknown>;

const API_PATH = '/api/gemini';
const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 30000;

const jsonResponse = (body: JsonObject, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const errorResponse = (status: number, code: string, message: string): Response =>
  jsonResponse({ code, error: message }, status);

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const isSameOriginRequest = (request: Request): boolean => {
  const originHeader = request.headers.get('origin');
  if (!originHeader) return true;

  try {
    const requestOrigin = new URL(request.url).origin;
    return originHeader === requestOrigin;
  } catch {
    return false;
  }
};

const isHtmlNavigationRequest = (request: Request): boolean => {
  if (request.method !== 'GET') return false;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
};

const buildPrompt = (payload: GeminiRequest): string => {
  if (payload.action === 'improve') {
    return `
You are an expert resume writer and career coach.
Rewrite the text below to be concise, measurable, and professional.
Use active voice and keep the original meaning.

Context: ${payload.context || 'resume'} section.
Original text:
"${payload.text}"

Return only the rewritten text.
    `.trim();
  }

  const skills = payload.skills.filter(Boolean).join(', ');
  return `
Write a professional resume summary in at most 3 sentences for a ${payload.role || 'professional'}.
Highlight these skills when relevant: ${skills || 'communication, ownership, collaboration'}.
Keep it modern and outcome-oriented.

Return only the summary text.
  `.trim();
};

const parseGeminiText = (data: JsonObject): string => {
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const first = candidates[0] as JsonObject | undefined;
  const content = (first?.content as JsonObject | undefined) ?? {};
  const parts = Array.isArray(content.parts) ? content.parts : [];
  const text = parts
    .map((part) => (part && typeof part === 'object' ? normalizeText((part as JsonObject).text) : ''))
    .filter(Boolean)
    .join('\n')
    .trim();

  return text;
};

const validateRequest = (body: unknown): GeminiRequest | null => {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  const action = value.action;

  if (action === 'improve') {
    const text = normalizeText(value.text);
    if (!text) return null;
    return {
      action,
      text,
      context: normalizeText(value.context) || 'resume',
      apiKey: normalizeText(value.apiKey) || undefined,
    };
  }

  if (action === 'summary') {
    const skills = Array.isArray(value.skills) ? value.skills.filter((item): item is string => typeof item === 'string') : [];
    return {
      action,
      role: normalizeText(value.role) || 'Professional',
      skills,
      apiKey: normalizeText(value.apiKey) || undefined,
    };
  }

  return null;
};

const parseJsonBody = async (request: Request): Promise<unknown> => {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new Error('REQUEST_TOO_LARGE');
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new Error('REQUEST_TOO_LARGE');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('INVALID_JSON');
  }
};

const callGemini = async (prompt: string, apiKey: string, model: string): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      }
    );

    const data = (await response.json().catch(() => ({}))) as JsonObject;
    if (!response.ok) {
      const upstreamError = (data.error as JsonObject | undefined) ?? {};
      const upstreamMessage = normalizeText(upstreamError.message) || 'Gemini request failed.';

      if (response.status === 429) {
        throw new Error(`UPSTREAM_RATE_LIMIT:${upstreamMessage}`);
      }
      if (response.status >= 500) {
        throw new Error(`UPSTREAM_UNAVAILABLE:${upstreamMessage}`);
      }
      throw new Error(`UPSTREAM_ERROR:${upstreamMessage}`);
    }

    const text = parseGeminiText(data);
    if (!text) {
      throw new Error('EMPTY_RESPONSE');
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('UPSTREAM_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const handleGeminiRequest = async (request: Request, env: Env): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.');
  }

  if (!isSameOriginRequest(request)) {
    return errorResponse(403, 'FORBIDDEN_ORIGIN', 'Cross-origin requests are not allowed.');
  }

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') {
      return errorResponse(413, 'REQUEST_TOO_LARGE', 'Request payload is too large.');
    }
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  const payload = validateRequest(body);
  if (!payload) {
    return errorResponse(400, 'INVALID_REQUEST', 'Invalid AI request payload.');
  }

  const model = normalizeText(env.GEMINI_MODEL) || 'gemini-2.0-flash-exp';
  const apiKey = normalizeText(env.GEMINI_API_KEY) || normalizeText(payload.apiKey);
  if (!apiKey) {
    return errorResponse(400, 'API_KEY_REQUIRED', 'AI key is missing on the server. Add GEMINI_API_KEY or provide your own key.');
  }

  const prompt = buildPrompt(payload);

  try {
    const text = await callGemini(prompt, apiKey, model);
    return jsonResponse({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('UPSTREAM_RATE_LIMIT:')) {
      return errorResponse(429, 'UPSTREAM_RATE_LIMIT', message.replace('UPSTREAM_RATE_LIMIT:', '').trim());
    }
    if (message.startsWith('UPSTREAM_UNAVAILABLE:')) {
      return errorResponse(503, 'UPSTREAM_UNAVAILABLE', message.replace('UPSTREAM_UNAVAILABLE:', '').trim());
    }
    if (message.startsWith('UPSTREAM_ERROR:')) {
      return errorResponse(502, 'UPSTREAM_ERROR', message.replace('UPSTREAM_ERROR:', '').trim());
    }
    if (message === 'UPSTREAM_TIMEOUT') {
      return errorResponse(504, 'UPSTREAM_TIMEOUT', 'AI request timed out. Please try again.');
    }
    if (message === 'EMPTY_RESPONSE') {
      return errorResponse(502, 'EMPTY_RESPONSE', 'AI returned an empty response.');
    }

    return errorResponse(500, 'UNKNOWN_ERROR', 'Unexpected AI proxy error.');
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === API_PATH) {
      return handleGeminiRequest(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return errorResponse(404, 'NOT_FOUND', 'API route not found.');
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || !isHtmlNavigationRequest(request)) {
      return assetResponse;
    }

    const spaUrl = new URL(request.url);
    spaUrl.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(spaUrl.toString(), request));
  },
};

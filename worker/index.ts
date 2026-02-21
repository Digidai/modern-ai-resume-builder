interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_SIGNING_SECRET?: string;
  ALLOWED_ORIGINS?: string;
  AI_RATE_LIMIT_PER_MINUTE?: string;
  AI_SESSION_RATE_LIMIT_PER_MINUTE?: string;
  AI_SESSION_TTL_SECONDS?: string;
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

interface SessionTokenPayload {
  ip: string;
  uaHash: string;
  iat: number;
  exp: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const API_PATH = '/api/gemini';
const SESSION_PATH = '/api/gemini/session';
const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';
const DEFAULT_RATE_LIMIT_PER_MINUTE = 20;
const DEFAULT_SESSION_RATE_LIMIT_PER_MINUTE = 60;
const DEFAULT_SESSION_TTL_SECONDS = 10 * 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_RATE_LIMIT_BUCKETS = 5000;

const tokenEncoder = new TextEncoder();
const rateLimitBuckets = new Map<string, RateLimitBucket>();

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

const parseInteger = (
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number => {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
};

const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlDecode = (value: string): Uint8Array | null => {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const binary = atob(base64 + padding);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
};

const timingSafeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
};

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', tokenEncoder.encode(value));
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const cleanupRateLimitBuckets = (now: number): void => {
  if (rateLimitBuckets.size <= MAX_RATE_LIMIT_BUCKETS) return;

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }

    if (rateLimitBuckets.size <= MAX_RATE_LIMIT_BUCKETS) break;
  }
};

const consumeRateLimit = (key: string, limit: number, now = Date.now()): RateLimitResult => {
  cleanupRateLimitBuckets(now);

  const existing = rateLimitBuckets.get(key);
  const inWindow = existing && existing.resetAt > now;
  const bucket: RateLimitBucket = inWindow
    ? existing
    : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  const allowed = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);

  return {
    allowed,
    limit,
    remaining,
    resetAt: bucket.resetAt,
  };
};

const appendRateLimitHeaders = (response: Response, result: RateLimitResult): Response => {
  const headers = new Headers(response.headers);
  headers.set('x-ratelimit-limit', String(result.limit));
  headers.set('x-ratelimit-remaining', String(result.remaining));
  headers.set('x-ratelimit-reset', String(Math.ceil(result.resetAt / 1000)));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const getAllowedOrigins = (request: Request, env: Env): Set<string> => {
  const urlOrigin = new URL(request.url).origin;
  const allowed = new Set<string>([urlOrigin]);

  const configured = normalizeText(env.ALLOWED_ORIGINS);
  if (configured) {
    for (const origin of configured.split(',')) {
      const normalized = origin.trim();
      if (!normalized) continue;
      allowed.add(normalized);
    }
  }

  return allowed;
};

const isAllowedOriginRequest = (request: Request, env: Env): boolean => {
  const allowedOrigins = getAllowedOrigins(request, env);

  const originHeader = normalizeText(request.headers.get('origin'));
  const refererHeader = normalizeText(request.headers.get('referer'));
  const secFetchSite = normalizeText(request.headers.get('sec-fetch-site'));

  const hasValidOrigin = originHeader ? allowedOrigins.has(originHeader) : false;
  const hasValidReferer = refererHeader
    ? Array.from(allowedOrigins).some((allowedOrigin) => refererHeader.startsWith(`${allowedOrigin}/`) || refererHeader === allowedOrigin)
    : false;

  const hasTrustedFetchSite = secFetchSite
    ? secFetchSite === 'same-origin' || secFetchSite === 'same-site'
    : false;

  return hasValidOrigin || hasValidReferer || hasTrustedFetchSite;
};

const getClientIp = (request: Request): string => {
  return normalizeText(request.headers.get('cf-connecting-ip')) || 'unknown';
};

const getSigningSecret = (env: Env): string => {
  return normalizeText(env.GEMINI_SIGNING_SECRET) || normalizeText(env.GEMINI_API_KEY);
};

const signSessionPayload = async (payload: string, secret: string): Promise<string> => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    tokenEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, tokenEncoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
};

const issueSessionToken = async (request: Request, env: Env): Promise<{ token: string; expiresAt: number }> => {
  const secret = getSigningSecret(env);
  if (!secret) {
    throw new Error('SIGNING_SECRET_MISSING');
  }

  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = parseInteger(env.AI_SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS, 60, 3600);
  const expiresAt = now + ttlSeconds;
  const ip = getClientIp(request);
  const userAgent = normalizeText(request.headers.get('user-agent')) || 'unknown';

  const payload: SessionTokenPayload = {
    ip,
    uaHash: await sha256Hex(userAgent),
    iat: now,
    exp: expiresAt,
  };

  const encodedPayload = base64UrlEncode(tokenEncoder.encode(JSON.stringify(payload)));
  const signature = await signSessionPayload(encodedPayload, secret);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: expiresAt * 1000,
  };
};

const verifySessionToken = async (
  request: Request,
  token: string,
  env: Env
): Promise<{ valid: true } | { valid: false; code: string; message: string }> => {
  const secret = getSigningSecret(env);
  if (!secret) {
    return { valid: false, code: 'SIGNING_SECRET_MISSING', message: 'Session signing secret is not configured.' };
  }

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) {
    return { valid: false, code: 'INVALID_SESSION_TOKEN', message: 'Malformed AI session token.' };
  }

  const expectedSignature = await signSessionPayload(encodedPayload, secret);
  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return { valid: false, code: 'INVALID_SESSION_TOKEN', message: 'Invalid AI session signature.' };
  }

  const decodedPayloadBytes = base64UrlDecode(encodedPayload);
  if (!decodedPayloadBytes) {
    return { valid: false, code: 'INVALID_SESSION_TOKEN', message: 'Invalid AI session payload.' };
  }

  let payload: SessionTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(decodedPayloadBytes)) as SessionTokenPayload;
  } catch {
    return { valid: false, code: 'INVALID_SESSION_TOKEN', message: 'Unreadable AI session payload.' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(payload.exp) || payload.exp <= now) {
    return { valid: false, code: 'SESSION_EXPIRED', message: 'AI session token expired. Refresh and try again.' };
  }

  const ip = getClientIp(request);
  const userAgent = normalizeText(request.headers.get('user-agent')) || 'unknown';
  const uaHash = await sha256Hex(userAgent);

  if (payload.ip !== ip || payload.uaHash !== uaHash) {
    return {
      valid: false,
      code: 'INVALID_SESSION_TOKEN',
      message: 'AI session token does not match this client.',
    };
  }

  return { valid: true };
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
  return parts
    .map((part) =>
      part && typeof part === 'object'
        ? normalizeText((part as JsonObject).text)
        : ''
    )
    .filter(Boolean)
    .join('\n')
    .trim();
};

const validateRequest = (body: unknown): GeminiRequest | null => {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;

  if (value.action === 'improve') {
    const text = normalizeText(value.text);
    if (!text) return null;

    return {
      action: 'improve',
      text,
      context: normalizeText(value.context) || 'resume',
      apiKey: normalizeText(value.apiKey) || undefined,
    };
  }

  if (value.action === 'summary') {
    const skills = Array.isArray(value.skills)
      ? value.skills.filter((item): item is string => typeof item === 'string')
      : [];

    return {
      action: 'summary',
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

const handleSessionRequest = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only POST is supported for session creation.');
  }

  if (!isAllowedOriginRequest(request, env)) {
    console.warn('[ai-session] blocked origin', {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      ip: getClientIp(request),
    });
    return errorResponse(403, 'FORBIDDEN_ORIGIN', 'Untrusted origin for AI session request.');
  }

  const sessionRateLimit = parseInteger(
    env.AI_SESSION_RATE_LIMIT_PER_MINUTE,
    DEFAULT_SESSION_RATE_LIMIT_PER_MINUTE,
    10,
    300
  );
  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit(`session:${ip}`, sessionRateLimit);
  if (!rateLimit.allowed) {
    console.warn('[ai-session] rate limited', { ip, limit: sessionRateLimit });
    return appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'Too many AI session requests. Please wait and try again.'),
      rateLimit
    );
  }

  try {
    const session = await issueSessionToken(request, env);
    return appendRateLimitHeaders(
      jsonResponse({ token: session.token, expiresAt: session.expiresAt }),
      rateLimit
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'SIGNING_SECRET_MISSING') {
      console.warn('[ai-session] signing secret missing');
      return errorResponse(500, 'SIGNING_SECRET_MISSING', 'AI session signing secret is not configured.');
    }

    return errorResponse(500, 'UNKNOWN_ERROR', 'Failed to create AI session token.');
  }
};

const handleGeminiRequest = async (request: Request, env: Env): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.');
  }

  if (!isAllowedOriginRequest(request, env)) {
    console.warn('[ai] blocked origin', {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      ip: getClientIp(request),
    });
    return errorResponse(403, 'FORBIDDEN_ORIGIN', 'Cross-origin requests are not allowed.');
  }

  const token = normalizeText(request.headers.get('x-ai-session-token'));
  if (!token) {
    return errorResponse(401, 'AUTH_REQUIRED', 'Missing AI session token.');
  }

  const tokenVerification = await verifySessionToken(request, token, env);
  if (!tokenVerification.valid) {
    console.warn('[ai] invalid session token', {
      ip: getClientIp(request),
      code: tokenVerification.code,
    });
    return errorResponse(401, tokenVerification.code, tokenVerification.message);
  }

  const aiRateLimit = parseInteger(env.AI_RATE_LIMIT_PER_MINUTE, DEFAULT_RATE_LIMIT_PER_MINUTE, 5, 240);
  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit(`ai:${ip}`, aiRateLimit);
  if (!rateLimit.allowed) {
    console.warn('[ai] rate limited', { ip, limit: aiRateLimit });
    return appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'AI rate limit reached. Please wait and try again.'),
      rateLimit
    );
  }

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') {
      return appendRateLimitHeaders(
        errorResponse(413, 'REQUEST_TOO_LARGE', 'Request payload is too large.'),
        rateLimit
      );
    }
    return appendRateLimitHeaders(
      errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.'),
      rateLimit
    );
  }

  const payload = validateRequest(body);
  if (!payload) {
    return appendRateLimitHeaders(
      errorResponse(400, 'INVALID_REQUEST', 'Invalid AI request payload.'),
      rateLimit
    );
  }

  const model = normalizeText(env.GEMINI_MODEL) || DEFAULT_MODEL;
  const apiKey = normalizeText(env.GEMINI_API_KEY) || normalizeText(payload.apiKey);
  if (!apiKey) {
    return appendRateLimitHeaders(
      errorResponse(400, 'API_KEY_REQUIRED', 'AI key is missing on the server. Add GEMINI_API_KEY or provide your own key.'),
      rateLimit
    );
  }

  const prompt = buildPrompt(payload);

  try {
    const text = await callGemini(prompt, apiKey, model);
    return appendRateLimitHeaders(jsonResponse({ text }), rateLimit);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('UPSTREAM_RATE_LIMIT:')) {
      return appendRateLimitHeaders(
        errorResponse(429, 'UPSTREAM_RATE_LIMIT', message.replace('UPSTREAM_RATE_LIMIT:', '').trim()),
        rateLimit
      );
    }
    if (message.startsWith('UPSTREAM_UNAVAILABLE:')) {
      return appendRateLimitHeaders(
        errorResponse(503, 'UPSTREAM_UNAVAILABLE', message.replace('UPSTREAM_UNAVAILABLE:', '').trim()),
        rateLimit
      );
    }
    if (message.startsWith('UPSTREAM_ERROR:')) {
      return appendRateLimitHeaders(
        errorResponse(502, 'UPSTREAM_ERROR', message.replace('UPSTREAM_ERROR:', '').trim()),
        rateLimit
      );
    }
    if (message === 'UPSTREAM_TIMEOUT') {
      return appendRateLimitHeaders(
        errorResponse(504, 'UPSTREAM_TIMEOUT', 'AI request timed out. Please try again.'),
        rateLimit
      );
    }
    if (message === 'EMPTY_RESPONSE') {
      return appendRateLimitHeaders(
        errorResponse(502, 'EMPTY_RESPONSE', 'AI returned an empty response.'),
        rateLimit
      );
    }

    return appendRateLimitHeaders(
      errorResponse(500, 'UNKNOWN_ERROR', 'Unexpected AI proxy error.'),
      rateLimit
    );
  }
};

const withSecurityHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('cross-origin-opener-policy', 'same-origin');
  headers.set('cross-origin-resource-policy', 'same-origin');
  headers.set('cross-origin-embedder-policy', 'credentialless');

  const contentType = normalizeText(headers.get('content-type')).toLowerCase();
  if (contentType.includes('text/html')) {
    headers.set(
      'content-security-policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    let response: Response;
    if (url.pathname === SESSION_PATH) {
      response = await handleSessionRequest(request, env);
      return withSecurityHeaders(response);
    }

    if (url.pathname === API_PATH) {
      response = await handleGeminiRequest(request, env);
      return withSecurityHeaders(response);
    }

    if (url.pathname.startsWith('/api/')) {
      response = errorResponse(404, 'NOT_FOUND', 'API route not found.');
      return withSecurityHeaders(response);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || !isHtmlNavigationRequest(request)) {
      return withSecurityHeaders(assetResponse);
    }

    const spaUrl = new URL(request.url);
    spaUrl.pathname = '/index.html';
    const fallback = await env.ASSETS.fetch(new Request(spaUrl.toString(), request));
    return withSecurityHeaders(fallback);
  },
};

import {
  type GeminiErrorCode,
  type GeminiRequest,
} from '../src/shared/geminiContract';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  RATE_LIMITER?: {
    idFromName: (name: string) => unknown;
    get: (id: unknown) => {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    };
  };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_SIGNING_SECRET?: string;
  ALLOWED_ORIGINS?: string;
  AI_RATE_LIMIT_PER_MINUTE?: string;
  AI_PER_SESSION_RATE_LIMIT_PER_MINUTE?: string;
  AI_GLOBAL_RATE_LIMIT_PER_MINUTE?: string;
  AI_SESSION_RATE_LIMIT_PER_MINUTE?: string;
  AI_SESSION_TTL_SECONDS?: string;
  AI_CLIENT_TOKEN_TTL_SECONDS?: string;
}

type JsonObject = Record<string, unknown>;

interface SessionTokenPayload {
  sidHash: string;
  ip: string;
  uaHash: string;
  iat: number;
  exp: number;
}

interface ClientTokenPayload {
  clientIdHash: string;
  ip: string;
  uaHash: string;
  origin: string;
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

interface RateLimitRequest {
  limit: number;
  now: number;
  windowMs: number;
}

interface DurableObjectStateLike {
  storage: {
    get<T = unknown>(key: string): Promise<T | undefined>;
    put<T = unknown>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<boolean>;
    setAlarm(timestamp: number): Promise<void>;
  };
}

const API_PATH = '/api/gemini';
const SESSION_PATH = '/api/gemini/session';
const RATE_LIMIT_DO_PATH = 'https://rate-limiter/consume';
const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';
const DEFAULT_RATE_LIMIT_PER_MINUTE = 20;
const DEFAULT_PER_SESSION_RATE_LIMIT_PER_MINUTE = 20;
const DEFAULT_GLOBAL_RATE_LIMIT_PER_MINUTE = 240;
const DEFAULT_SESSION_RATE_LIMIT_PER_MINUTE = 60;
const DEFAULT_SESSION_TTL_SECONDS = 10 * 60;
const DEFAULT_CLIENT_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_RATE_LIMIT_BUCKETS = 5000;
const SESSION_COOKIE_NAME = 'ai_session_id';
const CLIENT_TOKEN_COOKIE_NAME = 'ai_client_id';
const CLIENT_TOKEN_META_NAME = 'ai-client-token';
const CLIENT_TOKEN_HEADER = 'x-ai-client-token';
const REQUEST_ID_HEADER = 'x-ai-request-id';
const REQUEST_ID_MAX_BYTES = 128;
const REQUEST_ID_TTL_MS = 2 * 60 * 1000;
const MAX_REQUEST_REPLAY_CACHE = 10000;

const tokenEncoder = new TextEncoder();
const rateLimitBuckets = new Map<string, RateLimitBucket>();
const usedRequestIds = new Map<string, number>();
let hasLoggedMissingRateLimiter = false;
let hasLoggedRateLimiterFallback = false;

const jsonResponse = (body: JsonObject, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const errorResponse = (status: number, code: GeminiErrorCode, message: string): Response =>
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

const generateSessionId = (): string => {
  const random = crypto.getRandomValues(new Uint8Array(16));
  return base64UrlEncode(random);
};

const parseCookieHeader = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex <= 0) return acc;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (!key) return acc;
      acc[key] = value;
      return acc;
    }, {});
};

const getOldestMapKey = <T>(map: Map<string, T>): string | null => {
  const iterator = map.keys().next();
  return iterator.done ? null : iterator.value;
};

const cleanupExpiredRequestIds = (now: number): void => {
  while (usedRequestIds.size > 0) {
    const oldestKey = getOldestMapKey(usedRequestIds);
    if (!oldestKey) return;

    const expiresAt = usedRequestIds.get(oldestKey) || 0;
    if (expiresAt > now) return;
    usedRequestIds.delete(oldestKey);
  }
};

const reserveRequestId = (requestId: string, now = Date.now()): boolean => {
  cleanupExpiredRequestIds(now);

  const current = usedRequestIds.get(requestId);
  if (current && current > now) {
    return false;
  }

  if (current) {
    usedRequestIds.delete(requestId);
  }

  while (usedRequestIds.size >= MAX_REQUEST_REPLAY_CACHE) {
    const oldestKey = getOldestMapKey(usedRequestIds);
    if (!oldestKey) break;
    usedRequestIds.delete(oldestKey);
  }

  usedRequestIds.set(requestId, now + REQUEST_ID_TTL_MS);
  return true;
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

const consumeRateLimitLocal = (key: string, limit: number, now = Date.now()): RateLimitResult => {
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

const consumeRateLimit = async (
  env: Env,
  key: string,
  limit: number,
  now = Date.now()
): Promise<RateLimitResult> => {
  const namespace = env.RATE_LIMITER;
  if (!namespace) {
    if (!hasLoggedMissingRateLimiter) {
      hasLoggedMissingRateLimiter = true;
      console.warn('[rate-limit] RATE_LIMITER binding missing, falling back to in-memory limiter.');
    }
    return consumeRateLimitLocal(key, limit, now);
  }

  try {
    const id = namespace.idFromName(key);
    const stub = namespace.get(id);
    const response = await stub.fetch(RATE_LIMIT_DO_PATH, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        limit,
        now,
        windowMs: RATE_LIMIT_WINDOW_MS,
      } satisfies RateLimitRequest),
    });

    if (!response.ok) {
      if (!hasLoggedRateLimiterFallback) {
        hasLoggedRateLimiterFallback = true;
        console.warn('[rate-limit] Durable Object unavailable, falling back to in-memory limiter.');
      }
      return consumeRateLimitLocal(key, limit, now);
    }

    const payload = (await response.json().catch(() => null)) as RateLimitResult | null;
    if (
      !payload ||
      typeof payload.allowed !== 'boolean' ||
      !Number.isFinite(payload.limit) ||
      !Number.isFinite(payload.remaining) ||
      !Number.isFinite(payload.resetAt)
    ) {
      if (!hasLoggedRateLimiterFallback) {
        hasLoggedRateLimiterFallback = true;
        console.warn('[rate-limit] Invalid limiter payload, falling back to in-memory limiter.');
      }
      return consumeRateLimitLocal(key, limit, now);
    }

    return payload;
  } catch {
    if (!hasLoggedRateLimiterFallback) {
      hasLoggedRateLimiterFallback = true;
      console.warn('[rate-limit] Limiter request failed, falling back to in-memory limiter.');
    }
    return consumeRateLimitLocal(key, limit, now);
  }
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

const getRequestOrigin = (request: Request): string => new URL(request.url).origin;
const isLocalHostRequest = (request: Request): boolean => {
  const hostname = new URL(request.url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

const getAllowedOrigins = (request: Request, env: Env): Set<string> => {
  const urlOrigin = getRequestOrigin(request);
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

const hasAllowedOriginOrReferer = (request: Request, env: Env): boolean => {
  const allowedOrigins = getAllowedOrigins(request, env);
  const originHeader = normalizeText(request.headers.get('origin'));
  const refererHeader = normalizeText(request.headers.get('referer'));

  const hasValidOrigin = originHeader ? allowedOrigins.has(originHeader) : false;
  const hasValidReferer = refererHeader
    ? Array.from(allowedOrigins).some((allowedOrigin) => refererHeader.startsWith(`${allowedOrigin}/`) || refererHeader === allowedOrigin)
    : false;

  return hasValidOrigin || hasValidReferer;
};

const hasTrustedFetchMetadata = (request: Request): boolean => {
  const secFetchSite = normalizeText(request.headers.get('sec-fetch-site'));
  const secFetchMode = normalizeText(request.headers.get('sec-fetch-mode'));

  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site') {
    return false;
  }

  if (secFetchMode && secFetchMode !== 'cors' && secFetchMode !== 'same-origin') {
    return false;
  }

  return true;
};

const isAllowedOriginRequest = (request: Request, env: Env): boolean => {
  return hasAllowedOriginOrReferer(request, env) && hasTrustedFetchMetadata(request);
};

const withCorsHeaders = (request: Request, env: Env, response: Response): Response => {
  const originHeader = normalizeText(request.headers.get('origin'));
  if (!originHeader) return response;

  if (!getAllowedOrigins(request, env).has(originHeader)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', originHeader);
  headers.set('access-control-allow-credentials', 'true');
  headers.set('access-control-allow-methods', 'POST, OPTIONS');
  headers.set(
    'access-control-allow-headers',
    `content-type, ${REQUEST_ID_HEADER}, x-ai-session-token, ${CLIENT_TOKEN_HEADER}`
  );
  headers.set('vary', 'origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
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

const issueSessionToken = async (
  request: Request,
  env: Env
): Promise<{ token: string; expiresAt: number; sessionId: string }> => {
  const secret = getSigningSecret(env);
  if (!secret) {
    throw new Error('SIGNING_SECRET_MISSING');
  }

  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = parseInteger(env.AI_SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS, 60, 3600);
  const expiresAt = now + ttlSeconds;
  const sessionId = generateSessionId();
  const ip = getClientIp(request);
  const userAgent = normalizeText(request.headers.get('user-agent')) || 'unknown';

  const payload: SessionTokenPayload = {
    sidHash: await sha256Hex(sessionId),
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
    sessionId,
  };
};

const issueClientToken = async (
  request: Request,
  env: Env
): Promise<{ token: string; cookie: string }> => {
  const secret = getSigningSecret(env);
  if (!secret) {
    throw new Error('SIGNING_SECRET_MISSING');
  }

  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = parseInteger(
    env.AI_CLIENT_TOKEN_TTL_SECONDS,
    DEFAULT_CLIENT_TOKEN_TTL_SECONDS,
    600,
    7 * 24 * 60 * 60
  );
  const userAgent = normalizeText(request.headers.get('user-agent')) || 'unknown';
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const clientId = normalizeText(cookies[CLIENT_TOKEN_COOKIE_NAME]) || generateSessionId();

  const payload: ClientTokenPayload = {
    clientIdHash: await sha256Hex(clientId),
    ip: getClientIp(request),
    uaHash: await sha256Hex(userAgent),
    origin: getRequestOrigin(request),
    iat: now,
    exp: now + ttlSeconds,
  };

  const encodedPayload = base64UrlEncode(tokenEncoder.encode(JSON.stringify(payload)));
  const signature = await signSessionPayload(encodedPayload, secret);

  return {
    token: `${encodedPayload}.${signature}`,
    cookie: `${CLIENT_TOKEN_COOKIE_NAME}=${clientId}; Max-Age=${ttlSeconds}; Path=${API_PATH}; HttpOnly; Secure; SameSite=Strict`,
  };
};

const verifyClientToken = async (
  request: Request,
  token: string,
  env: Env
): Promise<{ valid: true } | { valid: false; code: GeminiErrorCode; message: string }> => {
  const secret = getSigningSecret(env);
  if (!secret) {
    return { valid: false, code: 'SIGNING_SECRET_MISSING', message: 'Session signing secret is not configured.' };
  }

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) {
    return { valid: false, code: 'INVALID_CLIENT_TOKEN', message: 'Malformed AI client token.' };
  }

  const expectedSignature = await signSessionPayload(encodedPayload, secret);
  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return { valid: false, code: 'INVALID_CLIENT_TOKEN', message: 'Invalid AI client token signature.' };
  }

  const decodedPayloadBytes = base64UrlDecode(encodedPayload);
  if (!decodedPayloadBytes) {
    return { valid: false, code: 'INVALID_CLIENT_TOKEN', message: 'Invalid AI client token payload.' };
  }

  let payload: ClientTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(decodedPayloadBytes)) as ClientTokenPayload;
  } catch {
    return { valid: false, code: 'INVALID_CLIENT_TOKEN', message: 'Unreadable AI client token payload.' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(payload.exp) || payload.exp <= now) {
    return { valid: false, code: 'CLIENT_TOKEN_REQUIRED', message: 'AI client token expired. Refresh and try again.' };
  }

  if (payload.origin !== getRequestOrigin(request)) {
    return {
      valid: false,
      code: 'INVALID_CLIENT_TOKEN',
      message: 'AI client token origin mismatch.',
    };
  }

  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const clientId = normalizeText(cookies[CLIENT_TOKEN_COOKIE_NAME]);
  if (!clientId) {
    return {
      valid: false,
      code: 'CLIENT_TOKEN_REQUIRED',
      message: 'Missing AI client cookie. Refresh and try again.',
    };
  }

  const clientIdHash = await sha256Hex(clientId);
  if (!payload.clientIdHash || payload.clientIdHash !== clientIdHash) {
    return {
      valid: false,
      code: 'INVALID_CLIENT_TOKEN',
      message: 'AI client token does not match this browser.',
    };
  }

  const ip = getClientIp(request);
  const userAgent = normalizeText(request.headers.get('user-agent')) || 'unknown';
  const uaHash = await sha256Hex(userAgent);
  if (payload.ip !== ip || payload.uaHash !== uaHash) {
    return {
      valid: false,
      code: 'INVALID_CLIENT_TOKEN',
      message: 'AI client token does not match this client.',
    };
  }

  return { valid: true };
};

const verifySessionToken = async (
  request: Request,
  token: string,
  env: Env
): Promise<
  { valid: true; sidHash: string } | { valid: false; code: GeminiErrorCode; message: string }
> => {
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

  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const sessionId = normalizeText(cookies[SESSION_COOKIE_NAME]);
  if (!sessionId) {
    return {
      valid: false,
      code: 'AUTH_REQUIRED',
      message: 'AI session cookie is missing. Refresh and try again.',
    };
  }

  const sidHash = await sha256Hex(sessionId);
  if (!payload.sidHash || payload.sidHash !== sidHash) {
    return {
      valid: false,
      code: 'INVALID_SESSION_TOKEN',
      message: 'AI session token does not match this browser session.',
    };
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

  return { valid: true, sidHash };
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

  if (!getSigningSecret(env)) {
    return errorResponse(500, 'SIGNING_SECRET_MISSING', 'AI session signing secret is not configured.');
  }

  const clientToken = normalizeText(request.headers.get(CLIENT_TOKEN_HEADER));
  if (!clientToken) {
    if (!isLocalHostRequest(request)) {
      return errorResponse(401, 'CLIENT_TOKEN_REQUIRED', 'Missing AI client token. Refresh and try again.');
    }
    console.warn('[ai-session] skipping client token check for localhost development.');
  } else {
    const clientTokenVerification = await verifyClientToken(request, clientToken, env);
    if (!clientTokenVerification.valid) {
      console.warn('[ai-session] invalid client token', {
        ip: getClientIp(request),
        code: clientTokenVerification.code,
      });
      return errorResponse(401, clientTokenVerification.code, clientTokenVerification.message);
    }
  }

  const sessionRateLimit = parseInteger(
    env.AI_SESSION_RATE_LIMIT_PER_MINUTE,
    DEFAULT_SESSION_RATE_LIMIT_PER_MINUTE,
    10,
    300
  );
  const ip = getClientIp(request);
  const rateLimit = await consumeRateLimit(env, `session:${ip}`, sessionRateLimit);
  if (!rateLimit.allowed) {
    console.warn('[ai-session] rate limited', { ip, limit: sessionRateLimit });
    return appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'Too many AI session requests. Please wait and try again.'),
      rateLimit
    );
  }

  try {
    const session = await issueSessionToken(request, env);
    const ttlSeconds = Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000));
    const sessionResponse = jsonResponse({ token: session.token, expiresAt: session.expiresAt });
    const sessionHeaders = new Headers(sessionResponse.headers);
    sessionHeaders.append(
      'set-cookie',
      `${SESSION_COOKIE_NAME}=${session.sessionId}; Max-Age=${ttlSeconds}; Path=${API_PATH}; HttpOnly; Secure; SameSite=Strict`
    );

    return appendRateLimitHeaders(
      new Response(sessionResponse.body, {
        status: sessionResponse.status,
        statusText: sessionResponse.statusText,
        headers: sessionHeaders,
      }),
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

  const requestId = normalizeText(request.headers.get(REQUEST_ID_HEADER));
  if (!requestId || requestId.length > REQUEST_ID_MAX_BYTES || !/^[a-zA-Z0-9._-]+$/.test(requestId)) {
    return errorResponse(400, 'INVALID_REQUEST', 'Missing or invalid AI request id.');
  }

  if (!reserveRequestId(requestId)) {
    return errorResponse(409, 'INVALID_REQUEST', 'Duplicate AI request detected. Retry with a new request id.');
  }

  const tokenVerification = await verifySessionToken(request, token, env);
  if (!tokenVerification.valid) {
    console.warn('[ai] invalid session token', {
      ip: getClientIp(request),
      code: tokenVerification.code,
    });
    return errorResponse(401, tokenVerification.code, tokenVerification.message);
  }

  const ip = getClientIp(request);
  const ipRateLimitLimit = parseInteger(env.AI_RATE_LIMIT_PER_MINUTE, DEFAULT_RATE_LIMIT_PER_MINUTE, 5, 240);
  const sessionRateLimitLimit = parseInteger(
    env.AI_PER_SESSION_RATE_LIMIT_PER_MINUTE,
    DEFAULT_PER_SESSION_RATE_LIMIT_PER_MINUTE,
    3,
    120
  );
  const globalRateLimitLimit = parseInteger(
    env.AI_GLOBAL_RATE_LIMIT_PER_MINUTE,
    DEFAULT_GLOBAL_RATE_LIMIT_PER_MINUTE,
    30,
    3000
  );

  const ipRateLimit = await consumeRateLimit(env, `ai:ip:${ip}`, ipRateLimitLimit);
  if (!ipRateLimit.allowed) {
    console.warn('[ai] rate limited', { ip, scope: 'ip', limit: ipRateLimitLimit });
    return appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'AI rate limit reached. Please wait and try again.'),
      ipRateLimit
    );
  }

  const sessionRateLimit = await consumeRateLimit(
    env,
    `ai:session:${tokenVerification.sidHash}`,
    sessionRateLimitLimit
  );
  if (!sessionRateLimit.allowed) {
    console.warn('[ai] rate limited', {
      ip,
      scope: 'session',
      limit: sessionRateLimitLimit,
      sidHash: tokenVerification.sidHash,
    });
    return appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'AI session limit reached. Please wait and try again.'),
      sessionRateLimit
    );
  }

  const globalRateLimit = await consumeRateLimit(env, 'ai:global', globalRateLimitLimit);
  if (!globalRateLimit.allowed) {
    console.warn('[ai] rate limited', { ip, scope: 'global', limit: globalRateLimitLimit });
    return appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'AI service is busy. Please retry shortly.'),
      globalRateLimit
    );
  }

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') {
      return appendRateLimitHeaders(
        errorResponse(413, 'REQUEST_TOO_LARGE', 'Request payload is too large.'),
        globalRateLimit
      );
    }
    return appendRateLimitHeaders(
      errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.'),
      globalRateLimit
    );
  }

  const payload = validateRequest(body);
  if (!payload) {
    return appendRateLimitHeaders(
      errorResponse(400, 'INVALID_REQUEST', 'Invalid AI request payload.'),
      globalRateLimit
    );
  }

  const model = normalizeText(env.GEMINI_MODEL) || DEFAULT_MODEL;
  const apiKey = normalizeText(env.GEMINI_API_KEY);
  if (!apiKey) {
    return appendRateLimitHeaders(
      errorResponse(500, 'SERVER_KEY_MISSING', 'AI service is not configured. Missing GEMINI_API_KEY on the server.'),
      globalRateLimit
    );
  }

  const prompt = buildPrompt(payload);

  try {
    const text = await callGemini(prompt, apiKey, model);
    return appendRateLimitHeaders(jsonResponse({ text }), globalRateLimit);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('UPSTREAM_RATE_LIMIT:')) {
      return appendRateLimitHeaders(
        errorResponse(429, 'UPSTREAM_RATE_LIMIT', message.replace('UPSTREAM_RATE_LIMIT:', '').trim()),
        globalRateLimit
      );
    }
    if (message.startsWith('UPSTREAM_UNAVAILABLE:')) {
      return appendRateLimitHeaders(
        errorResponse(503, 'UPSTREAM_UNAVAILABLE', message.replace('UPSTREAM_UNAVAILABLE:', '').trim()),
        globalRateLimit
      );
    }
    if (message.startsWith('UPSTREAM_ERROR:')) {
      return appendRateLimitHeaders(
        errorResponse(502, 'UPSTREAM_ERROR', message.replace('UPSTREAM_ERROR:', '').trim()),
        globalRateLimit
      );
    }
    if (message === 'UPSTREAM_TIMEOUT') {
      return appendRateLimitHeaders(
        errorResponse(504, 'UPSTREAM_TIMEOUT', 'AI request timed out. Please try again.'),
        globalRateLimit
      );
    }
    if (message === 'EMPTY_RESPONSE') {
      return appendRateLimitHeaders(
        errorResponse(502, 'EMPTY_RESPONSE', 'AI returned an empty response.'),
        globalRateLimit
      );
    }

    return appendRateLimitHeaders(
      errorResponse(500, 'UNKNOWN_ERROR', 'Unexpected AI proxy error.'),
      globalRateLimit
    );
  }
};

const generateCspNonce = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return base64UrlEncode(bytes);
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const upsertMetaTag = (html: string, name: string, content: string): string => {
  const metaTag = `<meta name="${name}" content="${content}">`;
  const pattern = new RegExp(`<meta\\s+name=["']${escapeRegExp(name)}["'][^>]*>`, 'i');
  if (pattern.test(html)) {
    return html.replace(pattern, metaTag);
  }

  return html.replace('</head>', `  ${metaTag}\n</head>`);
};

const withSecurityHeaders = async (request: Request, env: Env, response: Response): Promise<Response> => {
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
    const nonce = generateCspNonce();
    headers.set(
      'content-security-policy',
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        `style-src 'self' 'nonce-${nonce}'`,
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
    );

    let html = await response.text();
    html = upsertMetaTag(html, 'csp-nonce', nonce);

    try {
      const clientToken = await issueClientToken(request, env);
      html = upsertMetaTag(html, CLIENT_TOKEN_META_NAME, clientToken.token);
      headers.append('set-cookie', clientToken.cookie);
    } catch (error) {
      if (error instanceof Error && error.message === 'SIGNING_SECRET_MISSING') {
        console.warn('[ai-client] signing secret missing while rendering html.');
      }
    }

    const withNonce = html
      .replace(/<style>/g, `<style nonce="${nonce}">`)
      .replace(
        /<script(?![^>]*nonce=)([^>]*)type="application\/ld\+json"/g,
        `<script nonce="${nonce}"$1type="application/ld+json"`
      );

    return new Response(withNonce, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const finalizeResponse = async (request: Request, env: Env, response: Response): Promise<Response> => {
  const corsResponse = withCorsHeaders(request, env, response);
  return withSecurityHeaders(request, env, corsResponse);
};

export class RateLimiter {
  private state: DurableObjectStateLike;

  constructor(state: DurableObjectStateLike) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Rate limiter accepts POST only.');
    }

    let payload: RateLimitRequest | null = null;
    try {
      payload = (await request.json()) as RateLimitRequest;
    } catch {
      return errorResponse(400, 'INVALID_JSON', 'Rate limiter payload must be valid JSON.');
    }

    const limit = Number(payload?.limit || 0);
    const now = Number(payload?.now || Date.now());
    const windowMs = Number(payload?.windowMs || RATE_LIMIT_WINDOW_MS);
    if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(now) || !Number.isFinite(windowMs) || windowMs < 1) {
      return errorResponse(400, 'INVALID_REQUEST', 'Invalid rate limiter request payload.');
    }

    const storageKey = 'bucket';
    const stored = await this.state.storage.get<RateLimitBucket>(storageKey);
    const inWindow = stored && stored.resetAt > now;
    const bucket: RateLimitBucket = inWindow
      ? stored
      : {
        count: 0,
        resetAt: now + windowMs,
      };

    bucket.count += 1;
    await this.state.storage.put(storageKey, bucket);
    await this.state.storage.setAlarm(bucket.resetAt + windowMs);

    const result: RateLimitResult = {
      allowed: bucket.count <= limit,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: bucket.resetAt,
    };

    return jsonResponse(result as JsonObject, 200);
  }

  async alarm(): Promise<void> {
    await this.state.storage.delete('bucket');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if ((url.pathname === SESSION_PATH || url.pathname === API_PATH) && request.method === 'OPTIONS') {
      const preflight = isAllowedOriginRequest(request, env)
        ? new Response(null, { status: 204 })
        : errorResponse(403, 'FORBIDDEN_ORIGIN', 'Cross-origin requests are not allowed.');
      return finalizeResponse(request, env, preflight);
    }

    let response: Response;
    if (url.pathname === SESSION_PATH) {
      response = await handleSessionRequest(request, env);
      return finalizeResponse(request, env, response);
    }

    if (url.pathname === API_PATH) {
      response = await handleGeminiRequest(request, env);
      return finalizeResponse(request, env, response);
    }

    if (url.pathname.startsWith('/api/')) {
      response = errorResponse(404, 'NOT_FOUND', 'API route not found.');
      return finalizeResponse(request, env, response);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || !isHtmlNavigationRequest(request)) {
      return finalizeResponse(request, env, assetResponse);
    }

    const spaUrl = new URL(request.url);
    spaUrl.pathname = '/index.html';
    const fallback = await env.ASSETS.fetch(new Request(spaUrl.toString(), request));
    return finalizeResponse(request, env, fallback);
  },
};

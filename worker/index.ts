import puppeteer from '@cloudflare/puppeteer';
import {
  type AiErrorCode,
  type AiRequest,
  MAX_LATEX_SOURCE_CHARS,
} from '../src/shared/aiContract';
import { handleAgentRequest } from './agent';
import { OrcidError, fetchOrcidPublications, normalizeOrcid } from './orcid';

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
  /** Workers AI binding (`"ai": { "binding": "AI" }` in wrangler.jsonc). */
  AI?: {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
  };
  /** Cloudflare Browser Rendering binding, used to print resumes to vector PDF. */
  BROWSER?: Parameters<typeof puppeteer.launch>[0];
  AI_MODEL?: string;
  /** Sent as `reasoning_effort` when set; leave empty for models that don't accept it. */
  AI_REASONING_EFFORT?: string;
  AI_SIGNING_SECRET?: string;
  ALLOWED_ORIGINS?: string;
  AI_RATE_LIMIT_PER_MINUTE?: string;
  AI_PER_SESSION_RATE_LIMIT_PER_MINUTE?: string;
  AI_GLOBAL_RATE_LIMIT_PER_MINUTE?: string;
  AI_SESSION_RATE_LIMIT_PER_MINUTE?: string;
  AI_SESSION_TTL_SECONDS?: string;
  AI_CLIENT_TOKEN_TTL_SECONDS?: string;
  /** Origin the agent renderer's headless browser loads `/render/` from (defaults to the request origin). */
  RENDER_ORIGIN?: string;
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

const API_PATH = '/api/ai';
const PDF_PATH = '/api/pdf';
const ORCID_PATH = '/api/orcid';
const ORCID_RATE_LIMIT = 20;
const MAX_PDF_BODY_BYTES = 6 * 1024 * 1024;
const PDF_TIMEOUT_MS = 45000;
const SESSION_PATH = '/api/ai/session';
const RATE_LIMIT_DO_PATH = 'https://rate-limiter/consume';
const MAX_BODY_BYTES = 64 * 1024;
/** /api/ai bodies: a LaTeX source of MAX_LATEX_SOURCE_CHARS characters, CJK included (3 bytes each). */
const MAX_AI_BODY_BYTES = 160 * 1024;
const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_MODEL = '@cf/zai-org/glm-5.3-flash';
const MAX_OUTPUT_TOKENS = 600;
/** A whole resume as JSON, plus reasoning; LaTeX parsing gets a longer budget and deadline. */
const PARSE_OUTPUT_TOKENS = 8000;
const PARSE_TIMEOUT_MS = 150000;
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

const errorResponse = (status: number, code: AiErrorCode, message: string): Response =>
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
  return normalizeText(env.AI_SIGNING_SECRET);
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
    cookie: `${CLIENT_TOKEN_COOKIE_NAME}=${clientId}; Max-Age=${ttlSeconds}; Path=/api; HttpOnly; Secure; SameSite=Strict`,
  };
};

const verifyClientToken = async (
  request: Request,
  token: string,
  env: Env
): Promise<{ valid: true } | { valid: false; code: AiErrorCode; message: string }> => {
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
  { valid: true; sidHash: string } | { valid: false; code: AiErrorCode; message: string }
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

const withoutConditionalHeaders = (request: Request): Request => {
  const headers = new Headers(request.headers);
  headers.delete('if-none-match');
  headers.delete('if-modified-since');
  return new Request(request, { headers });
};

const isHtmlNavigationRequest = (request: Request): boolean => {
  if (request.method !== 'GET') return false;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
};

const SYSTEM_PROMPT = [
  'You are an expert resume writer and career coach.',
  'Write in the same language as the user-provided text.',
  'Never invent employers, numbers, metrics, or placeholders such as [X] or X%; only use facts that are given.',
  'Return only the final text: no preamble, no quotes, no markdown, no bullet symbols.',
].join(' ');

const PARSE_LATEX_PROMPT = [
  'You convert a LaTeX resume or academic CV (moderncv, Awesome-CV, AltaCV, Jake\'s Resume, res, custom macros) into JSON.',
  'Return only one JSON object, no markdown fences or commentary, with these keys (omit empty ones):',
  'fullName, title (headline or target role), email, phone, location, website, linkedin (URL),',
  'links: [{label, url}] for GitHub, Google Scholar, ORCID, portfolio and other profiles,',
  'summary (plain text; research interests for academic CVs),',
  'experience: [{company, role, location, startDate, endDate, isCurrent, description}],',
  'education: [{school, degree, startDate, endDate}] (put thesis titles, GPA and honours in degree, e.g. "PhD in Physics; thesis: ..."),',
  'projects: [{name, link, description}],',
  'publications: [{authors, title, venue, year, link}] (authors as written; link is a DOI or URL),',
  'awards: [{title, issuer, year, detail}] for grants, fellowships, scholarships and prizes (detail: amount or role),',
  'talks: [{title, event, location, year}] for invited talks, seminars, conference presentations and posters,',
  'teaching: [{course, role, institution, year}] for courses taught and TA roles,',
  'skills: ["Category: item, item", ...] (keep categories when the CV groups skills; put languages and certifications here too).',
  'Rules: dates are "YYYY-MM" (or "YYYY" when only the year is given); a current role has endDate "" and isCurrent true.',
  'description is a single string with one bullet per line, each starting with "- ", taken from \\item lines; keep the wording.',
  'Activities, leadership, service, committees and volunteering go in experience (organisation as company); put a LinkedIn URL in linkedin, not links.',
  'Turn LaTeX into plain Unicode text: expand accents and escapes (\\& to &, -- to an en dash), drop formatting commands, icons and spacing.',
  'Keep the CV\'s language and every fact; never invent, summarise away or reorder entries. Ignore the preamble except for name and contact macros.',
].join('\n');

const buildUserPrompt = (payload: AiRequest): string => {
  if (payload.action === 'parse_latex') return `LaTeX source:\n\n${payload.source}`;
  if (payload.action === 'improve') {
    return [
      `Rewrite this ${payload.context || 'resume'} text to be concise, specific, and results-oriented.`,
      'Use strong action verbs and active voice, keep the original meaning, and keep a similar length.',
      'Preserve line breaks if the original has multiple lines.',
      '',
      payload.text,
    ].join('\n');
  }

  const skills = payload.skills.filter(Boolean).join(', ');
  return [
    `Write a professional resume summary of 2-3 sentences for a ${payload.role || 'professional'}.`,
    skills ? `Weave in the most relevant of these skills: ${skills}.` : '',
    'Make it confident and outcome-oriented, written without first-person pronouns.',
  ]
    .filter(Boolean)
    .join('\n');
};

/** Strips wrappers models sometimes add despite instructions (quotes, bullets, think blocks). */
const cleanModelText = (text: string): string =>
  text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
    .replace(/^["“”']+|["“”']+$/g, '')
    .replace(/^\s*(?:[-*•]\s+)/gm, '')
    .trim();

/** Workers AI returns OpenAI-style `choices` for newer models and `{ response }` for older ones. */
const parseAiText = (data: unknown): string => {
  if (!data || typeof data !== 'object') return '';
  const value = data as JsonObject;
  if (typeof value.response === 'string') return cleanModelText(value.response);

  const choices = Array.isArray(value.choices) ? value.choices : [];
  const message = (choices[0] as JsonObject | undefined)?.message as JsonObject | undefined;
  return typeof message?.content === 'string' ? cleanModelText(message.content) : '';
};

/** The JSON object in a model reply, without think blocks or code fences; '' when there is none. */
const parseAiJson = (data: unknown): string => {
  if (!data || typeof data !== 'object') return '';
  const value = data as JsonObject;
  const message = ((Array.isArray(value.choices) ? value.choices[0] : undefined) as JsonObject | undefined)?.message as JsonObject | undefined;
  const raw = typeof value.response === 'string' ? value.response : typeof message?.content === 'string' ? message.content : '';
  const text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return '';
  try {
    return JSON.stringify(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return '';
  }
};

const validateRequest = (body: unknown): AiRequest | null => {
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

  if (value.action === 'parse_latex') {
    const source = normalizeText(value.source);
    if (!source || source.length > MAX_LATEX_SOURCE_CHARS) return null;
    return { action: 'parse_latex', source };
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

const parseJsonBody = async (request: Request, maxBytes = MAX_BODY_BYTES): Promise<unknown> => {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error('REQUEST_TOO_LARGE');
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new Error('REQUEST_TOO_LARGE');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('INVALID_JSON');
  }
};

const callAi = async (env: Env, payload: AiRequest): Promise<string> => {
  if (!env.AI) throw new Error('AI_NOT_CONFIGURED');

  const model = normalizeText(env.AI_MODEL) || DEFAULT_MODEL;
  const reasoningEffort = normalizeText(env.AI_REASONING_EFFORT);
  const parsing = payload.action === 'parse_latex';
  const input: Record<string, unknown> = {
    messages: [
      { role: 'system', content: parsing ? PARSE_LATEX_PROMPT : SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(payload) },
    ],
    max_tokens: parsing ? PARSE_OUTPUT_TOKENS : MAX_OUTPUT_TOKENS,
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
  };

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('UPSTREAM_TIMEOUT')), parsing ? PARSE_TIMEOUT_MS : REQUEST_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([env.AI.run(model, input), timeout]);
    // JSON replies keep their quotes and "- " lines; only think blocks are removed.
    const text = parsing ? parseAiJson(result) : parseAiText(result);
    if (!text) throw new Error('EMPTY_RESPONSE');
    // Keep the user's bullet format: templates render "- " lines as lists.
    const inputWasBullets = payload.action === 'improve' && /^\s*[-*•]\s+/m.test(payload.text);
    return inputWasBullets
      ? text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => `- ${line}`).join('\n')
      : text;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'UPSTREAM_TIMEOUT' || message === 'EMPTY_RESPONSE') throw error;
    console.error('[ai] Workers AI call failed', { model, message });
    // Workers AI reports capacity/rate limits as errors mentioning 429 or "capacity".
    if (/\b429\b|rate limit|capacity/i.test(message)) {
      throw new Error('UPSTREAM_RATE_LIMIT:AI is busy right now. Please try again in a moment.');
    }
    throw new Error('UPSTREAM_UNAVAILABLE:AI service is temporarily unavailable. Please try again.');
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Renders a resume snapshot to a vector PDF with Cloudflare Browser Rendering.
 * The client sends the paper's HTML and the CSS it needs (fonts inlined as data: URLs). The
 * document is sandboxed: a CSP meta tag blocks scripts and every network request, so the
 * browser can only lay out the given markup. Nothing is stored.
 */
const PDF_SANDBOX_CSP = "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:";

const buildPdfDocument = (html: string, css: string): string =>
  `<!doctype html><html><head><meta charset="utf-8">` +
  `<meta http-equiv="Content-Security-Policy" content="${PDF_SANDBOX_CSP}">` +
  // `</style` can't appear inside the CSS we were given; neutralize it if it does.
  `<style>${css.replace(/<\/style/gi, '<\\/style')}</style></head>` +
  `<body style="margin:0">${html.replace(/<script[\s\S]*?<\/script>/gi, '')}</body></html>`;

/**
 * Runs in the PDF page, in the engine that prints, and returns the page count. Same method as
 * src/utils/printLayout.ts: an off-screen copy of the paper laid out in page-sized columns (Chromium
 * fragments columns like printed pages; full-bleed roots and `.page-frame`s repeat their padding on every page).
 * - The editor measured `expected` pages in the user's browser. Safari and Firefox lay text out slightly
 *   differently, so if it comes out longer here, the text is made up to 5% smaller to keep the promised count.
 * - Full-bleed papers get a min-height that ends exactly at the bottom of the last page, so their
 *   background reaches the edge.
 * A string, so the bundler can't inject helpers that don't exist in the page.
 */
const PRINT_FIT_SCRIPT = `(expected) => {
  const paper = document.querySelector('.resume-preview-container');
  if (!paper) return 0;
  const fullBleed = paper.hasAttribute('data-full-bleed');
  const MM = 96 / 25.4, W = (fullBleed ? 210 : 180) * MM, H = (fullBleed ? 297 : 267) * MM, GAP = 40;
  if (fullBleed) paper.style.setProperty('min-height', '0px', 'important');
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-100000px;top:0;visibility:hidden;background:#fff;width:' + W + 'px';
  const copy = paper.cloneNode(true);
  copy.querySelectorAll('style').forEach((node) => node.remove());
  copy.style.removeProperty('min-height');
  copy.style.cssText += ';min-height:0;padding:0;overflow:visible;width:100%;box-sizing:border-box';
  host.appendChild(copy);
  document.body.appendChild(host);
  const count = () => Math.max(1, Math.round((host.scrollWidth + GAP) / (W + GAP)));
  const measure = () => {
    host.style.height = host.style.columnWidth = host.style.columnGap = host.style.columnFill = '';
    const natural = copy.offsetHeight;
    if (natural <= H + 2) return { pages: 1, natural };
    host.style.height = H + 'px';
    host.style.columnWidth = W + 'px';
    host.style.columnGap = GAP + 'px';
    host.style.columnFill = 'auto';
    return { pages: count(), natural };
  };
  try {
    let layout = measure();
    const zoomBox = copy.querySelector('[data-resume-zoom]');
    const base = zoomBox ? parseFloat(zoomBox.style.zoom) || 1 : 1;
    if (zoomBox && expected > 0 && layout.pages > expected) {
      for (let step = 1; step <= 5 && layout.pages > expected; step += 1) {
        zoomBox.style.zoom = String(Math.round(base * 100 - step) / 100);
        layout = measure();
      }
      if (layout.pages <= expected) paper.querySelector('[data-resume-zoom]').style.zoom = zoomBox.style.zoom;
      else {
        zoomBox.style.zoom = base === 1 ? '' : String(base);
        layout = measure();
      }
    }
    if (!fullBleed) return layout.pages;
    if (layout.pages === 1) {
      paper.style.setProperty('min-height', (H - 1) + 'px', 'important');
      return 1;
    }
    const frames = [copy, ...copy.querySelectorAll('[data-resume-zoom] > *, .page-frame')];
    const lastBottom = () => {
      const top = host.getBoundingClientRect().top;
      return Math.max(...frames.map((el) => { const r = el.getClientRects(); return r.length ? r[r.length - 1].bottom - top : 0; }));
    };
    let good = 0, extra = 0;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const gap = H - 1 - lastBottom();
      if (gap < 1) break;
      extra += gap;
      copy.style.minHeight = (layout.natural + extra) + 'px';
      if (count() !== layout.pages) break;
      good = extra;
    }
    paper.style.setProperty('min-height', (layout.natural + good) + 'px', 'important');
    return layout.pages;
  } finally {
    host.remove();
  }
}`;

/** Page count of a Chromium-generated PDF (its single page tree's /Count). */
const pdfPageCount = (pdf: Uint8Array): number => {
  const text = new TextDecoder('latin1').decode(pdf);
  return Math.max(0, ...Array.from(text.matchAll(/\/Count (\d+)/g), (match) => Number(match[1])));
};

const handlePdfRequest = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.');
  }
  const caller = await authorizeCaller(request, env, 'pdf', { ip: 10, session: 10, global: 120 });
  if (!caller.ok) return caller.response;
  if (!env.BROWSER) {
    return errorResponse(503, 'UPSTREAM_UNAVAILABLE', 'PDF rendering is not configured on the server.');
  }

  let body: unknown;
  try {
    body = await parseJsonBody(request, MAX_PDF_BODY_BYTES);
  } catch (error) {
    return error instanceof Error && error.message === 'REQUEST_TOO_LARGE'
      ? errorResponse(413, 'REQUEST_TOO_LARGE', 'Resume is too large to render.')
      : errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
  const { html, css } = (body ?? {}) as { html?: unknown; css?: unknown };
  if (typeof html !== 'string' || typeof css !== 'string' || !html.trim()) {
    return errorResponse(400, 'INVALID_REQUEST', 'Missing resume markup.');
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const render = (async () => {
      browser = await puppeteer.launch(env.BROWSER!);
      const page = await browser.newPage();
      await page.setContent(buildPdfDocument(html, css), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const print = () => page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
      const expected = Number(/^<div[^>]*\bdata-pages="(\d+)"/.exec(html)?.[1] ?? 0);
      const pages = Number(await page.evaluate(`(${PRINT_FIT_SCRIPT})(${expected})`));
      const pdf = await print();
      if (pdfPageCount(pdf) <= pages) return pdf;
      // Never let the last-page stretch add a page.
      await page.evaluate("document.querySelector('.resume-preview-container')?.style.setProperty('min-height', '0px', 'important')");
      return print();
    })();
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('UPSTREAM_TIMEOUT')), PDF_TIMEOUT_MS);
    });
    const pdf = await Promise.race([render, timeout]);
    return appendRateLimitHeaders(
      new Response(new Uint8Array(pdf), { headers: { 'content-type': 'application/pdf', 'cache-control': 'no-store' } }),
      caller.globalRateLimit
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[pdf] render failed', { message });
    if (message === 'UPSTREAM_TIMEOUT') return errorResponse(504, 'UPSTREAM_TIMEOUT', 'PDF rendering timed out.');
    if (/\b429\b|limit/i.test(message)) {
      return errorResponse(429, 'UPSTREAM_RATE_LIMIT', 'PDF rendering is busy. Please try again shortly.');
    }
    return errorResponse(503, 'UPSTREAM_UNAVAILABLE', 'PDF rendering is temporarily unavailable.');
  } finally {
    clearTimeout(timeoutId);
    await browser?.close().catch(() => undefined);
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
      `${SESSION_COOKIE_NAME}=${session.sessionId}; Max-Age=${ttlSeconds}; Path=/api; HttpOnly; Secure; SameSite=Strict`
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

interface CallerLimits {
  ip: number;
  session: number;
  global: number;
}

type CallerCheck = { ok: true; globalRateLimit: RateLimitResult } | { ok: false; response: Response };

/** Origin, signed session token, replay and rate-limit checks shared by /api/ai and /api/pdf. */
const authorizeCaller = async (request: Request, env: Env, scope: 'ai' | 'pdf', limits: CallerLimits): Promise<CallerCheck> => {
  if (!isAllowedOriginRequest(request, env)) {
    console.warn(`[${scope}] blocked origin`, {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      ip: getClientIp(request),
    });
    return { ok: false, response: errorResponse(403, 'FORBIDDEN_ORIGIN', 'Cross-origin requests are not allowed.') };
  }

  const token = normalizeText(request.headers.get('x-ai-session-token'));
  if (!token) {
    return { ok: false, response: errorResponse(401, 'AUTH_REQUIRED', 'Missing AI session token.') };
  }

  const requestId = normalizeText(request.headers.get(REQUEST_ID_HEADER));
  if (!requestId || requestId.length > REQUEST_ID_MAX_BYTES || !/^[a-zA-Z0-9._-]+$/.test(requestId)) {
    return { ok: false, response: errorResponse(400, 'INVALID_REQUEST', 'Missing or invalid AI request id.') };
  }

  if (!reserveRequestId(requestId)) {
    return { ok: false, response: errorResponse(409, 'INVALID_REQUEST', 'Duplicate AI request detected. Retry with a new request id.') };
  }

  const tokenVerification = await verifySessionToken(request, token, env);
  if (!tokenVerification.valid) {
    console.warn(`[${scope}] invalid session token`, {
      ip: getClientIp(request),
      code: tokenVerification.code,
    });
    return { ok: false, response: errorResponse(401, tokenVerification.code, tokenVerification.message) };
  }

  const ip = getClientIp(request);
  const ipRateLimitLimit = limits.ip;
  const sessionRateLimitLimit = limits.session;
  const globalRateLimitLimit = limits.global;

  const ipRateLimit = await consumeRateLimit(env, `${scope}:ip:${ip}`, ipRateLimitLimit);
  if (!ipRateLimit.allowed) {
    console.warn(`[${scope}] rate limited`, { ip, scope: 'ip', limit: ipRateLimitLimit });
    return { ok: false, response: appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'Rate limit reached. Please wait a minute and try again.'),
      ipRateLimit
    ) };
  }

  const sessionRateLimit = await consumeRateLimit(
    env,
    `${scope}:session:${tokenVerification.sidHash}`,
    sessionRateLimitLimit
  );
  if (!sessionRateLimit.allowed) {
    console.warn(`[${scope}] rate limited`, {
      ip,
      scope: 'session',
      limit: sessionRateLimitLimit,
      sidHash: tokenVerification.sidHash,
    });
    return { ok: false, response: appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'Too many requests from this session. Please wait and try again.'),
      sessionRateLimit
    ) };
  }

  const globalRateLimit = await consumeRateLimit(env, `${scope}:global`, globalRateLimitLimit);
  if (!globalRateLimit.allowed) {
    console.warn(`[${scope}] rate limited`, { ip, scope: 'global', limit: globalRateLimitLimit });
    return { ok: false, response: appendRateLimitHeaders(
      errorResponse(429, 'RATE_LIMITED', 'The service is busy. Please retry shortly.'),
      globalRateLimit
    ) };
  }

  return { ok: true, globalRateLimit };
};

const handleAiRequest = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.');
  }

  const caller = await authorizeCaller(request, env, 'ai', {
    ip: parseInteger(env.AI_RATE_LIMIT_PER_MINUTE, DEFAULT_RATE_LIMIT_PER_MINUTE, 5, 240),
    session: parseInteger(env.AI_PER_SESSION_RATE_LIMIT_PER_MINUTE, DEFAULT_PER_SESSION_RATE_LIMIT_PER_MINUTE, 3, 120),
    global: parseInteger(env.AI_GLOBAL_RATE_LIMIT_PER_MINUTE, DEFAULT_GLOBAL_RATE_LIMIT_PER_MINUTE, 30, 3000),
  });
  if (!caller.ok) return caller.response;
  const { globalRateLimit } = caller;

  let body: unknown;
  try {
    body = await parseJsonBody(request, MAX_AI_BODY_BYTES);
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

  try {
    const text = await callAi(env, payload);
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
    if (message === 'AI_NOT_CONFIGURED') {
      return appendRateLimitHeaders(
        errorResponse(500, 'AI_NOT_CONFIGURED', 'AI service is not configured on the server.'),
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
  if (contentType.includes('text/html') && response.status !== 304) {
    // Each HTML response carries a fresh CSP nonce, client token and matching cookie, so it must
    // never be revalidated from cache: a 304 would pair the cached page with a new cookie/nonce.
    headers.delete('etag');
    headers.delete('last-modified');
    headers.set('cache-control', 'private, no-cache');
    const nonce = generateCspNonce();
    headers.set(
      'content-security-policy',
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        `style-src 'self' 'nonce-${nonce}'`,
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://www.overleaf.com",
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

    return jsonResponse({ ...result }, 200);
  }

  async alarm(): Promise<void> {
    await this.state.storage.delete('bucket');
  }
}

/** GET /api/orcid?id=0000-0002-1825-0097 → { orcid, publications } from the public ORCID record. */
const handleOrcidRequest = async (request: Request, env: Env, url: URL): Promise<Response> => {
  if (request.method !== 'GET') return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Use GET.');
  const orcid = normalizeOrcid(url.searchParams.get('id') ?? '');
  if (!orcid) return errorResponse(400, 'INVALID_REQUEST', 'Enter an ORCID iD such as 0000-0002-1825-0097.');
  const limit = await consumeRateLimit(env, `orcid:ip:${getClientIp(request)}`, ORCID_RATE_LIMIT);
  if (!limit.allowed) return appendRateLimitHeaders(errorResponse(429, 'RATE_LIMITED', 'Rate limit reached. Please wait a minute and try again.'), limit);
  try {
    const publications = await fetchOrcidPublications(orcid);
    return jsonResponse({ orcid, publications: publications.map(({ id: _id, ...rest }) => rest) });
  } catch (error) {
    if (error instanceof OrcidError) return errorResponse(error.status, error.code, error.message);
    console.error('[orcid] failed', error);
    return errorResponse(502, 'UPSTREAM_UNAVAILABLE', 'Could not reach ORCID. Try again later.');
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Agent mode: remote MCP server and HTTP API, open to any origin (no cookies or credentials).
    const agentResponse = await handleAgentRequest(request, env, {
      clientIp: getClientIp(request),
      rateLimit: async (key, limit) => (await consumeRateLimit(env, key, limit)).allowed,
    });
    if (agentResponse) {
      const secured = await withSecurityHeaders(request, env, agentResponse);
      secured.headers.set('cross-origin-resource-policy', 'cross-origin');
      return secured;
    }

    if ((url.pathname === SESSION_PATH || url.pathname === API_PATH || url.pathname === PDF_PATH) && request.method === 'OPTIONS') {
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
      response = await handleAiRequest(request, env);
      return finalizeResponse(request, env, response);
    }

    if (url.pathname === PDF_PATH) {
      response = await handlePdfRequest(request, env);
      return finalizeResponse(request, env, response);
    }

    if (url.pathname === ORCID_PATH) {
      response = await handleOrcidRequest(request, env, url);
      return finalizeResponse(request, env, response);
    }

    if (url.pathname.startsWith('/api/')) {
      response = errorResponse(404, 'NOT_FOUND', 'API route not found.');
      return finalizeResponse(request, env, response);
    }

    // HTML is personalised per response (nonce + client token), so ask for the full page, never a 304.
    const assetRequest = isHtmlNavigationRequest(request) ? withoutConditionalHeaders(request) : request;
    const assetResponse = await env.ASSETS.fetch(assetRequest);
    const isNotFoundShell = url.pathname === '/404' || url.pathname === '/404.html';
    if (!isNotFoundShell && (assetResponse.status !== 404 || !isHtmlNavigationRequest(request))) {
      return finalizeResponse(request, env, assetResponse);
    }

    // Every real page is prerendered, so anything else is a 404. Serve the SPA shell (which renders
    // the "not found" view) with a real 404 status so search engines don't index soft 404s.
    const spaUrl = new URL(request.url);
    spaUrl.pathname = '/404';
    spaUrl.search = '';
    const shell = await env.ASSETS.fetch(new Request(spaUrl.toString(), assetRequest));
    const notFound = new Response(shell.body, { status: 404, headers: shell.headers });
    notFound.headers.set('x-robots-tag', 'noindex');
    return finalizeResponse(request, env, notFound);
  },
};

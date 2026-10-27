import {
  type AiErrorCode,
  type AiErrorEnvelope,
  type AiRequest,
  isAiApiResponse,
  isAiErrorCode,
  isAiSessionResponse,
} from '../shared/aiContract';

interface AiSessionCache {
  token: string;
  expiresAt: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 30000;
const SESSION_REFRESH_BUFFER_MS = 5000;
const FALLBACK_PROXY_PATH = '/api/ai';
const CLIENT_TOKEN_META_NAME = 'ai-client-token';

let cachedSession: AiSessionCache | null = null;

export class AiError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode = 'UNKNOWN_ERROR',
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AiError';
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getProxyUrl = (): string => {
  const configured = import.meta.env.VITE_AI_PROXY_URL?.trim();
  return configured || FALLBACK_PROXY_PATH;
};

const getSessionUrl = (): string => {
  const proxyUrl = getProxyUrl();
  if (proxyUrl.endsWith('/session')) return proxyUrl;
  return `${proxyUrl}/session`;
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new AiError('Request timed out. Please try again.', 'UPSTREAM_TIMEOUT', true)
          ),
        ms
      )
    ),
  ]);
};

const shouldRetry = (status: number, code?: AiErrorCode): boolean => {
  if (status === 429) return true;
  if (status >= 500) return true;
  return code === 'UPSTREAM_TIMEOUT' || code === 'NETWORK_ERROR' || code === 'SESSION_EXPIRED';
};

const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await withTimeout(operation(), TIMEOUT_MS);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const retryable = error instanceof AiError ? error.isRetryable : true;
      const isLastAttempt = attempt === retries;

      if (!retryable || isLastAttempt) break;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError || new AiError('Unknown AI error.');
};

const parseError = async (response: Response): Promise<AiError> => {
  let message = 'AI request failed.';
  let code: AiErrorCode = 'UNKNOWN_ERROR';

  try {
    const data = (await response.json()) as AiErrorEnvelope;
    if (typeof data.error === 'string' && data.error.trim()) {
      message = data.error.trim();
    }
    if (isAiErrorCode(data.code)) {
      code = data.code;
    }
  } catch {
    // Not our JSON envelope (e.g. a proxy or static-host error page): don't surface raw status text.
    message =
      response.status === 429
        ? 'Too many AI requests. Please wait a moment and try again.'
        : 'The AI service is unavailable right now. Please try again in a moment.';
  }

  return new AiError(message, code, shouldRetry(response.status, code));
};

const readSessionCache = (): AiSessionCache | null => {
  if (!cachedSession) return null;

  const now = Date.now();
  if (cachedSession.expiresAt - SESSION_REFRESH_BUFFER_MS <= now) {
    cachedSession = null;
    return null;
  }

  return cachedSession;
};

const setSessionCache = (session: AiSessionCache): void => {
  cachedSession = session;
};

const clearSessionCache = (): void => {
  cachedSession = null;
};

const createRequestId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const getClientToken = (): string => {
  if (typeof document === 'undefined') return '';
  const node = document.querySelector(`meta[name="${CLIENT_TOKEN_META_NAME}"]`);
  if (!node) return '';
  return (node.getAttribute('content') || '').trim();
};

const isLocalDevelopment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
};

const fetchSessionToken = async (forceRefresh = false): Promise<string> => {
  if (!forceRefresh) {
    const existing = readSessionCache();
    if (existing) return existing.token;
  }

  const clientToken = getClientToken();
  if (!clientToken && !isLocalDevelopment()) {
    throw new AiError(
      'AI client verification is missing. Refresh the page and try again.',
      'CLIENT_TOKEN_REQUIRED',
      false
    );
  }

  const endpoint = getSessionUrl();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(clientToken ? { 'x-ai-client-token': clientToken } : {}),
      },
    });
  } catch {
    throw new AiError(
      'Unable to reach AI session service. Please check your connection and try again.',
      'NETWORK_ERROR',
      true
    );
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  const rawData = (await response.json().catch(() => ({}))) as unknown;
  if (!isAiSessionResponse(rawData)) {
    throw new AiError('AI session response schema is invalid.', 'INVALID_RESPONSE', false);
  }

  const data = rawData;
  const token = typeof data.token === 'string' ? data.token.trim() : '';
  const expiresAt = Number(data.expiresAt || 0);

  if (!token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new AiError('AI session response is invalid.', 'INVALID_RESPONSE', false);
  }

  setSessionCache({ token, expiresAt });
  return token;
};

const postAiRequest = async (
  payload: AiRequest,
  sessionToken: string
): Promise<Response> => {
  const endpoint = getProxyUrl();

  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ai-session-token': sessionToken,
        'x-ai-request-id': createRequestId(),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AiError(
      'Unable to reach AI service. Please check your connection and try again.',
      'NETWORK_ERROR',
      true
    );
  }
};

const callAiProxy = async (payload: AiRequest): Promise<string> => {
  let sessionToken = await fetchSessionToken();
  let response = await postAiRequest(payload, sessionToken);

  if (response.status === 401) {
    const authError = await parseError(response);
    if (authError.code === 'SESSION_EXPIRED' || authError.code === 'INVALID_SESSION_TOKEN' || authError.code === 'AUTH_REQUIRED') {
      clearSessionCache();
      sessionToken = await fetchSessionToken(true);
      response = await postAiRequest(payload, sessionToken);
    } else {
      throw authError;
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  const rawData = (await response.json().catch(() => ({}))) as unknown;
  if (!isAiApiResponse(rawData)) {
    throw new AiError('AI response schema is invalid.', 'INVALID_RESPONSE', false);
  }

  const data = rawData;
  const text = typeof data.text === 'string' ? data.text.trim() : '';
  if (!text) {
    throw new AiError('AI returned an empty response.', 'INVALID_RESPONSE', false);
  }

  return text;
};

/**
 * POSTs to another Worker endpoint behind the same signed AI session (used by /api/pdf).
 * Retries once with a fresh session when the token has expired. Throws AiError on failure.
 */
export const postWithAiSession = async (path: string, body: string): Promise<Response> => {
  // VITE_AI_PROXY_URL points at …/api/ai; sibling endpoints share its origin and prefix.
  const endpoint = getProxyUrl().replace(/\/ai\/?$/, path.replace(/^\/api/, ''));
  const send = async (token: string) => {
    try {
      return await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ai-session-token': token, 'x-ai-request-id': createRequestId() },
        body,
      });
    } catch {
      throw new AiError('Unable to reach the server. Please check your connection.', 'NETWORK_ERROR', true);
    }
  };
  let response = await send(await fetchSessionToken());
  if (response.status === 401) {
    clearSessionCache();
    response = await send(await fetchSessionToken(true));
  }
  if (!response.ok) throw await parseError(response);
  return response;
};

export const improveText = async (
  text: string,
  context: string = 'resume'
): Promise<string> => {
  if (!text.trim()) return '';

  return executeWithRetry(async () => {
    return callAiProxy({
      action: 'improve',
      text,
      context,
    });
  });
};

export const generateSummary = async (
  role: string,
  skills: string[]
): Promise<string> => {
  return executeWithRetry(async () => {
    return callAiProxy({
      action: 'summary',
      role: role?.trim() || 'Professional',
      skills,
    });
  });
};

export const __resetAiSessionCacheForTests = (): void => {
  clearSessionCache();
};

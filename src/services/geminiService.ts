import {
  type GeminiErrorCode,
  type GeminiErrorEnvelope,
  type GeminiRequest,
  isGeminiApiResponse,
  isGeminiErrorCode,
  isGeminiSessionResponse,
} from '../shared/geminiContract';

interface GeminiSessionCache {
  token: string;
  expiresAt: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 30000;
const SESSION_REFRESH_BUFFER_MS = 5000;
const FALLBACK_PROXY_PATH = '/api/gemini';

let cachedSession: GeminiSessionCache | null = null;

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: GeminiErrorCode = 'UNKNOWN_ERROR',
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiError';
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
            new GeminiError('Request timed out. Please try again.', 'UPSTREAM_TIMEOUT', true)
          ),
        ms
      )
    ),
  ]);
};

const shouldRetry = (status: number, code?: GeminiErrorCode): boolean => {
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
      const retryable = error instanceof GeminiError ? error.isRetryable : true;
      const isLastAttempt = attempt === retries;

      if (!retryable || isLastAttempt) break;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError || new GeminiError('Unknown AI error.');
};

const parseError = async (response: Response): Promise<GeminiError> => {
  let message = 'AI request failed.';
  let code: GeminiErrorCode = 'UPSTREAM_ERROR';

  try {
    const data = (await response.json()) as GeminiErrorEnvelope;
    if (typeof data.error === 'string' && data.error.trim()) {
      message = data.error.trim();
    }
    if (isGeminiErrorCode(data.code)) {
      code = data.code;
    }
  } catch {
    message = response.statusText || message;
  }

  return new GeminiError(message, code, shouldRetry(response.status, code));
};

const readSessionCache = (): GeminiSessionCache | null => {
  if (!cachedSession) return null;

  const now = Date.now();
  if (cachedSession.expiresAt - SESSION_REFRESH_BUFFER_MS <= now) {
    cachedSession = null;
    return null;
  }

  return cachedSession;
};

const setSessionCache = (session: GeminiSessionCache): void => {
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

const fetchSessionToken = async (forceRefresh = false): Promise<string> => {
  if (!forceRefresh) {
    const existing = readSessionCache();
    if (existing) return existing.token;
  }

  const endpoint = getSessionUrl();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch {
    throw new GeminiError(
      'Unable to reach AI session service. Please check your connection and try again.',
      'NETWORK_ERROR',
      true
    );
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  const rawData = (await response.json().catch(() => ({}))) as unknown;
  if (!isGeminiSessionResponse(rawData)) {
    throw new GeminiError('AI session response schema is invalid.', 'INVALID_RESPONSE', false);
  }

  const data = rawData;
  const token = typeof data.token === 'string' ? data.token.trim() : '';
  const expiresAt = Number(data.expiresAt || 0);

  if (!token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new GeminiError('AI session response is invalid.', 'INVALID_RESPONSE', false);
  }

  setSessionCache({ token, expiresAt });
  return token;
};

const postGeminiRequest = async (
  payload: GeminiRequest,
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
    throw new GeminiError(
      'Unable to reach AI service. Please check your connection and try again.',
      'NETWORK_ERROR',
      true
    );
  }
};

const callGeminiProxy = async (payload: GeminiRequest): Promise<string> => {
  let sessionToken = await fetchSessionToken();
  let response = await postGeminiRequest(payload, sessionToken);

  if (response.status === 401) {
    const authError = await parseError(response);
    if (authError.code === 'SESSION_EXPIRED' || authError.code === 'INVALID_SESSION_TOKEN' || authError.code === 'AUTH_REQUIRED') {
      clearSessionCache();
      sessionToken = await fetchSessionToken(true);
      response = await postGeminiRequest(payload, sessionToken);
    } else {
      throw authError;
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  const rawData = (await response.json().catch(() => ({}))) as unknown;
  if (!isGeminiApiResponse(rawData)) {
    throw new GeminiError('AI response schema is invalid.', 'INVALID_RESPONSE', false);
  }

  const data = rawData;
  const text = typeof data.text === 'string' ? data.text.trim() : '';
  if (!text) {
    throw new GeminiError('AI returned an empty response.', 'INVALID_RESPONSE', false);
  }

  return text;
};

export const improveText = async (
  text: string,
  context: string = 'resume',
  apiKey?: string
): Promise<string> => {
  if (!text.trim()) return '';

  return executeWithRetry(async () => {
    return callGeminiProxy({
      action: 'improve',
      text,
      context,
      apiKey: apiKey?.trim() || undefined,
    });
  });
};

export const generateSummary = async (
  role: string,
  skills: string[],
  apiKey?: string
): Promise<string> => {
  return executeWithRetry(async () => {
    return callGeminiProxy({
      action: 'summary',
      role: role?.trim() || 'Professional',
      skills,
      apiKey: apiKey?.trim() || undefined,
    });
  });
};

export const __resetGeminiSessionCacheForTests = (): void => {
  clearSessionCache();
};

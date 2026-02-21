type GeminiErrorCode =
  | 'API_KEY_REQUIRED'
  | 'INVALID_REQUEST'
  | 'INVALID_JSON'
  | 'REQUEST_TOO_LARGE'
  | 'METHOD_NOT_ALLOWED'
  | 'FORBIDDEN_ORIGIN'
  | 'NOT_FOUND'
  | 'UPSTREAM_RATE_LIMIT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'EMPTY_RESPONSE'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN_ERROR';

interface GeminiApiRequest {
  action: 'improve' | 'summary';
  apiKey?: string;
  text?: string;
  context?: string;
  role?: string;
  skills?: string[];
}

interface GeminiApiError {
  code?: GeminiErrorCode;
  error?: string;
}

interface GeminiApiResponse {
  text?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 30000;
const FALLBACK_PROXY_PATH = '/api/gemini';

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
  return code === 'UPSTREAM_TIMEOUT' || code === 'NETWORK_ERROR';
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
    const data = (await response.json()) as GeminiApiError;
    if (typeof data.error === 'string' && data.error.trim()) {
      message = data.error.trim();
    }
    if (data.code) {
      code = data.code;
    }
  } catch {
    message = response.statusText || message;
  }

  return new GeminiError(message, code, shouldRetry(response.status, code));
};

const callGeminiProxy = async (payload: GeminiApiRequest): Promise<string> => {
  const endpoint = getProxyUrl();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
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

  if (!response.ok) {
    throw await parseError(response);
  }

  const data = (await response.json().catch(() => ({}))) as GeminiApiResponse;
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

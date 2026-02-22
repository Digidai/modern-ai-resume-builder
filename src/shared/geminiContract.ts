export const GEMINI_ACTIONS = ['improve', 'summary'] as const;
export type GeminiAction = (typeof GEMINI_ACTIONS)[number];

export const GEMINI_ERROR_CODES = [
  'API_KEY_REQUIRED',
  'SERVER_KEY_MISSING',
  'AUTH_REQUIRED',
  'CLIENT_TOKEN_REQUIRED',
  'INVALID_CLIENT_TOKEN',
  'INVALID_SESSION_TOKEN',
  'SESSION_EXPIRED',
  'SIGNING_SECRET_MISSING',
  'INVALID_REQUEST',
  'INVALID_JSON',
  'REQUEST_TOO_LARGE',
  'METHOD_NOT_ALLOWED',
  'FORBIDDEN_ORIGIN',
  'NOT_FOUND',
  'RATE_LIMITED',
  'UPSTREAM_RATE_LIMIT',
  'UPSTREAM_UNAVAILABLE',
  'UPSTREAM_ERROR',
  'UPSTREAM_TIMEOUT',
  'EMPTY_RESPONSE',
  'NETWORK_ERROR',
  'INVALID_RESPONSE',
  'UNKNOWN_ERROR',
] as const;

export type GeminiErrorCode = (typeof GEMINI_ERROR_CODES)[number];

export interface GeminiImproveRequest {
  action: 'improve';
  text: string;
  context?: string;
}

export interface GeminiSummaryRequest {
  action: 'summary';
  role: string;
  skills: string[];
}

export type GeminiRequest = GeminiImproveRequest | GeminiSummaryRequest;

export interface GeminiApiResponse {
  text?: string;
}

export interface GeminiSessionResponse {
  token?: string;
  expiresAt?: number;
}

export interface GeminiErrorEnvelope {
  code?: GeminiErrorCode;
  error?: string;
}

export const isGeminiErrorCode = (value: unknown): value is GeminiErrorCode =>
  typeof value === 'string' && (GEMINI_ERROR_CODES as readonly string[]).includes(value);

export const isGeminiApiResponse = (value: unknown): value is GeminiApiResponse => {
  if (!value || typeof value !== 'object') return false;
  const text = (value as GeminiApiResponse).text;
  return text === undefined || typeof text === 'string';
};

export const isGeminiSessionResponse = (value: unknown): value is GeminiSessionResponse => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as GeminiSessionResponse;
  const tokenValid = payload.token === undefined || typeof payload.token === 'string';
  const expiresValid = payload.expiresAt === undefined || typeof payload.expiresAt === 'number';
  return tokenValid && expiresValid;
};

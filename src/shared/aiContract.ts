export const AI_ACTIONS = ['improve', 'summary', 'parse_latex'] as const;
export type AiAction = (typeof AI_ACTIONS)[number];

export const AI_ERROR_CODES = [
  'AI_NOT_CONFIGURED',
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
  'UPSTREAM_TIMEOUT',
  'EMPTY_RESPONSE',
  'NETWORK_ERROR',
  'INVALID_RESPONSE',
  'UNKNOWN_ERROR',
] as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export interface AiImproveRequest {
  action: 'improve';
  text: string;
  context?: string;
}

export interface AiSummaryRequest {
  action: 'summary';
  role: string;
  skills: string[];
}

/** Converts a LaTeX resume or CV to ModernCV JSON; the reply's `text` is that JSON. */
export interface AiParseLatexRequest {
  action: 'parse_latex';
  source: string;
  /** Reply as an NDJSON stream of `AiParseLatexEvent`s instead of `{ text }`. */
  stream?: boolean;
}

/**
 * One line of a streamed parse: `thinking` while the model reasons, `delta` for each piece of JSON it
 * writes, then `done` with the whole JSON object, or `error`.
 */
export type AiParseLatexEvent =
  | { type: 'thinking' }
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string }
  | { type: 'error'; code: AiErrorCode; error: string };

/** Longest .tex source (after comments are stripped) the parser accepts. */
export const MAX_LATEX_SOURCE_CHARS = 40_000;

export type AiRequest = AiImproveRequest | AiSummaryRequest | AiParseLatexRequest;

export interface AiApiResponse {
  text?: string;
}

export interface AiSessionResponse {
  token?: string;
  expiresAt?: number;
}

export interface AiErrorEnvelope {
  code?: AiErrorCode;
  error?: string;
}

export const isAiErrorCode = (value: unknown): value is AiErrorCode =>
  typeof value === 'string' && (AI_ERROR_CODES as readonly string[]).includes(value);

export const isAiApiResponse = (value: unknown): value is AiApiResponse => {
  if (!value || typeof value !== 'object') return false;
  const text = (value as AiApiResponse).text;
  return text === undefined || typeof text === 'string';
};

export const isAiSessionResponse = (value: unknown): value is AiSessionResponse => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as AiSessionResponse;
  const tokenValid = payload.token === undefined || typeof payload.token === 'string';
  const expiresValid = payload.expiresAt === undefined || typeof payload.expiresAt === 'number';
  return tokenValid && expiresValid;
};

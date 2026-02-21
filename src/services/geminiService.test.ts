import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetGeminiSessionCacheForTests,
  improveText,
} from './geminiService';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });

describe('geminiService', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    __resetGeminiSessionCacheForTests();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('requests a session token before calling the ai endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ token: 'session-token', expiresAt: Date.now() + 60_000 })
      )
      .mockResolvedValueOnce(jsonResponse({ text: 'Improved sentence.' }));

    const result = await improveText('Original sentence', 'summary');

    expect(result).toBe('Improved sentence.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/gemini/session',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/gemini',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-ai-session-token': 'session-token',
          'x-ai-request-id': expect.any(String),
        }),
      })
    );
  });

  it('refreshes the session token when the first token is rejected', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ token: 'expired-token', expiresAt: Date.now() + 30_000 })
      )
      .mockResolvedValueOnce(
        jsonResponse({ code: 'SESSION_EXPIRED', error: 'Session expired' }, 401)
      )
      .mockResolvedValueOnce(
        jsonResponse({ token: 'fresh-token', expiresAt: Date.now() + 60_000 })
      )
      .mockResolvedValueOnce(jsonResponse({ text: 'Recovered output.' }));

    const result = await improveText('Needs retry', 'experience');

    expect(result).toBe('Recovered output.');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/gemini',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-ai-session-token': 'fresh-token',
        }),
      })
    );
  });
});

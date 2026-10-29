import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetAiSessionCacheForTests,
  improveText,
} from './aiService';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });

describe('aiService', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    __resetAiSessionCacheForTests();
    vi.stubGlobal('fetch', fetchMock);
    document.head.innerHTML = '<meta name="ai-client-token" content="test-client-token" />';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    document.head.innerHTML = '';
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
      '/api/ai/session',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-ai-client-token': 'test-client-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/ai',
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
      '/api/ai',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-ai-session-token': 'fresh-token',
        }),
      })
    );
  });

  it('streams an improvement, passing cleaned partial text and resolving to the finished text', async () => {
    const events = [
      { type: 'thinking' },
      { type: 'delta', text: '"Led a team' },
      { type: 'delta', text: ' of 4\nCut costs' },
      { type: 'delta', text: ' 30%"' },
      { type: 'done', text: '- Led a team of 4\n- Cut costs 30%' },
    ];
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: 'session-token', expiresAt: Date.now() + 60_000 }))
      .mockResolvedValueOnce(
        new Response(events.map((event) => JSON.stringify(event)).join('\n') + '\n', {
          headers: { 'content-type': 'application/x-ndjson' },
        })
      );
    const partials: string[] = [];

    const result = await improveText('- led team\n- cut costs', 'experience', (text) => partials.push(text));

    expect(result).toBe('- Led a team of 4\n- Cut costs 30%');
    // Quotes the model wraps around its reply are dropped, and each line keeps the input's "- " bullet.
    expect(partials).toEqual(['- Led a team', '- Led a team of 4\n- Cut costs', '- Led a team of 4\n- Cut costs 30%']);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({ action: 'improve', stream: true });
  });
});

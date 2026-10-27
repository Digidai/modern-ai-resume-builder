import { describe, expect, it } from 'vitest';
import { decodeResumePayload, encodeResumePayload, readResumeHash } from './resumeLink';

const resume = { fullName: 'Zoë Ångström', summary: '数据分析 — 4 yrs', skills: ['Tools: SQL, R'] };

describe('resume link payloads', () => {
  it('round-trips the compact form, including non-ASCII text', async () => {
    const payload = await encodeResumePayload(resume);
    expect(payload.startsWith('z.')).toBe(true);
    expect(payload).toMatch(/^z\.[A-Za-z0-9_-]+$/);
    expect(await decodeResumePayload(readResumeHash(`#resume=${payload}`)!)).toEqual(resume);
  });

  it('accepts hand-made base64url and URL-encoded JSON', async () => {
    const b64 = Buffer.from(JSON.stringify(resume)).toString('base64url');
    expect(await decodeResumePayload(readResumeHash(`#resume=${b64}`)!)).toEqual(resume);
    const encoded = encodeURIComponent(JSON.stringify({ ...resume, phone: '+1 555' }));
    expect(await decodeResumePayload(readResumeHash(`#resume=${encoded}`)!)).toEqual({ ...resume, phone: '+1 555' });
  });

  it('returns null for garbage instead of throwing', async () => {
    expect(await decodeResumePayload('z.not-deflate')).toBeNull();
    expect(await decodeResumePayload('garbage!!')).toBeNull();
    expect(readResumeHash('#other=1')).toBeNull();
  });
});

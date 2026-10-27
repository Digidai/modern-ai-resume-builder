// Resume ⇄ URL fragment, shared by the editor, the /render page and the Worker (agent API + MCP).
// The resume travels in the fragment (`#resume=…`), which browsers never send to a server, so an
// agent can hand a user a link that opens the editor with their resume without storing it anywhere.
//
// Accepted `resume` values:
//   z.<base64url(deflate-raw(JSON))>  compact form produced by the API / MCP server
//   <base64url(JSON)>                 easy to produce by hand (e.g. `base64 | tr '+/' '-_'`)
//   <URL-encoded JSON>                starts with `{` once decoded

export const RESUME_HASH_PARAM = 'resume';

const utf8 = new TextEncoder();
const utf8Decoder = new TextDecoder();

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const transform = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> =>
  new Uint8Array(await new Response(new Response(bytes as BodyInit).body!.pipeThrough(stream)).arrayBuffer());

/** Compact fragment value for any JSON-serialisable resume payload. */
export const encodeResumePayload = async (value: unknown): Promise<string> =>
  `z.${toBase64Url(await transform(utf8.encode(JSON.stringify(value)), new CompressionStream('deflate-raw')))}`;

/** Parses a fragment value in any accepted form; null when it isn't valid JSON. */
export const decodeResumePayload = async (value: string): Promise<unknown> => {
  try {
    const text = value.startsWith('z.')
      ? utf8Decoder.decode(await transform(fromBase64Url(value.slice(2)), new DecompressionStream('deflate-raw')))
      : value.trimStart().startsWith('{')
        ? value
        : utf8Decoder.decode(fromBase64Url(value.trim()));
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** The `resume` value in a location hash such as `#resume=z.abc`, or null. */
export const readResumeHash = (hash: string): string | null =>
  new URLSearchParams(hash.replace(/^#/, '')).get(RESUME_HASH_PARAM);

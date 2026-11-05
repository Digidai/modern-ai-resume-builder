/** Per-request CSP nonce injected by the Worker; undefined in `vite dev` and on static hosts. */
export const getCspNonce = (): string | undefined =>
  typeof document === 'undefined'
    ? undefined // Prerendering: the Worker adds each response's nonce to bare <style> tags.
    : document.head.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content || undefined;

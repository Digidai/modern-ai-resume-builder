/** Per-request CSP nonce injected by the Worker; undefined in `vite dev` and on static hosts. */
export const getCspNonce = (): string | undefined =>
  document.head.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content || undefined;

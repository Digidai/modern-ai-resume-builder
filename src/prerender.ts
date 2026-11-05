/**
 * The page arrived as HTML prerendered at build time (src/entry-server.tsx), which the client
 * hydrates. Until hydration is done, renders must match the server's: the sample resume, not the
 * saved one. Read once, before React touches #root.
 */
export const isPrerendered = typeof document !== 'undefined' && !!document.getElementById('root')?.firstElementChild;

/** Hydration has replaced the sample resume with the saved one; CSS stops hiding previews (index.css). */
export const markHydrated = () => document.documentElement.classList.add('hydrated');

/** Storage fields `index.html`'s boot script checks to tell a saved resume from the untouched sample. */
export const SAVED_RESUME_PREFIX = 'resumeData:v2:';

/** The hash index.html's boot script computes over the stored resume fields (keep the two in sync). */
export const hashStoredFields = (values: Array<string | null>): number => {
  let hash = 0;
  for (const value of values) {
    const text = value ?? '';
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
    hash = (hash * 31 + 124) | 0;
  }
  return hash;
};

// Shared by the Worker's ORCID import (merging repeated works) and the editor (works already on the resume).

/**
 * Key for spotting the same publication twice: letters and digits of any script, lower case and
 * without accents, so "Étude des réseaux" and "Etude des Reseaux." match. Empty when the title has
 * no letters or digits; an empty key matches nothing. Only Latin, Greek and Cyrillic accents are
 * dropped: vowel signs in Hindi, Thai or Arabic tell words apart.
 */
export const publicationTitleKey = (title: string): string =>
  title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '');

/** Lower-cases the first letter unless the text starts with an acronym ("US federal", "UX designers"). */
export const lowerFirst = (text) => (/^[A-Z]{2}/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1));

/**
 * Meta description for /templates/<id>/. Search results cut descriptions at about 160 characters, so the
 * least useful sentences are dropped until it fits.
 */
export const templateMetaDescription = (t) => {
  const lead = `${t.name} resume template: ${t.description}.`;
  const ats = t.atsFriendly ? ' ATS-friendly single column.' : '';
  const best = ` Best for ${lowerFirst(t.bestFor)}.`;
  const free = ' Free, with PDF export.';
  return [lead + ats + best + free, lead + ats + best, lead + best, lead + ats].find((d) => d.length <= 160) ?? lead + ats;
};

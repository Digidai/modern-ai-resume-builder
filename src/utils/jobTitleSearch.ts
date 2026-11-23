// Matching job titles to what people type in the directory search: in any word order, with or
// without hyphens and spaces ("front end" finds "Frontend"), in the plural, and with common
// abbreviations spelled out either way ("hr manager" and "human resources manager").

const EXPANSIONS: Record<string, string[]> = {
  hr: ['human', 'resources'],
  ml: ['machine', 'learning'],
  swe: ['software', 'engineer'],
  sde: ['software', 'development', 'engineer'],
};

const singular = (word: string) =>
  word.length > 4 && word.endsWith('ies') ? `${word.slice(0, -3)}y` : word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}+#.]+/u)
    // A leading dot is part of the name (".NET"); others are not ("Node.js" is "nodejs", "Sr." is "sr").
    .map((word) => word.replace(/(?!^)\./g, ''))
    .filter((word) => word && word !== '.')
    .flatMap((word) => EXPANSIONS[word] ?? [word]);

/**
 * How well a title matches a search: 1 when every word typed starts a word of the title, 2 when the
 * letters only appear inside it ("rn" in "Intern"), or null for no match.
 */
export const titleMatchRank = (title: string, query: string): 1 | 2 | null => {
  // Each word as typed and in the singular ("nurses" → "nurse"); either may match.
  const wanted = words(query).map((word) => [word, singular(word)]);
  if (!wanted.length) return null;
  const have = words(title);
  if (wanted.every((forms) => forms.some((form) => have.some((own) => own.startsWith(form))))) return 1;
  // Spaces and hyphens ignored ("front end" in "Frontend", "fullstack" in "Full Stack"); a match
  // that begins a title word ranks with the whole-word matches.
  const compact = have.join('');
  const starts = new Set(have.map((_, i) => have.slice(0, i).join('').length));
  let rank: 1 | 2 | null = null;
  for (const typed of new Set([wanted.map(([word]) => word).join(''), wanted.map(([, one]) => one).join('')])) {
    for (let at = compact.indexOf(typed); at !== -1; at = compact.indexOf(typed, at + 1)) {
      if (starts.has(at)) return 1;
      rank = 2;
    }
  }
  return rank;
};

import type { Publication } from '../types';
import { createId } from './resumeData';

// A small BibTeX reader for the Publications import: enough for the .bib files that Google Scholar,
// DBLP, Zotero, Mendeley and Overleaf produce. It reads @article/@inproceedings/... entries with
// braced, quoted, numeric and macro values (joined with #), honours @string macros, and turns
// LaTeX markup into plain Unicode text.

const ACCENTS: Record<string, string> = {
  '"': '\u0308', "'": '\u0301', '`': '\u0300', '^': '\u0302', '~': '\u0303', '=': '\u0304', '.': '\u0307',
  u: '\u0306', v: '\u030C', H: '\u030B', c: '\u0327', k: '\u0328', r: '\u030A', d: '\u0323', b: '\u0331',
};
const SYMBOLS: Record<string, string> = {
  ss: 'ß', ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', aa: 'å', AA: 'Å', o: 'ø', O: 'Ø', l: 'ł', L: 'Ł', i: 'ı', j: 'ȷ',
  '&': '&', '%': '%', '$': '$', '#': '#', _: '_', '{': '{', '}': '}', textendash: '–', textemdash: '—', textquoteright: '’',
};
const GREEK: Record<string, string> = Object.fromEntries(
  'alpha α beta β gamma γ delta δ epsilon ε varepsilon ε zeta ζ eta η theta θ kappa κ lambda λ mu μ nu ν xi ξ pi π rho ρ sigma σ tau τ phi φ varphi φ chi χ psi ψ omega ω Gamma Γ Delta Δ Theta Θ Lambda Λ Pi Π Sigma Σ Phi Φ Psi Ψ Omega Ω ell ℓ infty ∞ times × pm ± leq ≤ geq ≥ approx ≈ to →'
    .split(' ')
    .reduce<string[][]>((pairs, word, i, words) => (i % 2 ? pairs : [...pairs, [word, words[i + 1]]]), [])
);
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** LaTeX markup → plain text: accents, escapes, dashes, quotes; drops braces, math delimiters and font commands. */
export const latexToText = (value: string): string =>
  value
    // Accents: \"{o}, \"o, {\"o}, \'{\i}
    .replace(/\\([`'^"~=.uvHckrdb])\s*\{?\\?([A-Za-z])\}?/g, (_, accent: string, letter: string) =>
      `${letter === 'i' ? 'i' : letter}${ACCENTS[accent] ?? ''}`.normalize('NFC')
    )
    .replace(/\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i|j|textendash|textemdash|textquoteright)(?![A-Za-z])\s?/g, (_, name: string) => SYMBOLS[name])
    .replace(/\\([&%$#_{}])/g, (_, ch: string) => SYMBOLS[ch])
    .replace(/\\([A-Za-z]+)(?![A-Za-z])/g, (whole, name: string) => GREEK[name] ?? whole)
    // \textit{x}, \emph{x}, \url{x} … keep the argument.
    .replace(/\\[A-Za-z]+\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\[A-Za-z]+\s*/g, '')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/``|''/g, '"')
    .replace(/~/g, ' ')
    .replace(/[{}$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Splits on `sep` at brace depth 0 (case-insensitive for words such as " and "). */
const splitTopLevel = (value: string, sep: RegExp): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 0) {
      sep.lastIndex = i;
      const match = sep.exec(value);
      if (match && match.index === i) {
        parts.push(value.slice(start, i));
        start = i + match[0].length;
        i = start - 1;
      }
    }
  }
  parts.push(value.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
};

const initials = (given: string): string =>
  given
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.split('-').map((piece) => (piece.endsWith('.') && piece.length <= 3 ? piece : `${piece[0]}.`)).join('-'))
    .join(' ');

/** "Lee, Pat and Jun Chen and {OpenAI Team} and others" → "Lee, P., Chen, J., OpenAI Team, et al." */
export const formatAuthors = (raw: string): string => {
  const names = splitTopLevel(raw.replace(/\s+/g, ' '), /\s+and\s+/iy).map((name) => {
    if (/^others$/i.test(name)) return 'et al.';
    if (/^\{.*\}$/.test(name)) return latexToText(name);
    const parts = splitTopLevel(name, /,/y);
    if (parts.length >= 2) {
      // "von Last, Jr, First" or "Last, First"
      const last = latexToText(parts[0]);
      const given = latexToText(parts[parts.length - 1]);
      return given ? `${last}, ${initials(given)}` : last;
    }
    const words = splitTopLevel(name, / /y).map(latexToText).filter(Boolean);
    if (words.length === 1) return words[0];
    // "First Middle von Last": the surname starts at the first lower-case particle, else the last word.
    const particle = words.findIndex((word, index) => index > 0 && index < words.length - 1 && /^[a-z]/.test(word));
    const split = particle > 0 ? particle : words.length - 1;
    return `${words.slice(split).join(' ')}, ${initials(words.slice(0, split).join(' '))}`;
  });
  return names.join(', ').replace(/, et al\.$/, ', et al.');
};

interface RawEntry {
  type: string;
  fields: Record<string, string>;
}

/** Reads the raw entries of a .bib file; values keep their LaTeX markup. */
export const parseBibtexEntries = (source: string): RawEntry[] => {
  const entries: RawEntry[] = [];
  const macros: Record<string, string> = Object.fromEntries(MONTHS.map((m, i) => [m, String(i + 1)]));
  let pos = 0;

  const skipSpace = () => {
    while (pos < source.length && /\s/.test(source[pos])) pos++;
  };
  const readUntilBalanced = (open: string, close: string): string => {
    // pos is just after `open`
    let depth = 1;
    const start = pos;
    while (pos < source.length && depth > 0) {
      const ch = source[pos];
      if (ch === '\\') pos++;
      else if (ch === open) depth++;
      else if (ch === close) depth--;
      pos++;
    }
    return source.slice(start, pos - 1);
  };
  const readValue = (): string => {
    const pieces: string[] = [];
    for (;;) {
      skipSpace();
      const ch = source[pos];
      if (ch === '{') {
        pos++;
        pieces.push(readUntilBalanced('{', '}'));
      } else if (ch === '"') {
        pos++;
        let depth = 0;
        const start = pos;
        while (pos < source.length && !(source[pos] === '"' && depth === 0)) {
          if (source[pos] === '{') depth++;
          else if (source[pos] === '}') depth--;
          pos++;
        }
        pieces.push(source.slice(start, pos));
        pos++;
      } else {
        const match = /^[^\s,#}")]+/.exec(source.slice(pos));
        const word = match?.[0] ?? '';
        pos += word.length;
        if (!word) break;
        pieces.push(/^\d+$/.test(word) ? word : macros[word.toLowerCase()] ?? word);
      }
      skipSpace();
      if (source[pos] === '#') {
        pos++;
        continue;
      }
      break;
    }
    return pieces.join('');
  };

  while (pos < source.length) {
    const at = source.indexOf('@', pos);
    if (at < 0) break;
    pos = at + 1;
    const typeMatch = /^([A-Za-z]+)\s*([{(])/.exec(source.slice(pos));
    if (!typeMatch) continue;
    const type = typeMatch[1].toLowerCase();
    const close = typeMatch[2] === '{' ? '}' : ')';
    pos += typeMatch[0].length;
    if (type === 'comment' || type === 'preamble') {
      readUntilBalanced(typeMatch[2], close);
      continue;
    }
    const fields: Record<string, string> = {};
    if (type !== 'string') {
      // citation key
      const comma = source.indexOf(',', pos);
      const end = source.indexOf(close, pos);
      if (comma < 0 || (end >= 0 && end < comma)) {
        pos = end + 1;
        continue;
      }
      pos = comma + 1;
    }
    for (;;) {
      skipSpace();
      if (source[pos] === close || pos >= source.length) {
        pos++;
        break;
      }
      if (source[pos] === ',') {
        pos++;
        continue;
      }
      const nameMatch = /^([A-Za-z][\w:.+-]*)\s*=/.exec(source.slice(pos));
      if (!nameMatch) {
        // Malformed: skip to the end of this entry.
        const end = source.indexOf('\n@', pos);
        pos = end < 0 ? source.length : end;
        break;
      }
      pos += nameMatch[0].length;
      const value = readValue();
      if (type === 'string') macros[nameMatch[1].toLowerCase()] = value;
      else fields[nameMatch[1].toLowerCase()] = value;
    }
    if (type !== 'string') entries.push({ type, fields });
  }
  return entries;
};

const THESIS: Record<string, string> = { phdthesis: 'PhD thesis', mastersthesis: "Master's thesis" };

/** Broad kind of a work, used to filter an import list; not stored on the resume. */
export type PublicationKind = 'journal' | 'conference' | 'preprint' | 'book' | 'thesis' | 'other';
export const PUBLICATION_KINDS: Record<PublicationKind, string> = {
  journal: 'Journal articles',
  conference: 'Conference papers',
  preprint: 'Preprints',
  book: 'Books and chapters',
  thesis: 'Theses',
  other: 'Other',
};
/** A publication read for import, with its kind. */
export type ImportedPublication = Publication & { kind: PublicationKind };

const BIBTEX_KINDS: Record<string, PublicationKind> = {
  article: 'journal',
  inproceedings: 'conference',
  conference: 'conference',
  proceedings: 'conference',
  unpublished: 'preprint',
  book: 'book',
  inbook: 'book',
  incollection: 'book',
  booklet: 'book',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  thesis: 'thesis',
};

const toPublication = ({ type, fields }: RawEntry): ImportedPublication => {
  const f = (name: string) => latexToText(fields[name] ?? '');
  const arxiv = /arxiv/i.test(fields.archiveprefix ?? fields.eprinttype ?? '') || /arxiv/i.test(fields.journal ?? '');
  const eprint = f('eprint');
  const thesis = THESIS[type];
  const venue =
    f('journal') ||
    f('journaltitle') ||
    f('booktitle') ||
    (thesis ? [thesis, f('school') || f('institution')].filter(Boolean).join(', ') : '') ||
    (type === 'techreport' ? ['Technical report', f('institution')].filter(Boolean).join(', ') : '') ||
    (arxiv ? `arXiv preprint${eprint ? ` arXiv:${eprint}` : ''}` : '') ||
    f('publisher') ||
    f('howpublished') ||
    f('organization');
  const doi = f('doi').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const url = f('url');
  return {
    id: createId(),
    kind: arxiv ? 'preprint' : BIBTEX_KINDS[type] ?? 'other',
    authors: fields.author ? formatAuthors(fields.author) : fields.editor ? `${formatAuthors(fields.editor)} (Ed.)` : '',
    title: f('title'),
    venue,
    year: f('year') || f('date').slice(0, 4),
    link: doi ? `doi.org/${doi}` : url ? url.replace(/^https?:\/\//, '') : arxiv && eprint ? `arxiv.org/abs/${eprint}` : '',
  };
};

/** Publications from a .bib file, in file order; entries without a title or authors are skipped. */
export const parseBibtex = (source: string): ImportedPublication[] =>
  parseBibtexEntries(source)
    .map(toPublication)
    .filter((pub) => pub.title || pub.authors);

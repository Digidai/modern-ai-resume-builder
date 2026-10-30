import type { AiErrorCode } from '../src/shared/aiContract';
import type { Publication } from '../src/types';
import { formatAuthors, latexToText, parseBibtex } from '../src/utils/bibtex';

// Publications from a public ORCID record, through ORCID's public API (no key needed). The work
// summaries list every work; the bulk endpoint (≤ 100 put-codes per call) adds contributors and,
// often, a BibTeX citation, which is the most complete source when it is there.

const ORCID_API = 'https://pub.orcid.org/v3.0';
const BULK_SIZE = 100;
const MAX_WORKS = 300;

/** "0000-0002-1825-0097", an orcid.org URL, or the bare 16 characters → canonical iD, or null. */
export const normalizeOrcid = (input: string): string | null => {
  const compact = input.trim().replace(/^https?:\/\/(www\.)?orcid\.org\//i, '').replace(/[\s-]/g, '').toUpperCase();
  if (!/^\d{15}[\dX]$/.test(compact)) return null;
  // ISO 7064 MOD 11-2 check digit.
  let total = 0;
  for (const digit of compact.slice(0, 15)) total = (total + Number(digit)) * 2;
  const check = (12 - (total % 11)) % 11;
  if (compact[15] !== (check === 10 ? 'X' : String(check))) return null;
  return compact.match(/.{4}/g)!.join('-');
};

type Json = Record<string, unknown>;
const at = (value: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Json)[key] : undefined), value);
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const VENUE_BY_TYPE: Record<string, string> = { 'dissertation-thesis': 'Thesis', preprint: 'Preprint' };

const fromWork = (work: Json): Publication | null => {
  const citationType = text(at(work, 'citation', 'citation-type'));
  const citation = text(at(work, 'citation', 'citation-value'));
  const fromBib = citationType === 'bibtex' && citation ? parseBibtex(citation)[0] : undefined;

  const ids = (at(work, 'external-ids', 'external-id') as Json[] | undefined) ?? [];
  const doi = ids.find((id) => text(id['external-id-type']) === 'doi' && text(id['external-id-relationship']) !== 'part-of');
  const doiValue = text(doi?.['external-id-value']).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const contributors = ((at(work, 'contributors', 'contributor') as Json[] | undefined) ?? [])
    .map((c) => text(at(c, 'credit-name', 'value')))
    .filter(Boolean);
  const url = text(at(work, 'url', 'value')).replace(/^https?:\/\//, '');

  const pub: Publication = {
    id: '',
    title: fromBib?.title || latexToText(text(at(work, 'title', 'title', 'value'))),
    authors: fromBib?.authors || (contributors.length ? formatAuthors(contributors.map((name) => (name.includes(',') ? `{${name}}` : name)).join(' and ')) : ''),
    venue: fromBib?.venue || text(at(work, 'journal-title', 'value')) || VENUE_BY_TYPE[text(work.type)] || '',
    year: text(at(work, 'publication-date', 'year', 'value')) || fromBib?.year || '',
    link: doiValue ? `doi.org/${doiValue}` : fromBib?.link || url,
  };
  return pub.title ? pub : null;
};

export class OrcidError extends Error {
  constructor(
    readonly status: number,
    readonly code: AiErrorCode,
    message: string
  ) {
    super(message);
  }
}

const getJson = async (path: string): Promise<Json> => {
  const response = await fetch(`${ORCID_API}/${path}`, { headers: { Accept: 'application/json', 'User-Agent': 'ModernCV (https://genedai.cv)' } });
  if (response.status === 404) throw new OrcidError(404, 'NOT_FOUND', 'No public ORCID record with that iD.');
  if (!response.ok) throw new OrcidError(502, 'UPSTREAM_UNAVAILABLE', `ORCID returned ${response.status}. Try again later.`);
  return (await response.json()) as Json;
};

/** Progress of a fetch: how many works the record lists, then how many have been read. */
export type OrcidProgress = { total: number; read: number };

/** The record's public works as publications, newest first. */
export const fetchOrcidPublications = async (orcid: string, onProgress?: (progress: OrcidProgress) => void): Promise<Publication[]> => {
  const summary = await getJson(`${orcid}/works`);
  const putCodes = ((summary.group as Json[] | undefined) ?? [])
    .map((group) => at((group['work-summary'] as Json[] | undefined)?.[0], 'put-code'))
    .filter((code): code is number => typeof code === 'number')
    .slice(0, MAX_WORKS);
  onProgress?.({ total: putCodes.length, read: 0 });

  const batches: number[][] = [];
  for (let i = 0; i < putCodes.length; i += BULK_SIZE) batches.push(putCodes.slice(i, i + BULK_SIZE));
  let read = 0;
  const works = (
    await Promise.all(
      batches.map(async (batch) => {
        const bulk = await getJson(`${orcid}/works/${batch.join(',')}`);
        read += batch.length;
        onProgress?.({ total: putCodes.length, read });
        return bulk;
      })
    )
  )
    .flatMap((bulk) => (bulk.bulk as Json[] | undefined) ?? [])
    .map((item) => item.work as Json | undefined)
    .filter((work): work is Json => !!work);

  // ORCID often holds one work several times (a preprint and its versions, or one per source).
  const seen = new Set<string>();
  return works
    .map(fromWork)
    .filter((pub): pub is Publication => !!pub)
    .filter((pub) => {
      const key = pub.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (Number(b.year.slice(0, 4)) || 0) - (Number(a.year.slice(0, 4)) || 0));
};

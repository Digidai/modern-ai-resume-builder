import React, { useMemo, useRef, useState } from 'react';
import type { Publication } from '../types';
import { PUBLICATION_KINDS, parseBibtex, type ImportedPublication, type PublicationKind } from '../utils/bibtex';
import { createId } from '../utils/resumeData';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { TaskProgress } from './TaskProgress';

type Mode = 'bibtex' | 'orcid';

type OrcidEvent =
  | { type: 'progress'; total: number; read: number; listed: number }
  | { type: 'done'; publications: OrcidWork[]; listed?: number }
  | { type: 'error'; error: string };

/** Fetch progress: null before the record answers, then works listed and read so far. */
type OrcidProgress = { total: number; read: number; listed: number } | null;

const ORCID_STEPS = ['Find record', 'Read works', 'Review'] as const;

/** A work in the ORCID reply; `kind` is missing from servers older than the filters. */
type OrcidWork = Omit<Publication, 'id'> & { kind?: PublicationKind };
const fromOrcid = (works: OrcidWork[]): ImportedPublication[] => works.map((work) => ({ ...work, kind: work.kind ?? 'other', id: createId() }));

/** First four-digit year in "2025", "2025-06"; null for "In press" or none. */
const yearOf = (pub: Publication): number | null => {
  const match = /\d{4}/.exec(pub.year);
  return match ? Number(match[0]) : null;
};

const KIND_LABEL: Record<PublicationKind, string> = {
  journal: 'Journal article',
  conference: 'Conference paper',
  preprint: 'Preprint',
  book: 'Book or chapter',
  thesis: 'Thesis',
  other: 'Other',
};

const titleKey = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * "Import BibTeX" and "Import from ORCID" for the Publications section. Both produce a list the user
 * can tick through before adding; works already on the resume (same title) start unticked.
 */
export const PublicationImport: React.FC<{ existing: Publication[]; onImport: (publications: Publication[]) => void }> = ({ existing, onImport }) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [bibtex, setBibtex] = useState('');
  const [orcid, setOrcid] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<OrcidProgress>(null);
  /** Works the ORCID record lists when more than were read (the Worker reads the newest 4,000). */
  const [skipped, setSkipped] = useState<{ read: number; listed: number } | null>(null);
  const [error, setError] = useState('');
  const [found, setFound] = useState<ImportedPublication[] | null>(null);
  /** Filters on the review list: kinds hidden, and an inclusive year range (null = no limit). */
  const [hiddenKinds, setHiddenKinds] = useState<Set<PublicationKind>>(new Set());
  const [fromYear, setFromYear] = useState<number | null>(null);
  const [toYear, setToYear] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const existingKeys = useMemo(() => new Set(existing.map((pub) => titleKey(pub.title))), [existing]);

  const reset = (next: Mode | null) => {
    setMode(next);
    setError('');
    setFound(null);
  };

  const review = (publications: ImportedPublication[], emptyMessage: string) => {
    if (publications.length === 0) {
      setError(emptyMessage);
      setFound(null);
      return;
    }
    setError('');
    setFound(publications);
    setHiddenKinds(new Set());
    setFromYear(null);
    setToYear(null);
    setSelected(new Set(publications.filter((pub) => !existingKeys.has(titleKey(pub.title))).map((pub) => pub.id)));
  };

  const readBibtex = (source: string) => review(parseBibtex(source), 'No entries with a title or authors were found. Paste the contents of a .bib file.');

  const fetchOrcid = async () => {
    setLoading(true);
    setProgress(null);
    setSkipped(null);
    setError('');
    setFound(null);
    let read = 0;
    const fail = (message?: string) => setError(message || 'Could not load that ORCID record. Try again later.');
    try {
      const response = await fetch(`/api/orcid?id=${encodeURIComponent(orcid.trim())}&stream=1`);
      if (!response.ok || !response.body || !(response.headers.get('content-type') || '').includes('ndjson')) {
        const body = (await response.json().catch(() => null)) as { publications?: OrcidWork[]; error?: string } | null;
        if (!response.ok || !body?.publications) return fail(body?.error);
        return review(fromOrcid(body.publications), 'That ORCID record has no public works yet.');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = done ? '' : lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as OrcidEvent;
          if (event.type === 'progress') {
            read = event.total;
            setProgress({ total: event.total, read: event.read, listed: event.listed });
          }
          else if (event.type === 'error') return fail(event.error);
          else {
            if (event.listed && event.listed > read) setSkipped({ read, listed: event.listed });
            return review(fromOrcid(event.publications), 'That ORCID record has no public works yet.');
          }
        }
        if (done) return fail();
      }
    } catch {
      setError('Could not reach ORCID. Check your connection and try again.');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const kindCounts = useMemo(() => {
    const counts = new Map<PublicationKind, number>();
    for (const pub of found ?? []) counts.set(pub.kind, (counts.get(pub.kind) ?? 0) + 1);
    return (Object.keys(PUBLICATION_KINDS) as PublicationKind[]).filter((kind) => counts.has(kind)).map((kind) => [kind, counts.get(kind)!] as const);
  }, [found]);
  const years = useMemo(() => [...new Set((found ?? []).map(yearOf).filter((year): year is number => year !== null))].sort((a, b) => b - a), [found]);
  const yearFiltered = fromYear !== null || toYear !== null;
  // Works without a year are only shown while no year limit is set.
  const shown = useMemo(
    () =>
      (found ?? []).filter((pub) => {
        if (hiddenKinds.has(pub.kind)) return false;
        if (!yearFiltered) return true;
        const year = yearOf(pub);
        return year !== null && (fromYear === null || year >= fromYear) && (toYear === null || year <= toYear);
      }),
    [found, hiddenKinds, fromYear, toYear, yearFiltered]
  );
  const toAdd = shown.filter((pub) => selected.has(pub.id));
  const setShown = (on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const pub of shown) if (on) next.add(pub.id);
      else next.delete(pub.id);
      return next;
    });
  const toggleKind = (kind: PublicationKind) =>
    setHiddenKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  const add = () => {
    // Only what is ticked and passes the filters; `kind` is for filtering, not part of the resume.
    onImport(toAdd.map(({ kind: _kind, ...pub }) => pub));
    setBibtex('');
    reset(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === 'bibtex' ? 'primary' : 'secondary'} size="sm" onClick={() => reset(mode === 'bibtex' ? null : 'bibtex')} aria-expanded={mode === 'bibtex'}>
          Import BibTeX
        </Button>
        <Button variant={mode === 'orcid' ? 'primary' : 'secondary'} size="sm" onClick={() => reset(mode === 'orcid' ? null : 'orcid')} aria-expanded={mode === 'orcid'}>
          Import from ORCID
        </Button>
      </div>

      {mode && (
        <div className="space-y-3 rounded-lg border border-rule bg-tint/50 p-4">
          {mode === 'bibtex' ? (
            <>
              <Textarea
                label="BibTeX"
                value={bibtex}
                onChange={setBibtex}
                minRows={5}
                placeholder={'@article{lee2025,\n  title = {Sparse attention for long documents},\n  author = {Lee, Pat and Chen, Jun},\n  journal = {NeurIPS}, year = {2025}\n}'}
                hint="Paste entries from Google Scholar, DBLP, Zotero or your .bib file."
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => readBibtex(bibtex)} disabled={!bibtex.trim()}>
                  Read entries
                </Button>
                <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                  Choose .bib file
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".bib,.bibtex,.txt,text/plain,application/x-bibtex"
                  className="hidden"
                  aria-label="Choose a .bib file"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    if (file.size > 2_000_000) {
                      setError('That file is larger than 2 MB.');
                      return;
                    }
                    const source = await file.text();
                    setBibtex(source);
                    readBibtex(source);
                  }}
                />
              </div>
            </>
          ) : (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (orcid.trim()) void fetchOrcid();
              }}
            >
              <Input
                label="ORCID iD"
                value={orcid}
                onChange={setOrcid}
                placeholder="0000-0002-1825-0097"
                hint="Your public works are read from orcid.org."
                className="min-w-[14rem] flex-1"
              />
              <Button type="submit" size="sm" isLoading={loading} disabled={!orcid.trim()} className="mb-6">
                Fetch works
              </Button>
            </form>
          )}

          {mode === 'orcid' && loading && (
            <TaskProgress
              data-testid="orcid-progress"
              steps={ORCID_STEPS}
              step={progress ? 1 : 0}
              status={
                !progress
                  ? 'Looking up the ORCID record…'
                  : progress.total === 0
                    ? 'No public works listed…'
                    : `Reading ${progress.read} of ${progress.total} works…`
              }
              label="ORCID import progress"
              percent={progress && progress.total ? Math.max(4, Math.round((progress.read / progress.total) * 100)) : null}
              note={
                !progress
                  ? 'Reading from orcid.org.'
                  : progress.listed > progress.total
                    ? `The record lists ${progress.listed.toLocaleString('en')} works; the newest ${progress.total.toLocaleString('en')} are read.`
                    : 'ORCID sends the details of 100 works at a time.'
              }
            />
          )}

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          {found && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-ink">
                  {shown.length === found.length ? `${found.length.toLocaleString('en')} found` : `${shown.length.toLocaleString('en')} of ${found.length.toLocaleString('en')} shown`} ·{' '}
                  {toAdd.length.toLocaleString('en')} selected
                </span>
                <span className="flex gap-3 text-muted">
                  <button type="button" className="hover:text-ink" onClick={() => setShown(true)}>
                    All
                  </button>
                  <button type="button" className="hover:text-ink" onClick={() => setShown(false)}>
                    None
                  </button>
                </span>
              </div>
              {skipped && (
                <p className="text-xs text-muted">
                  The record lists {skipped.listed.toLocaleString('en')} works; the newest {skipped.read.toLocaleString('en')} were read. Add older ones with Import BibTeX.
                </p>
              )}
              {(kindCounts.length > 1 || years.length > 1) && (
                <div className="space-y-2 rounded-md border border-rule bg-surface p-2.5" data-testid="publication-import-filters">
                  {kindCounts.length > 1 && (
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
                      {kindCounts.map(([kind, total]) => {
                        const on = !hiddenKinds.has(kind);
                        return (
                          <button
                            key={kind}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleKind(kind)}
                            className={`focus-ring rounded-full border px-2.5 py-0.5 text-xs transition-colors ${on ? 'border-ink bg-ink text-surface' : 'border-rule text-muted hover:text-ink'}`}
                          >
                            {PUBLICATION_KINDS[kind]} <span className="tabular-nums opacity-70">{total}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {years.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>Years</span>
                      <select
                        aria-label="From year"
                        value={fromYear ?? ''}
                        onChange={(event) => setFromYear(event.target.value ? Number(event.target.value) : null)}
                        className="focus-ring rounded-md border border-rule bg-surface px-1.5 py-1 text-ink"
                      >
                        <option value="">Earliest</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <span>to</span>
                      <select
                        aria-label="To year"
                        value={toYear ?? ''}
                        onChange={(event) => setToYear(event.target.value ? Number(event.target.value) : null)}
                        className="focus-ring rounded-md border border-rule bg-surface px-1.5 py-1 text-ink"
                      >
                        <option value="">Latest</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      {[5, 10].map((span) => (
                        <button
                          key={span}
                          type="button"
                          className="focus-ring rounded px-1.5 py-0.5 hover:bg-tint hover:text-ink"
                          onClick={() => {
                            setFromYear(new Date().getFullYear() - span + 1);
                            setToYear(null);
                          }}
                        >
                          Last {span} years
                        </button>
                      ))}
                      {(yearFiltered || hiddenKinds.size > 0) && (
                        <button
                          type="button"
                          className="focus-ring ml-auto rounded px-1.5 py-0.5 hover:bg-tint hover:text-ink"
                          onClick={() => {
                            setHiddenKinds(new Set());
                            setFromYear(null);
                            setToYear(null);
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted">Duplicates (the same title from several sources) are listed once.{yearFiltered ? ' Works without a year are hidden while a year range is set.' : ''}</p>
              <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-rule bg-surface p-2" data-testid="publication-import-list">
                {shown.map((pub) => (
                  <li key={pub.id}>
                    <label className="flex cursor-pointer gap-2 rounded px-1.5 py-1 text-sm hover:bg-tint">
                      <input
                        type="checkbox"
                        checked={selected.has(pub.id)}
                        onChange={() => toggle(pub.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--site-ink)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-ink">{pub.title || pub.authors}</span>
                        <span className="block text-xs text-muted">
                          {[KIND_LABEL[pub.kind], pub.authors, pub.venue, pub.year].filter(Boolean).join(' · ')}
                          {existingKeys.has(titleKey(pub.title)) && ' · already on your resume'}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {shown.length === 0 && <p className="text-sm text-muted">No works match these filters.</p>}
              <Button size="sm" onClick={add} disabled={toAdd.length === 0}>
                Add {toAdd.length.toLocaleString('en')} {toAdd.length === 1 ? 'publication' : 'publications'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useRef, useState } from 'react';
import type { Publication } from '../types';
import { parseBibtex } from '../utils/bibtex';
import { createId } from '../utils/resumeData';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { TaskProgress } from './TaskProgress';

type Mode = 'bibtex' | 'orcid';

type OrcidEvent =
  | { type: 'progress'; total: number; read: number }
  | { type: 'done'; publications: Omit<Publication, 'id'>[] }
  | { type: 'error'; error: string };

/** Fetch progress: null before the record answers, then works listed and read so far. */
type OrcidProgress = { total: number; read: number } | null;

const ORCID_STEPS = ['Find record', 'Read works', 'Review'] as const;

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
  const [error, setError] = useState('');
  const [found, setFound] = useState<Publication[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const existingKeys = useMemo(() => new Set(existing.map((pub) => titleKey(pub.title))), [existing]);

  const reset = (next: Mode | null) => {
    setMode(next);
    setError('');
    setFound(null);
  };

  const review = (publications: Publication[], emptyMessage: string) => {
    if (publications.length === 0) {
      setError(emptyMessage);
      setFound(null);
      return;
    }
    setError('');
    setFound(publications);
    setSelected(new Set(publications.filter((pub) => !existingKeys.has(titleKey(pub.title))).map((pub) => pub.id)));
  };

  const readBibtex = (source: string) => review(parseBibtex(source), 'No entries with a title or authors were found. Paste the contents of a .bib file.');

  const fetchOrcid = async () => {
    setLoading(true);
    setProgress(null);
    setError('');
    setFound(null);
    const fail = (message?: string) => setError(message || 'Could not load that ORCID record. Try again later.');
    try {
      const response = await fetch(`/api/orcid?id=${encodeURIComponent(orcid.trim())}&stream=1`);
      if (!response.ok || !response.body || !(response.headers.get('content-type') || '').includes('ndjson')) {
        const body = (await response.json().catch(() => null)) as { publications?: Omit<Publication, 'id'>[]; error?: string } | null;
        if (!response.ok || !body?.publications) return fail(body?.error);
        return review(body.publications.map((pub) => ({ ...pub, id: createId() })), 'That ORCID record has no public works yet.');
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
          if (event.type === 'progress') setProgress({ total: event.total, read: event.read });
          else if (event.type === 'error') return fail(event.error);
          else return review(event.publications.map((pub) => ({ ...pub, id: createId() })), 'That ORCID record has no public works yet.');
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

  const add = () => {
    onImport((found ?? []).filter((pub) => selected.has(pub.id)));
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
              note={progress ? 'ORCID sends the details of up to 100 works at a time (300 at most).' : 'Reading from orcid.org.'}
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
                  {found.length} found · {selected.size} selected
                </span>
                <span className="flex gap-3 text-muted">
                  <button type="button" className="hover:text-ink" onClick={() => setSelected(new Set(found.map((pub) => pub.id)))}>
                    All
                  </button>
                  <button type="button" className="hover:text-ink" onClick={() => setSelected(new Set())}>
                    None
                  </button>
                </span>
              </div>
              <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-rule bg-surface p-2" data-testid="publication-import-list">
                {found.map((pub) => (
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
                          {[pub.authors, pub.venue, pub.year].filter(Boolean).join(' · ')}
                          {existingKeys.has(titleKey(pub.title)) && ' · already on your resume'}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button size="sm" onClick={add} disabled={selected.size === 0}>
                Add {selected.size} {selected.size === 1 ? 'publication' : 'publications'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

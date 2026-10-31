import { useEffect, useState, type KeyboardEvent } from 'react';
import type { ResumeDesign } from '../types';
import { DEFAULT_DESIGN } from '../types';
import { ACCENT_PRESETS, FONT_PRESETS, SCALE_MAX, SCALE_MIN, SCALE_STEP, contrastOnWhite } from '../constants/design';
import { CheckIcon } from './Icons';
import { pageLimitNote, useOnePageFit } from '../hooks/useOnePageFit';
import { PAPERS, PAPER_IDS } from '../constants/print';

const HEX = /^#[0-9a-f]{6}$/i;

const round = (n: number) => Math.round(n * 100) / 100;

interface DesignControlsProps {
  design: ResumeDesign;
  onChange: (patch: Partial<ResumeDesign>) => void;
  /** The template expects US Letter (the federal resume), so A4 gets a note. */
  expectsLetter?: boolean;
  /** The template's page limit (Federal: 2); above it the page count turns into a warning. */
  maxPages?: number;
}

export const DesignControls = ({ design, onChange, expectsLetter = false, maxPages }: DesignControlsProps) => {
  const { pageCount, lastPageSparse, fitLabel, fit, note: fitNote, atMinimum, overLimit } = useOnePageFit(design, onChange, maxPages);
  const [hexDraft, setHexDraft] = useState(design.accent);

  useEffect(() => setHexDraft(design.accent), [design.accent]);

  // Roving focus for the accent radiogroup: one tab stop, arrow keys move and select.
  const accentValues = ['', ...ACCENT_PRESETS.map((p) => p.value)];
  const selectedAccentIndex = Math.max(0, accentValues.findIndex((v) => v.toLowerCase() === design.accent.toLowerCase()));
  const hasPresetAccent = accentValues.some((v) => v.toLowerCase() === design.accent.toLowerCase());
  const onAccentKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + accentValues.length) % accentValues.length;
    onChange({ accent: accentValues[next] });
    document.getElementById(`accent-${next}`)?.focus();
  };
  const accentTabIndex = (index: number) => (index === (hasPresetAccent ? selectedAccentIndex : 0) ? 0 : -1);
  const hexInvalid = hexDraft !== '' && !HEX.test(hexDraft);

  const contrast = HEX.test(hexDraft) ? contrastOnWhite(hexDraft) : null;
  const isCustom = design.accent !== '' && !ACCENT_PRESETS.some((p) => p.value.toLowerCase() === design.accent.toLowerCase());
  const isDefault = design.accent === DEFAULT_DESIGN.accent && design.font === DEFAULT_DESIGN.font && design.scale === DEFAULT_DESIGN.scale;

  // Every swatch has a hairline outline so dark presets (Black, Graphite) stay visible on the dark editor.
  const swatch = 'relative h-8 w-8 rounded-full ring-1 ring-ink/25 ring-offset-2 ring-offset-surface transition focus-ring';

  return (
    <div className="space-y-6 rounded-lg border border-rule bg-surface p-4">
      <fieldset>
        <legend className="text-sm font-medium text-ink">Accent colour</legend>
        <div className="mt-3 grid w-fit grid-cols-6 gap-3" role="radiogroup" aria-label="Accent colour">
          <button
            id="accent-0"
            type="button"
            role="radio"
            aria-checked={design.accent === ''}
            tabIndex={accentTabIndex(0)}
            onKeyDown={(e) => onAccentKeyDown(e, 0)}
            onClick={() => onChange({ accent: '' })}
            title="Template default"
            className={`${swatch} flex items-center justify-center border border-dashed border-muted bg-surface text-[10px] font-semibold text-muted ${
              design.accent === '' ? 'ring-2 ring-accent' : ''
            }`}
          >
            Auto
          </button>
          {ACCENT_PRESETS.map((p, i) => {
            const selected = design.accent.toLowerCase() === p.value.toLowerCase();
            return (
              <button
                key={p.value}
                id={`accent-${i + 1}`}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={accentTabIndex(i + 1)}
                onKeyDown={(e) => onAccentKeyDown(e, i + 1)}
                aria-label={p.name}
                title={p.name}
                onClick={() => onChange({ accent: p.value })}
                className={`${swatch} ${selected ? 'ring-2 ring-accent' : ''}`}
                style={{ backgroundColor: p.value }}
              >
                {selected && <CheckIcon className="absolute inset-0 m-auto h-4 w-4 text-white" />}
              </button>
            );
          })}
          <label
            className={`${swatch} cursor-pointer overflow-hidden bg-[conic-gradient(#ef4444,#f59e0b,#22c55e,#06b6d4,#3b82f6,#ec4899,#ef4444)] ${isCustom ? 'ring-2 ring-accent' : ''}`}
            title="Custom colour"
          >
            <span className="sr-only">Custom colour</span>
            <input
              type="color"
              value={HEX.test(design.accent) ? design.accent : '#A3361F'}
              onChange={(e) => onChange({ accent: e.target.value.toUpperCase() })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            aria-label="Accent hex value"
            value={hexDraft}
            placeholder="#RRGGBB"
            aria-invalid={hexInvalid || undefined}
            aria-describedby="accent-hex-status"
            onChange={(e) => {
              let v = e.target.value.trim();
              if (/^[0-9a-f]{6}$/i.test(v)) v = `#${v}`; // accept "2F5A8A" without the hash
              setHexDraft(v);
              if (HEX.test(v)) onChange({ accent: v.toUpperCase() });
              else if (v === '') onChange({ accent: '' });
            }}
            className="w-32 rounded-lg border border-rule aria-invalid:border-amber-600 bg-surface px-2.5 py-1.5 font-label text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {hexInvalid && (
            <span id="accent-hex-status" className="text-xs text-amber-800 dark:text-amber-300">
              Use 6 hex digits, like #2F5A8A
            </span>
          )}
          {contrast !== null && (
            <span
              id="accent-hex-status"
              className={`text-xs ${contrast >= 4.5 ? 'text-success' : 'text-amber-800 dark:text-amber-300'}`}
            >
              {contrast >= 4.5 ? `Readable · ${contrast.toFixed(1)}:1` : `Low contrast · ${contrast.toFixed(1)}:1 — pick a darker shade`}
            </span>
          )}
        </div>
      </fieldset>

      <div>
        <label htmlFor="design-font" className="text-sm font-medium text-ink">
          Font
        </label>
        <select
          id="design-font"
          value={design.font}
          onChange={(e) => onChange({ font: e.target.value })}
          className="mt-2 block w-full rounded-lg border border-rule bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {FONT_PRESETS.map((f) => (
            <option key={f.id} value={f.id}>
              {'kind' in f ? `${f.name} · ${f.kind}` : f.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Paper size</legend>
        <div role="radiogroup" aria-label="Paper size" className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-rule bg-tint p-0.5 text-sm">
          {PAPER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={design.paper === id}
              onClick={() => onChange({ paper: id })}
              className={`focus-ring rounded-md px-3 py-1.5 font-medium transition-colors ${design.paper === id ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'}`}
            >
              {PAPERS[id].label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {expectsLetter && design.paper !== 'letter'
            ? 'USAJOBS counts pages on US Letter: switch to it so the page count matches what HR sees.'
            : 'A4 for most countries; US Letter for the United States and Canada. The PDF and page count follow it.'}
        </p>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="design-scale" className="text-sm font-medium text-ink">
            Text size
          </label>
          <span className="text-xs tabular-nums text-muted">{Math.round(design.scale * 100)}%</span>
        </div>
        <input
          id="design-scale"
          type="range"
          min={SCALE_MIN}
          max={SCALE_MAX}
          step={SCALE_STEP}
          value={design.scale}
          onChange={(e) => onChange({ scale: round(Number(e.target.value)) })}
          className="mt-2 w-full accent-[var(--site-ink)]"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted" aria-live="polite">
            {pageCount === null ? '' : pageCount === 1 ? 'Fits on 1 page' : `${pageCount} pages${lastPageSparse ? ' · last page has only a few lines' : ''}`}
          </span>
          <div className="flex gap-2">
            {pageCount !== null && pageCount > 1 && (
              <button
                type="button"
                disabled={atMinimum}
                onClick={fit}
                className="focus-ring h-8 rounded-lg bg-ink px-3 text-xs font-medium text-paper shadow-button hover:bg-ink-hover disabled:opacity-50"
              >
                {atMinimum ? 'At minimum size' : fitLabel}
              </button>
            )}
            {!isDefault && (
              <button
                type="button"
                // The paper size is a choice about where you apply, not style, so it is kept.
                onClick={() => onChange({ ...DEFAULT_DESIGN, paper: design.paper })}
                className="focus-ring h-8 rounded-lg border border-rule bg-surface shadow-card px-3 text-xs font-medium text-ink hover:bg-tint"
              >
                Reset style
              </button>
            )}
          </div>
        </div>
        {overLimit && maxPages && pageCount !== null && (
          <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300" role="status">
            {pageLimitNote(pageCount, maxPages)}
          </p>
        )}
        {fitNote && (
          <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300" role="status">
            {fitNote}
          </p>
        )}
      </div>
    </div>
  );
};

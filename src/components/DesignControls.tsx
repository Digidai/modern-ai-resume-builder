import { useEffect, useState, type KeyboardEvent } from 'react';
import type { ResumeDesign } from '../types';
import { DEFAULT_DESIGN } from '../types';
import { ACCENT_PRESETS, FONT_PRESETS, SCALE_MAX, SCALE_MIN, SCALE_STEP, contrastOnWhite } from '../constants/design';
import { CheckIcon } from './Icons';

const PAGE_HEIGHT_PX = (297 / 25.4) * 96;
const HEX = /^#[0-9a-f]{6}$/i;

/** Height of the exported preview in A4 pages, or null while it is not laid out (e.g. hidden on mobile). */
const usePreviewPages = () => {
  const [pages, setPages] = useState<number | null>(null);
  useEffect(() => {
    let observer: ResizeObserver | undefined;
    let frame = 0;
    const attach = () => {
      const el = document.getElementById('resume-preview-container');
      if (!el) {
        frame = requestAnimationFrame(attach);
        return;
      }
      const measure = () => setPages(el.offsetHeight ? el.offsetHeight / PAGE_HEIGHT_PX : null);
      observer = new ResizeObserver(measure);
      observer.observe(el);
      measure();
    };
    attach();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);
  return pages;
};

const round = (n: number) => Math.round(n * 100) / 100;

interface DesignControlsProps {
  design: ResumeDesign;
  onChange: (patch: Partial<ResumeDesign>) => void;
}

export const DesignControls = ({ design, onChange }: DesignControlsProps) => {
  const pages = usePreviewPages();
  const pageCount = pages === null ? null : Math.max(1, Math.ceil(pages - 0.01));
  const [fitting, setFitting] = useState(false);
  const [fitNote, setFitNote] = useState('');
  const [hexDraft, setHexDraft] = useState(design.accent);

  useEffect(() => setHexDraft(design.accent), [design.accent]);

  // Fit to one page: step the scale down, letting each step lay out before measuring again. If it still
  // doesn't fit at the minimum, restore the original size rather than leave the text shrunk for nothing.
  const startFit = async () => {
    const paper = document.getElementById('resume-preview-container');
    if (!paper) return;
    const measure = () => paper.offsetHeight / PAGE_HEIGHT_PX;
    const nextLayout = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const startScale = design.scale;
    let scale = startScale;
    setFitNote('');
    setFitting(true);
    while (measure() > 1.005 && scale > SCALE_MIN + 1e-6) {
      scale = round(Math.max(SCALE_MIN, scale - SCALE_STEP));
      onChange({ scale });
      await nextLayout();
    }
    const finalPages = measure();
    if (finalPages > 1.005) {
      onChange({ scale: startScale });
      setFitNote(
        `Still ${Math.ceil(finalPages - 0.01)} pages at the smallest size, so the size was left unchanged. Shorten a few bullets or try the Compact template.`
      );
    }
    setFitting(false);
  };

  useEffect(() => {
    if (pageCount === 1) setFitNote('');
  }, [pageCount]);

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
    <div className="space-y-6 rounded-[2px] border border-rule bg-surface p-4">
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
            className="w-32 rounded-[2px] border border-rule aria-invalid:border-amber-600 bg-surface px-2.5 py-1.5 font-label text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
          className="mt-2 block w-full rounded-[2px] border border-rule bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {FONT_PRESETS.map((f) => (
            <option key={f.id} value={f.id}>
              {'kind' in f ? `${f.name} · ${f.kind}` : f.name}
            </option>
          ))}
        </select>
      </div>

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
            {pageCount === null ? '' : pageCount === 1 ? 'Fits on 1 page' : `${pageCount} pages`}
          </span>
          <div className="flex gap-2">
            {pageCount !== null && pageCount > 1 && (
              <button
                type="button"
                disabled={fitting || design.scale <= SCALE_MIN}
                onClick={startFit}
                className="focus-ring h-8 rounded-[2px] bg-ink px-3 text-xs font-medium text-paper hover:bg-ink-hover disabled:opacity-50"
              >
                {fitting ? 'Fitting…' : design.scale <= SCALE_MIN ? 'At minimum size' : 'Fit to one page'}
              </button>
            )}
            {!isDefault && (
              <button
                type="button"
                onClick={() => onChange(DEFAULT_DESIGN)}
                className="focus-ring h-8 rounded-[2px] border border-ink px-3 text-xs font-medium text-ink hover:bg-ink/5"
              >
                Reset style
              </button>
            )}
          </div>
        </div>
        {fitNote && (
          <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300" role="status">
            {fitNote}
          </p>
        )}
      </div>
    </div>
  );
};

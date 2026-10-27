import { useEffect, useState } from 'react';
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
  const [hexDraft, setHexDraft] = useState(design.accent);

  useEffect(() => setHexDraft(design.accent), [design.accent]);

  // Fit to one page: step the scale down one notch per layout until the preview fits or hits the minimum.
  useEffect(() => {
    if (!fitting || pages === null) return;
    if (pages <= 1.005 || design.scale <= SCALE_MIN + 1e-6) {
      setFitting(false);
      return;
    }
    onChange({ scale: round(Math.max(SCALE_MIN, design.scale - SCALE_STEP)) });
  }, [fitting, pages, design.scale, onChange]);

  const contrast = HEX.test(hexDraft) ? contrastOnWhite(hexDraft) : null;
  const isCustom = design.accent !== '' && !ACCENT_PRESETS.some((p) => p.value.toLowerCase() === design.accent.toLowerCase());
  const isDefault = design.accent === DEFAULT_DESIGN.accent && design.font === DEFAULT_DESIGN.font && design.scale === DEFAULT_DESIGN.scale;

  const swatch = 'relative h-8 w-8 rounded-full ring-offset-2 ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:ring-offset-slate-900';

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <fieldset>
        <legend className="text-sm font-medium text-slate-800 dark:text-slate-200">Accent colour</legend>
        <div className="mt-3 flex flex-wrap items-center gap-2.5" role="radiogroup" aria-label="Accent colour">
          <button
            type="button"
            role="radio"
            aria-checked={design.accent === ''}
            onClick={() => onChange({ accent: '' })}
            title="Template default"
            className={`${swatch} flex items-center justify-center border border-dashed border-slate-300 bg-white text-[10px] font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 ${
              design.accent === '' ? 'ring-2 ring-indigo-600' : ''
            }`}
          >
            Auto
          </button>
          {ACCENT_PRESETS.map((p) => {
            const selected = design.accent.toLowerCase() === p.value.toLowerCase();
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={p.name}
                title={p.name}
                onClick={() => onChange({ accent: p.value })}
                className={`${swatch} ${selected ? 'ring-2 ring-indigo-600' : ''}`}
                style={{ backgroundColor: p.value }}
              >
                {selected && <CheckIcon className="absolute inset-0 m-auto h-4 w-4 text-white" />}
              </button>
            );
          })}
          <label
            className={`${swatch} cursor-pointer overflow-hidden bg-[conic-gradient(#ef4444,#f59e0b,#22c55e,#06b6d4,#6366f1,#d946ef,#ef4444)] ${isCustom ? 'ring-2 ring-indigo-600' : ''}`}
            title="Custom colour"
          >
            <span className="sr-only">Custom colour</span>
            <input
              type="color"
              value={HEX.test(design.accent) ? design.accent : '#4338ca'}
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
            onChange={(e) => {
              const v = e.target.value.trim();
              setHexDraft(v);
              if (HEX.test(v)) onChange({ accent: v.toUpperCase() });
              else if (v === '') onChange({ accent: '' });
            }}
            className="w-32 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {contrast !== null && (
            <span
              className={`text-xs ${contrast >= 4.5 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}
            >
              {contrast >= 4.5 ? `Readable · ${contrast.toFixed(1)}:1` : `Low contrast · ${contrast.toFixed(1)}:1 — pick a darker shade`}
            </span>
          )}
        </div>
      </fieldset>

      <div>
        <label htmlFor="design-font" className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Font
        </label>
        <select
          id="design-font"
          value={design.font}
          onChange={(e) => onChange({ font: e.target.value })}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
          <label htmlFor="design-scale" className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Text size
          </label>
          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{Math.round(design.scale * 100)}%</span>
        </div>
        <input
          id="design-scale"
          type="range"
          min={SCALE_MIN}
          max={SCALE_MAX}
          step={SCALE_STEP}
          value={design.scale}
          onChange={(e) => onChange({ scale: round(Number(e.target.value)) })}
          className="mt-2 w-full accent-indigo-600"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
            {pageCount === null ? '' : pageCount === 1 ? 'Fits on 1 page' : `${pageCount} pages`}
          </span>
          <div className="flex gap-2">
            {pageCount !== null && pageCount > 1 && (
              <button
                type="button"
                disabled={fitting || design.scale <= SCALE_MIN}
                onClick={() => setFitting(true)}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {fitting ? 'Fitting…' : design.scale <= SCALE_MIN ? 'At minimum size' : 'Fit to one page'}
              </button>
            )}
            {!isDefault && (
              <button
                type="button"
                onClick={() => onChange(DEFAULT_DESIGN)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-300 hover:bg-white dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                Reset style
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

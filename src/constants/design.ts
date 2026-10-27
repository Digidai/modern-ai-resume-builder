import type { CSSProperties } from 'react';
import type { ResumeDesign } from '../types';

/** Accent presets; every one has ≥ 4.5:1 contrast on white, so it is safe for text. */
export const ACCENT_PRESETS = [
  { name: 'Indigo', value: '#4338CA' },
  { name: 'Ocean', value: '#2F5A8A' },
  { name: 'Teal', value: '#1F6E73' },
  { name: 'Forest', value: '#3E6B4F' },
  { name: 'Plum', value: '#6B3E6E' },
  { name: 'Wine', value: '#8A2C3F' },
  { name: 'Rust', value: '#A0442A' },
  { name: 'Ochre', value: '#7A5A12' },
  { name: 'Graphite', value: '#3B3F45' },
  { name: 'Black', value: '#111111' },
] as const;

/** Paper font families that a preset can stand in for (all non-monospace families). */
const OVERRIDABLE_FAMILIES = [
  'sans',
  'serif',
  'inter',
  'source-sans',
  'roboto',
  'lato',
  'raleway',
  'montserrat',
  'source-serif',
  'garamond',
  'playfair',
  'tinos',
  'charis',
  'plex-serif',
] as const;

export const FONT_PRESETS = [
  { id: 'template', name: 'Template default', family: '' },
  { id: 'inter', name: 'Inter', kind: 'Sans', family: 'inter' },
  { id: 'source-sans', name: 'Source Sans', kind: 'Sans', family: 'source-sans' },
  { id: 'lato', name: 'Lato', kind: 'Sans', family: 'lato' },
  { id: 'roboto', name: 'Roboto', kind: 'Sans', family: 'roboto' },
  { id: 'source-serif', name: 'Source Serif', kind: 'Serif', family: 'source-serif' },
  { id: 'charis', name: 'Charis', kind: 'Serif', family: 'charis' },
  { id: 'garamond', name: 'EB Garamond', kind: 'Serif', family: 'garamond' },
  { id: 'tinos', name: 'Tinos (Times)', kind: 'Serif', family: 'tinos' },
  { id: 'plex-serif', name: 'IBM Plex Serif', kind: 'Serif', family: 'plex-serif' },
] as const;

export const SCALE_MIN = 0.85;
export const SCALE_MAX = 1.15;
export const SCALE_STEP = 0.05;

const channel = (hex: string, offset: number) => {
  const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG contrast ratio of a #rrggbb colour against white. */
export const contrastOnWhite = (hex: string): number => {
  const l = 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  return 1.05 / (l + 0.05);
};

/**
 * CSS custom properties applied to the paper. Templates read `--rs-accent` through their own
 * `--accent` (with a template default) and use the generic/named font utilities, so these
 * overrides work without any per-template code.
 */
export const designStyle = (design: ResumeDesign): CSSProperties => {
  const style: Record<string, string> = {};
  if (design.accent) style['--rs-accent'] = design.accent;
  const preset = FONT_PRESETS.find((p) => p.id === design.font);
  if (preset?.family) {
    for (const family of OVERRIDABLE_FAMILIES) style[`--font-${family}`] = `var(--rf-${preset.family})`;
  }
  return style as CSSProperties;
};

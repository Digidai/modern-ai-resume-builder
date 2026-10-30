export type PaperId = 'a4' | 'letter';

/** Paper sizes the resume prints on. `css` is the `@page size` keyword; `pt` is the PDF page size. */
export const PAPERS = {
  a4: { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297, css: 'A4', pt: [595.28, 841.89] as const },
  letter: { id: 'letter', label: 'US Letter', widthMm: 215.9, heightMm: 279.4, css: 'letter', pt: [612, 792] as const },
} as const;

export const PAPER_IDS = Object.keys(PAPERS) as PaperId[];
export const DEFAULT_PAPER: PaperId = 'a4';

/** The paper for a design value or a paper element's `data-paper`; anything unknown is A4. */
export const paperSize = (paper: string | undefined | null) => PAPERS[paper === 'letter' ? 'letter' : 'a4'];

export const PRINT_CONFIG = {
  MARGIN_STANDARD_MM: 15,
  MARGIN_FULL_BLEED_MM: 0,
} as const;

export const MM_TO_PX = 96 / 25.4;

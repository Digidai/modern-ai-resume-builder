export const PRINT_CONFIG = {
  PAGE_WIDTH_MM: 210,
  PAGE_HEIGHT_MM: 297,
  MARGIN_STANDARD_MM: 15,
  MARGIN_FULL_BLEED_MM: 0,
  /** Full-bleed templates own page 1's margins; when they run longer, later pages get this top and bottom margin. */
  MARGIN_CONTINUATION_MM: 12,
} as const;

export const A4_DIMENSIONS = {
  WIDTH_PT: 595.28,
  HEIGHT_PT: 841.89,
} as const;

export const MM_TO_PX = 96 / 25.4;
export const PAGE_HEIGHT_PX = PRINT_CONFIG.PAGE_HEIGHT_MM * MM_TO_PX;


import { PDFDocument } from 'pdf-lib';
import { toPng } from 'html-to-image';
import { ResumeData } from '../types';
import { isFullBleedTemplate } from '../constants/templates';
import { PAGE_HEIGHT_PX, MM_TO_PX } from '../constants/print';
import { measurePrintLayout, pageBoxMm, repeatedFrameSpace, SUPPORTS_CLONE, withPrintedPages } from './printLayout';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const EXPORT_PIXEL_RATIO = 2;
const MM_TO_PT = 72 / 25.4;

interface ExportResumeToPdfOptions {
  rawFileName: string;
  data: ResumeData;
  previewElementId?: string;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load export image'));
    img.src = src;
  });

const sanitizeFileName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '');

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const getPreviewElement = async (previewElementId: string): Promise<HTMLElement> => {
  const immediate = document.getElementById(previewElementId);
  if (immediate) return immediate;

  await nextFrame();
  const retried = document.getElementById(previewElementId);
  if (!retried) {
    throw new Error('Resume preview is not ready yet.');
  }

  return retried;
};

/**
 * html-to-image copies every computed style inline but rounds font sizes down (13.5px becomes 12.9px), so
 * text wraps differently than on the page and leaves gaps. It copies all properties except font-size, and
 * `withExactFontSizes` sets each element's exact font size inline (inline styles survive its cloning).
 */
const captureOptions = (fontEmbedCSS: string) => ({
  cacheBust: true,
  pixelRatio: EXPORT_PIXEL_RATIO,
  backgroundColor: '#ffffff',
  fontEmbedCSS,
  includeStyleProperties: Array.from(getComputedStyle(document.documentElement)).filter((name) => name !== 'font-size'),
});

const withExactFontSizes = async <T,>(root: HTMLElement, capture: () => Promise<T>): Promise<T> => {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  const previous = elements.map((element) => element.style.fontSize);
  const sizes = elements.map((element) => getComputedStyle(element).fontSize);
  elements.forEach((element, index) => element.style.setProperty('font-size', sizes[index]));
  try {
    return await capture();
  } finally {
    elements.forEach((element, index) => (element.style.fontSize = previous[index]));
  }
};

const newCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, context };
};

/**
 * Captures the print layout itself (page-sized columns of the paper, with repeating page frames) and cuts
 * it into pages. For browsers that repeat frames on every page (Chromium, Firefox) and standard templates.
 */
const capturePagesAsColumns = (element: HTMLElement, fullBleed: boolean, fontEmbedCSS: string) =>
  withPrintedPages(element, fullBleed, async (host, layout) => {
    await nextFrame();
    const width = layout.pages * layout.columnWidthPx + (layout.pages - 1) * layout.gapPx;
    const dataUrl = await withExactFontSizes(host, () => toPng(host, {
      ...captureOptions(fontEmbedCSS),
      width,
      height: layout.columnHeightPx,
      // `width` above sizes the canvas to include the overflowing columns; the host keeps its measured width.
      style: { position: 'static', left: '0', top: '0', opacity: '1', width: `${layout.columnWidthPx}px` },
    }));
    if (!dataUrl) throw new Error('Failed to generate image from resume');
    const image = await loadImage(dataUrl);
    // html-to-image shrinks very wide canvases (about 10+ pages), so use the scale it actually produced.
    const ratio = image.width / width;
    return Array.from({ length: layout.pages }, (_, index) => {
      const { canvas, context } = newCanvas(layout.columnWidthPx * ratio, layout.columnHeightPx * ratio);
      context.drawImage(image, Math.round(index * (layout.columnWidthPx + layout.gapPx) * ratio), 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      return canvas;
    });
  });

/**
 * Full-bleed templates in Safari, which doesn't repeat page frames across pages: captures the paper as on
 * screen and cuts it at the predicted page breaks. Each later page starts below the frames' top space, and
 * the space above and below each page's content is filled with the background just outside it.
 */
const capturePagesBySlicing = async (element: HTMLElement, fontEmbedCSS: string) => {
  const { pages, breaksMm } = measurePrintLayout(element, true);
  const space = repeatedFrameSpace(element);
  const widthPx = element.offsetWidth;
  const heightPx = element.offsetHeight;
  const dataUrl = await withExactFontSizes(element, () => toPng(element, {
    ...captureOptions(fontEmbedCSS),
    width: widthPx,
    height: heightPx,
    filter: (node) => !(node instanceof HTMLElement) || node.dataset.exportIgnore !== 'true',
    // The on-screen preview may be visually scaled; capture it at its layout size.
    style: { transform: 'none', margin: '0', boxShadow: 'none' },
  }));
  if (!dataUrl) throw new Error('Failed to generate image from resume');
  const image = await loadImage(dataUrl);
  const ratio = image.width / widthPx;
  const pageHeight = PAGE_HEIGHT_PX * ratio;
  const cuts = [0, ...breaksMm.map((mm) => mm * MM_TO_PX * ratio), image.height];
  // Stretches one row of the capture over a band, so plain backgrounds (sidebars, dark pages) continue.
  const band = (context: CanvasRenderingContext2D, row: number, top: number, height: number) => {
    if (height > 0) context.drawImage(image, 0, Math.min(image.height - 1, Math.max(0, Math.round(row))), image.width, 1, 0, top, image.width, height);
  };
  return Array.from({ length: pages }, (_, index) => {
    const { canvas, context } = newCanvas(image.width, pageHeight);
    const from = cuts[index];
    const top = index === 0 ? 0 : Math.round(space.top * ratio);
    const height = Math.min(cuts[index + 1] - from, pageHeight - top);
    band(context, from - 1, 0, top);
    context.drawImage(image, 0, Math.round(from), image.width, Math.round(height), 0, top, image.width, Math.round(height));
    band(context, from + height - 1, top + Math.round(height), pageHeight - top - Math.round(height));
    return canvas;
  });
};

export const exportResumeToPdf = async ({
  rawFileName,
  data,
  previewElementId = 'resume-preview-container',
}: ExportResumeToPdfOptions) => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const element = await getPreviewElement(previewElementId);
  await nextFrame();

  const safeName = sanitizeFileName(rawFileName) || 'resume';

  // Best path: the server prints the exact preview to a vector PDF (selectable text, all templates).
  try {
    const { renderPdfOnServer } = await import('./serverPdf');
    downloadBlob(await renderPdfOnServer(element), `${safeName}.pdf`);
    return;
  } catch (error) {
    console.warn('Server PDF rendering unavailable, exporting in the browser instead.', error);
  }

  // Browser fallback: an image-based PDF of the same pagination print uses, so pages break, keep margins
  // and fill backgrounds like the vector PDF.
  const fullBleed = isFullBleedTemplate(data.templateId);
  const box = pageBoxMm(fullBleed);
  try {
    // Our own font CSS: html-to-image's font discovery throws in Firefox (it reads `@font-face` rules'
    // `style.fontFamily`, which Firefox doesn't expose).
    const fontEmbedCSS = await import('./serverPdf').then(({ buildFontEmbedCss }) => buildFontEmbedCss(element));
    const pageImages = fullBleed && !SUPPORTS_CLONE ? await capturePagesBySlicing(element, fontEmbedCSS) : await capturePagesAsColumns(element, fullBleed, fontEmbedCSS);

    const pdfDoc = await PDFDocument.create();
    for (const canvas of pageImages) {
      const slice = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
      const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
      page.drawImage(slice, {
        x: box.inset * MM_TO_PT,
        y: A4_HEIGHT_PT - (box.inset + box.height) * MM_TO_PT,
        width: box.width * MM_TO_PT,
        height: box.height * MM_TO_PT,
      });
    }

    const pdfBytes = await pdfDoc.save();
    downloadBlob(new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), `${safeName}.pdf`);
  } catch (error) {
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

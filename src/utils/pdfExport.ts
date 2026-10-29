import { PDFDocument } from 'pdf-lib';
import { toPng } from 'html-to-image';
import { ResumeData } from '../types';
import { isFullBleedTemplate } from '../constants/templates';
import { pageBoxMm, withPrintedPages } from './printLayout';

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

  // Browser fallback: an image-based PDF of the same pagination print uses (page-sized columns of the
  // paper, with repeating page frames), so pages break, keep margins and fill backgrounds like the vector PDF.
  const fullBleed = isFullBleedTemplate(data.templateId);
  const box = pageBoxMm(fullBleed);
  try {
    const { image, pages, pagePx, stridePx } = await withPrintedPages(element, fullBleed, async (host, layout) => {
      await nextFrame();
      const width = layout.pages * layout.columnWidthPx + (layout.pages - 1) * layout.gapPx;
      const dataUrl = await toPng(host, {
        cacheBust: true,
        pixelRatio: EXPORT_PIXEL_RATIO,
        backgroundColor: '#ffffff',
        width,
        height: layout.columnHeightPx,
        // `width` above sizes the canvas to include the overflowing columns; the host keeps its measured width.
        style: { position: 'static', left: '0', top: '0', opacity: '1', width: `${layout.columnWidthPx}px` },
      });
      if (!dataUrl) throw new Error('Failed to generate image from resume');
      const image = await loadImage(dataUrl);
      // html-to-image shrinks very wide canvases (about 10+ pages), so use the scale it actually produced.
      const ratio = image.width / width;
      return {
        image,
        pages: layout.pages,
        pagePx: { width: layout.columnWidthPx * ratio, height: layout.columnHeightPx * ratio },
        stridePx: (layout.columnWidthPx + layout.gapPx) * ratio,
      };
    });

    const pdfDoc = await PDFDocument.create();
    for (let index = 0; index < pages; index += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(pagePx.width);
      canvas.height = Math.round(pagePx.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is not available');
      context.drawImage(image, Math.round(index * stridePx), 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
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

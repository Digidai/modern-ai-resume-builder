import { PDFDocument } from 'pdf-lib';
import { toPng } from 'html-to-image';
import { ResumeData } from '../types';
import { PRINT_CONFIG } from '../constants/print';
import { isFullBleedTemplate } from '../constants/templates';
import { measurePrintLayout } from './printLayout';

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

  // Browser fallback: an image-based PDF. Pages are cut where printing would break them (never through a
  // line) and continuation pages get the same top margin as the vector PDF.
  const fullBleed = isFullBleedTemplate(data.templateId);
  const { pages, breaksMm } = measurePrintLayout(element, fullBleed);

  const clone = element.cloneNode(true) as HTMLElement;
  // offsetWidth is the layout width; the on-screen preview may be visually scaled with a transform.
  const safeWidth = Math.max(1, Math.round(element.offsetWidth || element.scrollWidth || 794));
  clone.removeAttribute('id');
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';
  clone.style.height = 'auto';
  clone.style.width = `${safeWidth}px`;
  clone.querySelectorAll('[data-export-ignore="true"]').forEach((node) => node.remove());

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, { position: 'fixed', left: '-100000px', top: '0', opacity: '0', zIndex: '-1', pointerEvents: 'none', width: `${safeWidth}px` });
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  let dataUrl = '';
  try {
    await nextFrame();
    dataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio: EXPORT_PIXEL_RATIO,
      backgroundColor: '#ffffff',
      width: clone.scrollWidth || safeWidth,
      height: clone.scrollHeight,
    });
    if (!dataUrl) throw new Error('Failed to generate image from resume');
  } catch (error) {
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    wrapper.remove();
  }

  try {
    const image = await loadImage(dataUrl);
    const pxPerMm = image.width / PRINT_CONFIG.PAGE_WIDTH_MM;
    const imageHeightMm = image.height / pxPerMm;
    const topMarginMm = fullBleed ? PRINT_CONFIG.MARGIN_CONTINUATION_MM : PRINT_CONFIG.MARGIN_STANDARD_MM;
    const pdfDoc = await PDFDocument.create();

    let fromMm = 0;
    for (let index = 0; index < pages; index += 1) {
      // Page 1 is the top of the paper as-is (it carries its own margin); later pages continue from
      // their break, placed below the top margin.
      const capacityMm = PRINT_CONFIG.PAGE_HEIGHT_MM - (index === 0 ? 0 : topMarginMm);
      const toMm = Math.min(breaksMm[index] ?? Infinity, imageHeightMm, fromMm + capacityMm);
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = Math.max(1, Math.round((toMm - fromMm) * pxPerMm));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is not available');
      context.drawImage(image, 0, Math.round(fromMm * pxPerMm), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

      const slice = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
      const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
      const heightPt = (canvas.height / pxPerMm) * MM_TO_PT;
      const topPt = (index === 0 ? 0 : topMarginMm) * MM_TO_PT;
      page.drawImage(slice, { x: 0, y: A4_HEIGHT_PT - topPt - heightPt, width: A4_WIDTH_PT, height: heightPt });
      fromMm = toMm;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
    downloadBlob(blob, `${safeName}.pdf`);
  } catch (error) {
    throw new Error(`Failed to create PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

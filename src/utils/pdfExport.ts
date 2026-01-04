import { PDFDocument } from 'pdf-lib';
import { toPng } from 'html-to-image';
import { ResumeData } from '../types';
import { exportResumeVectorPdf, supportsVectorTemplate } from './pdfVectorExport';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const EXPORT_PIXEL_RATIO = 2;
const PAGE_SPLIT_EPSILON_PT = 1;

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

export const exportResumeToPdf = async (element: HTMLElement, rawFileName: string, data: ResumeData) => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const safeName = sanitizeFileName(rawFileName) || 'resume';

  // Try Vector Export for supported templates
  if (supportsVectorTemplate(data.templateId)) {
    try {
      const blob = await exportResumeVectorPdf(data);
      downloadBlob(blob, `${safeName}.pdf`);
      return;
    } catch (error) {
      console.warn('Vector PDF export failed/skipped, falling back to image export.', error);
      // Fallthrough to image export
    }
  }

  // Preserve the on-screen layout (padding/backgrounds) for higher fidelity.
  const marginPt = 0;
  const contentWidth = A4_WIDTH_PT;
  const contentHeight = A4_HEIGHT_PT;

  const clone = element.cloneNode(true) as HTMLElement;
  const baseWidth = element.getBoundingClientRect().width || element.scrollWidth;
  const fallbackWidth = element.scrollWidth || 794;
  const safeWidth = Math.max(1, Math.round(baseWidth || fallbackWidth));
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';
  clone.style.height = 'auto';
  clone.style.width = `${safeWidth}px`;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.opacity = '0';
  wrapper.style.zIndex = '-1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.width = `${safeWidth}px`;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  clone.querySelectorAll('[data-export-ignore="true"]').forEach((node) => node.remove());

  const width = clone.scrollWidth || safeWidth;
  const height = clone.scrollHeight;

  let dataUrl = '';
  try {
    dataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio: EXPORT_PIXEL_RATIO,
      backgroundColor: '#ffffff',
      width,
      height,
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return node.dataset.exportIgnore !== 'true';
      },
    });
  } finally {
    wrapper.remove();
  }

  const image = await loadImage(dataUrl);
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(dataUrl);

  const pageWidth = A4_WIDTH_PT;
  const pageHeight = A4_HEIGHT_PT;
  const scale = contentWidth / image.width;
  const scaledHeight = image.height * scale;
  // Avoid spurious extra pages from sub-point rounding when height ~= A4.
  const pageCount = Math.max(1, Math.ceil((scaledHeight - PAGE_SPLIT_EPSILON_PT) / contentHeight));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const y = marginPt + contentHeight - scaledHeight + contentHeight * pageIndex;
    page.drawImage(pngImage, {
      x: marginPt,
      y,
      width: contentWidth,
      height: scaledHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  downloadBlob(blob, `${safeName}.pdf`);
};

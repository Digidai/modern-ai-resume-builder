import { PDFDocument } from 'pdf-lib';
import { toPng } from 'html-to-image';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const EXPORT_PIXEL_RATIO = 2;

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

export const exportResumeToPdf = async (element: HTMLElement, rawFileName: string) => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const width = element.scrollWidth;
  const height = element.scrollHeight;

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    width,
    height,
    style: {
      boxShadow: 'none',
      margin: '0',
    },
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return node.dataset.exportIgnore !== 'true';
    },
  });

  const image = await loadImage(dataUrl);
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(dataUrl);

  const pageWidth = A4_WIDTH_PT;
  const pageHeight = A4_HEIGHT_PT;
  const scale = pageWidth / image.width;
  const scaledHeight = image.height * scale;
  const pageCount = Math.max(1, Math.ceil(scaledHeight / pageHeight));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const y = pageHeight - scaledHeight + pageHeight * pageIndex;
    page.drawImage(pngImage, {
      x: 0,
      y,
      width: pageWidth,
      height: scaledHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const safeName = sanitizeFileName(rawFileName) || 'resume';
  downloadBlob(blob, `${safeName}.pdf`);
};

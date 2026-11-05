// Client side of "Import resume": reads the text of a PDF, Word (.docx), LaTeX or text file in the
// browser, so only that text is sent to the AI parser.

export type ResumeSourceKind = 'latex' | 'text';

export interface ResumeSource {
  kind: ResumeSourceKind;
  text: string;
  /** The headshot found in a PDF or Word file, as an image; it is never sent to the AI. */
  photo?: Blob;
}

/** A displayed image that can be a headshot: portrait to square, between 0.5 and 3.5 inches wide (sizes in points). */
const isHeadshotBox = (width: number, height: number) => width >= 36 && width <= 252 && height / width >= 0.75 && height / width <= 1.6;

/** Why a file can't be read; the dialog shows the message. */
export class ResumeFileError extends Error {}

const MAX_FILE_BYTES = 10_000_000;

/** LaTeX when it has a document class or a few macros with arguments; anything else is plain text. */
export const looksLikeLatex = (text: string): boolean =>
  /\\documentclass|\\begin\{document\}/.test(text) || (text.match(/\\[A-Za-z]+\s*[{[]/g) ?? []).length >= 5;

/** Trims each line, keeps one blank line between blocks and drops invisible characters. */
export const tidyResumeText = (text: string): string =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00AD\u200B\uFEFF]/g, '')
    .split('\n')
    .map((line) => line.replace(/[\t\u00A0]/g, ' ').trim())
    // Letter-spaced headings come out as "S K I L L S" (words two or more spaces apart).
    .map((line) => (/^\S(?: +\S){2,}$/.test(line) ? line.split(/ {2,}/).map((word) => word.replace(/ /g, '')).join(' ') : line.replace(/ {2,}/g, ' ')))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Link URLs that the visible text doesn't already show, as a list the parser can match up. */
const withLinks = (text: string, urls: string[]): string => {
  const extra = [...new Set(urls.map((url) => url.trim()))].filter((url) => /^(https?:|mailto:)/i.test(url) && !text.includes(url.replace(/^mailto:/i, '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')));
  return extra.length ? `${text}\n\nLinks in the file:\n${extra.join('\n')}` : text;
};

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type PdfPage = Awaited<ReturnType<Awaited<ReturnType<PdfJs['getDocument']>['promise']>['getPage']>>;

/** The decoded pixels of a pdf.js image object as a PNG; null for 1-bit images and masks. */
const pdfImageBlob = async (pdfjs: PdfJs, image: { width: number; height: number; bitmap?: ImageBitmap; data?: Uint8ClampedArray; kind?: number }): Promise<Blob | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  if (image.bitmap) context.drawImage(image.bitmap, 0, 0);
  else if (image.data && (image.kind === pdfjs.ImageKind.RGBA_32BPP || image.kind === pdfjs.ImageKind.RGB_24BPP)) {
    const rgba = new Uint8ClampedArray(image.width * image.height * 4);
    if (image.kind === pdfjs.ImageKind.RGBA_32BPP) rgba.set(image.data.subarray(0, rgba.length));
    else for (let i = 0, j = 0; j < rgba.length; i += 3, j += 4) rgba.set([image.data[i], image.data[i + 1], image.data[i + 2], 255], j);
    context.putImageData(new ImageData(rgba, image.width, image.height), 0, 0);
  } else return null;
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
};

/**
 * The headshot on a PDF page: the largest image drawn portrait to square and 0.5–3.5 in wide in the top
 * half of the page. Logos, icons and full-page backgrounds fall outside that; the preview shows the pick.
 */
const pdfPhoto = async (pdfjs: PdfJs, page: PdfPage): Promise<Blob | null> => {
  const { fnArray, argsArray } = await page.getOperatorList();
  const [, , , pageTop] = page.view;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  let best: { id: string; area: number } | null = null;
  for (let i = 0; i < fnArray.length; i += 1) {
    const fn = fnArray[i];
    const args = argsArray[i];
    if (fn === pdfjs.OPS.save) stack.push(ctm);
    else if (fn === pdfjs.OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === pdfjs.OPS.transform) ctm = pdfjs.Util.transform(ctm, args);
    else if (fn === pdfjs.OPS.paintFormXObjectBegin) {
      stack.push(ctm);
      if (Array.isArray(args[0])) ctm = pdfjs.Util.transform(ctm, args[0]);
    } else if (fn === pdfjs.OPS.paintFormXObjectEnd) ctm = stack.pop() ?? ctm;
    else if (fn === pdfjs.OPS.paintImageXObject && typeof args[0] === 'string') {
      // An image fills the unit square of the current transform.
      const [a, b, c, d, , f] = ctm;
      const width = Math.hypot(a, b);
      const height = Math.hypot(c, d);
      const top = Math.max(f, f + b, f + d, f + b + d);
      if (isHeadshotBox(width, height) && top > pageTop / 2 && (!best || width * height > best.area)) best = { id: args[0], area: width * height };
    }
  }
  if (!best) return null;
  const { id } = best;
  const objects = id.startsWith('g_') ? page.commonObjs : page.objs;
  const image = await new Promise<Parameters<typeof pdfImageBlob>[1] | null>((resolve) => {
    objects.get(id, resolve);
    setTimeout(() => resolve(null), 3000);
  });
  return image && image.width >= 64 && image.height >= 64 ? pdfImageBlob(pdfjs, image) : null;
};

const pdfText = async (file: File): Promise<{ text: string; photo: Blob | null }> => {
  const [pdfjs, { default: workerUrl }] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), disableFontFace: true });
  let pdf;
  try {
    pdf = await task.promise;
  } catch (error) {
    if ((error as { name?: string })?.name === 'PasswordException') throw new ResumeFileError('That PDF is password-protected. Save a copy without a password and try again.');
    throw new ResumeFileError("Couldn't open that PDF. Export it again, or paste the text instead.");
  }
  const pages: string[] = [];
  const urls: string[] = [];
  let photo: Blob | null = null;
  try {
    for (let n = 1; n <= Math.min(pdf.numPages, 12); n += 1) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      let line = '';
      const lines: string[] = [];
      let lastY: number | null = null;
      let lastEnd = 0;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const [, , , , x, y] = item.transform;
        // The content stream keeps a column's lines together; a jump in y without an end-of-line mark is a new line too.
        if (lastY !== null && Math.abs(y - lastY) > Math.max(2, item.height * 0.5) && line.trim()) {
          lines.push(line);
          line = '';
        }
        // Runs of one word are often split (an email in two spans); only a visible gap is a space. Gaps are
        // written as two spaces so tidyResumeText can tell words apart in letter-spaced headings.
        const gap = x - lastEnd > Math.max(1, item.height * 0.15);
        line += !item.str.trim() ? '  ' : line && gap ? `  ${item.str}` : item.str;
        if (item.str.trim()) {
          lastY = y;
          lastEnd = x + item.width;
        }
        if (item.hasEOL) {
          lines.push(line);
          line = '';
        }
      }
      lines.push(line);
      pages.push(lines.join('\n'));
      for (const annotation of await page.getAnnotations()) {
        if (typeof annotation.url === 'string') urls.push(annotation.url);
      }
      // A photo that can't be read just isn't imported.
      if (n === 1) photo = await pdfPhoto(pdfjs, page).catch(() => null);
      page.cleanup();
    }
  } finally {
    void task.destroy();
  }
  const text = tidyResumeText(pages.join('\n\n'));
  if (text.replace(/\s/g, '').length < 40) {
    throw new ResumeFileError('This PDF has no text to read; it is probably a scan or an image. Export it again from Word or Google Docs, or paste the text.');
  }
  return { text: withLinks(text, urls), photo };
};

/** One file from a .zip (a .docx is one), inflated with the browser's DecompressionStream. */
const unzipEntry = async (bytes: Uint8Array, name: string): Promise<Uint8Array | null> => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end -= 1;
  if (end < 0) return null;
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  for (let i = 0; i < count && view.getUint32(at, true) === 0x02014b50; i += 1) {
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const skip = nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    if (decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength)) === name) {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const data = bytes.subarray(start, start + size);
      if (method === 0) return data;
      if (method !== 8) return null;
      return new Uint8Array(await new Response(new Response(data.slice()).body!.pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    }
    at += 46 + skip;
  }
  return null;
};

const unzipText = async (bytes: Uint8Array, name: string) => {
  const data = await unzipEntry(bytes, name);
  return data && new TextDecoder().decode(data);
};

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/** The text of a .docx: one line per paragraph, list items as "- " bullets, hyperlinks' URLs collected. */
export const docxText = async (bytes: Uint8Array): Promise<string> => {
  const xml = await unzipText(bytes, 'word/document.xml');
  if (!xml) throw new ResumeFileError("Couldn't read that Word file. Save it as .docx or PDF and try again.");
  const relsXml = await unzipText(bytes, 'word/_rels/document.xml.rels');
  const targets = new Map<string, string>();
  if (relsXml) {
    for (const rel of Array.from(new DOMParser().parseFromString(relsXml, 'application/xml').getElementsByTagName('Relationship'))) {
      if (rel.getAttribute('TargetMode') === 'External') targets.set(rel.getAttribute('Id') ?? '', rel.getAttribute('Target') ?? '');
    }
  }
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const urls: string[] = [];
  const read = (node: Element): string => {
    let text = '';
    for (const child of Array.from(node.children)) {
      if (child.namespaceURI !== W) continue;
      switch (child.localName) {
        case 't':
          text += child.textContent ?? '';
          break;
        case 'tab':
          text += '\t';
          break;
        case 'br':
        case 'cr':
          text += '\n';
          break;
        case 'hyperlink': {
          const url = targets.get(child.getAttributeNS(R, 'id') ?? '');
          if (url) urls.push(url);
          text += read(child);
          break;
        }
        case 'r':
        case 'ins':
        case 'smartTag':
        case 'sdt':
        case 'sdtContent':
        case 'fldSimple':
          text += read(child);
          break;
        default:
      }
    }
    return text;
  };
  const lines = Array.from(doc.getElementsByTagNameNS(W, 'p')).map((paragraph) => {
    const text = read(paragraph);
    const list = paragraph.getElementsByTagNameNS(W, 'numPr').length > 0;
    return list && text.trim() ? `- ${text.trim()}` : text;
  });
  return withLinks(tidyResumeText(lines.join('\n')), urls);
};

const IMAGE_TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp' };

/** The headshot in a .docx: the largest picture whose displayed size passes isHeadshotBox. */
export const docxPhoto = async (bytes: Uint8Array): Promise<Blob | null> => {
  const [xml, relsXml] = await Promise.all([unzipText(bytes, 'word/document.xml'), unzipText(bytes, 'word/_rels/document.xml.rels')]);
  if (!xml || !relsXml) return null;
  const targets = new Map(
    Array.from(new DOMParser().parseFromString(relsXml, 'application/xml').getElementsByTagName('Relationship')).map((rel) => [rel.getAttribute('Id') ?? '', rel.getAttribute('Target') ?? ''])
  );
  let best: { target: string; area: number } | null = null;
  // Each picture is a <w:drawing> with its displayed size in <wp:extent> (EMU, 12,700 per point) and the image in <a:blip r:embed>.
  for (const drawing of Array.from(new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagNameNS(W, 'drawing'))) {
    const extent = Array.from(drawing.getElementsByTagName('*')).find((node) => node.localName === 'extent');
    const blip = Array.from(drawing.getElementsByTagName('*')).find((node) => node.localName === 'blip');
    const target = targets.get(blip?.getAttributeNS(R, 'embed') ?? '');
    const width = Number(extent?.getAttribute('cx')) / 12700;
    const height = Number(extent?.getAttribute('cy')) / 12700;
    if (target && isHeadshotBox(width, height) && (!best || width * height > best.area)) best = { target, area: width * height };
  }
  if (!best) return null;
  const path = best.target.startsWith('/') ? best.target.slice(1) : `word/${best.target}`;
  const type = IMAGE_TYPES[path.split('.').pop()?.toLowerCase() ?? ''];
  const data = type ? await unzipEntry(bytes, path) : null;
  return data ? new Blob([data.slice()], { type }) : null;
};

/** Reads a chosen file; throws ResumeFileError with a message for the user when it can't. */
export const readResumeFile = async (file: File): Promise<ResumeSource> => {
  const name = file.name.toLowerCase();
  if (file.size > MAX_FILE_BYTES) throw new ResumeFileError('That file is larger than 10 MB.');
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const { text, photo } = await pdfText(file);
    return { kind: 'text', text, ...(photo ? { photo } : {}) };
  }
  if (name.endsWith('.docx')) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const [text, photo] = await Promise.all([docxText(bytes), docxPhoto(bytes).catch(() => null)]);
    if (!text) throw new ResumeFileError('That Word file has no text.');
    return { kind: 'text', text, ...(photo ? { photo } : {}) };
  }
  if (name.endsWith('.doc') || name.endsWith('.pages') || name.endsWith('.odt') || name.endsWith('.rtf')) {
    throw new ResumeFileError('Save it as PDF or Word (.docx) first, then choose that file.');
  }
  if (file.size > 1_000_000) throw new ResumeFileError('That text file is larger than 1 MB.');
  const text = await file.text();
  return looksLikeLatex(text) || /\.(tex|ltx)$/.test(name) ? { kind: 'latex', text } : { kind: 'text', text: tidyResumeText(text) };
};

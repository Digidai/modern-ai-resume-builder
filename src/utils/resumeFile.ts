// Client side of "Import resume": reads the text of a PDF, Word (.docx), LaTeX or text file in the
// browser, so only that text is sent to the AI parser.

export type ResumeSourceKind = 'latex' | 'text';

export interface ResumeSource {
  kind: ResumeSourceKind;
  text: string;
}

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

const pdfText = async (file: File): Promise<string> => {
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
      page.cleanup();
    }
  } finally {
    void task.destroy();
  }
  const text = tidyResumeText(pages.join('\n\n'));
  if (text.replace(/\s/g, '').length < 40) {
    throw new ResumeFileError('This PDF has no text to read; it is probably a scan or an image. Export it again from Word or Google Docs, or paste the text.');
  }
  return withLinks(text, urls);
};

/** One file from a .zip (a .docx is one), inflated with the browser's DecompressionStream. */
const unzipEntry = async (bytes: Uint8Array, name: string): Promise<string | null> => {
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
      if (method === 0) return decoder.decode(data);
      if (method !== 8) return null;
      return new Response(new Response(data.slice()).body!.pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    at += 46 + skip;
  }
  return null;
};

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/** The text of a .docx: one line per paragraph, list items as "- " bullets, hyperlinks' URLs collected. */
export const docxText = async (bytes: Uint8Array): Promise<string> => {
  const xml = await unzipEntry(bytes, 'word/document.xml');
  if (!xml) throw new ResumeFileError("Couldn't read that Word file. Save it as .docx or PDF and try again.");
  const relsXml = await unzipEntry(bytes, 'word/_rels/document.xml.rels');
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

/** Reads a chosen file; throws ResumeFileError with a message for the user when it can't. */
export const readResumeFile = async (file: File): Promise<ResumeSource> => {
  const name = file.name.toLowerCase();
  if (file.size > MAX_FILE_BYTES) throw new ResumeFileError('That file is larger than 10 MB.');
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return { kind: 'text', text: await pdfText(file) };
  if (name.endsWith('.docx')) {
    const text = await docxText(new Uint8Array(await file.arrayBuffer()));
    if (!text) throw new ResumeFileError('That Word file has no text.');
    return { kind: 'text', text };
  }
  if (name.endsWith('.doc') || name.endsWith('.pages') || name.endsWith('.odt') || name.endsWith('.rtf')) {
    throw new ResumeFileError('Save it as PDF or Word (.docx) first, then choose that file.');
  }
  if (file.size > 1_000_000) throw new ResumeFileError('That text file is larger than 1 MB.');
  const text = await file.text();
  return looksLikeLatex(text) || /\.(tex|ltx)$/.test(name) ? { kind: 'latex', text } : { kind: 'text', text: tidyResumeText(text) };
};

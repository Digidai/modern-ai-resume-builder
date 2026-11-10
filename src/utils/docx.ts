import type { ResumeData } from '../types';
import { BULLET_PATTERN, formatDateRange, getContactEntries, groupSkills, toHref } from '../components/templates/shared';
import { validateUrl } from './validation';
import { resumeFileName } from '../shared/fileName';

// The resume as an editable Word file (.docx) for portals and recruiters that ask for one. It is the
// plain single-column layout ATS parsers read best: real Heading 1 sections, Word's own bullet list,
// dates on a right tab stop, live links. Built by hand (a few XML parts in a stored zip), so no library.

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

const esc = (text: string) =>
  text
    // Characters XML 1.0 can't hold (Word refuses the file).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
}

const run = (text: string, style: RunStyle = {}) => {
  if (!text) return '';
  const props = `${style.bold ? '<w:b/>' : ''}${style.italic ? '<w:i/>' : ''}`;
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
};
const tab = '<w:r><w:tab/></w:r>';

const paragraph = (content: string, style?: string, extra = '') =>
  `<w:p>${style || extra ? `<w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}${extra}</w:pPr>` : ''}${content}</w:p>`;

/** Builds document.xml's body and collects the hyperlink relationships it uses. */
const buildBody = (data: ResumeData, textWidth: number) => {
  const rightTab = `<w:tabs><w:tab w:val="right" w:pos="${textWidth}"/></w:tabs>`;
  const links: string[] = [];
  const hyperlink = (url: string, label: string) => {
    links.push(url);
    return `<w:hyperlink r:id="rIdLink${links.length}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t xml:space="preserve">${esc(label)}</w:t></w:r></w:hyperlink>`;
  };
  const out: string[] = [];
  const heading = (title: string) => out.push(paragraph(run(title), 'Heading1'));
  /** Bold title, optional plain detail, dates flush right. */
  const entry = (title: string, detail: string, dates: string) =>
    out.push(paragraph(`${run(clean(title), { bold: true })}${detail ? run(`${title.trim() ? ', ' : ''}${clean(detail)}`) : ''}${dates ? `${tab}${run(dates)}` : ''}`, 'Entry', rightTab));
  /** Editor text: "- " lines become Word bullets, other lines paragraphs. */
  const rich = (text: string) => {
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      if (BULLET_PATTERN.test(line)) out.push(paragraph(run(clean(line.replace(BULLET_PATTERN, ''))), 'ListBullet', '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'));
      else out.push(paragraph(run(clean(line))));
    }
  };

  out.push(paragraph(run(clean(data.fullName) || 'Resume'), 'Title'));
  if (data.title.trim()) out.push(paragraph(run(clean(data.title)), 'Subtitle'));
  const contacts = getContactEntries(data);
  if (contacts.length) {
    out.push(
      paragraph(
        contacts.map((c) => (c.href && c.key !== 'phone' ? hyperlink(c.href, c.value) : run(c.value))).join(run('  ·  ')),
        'Contact'
      )
    );
  }

  const publications = data.publications ?? [];
  const awards = data.awards ?? [];
  const talks = data.talks ?? [];
  const teaching = data.teaching ?? [];
  const academic = publications.length + awards.length + talks.length + teaching.length > 0;

  const summary = () => {
    if (!data.summary.trim()) return;
    heading(academic ? 'Research Interests' : 'Summary');
    rich(data.summary);
  };
  const experience = () => {
    if (!data.experience.length) return;
    heading('Experience');
    for (const exp of data.experience) {
      const hours = /^\d+(?:\.\d+)?$/.test(exp.hours?.trim() ?? '') ? `${exp.hours!.trim()} hours per week` : clean(exp.hours ?? '');
      entry(exp.role, [exp.company, hours].map(clean).filter(Boolean).join(', '), formatDateRange(exp.startDate, exp.endDate, exp.isCurrent));
      rich(exp.description);
    }
  };
  const education = () => {
    if (!data.education.length) return;
    heading('Education');
    for (const edu of data.education) entry(edu.school || edu.degree, edu.school ? edu.degree : '', formatDateRange(edu.startDate, edu.endDate));
  };
  /** One line per entry with the year flush right. */
  const rows = (title: string, items: Array<{ bold: string; rest: string; year: string }>) => {
    if (!items.length) return;
    heading(title);
    for (const item of items) entry(item.bold, item.rest, clean(item.year));
  };

  summary();
  if (academic) {
    education();
    if (publications.length) {
      heading('Publications');
      publications.forEach((pub, index) => {
        const parts = [clean(pub.authors).replace(/[,;]$/, ''), pub.year.trim() ? `(${clean(pub.year)}).` : '', clean(pub.title), clean(pub.venue)].filter(Boolean);
        const link = pub.link.trim() && validateUrl(pub.link) ? ` ${hyperlink(toHref(pub.link), pub.link.trim())}` : '';
        out.push(paragraph(`${run(`[${index + 1}] ${parts.join(' ')}`)}${link}`, 'Entry', rightTab));
      });
    }
    rows('Grants and Awards', awards.map((a) => ({ bold: a.title, rest: [a.issuer, a.detail].map(clean).filter(Boolean).join(', '), year: a.year })));
    rows('Talks', talks.map((t) => ({ bold: t.title, rest: [t.event, t.location].map(clean).filter(Boolean).join(', '), year: t.year })));
    rows('Teaching', teaching.map((c) => ({ bold: c.course, rest: [c.role, c.institution].map(clean).filter(Boolean).join(', '), year: c.year })));
    experience();
  } else {
    experience();
    education();
  }
  if (data.projects.length) {
    heading('Projects');
    for (const proj of data.projects) {
      const link = proj.link.trim() && validateUrl(proj.link) ? `${tab}${hyperlink(toHref(proj.link), proj.link.trim().replace(/^https?:\/\//i, ''))}` : '';
      out.push(paragraph(`${run(clean(proj.name), { bold: true })}${link}`, 'Entry', rightTab));
      rich(proj.description);
    }
  }
  const skills = groupSkills(data.skills);
  if (skills.length) {
    heading('Skills');
    for (const group of skills) out.push(paragraph(`${group.category ? run(`${group.category}: `, { bold: true }) : ''}${run(group.items.join(', '))}`));
  }
  return { body: out.join(''), links };
};

const twips = (mm: number) => Math.round((mm / 25.4) * 1440);

const buildParts = (data: ResumeData): Record<string, string> => {
  const letter = data.design?.paper === 'letter';
  const width = twips(letter ? 215.9 : 210);
  const height = twips(letter ? 279.4 : 297);
  const margin = 1080; // 0.75 in
  const textWidth = width - 2 * margin;
  const { body, links } = buildBody(data, textWidth);
  const font = '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Microsoft YaHei" w:cs="Calibri"/>';

  return {
    '[Content_Types].xml': `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    '_rels/.rels': `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    'docProps/core.xml': `${XML_HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(clean(`${data.fullName} Resume`))}</dc:title><dc:creator>${esc(clean(data.fullName))}</dc:creator></cp:coreProperties>`,
    'word/_rels/document.xml.rels': `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${links
      .map((url, i) => `<Relationship Id="rIdLink${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(url)}" TargetMode="External"/>`)
      .join('')}</Relationships>`,
    'word/numbering.xml': `${XML_HEAD}<w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="300" w:hanging="220"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
    'word/styles.xml': `${XML_HEAD}<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="20"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="40"/></w:pPr><w:rPr><w:color w:val="404040"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Contact"><w:name w:val="Contact"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:color w:val="404040"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="808080"/></w:pBdr><w:spacing w:before="220" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:caps/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:customStyle="1" w:styleId="Entry"><w:name w:val="Entry"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:tabs><w:tab w:val="right" w:pos="${textWidth}"/></w:tabs><w:spacing w:before="100" w:after="20"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:numPr><w:numId w:val="1"/></w:numPr><w:spacing w:after="20"/></w:pPr></w:style>
<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="1F4E79"/><w:u w:val="single"/></w:rPr></w:style></w:styles>`,
    'word/document.xml': `${XML_HEAD}<w:document ${NS}><w:body>${body}<w:sectPr><w:pgSz w:w="${width}" w:h="${height}"/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  };
};

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

/** A zip of uncompressed (stored) files: Word opens them, and a resume is a few kilobytes anyway. */
const zip = (files: Record<string, string>): Uint8Array => {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centrals.length, true);
  ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
};

/** The resume as the bytes of a .docx file. */
export const toDocx = (data: ResumeData): Uint8Array => zip(buildParts(data));

/** Saves the resume as `<Name>_Resume.docx`. */
export const downloadDocx = (data: ResumeData): void => {
  const bytes = toDocx(data);
  const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = resumeFileName(data.fullName, 'docx');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

import type { ResumeData } from '../types';
import { BULLET_PATTERN, displayUrl, formatDateRange, getContactEntries, groupSkills, ownerNamePattern, toHref } from '../components/templates/shared';
import { validateUrl } from './validation';

// The resume as a standalone LaTeX document for Overleaf or a local TeX install. It uses only
// packages in every TeX Live (article, geometry, titlesec, enumitem, hyperref) and the classic CV
// look: small-caps section titles over a rule, dates flush right, Latin Modern. Text with CJK
// characters switches to XeLaTeX with xeCJK.

const SPECIAL: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  $: '\\$',
  '&': '\\&',
  '#': '\\#',
  '%': '\\%',
  _: '\\_',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

/** Escapes LaTeX's special characters and smart punctuation. */
export const escapeLatex = (value: string): string => escapeRaw(value).replace(/\s+/g, ' ').trim();

/** Escaping without trimming, for pieces of a line. */
const escapeRaw = (value: string): string =>
  value
    .replace(/[\\{}$&#%_~^]/g, (ch) => SPECIAL[ch])
    .replace(/–/g, '--')
    .replace(/—/g, '---')
    .replace(/[“”]/g, (ch) => (ch === '“' ? '``' : "''"))
    .replace(/[‘’]/g, (ch) => (ch === '‘' ? '`' : "'"));

/** Escapes a URL for \href (hyperref takes % and # escaped). */
const escapeUrl = (url: string) => url.replace(/\\/g, '/').replace(/([%#{}])/g, '\\$1');

const link = (url: string, label = displayUrl(url)) => `\\href{${escapeUrl(toHref(url))}}{${escapeLatex(label)}}`;

const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/;

export const latexEngine = (data: ResumeData): 'pdflatex' | 'xelatex' => (CJK.test(JSON.stringify(data)) ? 'xelatex' : 'pdflatex');

const bold = (text: string, owner: string) => {
  const pattern = ownerNamePattern(owner);
  if (!pattern) return escapeLatex(text);
  return text
    .split(pattern)
    .map((part, index) => (index % 2 === 1 ? `\\textbf{${escapeRaw(part)}}` : escapeRaw(part)))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
};

/** "- a\n- b\nplain" → itemize + paragraphs. */
const richText = (text: string): string => {
  const out: string[] = [];
  let items: string[] = [];
  const flush = () => {
    if (items.length) out.push(`\\begin{itemize}\n${items.map((item) => `  \\item ${escapeLatex(item)}`).join('\n')}\n\\end{itemize}`);
    items = [];
  };
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (BULLET_PATTERN.test(line)) items.push(line.replace(BULLET_PATTERN, ''));
    else {
      flush();
      out.push(`${escapeLatex(line)}\\par`);
    }
  }
  flush();
  return out.join('\n');
};

const entry = (primary: string, dates: string, secondary = '', extra = '') =>
  `\\entry{${escapeLatex(primary)}}{${escapeLatex(dates)}}{${escapeLatex(secondary)}}{${escapeLatex(extra)}}`;

/** Federal resumes list hours per week on every job: "40" → "40 hours per week". */
const hoursPerWeek = (hours = '') => (/^\d+(?:\.\d+)?$/.test(hours.trim()) ? `${hours.trim()} hours per week` : hours.trim());

const sentence = (text: string) => (/[.?!]$/.test(text) ? text : `${text}.`);

/** The resume as a complete .tex file. */
export const toLatex = (data: ResumeData): string => {
  const engine = latexEngine(data);
  const owner = data.fullName;
  const publications = data.publications ?? [];
  const awards = data.awards ?? [];
  const talks = data.talks ?? [];
  const teaching = data.teaching ?? [];
  const academic = publications.length + awards.length + talks.length + teaching.length > 0;
  const sections: string[] = [];
  const add = (title: string, body: string) => body.trim() && sections.push(`\\section{${title}}\n${body.trim()}`);

  const summary = data.summary.trim() ? richText(data.summary) : '';
  const education = data.education
    .map((edu) => entry(edu.school || edu.degree, formatDateRange(edu.startDate, edu.endDate), edu.school ? edu.degree : ''))
    .join('\n');
  const experience = data.experience
    .map((exp) => [entry(exp.company || exp.role, formatDateRange(exp.startDate, exp.endDate, exp.isCurrent), [exp.company ? exp.role : '', hoursPerWeek(exp.hours)].filter(Boolean).join(', ')), richText(exp.description)].filter(Boolean).join('\n'))
    .join('\n\\medskip\n');
  const projects = data.projects
    .map((proj) => [`\\textbf{${escapeLatex(proj.name)}}${proj.link.trim() && validateUrl(proj.link) ? ` \\hfill ${link(proj.link)}` : ''}\\par`, richText(proj.description)].filter(Boolean).join('\n'))
    .join('\n\\medskip\n');
  const pubs = publications.length
    ? `\\begin{enumerate}[label={[\\arabic*]}, leftmargin=2.2em]\n${publications
        .map((pub) => {
          const authors = pub.authors.trim().replace(/[,;\s]+$/, '');
          const parts = [
            authors ? `${bold(authors, owner)}${pub.year.trim() ? ` (${escapeLatex(pub.year)})` : ''}.` : '',
            pub.title.trim() ? `${escapeLatex(sentence(pub.title.trim()))}` : '',
            pub.venue.trim() ? `\\textit{${escapeLatex(pub.venue)}}${!authors && pub.year.trim() ? `, ${escapeLatex(pub.year)}` : ''}.` : '',
            pub.link.trim() && validateUrl(pub.link) ? link(pub.link) : '',
          ];
          return `  \\item ${parts.filter(Boolean).join(' ')}`;
        })
        .join('\n')}\n\\end{enumerate}`
    : '';
  // One row per entry: text on the left, year in a fixed right-hand column (\\row in the preamble).
  const list = (rows: Array<[string, string]>) => rows.map(([text, year]) => `\\row{${text}}{${escapeLatex(year)}}`).join('\n');
  const join = (...parts: string[]) => parts.map((part) => part.trim()).filter(Boolean).map(escapeLatex).join(', ');
  const grants = list(awards.map((a): [string, string] => [`${a.title.trim() ? `\\textbf{${escapeLatex(a.title)}}` : ''}${a.title.trim() && join(a.issuer, a.detail) ? ', ' : ''}${join(a.issuer, a.detail)}`, a.year]));
  const talkRows = list(
    talks.map((t): [string, string] => [`${t.title.trim() ? `\`\`${escapeLatex(sentence(t.title.trim()))}'' ` : ''}${t.event.trim() ? `\\textit{${escapeLatex(t.event)}}` : ''}${t.event.trim() && t.location.trim() ? ', ' : ''}${escapeLatex(t.location)}`, t.year])
  );
  const teachingRows = list(teaching.map((c): [string, string] => [`${c.course.trim() ? `\\textbf{${escapeLatex(c.course)}}` : ''}${c.course.trim() && join(c.role, c.institution) ? ', ' : ''}${join(c.role, c.institution)}`, c.year]));
  const skills = groupSkills(data.skills)
    .map((group) => `${group.category ? `\\textbf{${escapeLatex(group.category)}:} ` : ''}${escapeLatex(group.items.join(', '))}\\par`)
    .join('\n');

  add(academic ? 'Research Interests' : 'Summary', summary);
  if (academic) {
    add('Education', education);
    add('Publications', pubs);
    add('Grants and Awards', grants);
    add('Talks', talkRows);
    add('Teaching', teachingRows);
    add('Experience', experience);
  } else {
    add('Experience', experience);
    add('Education', education);
  }
  add('Projects', projects);
  add('Skills', skills);

  const contacts = getContactEntries(data)
    .map((c) => (c.href ? (c.key === 'email' || c.key === 'phone' ? `\\href{${escapeUrl(c.href)}}{${escapeLatex(c.value)}}` : link(c.href, c.value)) : escapeLatex(c.value)))
    .join(' \\quad{}\\textperiodcentered\\quad{} ');

  const fonts =
    engine === 'xelatex'
      ? '% fontspec defaults to Latin Modern; xeCJK to the Fandol fonts bundled with TeX Live.\n\\usepackage{fontspec}\n\\usepackage{xeCJK}'
      : '\\usepackage[T1]{fontenc}\n\\usepackage[utf8]{inputenc}\n\\usepackage{lmodern}\n\\usepackage{textcomp}';

  const paper = data.design?.paper === 'letter' ? 'letterpaper' : 'a4paper';

  return `% ${data.fullName.trim() || 'Resume'}, exported from ModernCV (https://genedai.cv).
% Compile with ${engine === 'xelatex' ? 'XeLaTeX' : 'pdfLaTeX'}; on Overleaf, Menu > Compiler.
\\documentclass[11pt,${paper}]{article}
\\usepackage[${paper},margin=18mm]{geometry}
${fonts}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\titleformat{\\section}{\\large\\scshape\\raggedright}{}{0em}{}[\\vspace{-0.6ex}\\rule{\\textwidth}{0.4pt}]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}
\\setlist{itemsep=1pt, topsep=2pt, parsep=0pt}
\\setlist[itemize]{leftmargin=1.2em}
% \\entry{organisation}{dates}{role or degree}{extra}; \\row{text}{year}
\\newcommand{\\entry}[4]{\\textbf{#1}\\hfill #2\\par\\ifx&#3&\\else\\textit{#3}\\par\\fi}
\\newcommand{\\row}[2]{\\parbox[t]{\\dimexpr\\textwidth-7.5em\\relax}{\\raggedright #1}\\hfill\\parbox[t]{7em}{\\raggedleft #2}\\par\\smallskip}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries ${escapeLatex(data.fullName) || 'Your Name'}}\\par\\smallskip
${data.title.trim() ? `  {\\large ${escapeLatex(data.title)}}\\par\\smallskip\n` : ''}${contacts ? `  {\\small ${contacts}}\\par\n` : ''}\\end{center}

${sections.join('\n\n')}

\\end{document}
`;
};

const fileBase = (data: ResumeData) => (data.fullName.trim() || 'resume').replace(/\s+/g, '_').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').toLowerCase();

/** Saves the resume as `<name>-resume.tex`. */
export const downloadLatex = (data: ResumeData): void => {
  const url = URL.createObjectURL(new Blob([toLatex(data)], { type: 'application/x-tex' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileBase(data)}-resume.tex`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** Opens the .tex as a new Overleaf project (Overleaf's documented "open in Overleaf" form POST). */
export const openInOverleaf = (data: ResumeData): void => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.overleaf.com/docs';
  form.target = '_blank';
  form.rel = 'noopener';
  const fields = { encoded_snip: encodeURIComponent(toLatex(data)), snip_name: `${fileBase(data)}-resume.tex`, engine: latexEngine(data) };
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
};

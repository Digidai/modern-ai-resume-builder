import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { ResumeData } from '../types';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

// Tailwind Slate Colors (Exact RGB values)
const COLORS = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  slate900: rgb(15 / 255, 23 / 255, 42 / 255),  // #0f172a
  slate800: rgb(30 / 255, 41 / 255, 59 / 255),  // #1e293b
  slate700: rgb(51 / 255, 65 / 255, 85 / 255),  // #334155
  slate600: rgb(71 / 255, 85 / 255, 105 / 255), // #475569
  slate500: rgb(100 / 255, 116 / 255, 139 / 255), // #64748b
  slate400: rgb(148 / 255, 163 / 255, 184 / 255), // #94a3b8
  slate300: rgb(203 / 255, 213 / 255, 225 / 255), // #cbd5e1
  slate200: rgb(226 / 255, 232 / 255, 240 / 255), // #e2e8f0
  slate100: rgb(241 / 255, 245 / 255, 249 / 255), // #f1f5f9
  slate50:  rgb(248 / 255, 250 / 255, 252 / 255), // #f8fafc
  indigo600: rgb(79 / 255, 70 / 255, 229 / 255),  // #4f46e5
  indigo500: rgb(99 / 255, 102 / 255, 241 / 255), // #6366f1
  indigo400: rgb(129 / 255, 140 / 255, 248 / 255), // #818cf8
};

const VECTOR_TEMPLATES = new Set(['modern', 'minimalist', 'sidebar']);

export const supportsVectorTemplate = (templateId: string) => VECTOR_TEMPLATES.has(templateId);

// Check for characters outside Latin-1 range (Standard fonts only support Latin-1)
const hasNonLatinCharacters = (str: string) => {
    // Regex for non-Latin-1 characters. 
    // Latin-1 Supplement is up to \u00FF.
    return /[^\u0000-\u00FF]/.test(str);
};

type FontSet = {
  sans: PDFFont;
  sansBold: PDFFont;
  sansItalic: PDFFont;
  serif: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
};

type Margins = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type LayoutContext = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  cursorY: number;
  pageWidth: number;
  pageHeight: number;
  margins: Margins;
  addPage: () => void;
  ensureSpace: (height: number) => void;
  moveCursor: (amount: number) => void;
};

const createLayoutContext = (pdfDoc: PDFDocument, margins: Margins, onNewPage?: (page: PDFPage) => void) => {
  const ctx = {
    pdfDoc,
    page: pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]),
    cursorY: A4_HEIGHT_PT - margins.top,
    pageWidth: A4_WIDTH_PT,
    pageHeight: A4_HEIGHT_PT,
    margins,
    addPage: () => {
      ctx.page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
      if (onNewPage) onNewPage(ctx.page);
      ctx.cursorY = A4_HEIGHT_PT - margins.top;
    },
    ensureSpace: (height: number) => {
      if (ctx.cursorY - height < margins.bottom) {
        ctx.addPage();
      }
    },
    moveCursor: (amount: number) => {
      ctx.cursorY -= amount;
    },
  } as LayoutContext;

  if (onNewPage) onNewPage(ctx.page);
  return ctx;
};

const measureTextWidth = (font: PDFFont, size: number, text: string) =>
  font.widthOfTextAtSize(text, size);

const breakLongWord = (word: string, font: PDFFont, size: number, maxWidth: number) => {
  const lines: string[] = [];
  let current = '';
  for (const char of word) {
    const next = `${current}${char}`;
    if (measureTextWidth(font, size, next) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = char;
  }
  if (current) lines.push(current);
  return lines;
};

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureTextWidth(font, size, candidate) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    if (measureTextWidth(font, size, word) > maxWidth) {
      const broken = breakLongWord(word, font, size, maxWidth);
      lines.push(...broken.slice(0, -1));
      current = broken[broken.length - 1] ?? '';
    } else {
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
};

const drawTextLine = (
  page: PDFPage,
  text: string,
  x: number,
  yTop: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  maxWidth: number,
  align: 'left' | 'center' | 'right' = 'left'
) => {
  if (!text) return;
  const textWidth = measureTextWidth(font, size, text);
  let drawX = x;
  if (align === 'center') drawX = x + (maxWidth - textWidth) / 2;
  if (align === 'right') drawX = x + maxWidth - textWidth;
  
  page.drawText(text, {
    x: drawX,
    y: yTop - size + (size * 0.2), // Adjustment to match baseline better
    size,
    font,
    color,
  });
};

const drawWrappedText = (
  ctx: LayoutContext,
  text: string,
  x: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  options?: { lineHeight?: number; paragraphGap?: number; align?: 'left' | 'center' | 'right' }
) => {
  const normalized = String(text ?? '');
  if (!normalized.trim()) return;
  const lineHeight = options?.lineHeight ?? size * 1.4;
  const paragraphGap = options?.paragraphGap ?? lineHeight * 0.5;
  const align = options?.align ?? 'left';
  const paragraphs = normalized.split(/\r?\n/);

  for (let pIndex = 0; pIndex < paragraphs.length; pIndex += 1) {
    const paragraph = paragraphs[pIndex];
    if (!paragraph.trim()) {
      ctx.moveCursor(paragraphGap);
      continue;
    }

    const lines = wrapText(paragraph, font, size, maxWidth);
    for (const line of lines) {
      ctx.ensureSpace(lineHeight);
      drawTextLine(ctx.page, line, x, ctx.cursorY, font, size, color, maxWidth, align);
      ctx.moveCursor(lineHeight);
    }

    if (pIndex < paragraphs.length - 1) {
      ctx.moveCursor(paragraphGap);
    }
  }
};

const drawSectionTitle = (
  ctx: LayoutContext,
  title: string,
  x: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  spacing = size * 1.6
) => {
  ctx.ensureSpace(spacing);
  drawTextLine(ctx.page, title.toUpperCase(), x, ctx.cursorY, font, size, color, maxWidth);
  ctx.moveCursor(spacing);
};

const drawLeftRightLine = (
  ctx: LayoutContext,
  leftText: string,
  rightText: string,
  x: number,
  maxWidth: number,
  fontLeft: PDFFont,
  fontRight: PDFFont,
  sizeLeft: number,
  sizeRight: number,
  colorLeft: ReturnType<typeof rgb>,
  colorRight: ReturnType<typeof rgb>,
  gap = 8
) => {
  const rightWidth = rightText ? measureTextWidth(fontRight, sizeRight, rightText) : 0;
  const leftMax = Math.max(0, maxWidth - rightWidth - gap);
  const lines = wrapText(leftText, fontLeft, sizeLeft, leftMax);
  const lineHeight = sizeLeft * 1.4;

  lines.forEach((line, index) => {
    ctx.ensureSpace(lineHeight);
    drawTextLine(ctx.page, line, x, ctx.cursorY, fontLeft, sizeLeft, colorLeft, leftMax);
    if (index === 0 && rightText) {
      drawTextLine(
        ctx.page,
        rightText,
        x + maxWidth - rightWidth,
        ctx.cursorY,
        fontRight,
        sizeRight,
        colorRight,
        rightWidth,
        'left'
      );
    }
    ctx.moveCursor(lineHeight);
  });
};

const drawSkillChips = (
  ctx: LayoutContext,
  skills: string[],
  x: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  options?: {
    chipHeight?: number;
    paddingX?: number;
    paddingY?: number;
    gap?: number;
    fill?: ReturnType<typeof rgb>;
    border?: ReturnType<typeof rgb>;
    text?: ReturnType<typeof rgb>;
  }
) => {
  const chipHeight = options?.chipHeight ?? size * 1.8;
  const paddingX = options?.paddingX ?? 6;
  const paddingY = options?.paddingY ?? 4;
  const gap = options?.gap ?? 6;
  const fill = options?.fill ?? COLORS.slate100;
  const border = options?.border ?? COLORS.slate200;
  const textColor = options?.text ?? COLORS.slate700;

  let currentX = x;
  let rowTop = ctx.cursorY;

  const startRow = () => {
    ctx.ensureSpace(chipHeight + gap);
    rowTop = ctx.cursorY;
    currentX = x;
  };

  startRow();

  for (const skill of skills) {
    const label = skill.trim();
    if (!label) continue;
    const textWidth = measureTextWidth(font, size, label);
    const chipWidth = textWidth + paddingX * 2;

    if (currentX + chipWidth > x + maxWidth) {
      ctx.cursorY = rowTop - chipHeight - gap;
      startRow();
    }

    ctx.page.drawRectangle({
      x: currentX,
      y: rowTop - chipHeight + paddingY,
      width: chipWidth,
      height: chipHeight - paddingY,
      color: fill,
      borderColor: border,
      borderWidth: 1,
    });

    ctx.page.drawText(label, {
      x: currentX + paddingX,
      y: rowTop - chipHeight + paddingY + (chipHeight - size) / 2 + 1, // Adjusted vertical center
      size,
      font,
      color: textColor,
    });

    currentX += chipWidth + gap;
  }

  ctx.cursorY = rowTop - chipHeight - gap;
};

const buildContactLine = (data: ResumeData) =>
  [data.email, data.phone, data.location, data.website, data.linkedin].filter(Boolean).join(' • ');

// --- Modern Template ---
const renderModernTemplate = (data: ResumeData, pdfDoc: PDFDocument, fonts: FontSet) => {
  const margins = { top: 40, bottom: 40, left: 40, right: 40 };
  const ctx = createLayoutContext(pdfDoc, margins);
  const contentWidth = ctx.pageWidth - margins.left - margins.right;
  const startX = margins.left;

  // Name: text-4xl (36px) -> 27pt
  drawWrappedText(
    ctx,
    data.fullName.toUpperCase(),
    startX,
    contentWidth,
    fonts.sansBold,
    27, 
    COLORS.slate900,
    { lineHeight: 32 }
  );
  
  // Title: text-xl (20px) -> 15pt
  drawWrappedText(ctx, data.title, startX, contentWidth, fonts.sans, 15, COLORS.slate600, {
    lineHeight: 20,
    paragraphGap: 8,
  });

  const contacts = buildContactLine(data);
  if (contacts) {
    // text-sm (14px) -> 10.5pt
    drawWrappedText(ctx, contacts, startX, contentWidth, fonts.sans, 10.5, COLORS.slate600, {
      lineHeight: 14,
      paragraphGap: 0,
    });
  }

  ctx.moveCursor(16);
  ctx.page.drawLine({
    start: { x: startX, y: ctx.cursorY },
    end: { x: startX + contentWidth, y: ctx.cursorY },
    thickness: 1,
    color: COLORS.slate200,
  });
  ctx.moveCursor(20);

  const sectionHeaderSize = 10.5; // text-sm
  const bodyTextSize = 10.5; // text-sm
  const sectionGap = 16;
  
  if (data.summary) {
    drawSectionTitle(ctx, 'Profile', startX, contentWidth, fonts.sansBold, sectionHeaderSize, COLORS.slate400, sectionGap);
    drawWrappedText(ctx, data.summary, startX, contentWidth, fonts.sans, bodyTextSize, COLORS.slate700, {
      lineHeight: 16,
    });
    ctx.moveCursor(12);
  }

  if (data.experience.length > 0) {
    drawSectionTitle(ctx, 'Experience', startX, contentWidth, fonts.sansBold, sectionHeaderSize, COLORS.slate400, sectionGap);
    for (const exp of data.experience) {
      const dateText = `${exp.startDate} — ${exp.isCurrent ? 'Present' : exp.endDate}`;
      drawLeftRightLine(
        ctx,
        exp.role,
        dateText,
        startX,
        contentWidth,
        fonts.sansBold,
        fonts.sans,
        bodyTextSize,
        10, // slightly smaller date
        COLORS.slate900,
        COLORS.slate500
      );

      drawWrappedText(ctx, exp.company, startX, contentWidth, fonts.sans, bodyTextSize, COLORS.slate600, {
        lineHeight: 14,
        paragraphGap: 4,
      });

      drawWrappedText(ctx, exp.description, startX, contentWidth, fonts.sans, bodyTextSize, COLORS.slate700, {
        lineHeight: 15,
        paragraphGap: 8,
      });

      ctx.moveCursor(12);
    }
  }

  if (data.skills.length > 0) {
    drawSectionTitle(ctx, 'Skills', startX, contentWidth, fonts.sansBold, sectionHeaderSize, COLORS.slate400, sectionGap);
    drawSkillChips(ctx, data.skills, startX, contentWidth, fonts.sans, 9, {
      fill: COLORS.slate100,
      border: COLORS.slate200,
      text: COLORS.slate700,
      paddingX: 8,
      paddingY: 4
    });
    ctx.moveCursor(12);
  }

  if (data.education.length > 0) {
    drawSectionTitle(ctx, 'Education', startX, contentWidth, fonts.sansBold, sectionHeaderSize, COLORS.slate400, sectionGap);
    for (const edu of data.education) {
      const dateText = `${edu.startDate} — ${edu.endDate}`;
      drawLeftRightLine(
        ctx,
        edu.school,
        dateText,
        startX,
        contentWidth,
        fonts.sansBold,
        fonts.sans,
        bodyTextSize,
        10,
        COLORS.slate900,
        COLORS.slate500
      );
      drawWrappedText(ctx, edu.degree, startX, contentWidth, fonts.sans, 10, COLORS.slate600, {
        lineHeight: 14,
        paragraphGap: 6,
      });
      ctx.moveCursor(8);
    }
  }
};

// --- Minimalist Template ---
const renderMinimalistTemplate = (data: ResumeData, pdfDoc: PDFDocument, fonts: FontSet) => {
  const margins = { top: 40, bottom: 40, left: 40, right: 40 };
  const ctx = createLayoutContext(pdfDoc, margins);
  const contentWidth = ctx.pageWidth - margins.left - margins.right;
  const startX = margins.left;

  // Name: text-3xl md:text-5xl -> let's go with 32pt (approx 42px)
  drawWrappedText(ctx, data.fullName, startX, contentWidth, fonts.serifBold, 32, COLORS.slate900, {
    lineHeight: 38,
    align: 'center',
  });
  
  // Title: text-lg md:text-xl -> 15pt
  drawWrappedText(ctx, data.title, startX, contentWidth, fonts.serifItalic, 15, COLORS.slate600, {
    lineHeight: 20,
    align: 'center',
    paragraphGap: 6,
  });

  const contacts = buildContactLine(data);
  if (contacts) {
    // text-sm -> 10.5pt
    drawWrappedText(ctx, contacts, startX, contentWidth, fonts.serif, 10.5, COLORS.slate500, {
      lineHeight: 14,
      align: 'center',
    });
  }

  ctx.moveCursor(12);
  ctx.page.drawLine({
    start: { x: startX, y: ctx.cursorY },
    end: { x: startX + contentWidth, y: ctx.cursorY },
    thickness: 1.5,
    color: COLORS.black,
  });
  ctx.moveCursor(20);

  if (data.summary) {
    // text-sm md:text-base -> 11pt
    drawWrappedText(ctx, data.summary, startX + 40, contentWidth - 80, fonts.serif, 11, COLORS.slate700, {
      lineHeight: 16,
      align: 'center',
    });
    ctx.moveCursor(16);
  }

  if (data.skills.length > 0) {
    drawSectionTitle(ctx, 'Core Competencies', startX, contentWidth, fonts.sansBold, 9, COLORS.slate400, 14); // Keep sans for header in minimalist per design? No, design says font-bold uppercase, but usually sans looks better for tiny headers. Template says "text-xs font-bold uppercase". Tailwind default is sans.
    
    // Skills are centered text
    const skillsLine = data.skills.join(' • ');
    drawWrappedText(ctx, skillsLine, startX, contentWidth, fonts.serif, 10.5, COLORS.slate800, {
      lineHeight: 15,
      align: 'center',
    });
    ctx.moveCursor(20);
  }

  // Section Headers: Serif Bold, text-xl -> 15pt
  const sectionHeaderFont = fonts.serifBold;
  const sectionHeaderSize = 15;

  if (data.experience.length > 0) {
    drawWrappedText(ctx, 'Experience', startX, contentWidth, sectionHeaderFont, sectionHeaderSize, COLORS.slate900, {
      lineHeight: 20,
    });
    ctx.page.drawLine({
      start: { x: startX, y: ctx.cursorY + 4 },
      end: { x: startX + contentWidth, y: ctx.cursorY + 4 },
      thickness: 0.5,
      color: COLORS.slate200,
    });
    ctx.moveCursor(16);

    const leftWidth = 130;
    const gap = 16;
    const rightX = startX + leftWidth + gap;
    const rightWidth = contentWidth - leftWidth - gap;

    for (const exp of data.experience) {
      const dateText = `${exp.startDate} — ${exp.isCurrent ? 'Present' : exp.endDate}`;
      drawTextLine(ctx.page, dateText, startX, ctx.cursorY, fonts.sans, 10, COLORS.slate500, leftWidth); // Sans for dates looks cleaner

      drawWrappedText(ctx, exp.role, rightX, rightWidth, fonts.sansBold, 12, COLORS.slate900, { // Mix sans for clarity? Template says serif for company
        lineHeight: 15,
        paragraphGap: 2,
      });
      drawWrappedText(ctx, exp.company, rightX, rightWidth, fonts.serifItalic, 11, COLORS.slate700, {
        lineHeight: 14,
        paragraphGap: 6,
      });
      drawWrappedText(ctx, exp.description, rightX, rightWidth, fonts.serif, 10.5, COLORS.slate700, {
        lineHeight: 15,
        paragraphGap: 12,
      });

      ctx.moveCursor(4);
    }
  }

  if (data.projects.length > 0) {
    drawWrappedText(ctx, 'Projects', startX, contentWidth, sectionHeaderFont, sectionHeaderSize, COLORS.slate900, {
      lineHeight: 20,
    });
    ctx.page.drawLine({
      start: { x: startX, y: ctx.cursorY + 4 },
      end: { x: startX + contentWidth, y: ctx.cursorY + 4 },
      thickness: 0.5,
      color: COLORS.slate200,
    });
    ctx.moveCursor(16);

    for (const proj of data.projects) {
      const nameLine = proj.link ? `${proj.name} (${proj.link})` : proj.name;
      drawWrappedText(ctx, nameLine, startX, contentWidth, fonts.sansBold, 11, COLORS.slate900, {
        lineHeight: 14,
        paragraphGap: 4,
      });
      drawWrappedText(ctx, proj.description, startX, contentWidth, fonts.serif, 10.5, COLORS.slate600, {
        lineHeight: 14,
        paragraphGap: 12,
      });
    }
  }

  if (data.education.length > 0) {
    drawWrappedText(ctx, 'Education', startX, contentWidth, sectionHeaderFont, sectionHeaderSize, COLORS.slate900, {
      lineHeight: 20,
    });
    ctx.page.drawLine({
      start: { x: startX, y: ctx.cursorY + 4 },
      end: { x: startX + contentWidth, y: ctx.cursorY + 4 },
      thickness: 0.5,
      color: COLORS.slate200,
    });
    ctx.moveCursor(16);

    for (const edu of data.education) {
      const dateText = `${edu.startDate} — ${edu.endDate}`;
      drawLeftRightLine(
        ctx,
        edu.school,
        dateText,
        startX,
        contentWidth,
        fonts.sansBold,
        fonts.sans, // Date in Sans
        11,
        10,
        COLORS.slate900,
        COLORS.slate500
      );
      drawWrappedText(ctx, edu.degree, startX, contentWidth, fonts.serifItalic, 10.5, COLORS.slate600, {
        lineHeight: 14,
        paragraphGap: 10,
      });
    }
  }
};

// --- Sidebar Template ---
const drawSidebarLeftColumn = (
  page: PDFPage,
  data: ResumeData,
  fonts: FontSet,
  sidebarWidth: number,
  padding: number
) => {
  const startX = padding;
  const maxWidth = sidebarWidth - padding * 2;
  let y = A4_HEIGHT_PT - padding - 10;

  const drawBlock = (
    text: string,
    font: PDFFont,
    size: number,
    color: ReturnType<typeof rgb>,
    gap = size * 1.4
  ) => {
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x: startX, y: y - size, size, font, color });
      y -= gap;
    }
  };

  // Name: text-3xl -> 24pt
  drawBlock(data.fullName, fonts.sansBold, 24, COLORS.white, 28);
  // Title: text-lg -> 14pt
  drawBlock(data.title, fonts.sans, 14, COLORS.indigo400, 20);
  y -= 20;

  const contactItems = [
    { label: 'Email', value: data.email },
    { label: 'Phone', value: data.phone },
    { label: 'Location', value: data.location },
    { label: 'Portfolio', value: data.website },
    { label: 'LinkedIn', value: data.linkedin },
  ];

  for (const item of contactItems) {
    if (!item.value) continue;
    page.drawText(item.label.toUpperCase(), {
      x: startX,
      y: y - 8,
      size: 8,
      font: fonts.sansBold,
      color: COLORS.slate500,
    });
    y -= 14;
    // Break long contact items (like URLs)
    const lines = wrapText(item.value, fonts.sans, 10, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x: startX, y: y - 10, size: 10, font: fonts.sans, color: COLORS.slate300 });
      y -= 14;
    }
    y -= 8;
  }

  if (data.skills.length > 0) {
    y -= 10;
    page.drawText('SKILLS', {
      x: startX,
      y: y - 9,
      size: 9,
      font: fonts.sansBold,
      color: COLORS.white,
    });
    page.drawLine({
        start: { x: startX, y: y - 12 },
        end: { x: startX + maxWidth, y: y - 12 },
        thickness: 1,
        color: COLORS.slate700
    });
    y -= 22;

    const chipFontSize = 9;
    const chipGap = 4;
    let chipX = startX;
    let chipY = y;
    
    for (const skill of data.skills) {
      const label = skill.trim();
      if (!label) continue;
      const textWidth = measureTextWidth(fonts.sans, chipFontSize, label);
      const chipPadding = 8;
      const chipWidth = textWidth + chipPadding;
      
      if (chipX + chipWidth > startX + maxWidth) {
        chipX = startX;
        chipY -= 18;
      }
      
      // Sidebar uses bg-slate-800
      page.drawRectangle({
        x: chipX,
        y: chipY - 12,
        width: chipWidth,
        height: 16,
        color: COLORS.slate800,
        opacity: 1
      });
      page.drawText(label, {
        x: chipX + 4,
        y: chipY - 9,
        size: chipFontSize,
        font: fonts.sans,
        color: COLORS.slate300,
      });
      chipX += chipWidth + chipGap;
    }
    y = chipY - 24;
  }

  if (data.education.length > 0) {
    page.drawText('EDUCATION', {
      x: startX,
      y: y - 9,
      size: 9,
      font: fonts.sansBold,
      color: COLORS.white,
    });
    page.drawLine({
        start: { x: startX, y: y - 12 },
        end: { x: startX + maxWidth, y: y - 12 },
        thickness: 1,
        color: COLORS.slate700
    });
    y -= 22;

    for (const edu of data.education) {
      drawBlock(edu.school, fonts.sansBold, 10, COLORS.white, 12);
      drawBlock(edu.degree, fonts.sans, 9, COLORS.slate400, 11);
      drawBlock(`${edu.startDate} — ${edu.endDate}`, fonts.sans, 8, COLORS.slate500, 10);
      y -= 12;
    }
  }
};

const renderSidebarTemplate = (data: ResumeData, pdfDoc: PDFDocument, fonts: FontSet) => {
  const sidebarWidth = 200;
  const sidebarPadding = 24;
  const mainPadding = 32;
  const mainX = sidebarWidth + mainPadding;
  const mainWidth = A4_WIDTH_PT - mainX - mainPadding;

  const drawSidebar = (page: PDFPage) => {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: sidebarWidth,
      height: A4_HEIGHT_PT,
      color: COLORS.slate900,
    });
    drawSidebarLeftColumn(page, data, fonts, sidebarWidth, sidebarPadding);
  };

  const ctx = createLayoutContext(
    pdfDoc,
    { top: 32, bottom: 32, left: 0, right: 0 },
    drawSidebar
  );

  const sectionTitle = (title: string) => {
    ctx.ensureSpace(30);
    const lineY = ctx.cursorY - 14;
    // Sidebar marker
    ctx.page.drawRectangle({
      x: mainX,
      y: lineY,
      width: 28,
      height: 4,
      color: COLORS.slate900,
    });
    ctx.page.drawText(title.toUpperCase(), {
      x: mainX + 40,
      y: ctx.cursorY - 14,
      size: 14,
      font: fonts.sansBold,
      color: COLORS.slate800,
    });
    ctx.moveCursor(32);
  };

  if (data.summary) {
    sectionTitle('Profile');
    drawWrappedText(ctx, data.summary, mainX, mainWidth, fonts.sans, 10.5, COLORS.slate600, {
      lineHeight: 15,
      paragraphGap: 8,
    });
    ctx.moveCursor(16);
  }

  if (data.experience.length > 0) {
    sectionTitle('Experience');
    
    // Draw vertical line line the template
    const lineStartY = ctx.cursorY;
    
    // We need to track where the line should end. This is tricky in a streamed layout.
    // For simplicity in PDF-Lib, we'll just draw the text and decorations per item.
    
    // The sidebar template has a border-l-2.
    const borderX = mainX + 6;
    
    for (const exp of data.experience) {
        // Bullet point
        ctx.page.drawEllipse({
            x: borderX,
            y: ctx.cursorY - 6,
            xScale: 3,
            yScale: 3,
            color: COLORS.slate200,
            borderColor: COLORS.white,
            borderWidth: 1.5
        });

      drawWrappedText(ctx, exp.role, mainX + 24, mainWidth - 24, fonts.sansBold, 12, COLORS.slate900, {
        lineHeight: 16,
        paragraphGap: 4,
      });
      
      const meta = `${exp.company}  |  ${exp.startDate} — ${exp.isCurrent ? 'Present' : exp.endDate}`;
      drawWrappedText(ctx, meta, mainX + 24, mainWidth - 24, fonts.sansBold, 10, COLORS.indigo600, {
        lineHeight: 14,
        paragraphGap: 6,
      });
      
      drawWrappedText(ctx, exp.description, mainX + 24, mainWidth - 24, fonts.sans, 10.5, COLORS.slate600, {
        lineHeight: 15,
        paragraphGap: 12,
      });
      
      ctx.moveCursor(12);
    }
    
    // Draw the vertical line roughly
    // ctx.page.drawLine({
    //    start: { x: borderX, y: lineStartY },
    //    end: { x: borderX, y: ctx.cursorY },
    //    thickness: 2,
    //    color: COLORS.slate100
    // });
    // Note: To draw the line correctly behind items, we'd need to know height beforehand or use layers.
    // For now, omitting the continuous line to avoid complexity, or we can just draw small segments.
  }

  if (data.projects.length > 0) {
    sectionTitle('Projects');
    for (const proj of data.projects) {
      ctx.ensureSpace(40);
      // Project box background is tricky. skipping bg, focusing on text layout.
      
      drawWrappedText(ctx, proj.name, mainX, mainWidth, fonts.sansBold, 11, COLORS.slate900, {
        lineHeight: 14,
        paragraphGap: 4,
      });
      if (proj.link) {
        drawWrappedText(ctx, proj.link, mainX, mainWidth, fonts.sans, 9, COLORS.indigo600, {
          lineHeight: 12,
          paragraphGap: 4,
        });
      }
      drawWrappedText(ctx, proj.description, mainX, mainWidth, fonts.sans, 10.5, COLORS.slate600, {
        lineHeight: 15,
        paragraphGap: 12,
      });
    }
  }
};

const loadFonts = async (pdfDoc: PDFDocument): Promise<FontSet> => ({
  sans: await pdfDoc.embedFont(StandardFonts.Helvetica),
  sansBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  sansItalic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
  serif: await pdfDoc.embedFont(StandardFonts.TimesRoman),
  serifBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
  serifItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
});

export const exportResumeVectorPdf = async (data: ResumeData): Promise<Uint8Array> => {
  // 1. Safety Check: If data contains non-Latin characters, Standard Fonts will fail.
  // Fallback to image export (handled by caller catching this error).
  const jsonString = JSON.stringify(data);
  if (hasNonLatinCharacters(jsonString)) {
      throw new Error("Resume contains non-Latin characters. Vector export not supported without custom fonts. Falling back to image export.");
  }

  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);

  switch (data.templateId) {
    case 'modern':
      renderModernTemplate(data, pdfDoc, fonts);
      break;
    case 'minimalist':
      renderMinimalistTemplate(data, pdfDoc, fonts);
      break;
    case 'sidebar':
      renderSidebarTemplate(data, pdfDoc, fonts);
      break;
    default:
      throw new Error(`Vector export not supported for template: ${data.templateId}`);
  }

  return pdfDoc.save();
};

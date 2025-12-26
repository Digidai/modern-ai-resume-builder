import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { ResumeData } from '../types';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

const COLORS = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  slate900: rgb(0.07, 0.09, 0.16),
  slate800: rgb(0.12, 0.16, 0.23),
  slate700: rgb(0.2, 0.24, 0.31),
  slate600: rgb(0.28, 0.32, 0.38),
  slate500: rgb(0.39, 0.44, 0.51),
  slate400: rgb(0.58, 0.62, 0.69),
  slate300: rgb(0.8, 0.82, 0.85),
  slate200: rgb(0.9, 0.92, 0.95),
  slate100: rgb(0.96, 0.97, 0.98),
  indigo500: rgb(0.39, 0.4, 0.94),
  indigo400: rgb(0.51, 0.55, 0.96),
};

const VECTOR_TEMPLATES = new Set(['modern', 'minimalist', 'sidebar']);

export const supportsVectorTemplate = (templateId: string) => VECTOR_TEMPLATES.has(templateId);

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
    y: yTop - size,
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
  const lineHeight = sizeLeft * 1.35;

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
      y: rowTop - chipHeight + paddingY + (chipHeight - size) / 2 - 1,
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

const renderModernTemplate = (data: ResumeData, pdfDoc: PDFDocument, fonts: FontSet) => {
  const margins = { top: 42, bottom: 42, left: 42, right: 42 };
  const ctx = createLayoutContext(pdfDoc, margins);
  const contentWidth = ctx.pageWidth - margins.left - margins.right;
  const startX = margins.left;

  drawWrappedText(
    ctx,
    data.fullName.toUpperCase(),
    startX,
    contentWidth,
    fonts.sansBold,
    26,
    COLORS.slate900,
    { lineHeight: 30 }
  );

  drawWrappedText(ctx, data.title, startX, contentWidth, fonts.sans, 13, COLORS.slate600, {
    lineHeight: 18,
    paragraphGap: 6,
  });

  const contacts = buildContactLine(data);
  if (contacts) {
    drawWrappedText(ctx, contacts, startX, contentWidth, fonts.sans, 9, COLORS.slate600, {
      lineHeight: 12,
      paragraphGap: 0,
    });
  }

  ctx.moveCursor(8);
  ctx.page.drawLine({
    start: { x: startX, y: ctx.cursorY },
    end: { x: startX + contentWidth, y: ctx.cursorY },
    thickness: 1,
    color: COLORS.slate200,
  });
  ctx.moveCursor(18);

  if (data.summary) {
    drawSectionTitle(ctx, 'Profile', startX, contentWidth, fonts.sansBold, 9, COLORS.slate400, 14);
    drawWrappedText(ctx, data.summary, startX, contentWidth, fonts.sans, 10, COLORS.slate700, {
      lineHeight: 14,
    });
    ctx.moveCursor(10);
  }

  if (data.experience.length > 0) {
    drawSectionTitle(ctx, 'Experience', startX, contentWidth, fonts.sansBold, 9, COLORS.slate400, 16);
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
        11,
        9,
        COLORS.slate900,
        COLORS.slate500
      );

      drawWrappedText(ctx, exp.company, startX, contentWidth, fonts.sansBold, 9.5, COLORS.slate600, {
        lineHeight: 13,
        paragraphGap: 4,
      });

      drawWrappedText(ctx, exp.description, startX, contentWidth, fonts.sans, 9, COLORS.slate700, {
        lineHeight: 12,
        paragraphGap: 6,
      });

      ctx.moveCursor(8);
    }
  }

  if (data.skills.length > 0) {
    drawSectionTitle(ctx, 'Skills', startX, contentWidth, fonts.sansBold, 9, COLORS.slate400, 14);
    drawSkillChips(ctx, data.skills, startX, contentWidth, fonts.sansBold, 8, {
      fill: COLORS.slate100,
      border: COLORS.slate200,
      text: COLORS.slate700,
    });
    ctx.moveCursor(6);
  }

  if (data.education.length > 0) {
    drawSectionTitle(ctx, 'Education', startX, contentWidth, fonts.sansBold, 9, COLORS.slate400, 14);
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
        10,
        9,
        COLORS.slate900,
        COLORS.slate500
      );
      drawWrappedText(ctx, edu.degree, startX, contentWidth, fonts.sans, 9, COLORS.slate600, {
        lineHeight: 12,
        paragraphGap: 6,
      });
      ctx.moveCursor(4);
    }
  }
};

const renderMinimalistTemplate = (data: ResumeData, pdfDoc: PDFDocument, fonts: FontSet) => {
  const margins = { top: 42, bottom: 42, left: 42, right: 42 };
  const ctx = createLayoutContext(pdfDoc, margins);
  const contentWidth = ctx.pageWidth - margins.left - margins.right;
  const startX = margins.left;

  drawWrappedText(ctx, data.fullName, startX, contentWidth, fonts.serifBold, 24, COLORS.slate900, {
    lineHeight: 28,
    align: 'center',
  });
  drawWrappedText(ctx, data.title, startX, contentWidth, fonts.serifItalic, 13, COLORS.slate600, {
    lineHeight: 18,
    align: 'center',
    paragraphGap: 4,
  });

  const contacts = buildContactLine(data);
  if (contacts) {
    drawWrappedText(ctx, contacts, startX, contentWidth, fonts.serif, 9, COLORS.slate500, {
      lineHeight: 12,
      align: 'center',
    });
  }

  ctx.moveCursor(10);
  ctx.page.drawLine({
    start: { x: startX, y: ctx.cursorY },
    end: { x: startX + contentWidth, y: ctx.cursorY },
    thickness: 1.5,
    color: COLORS.black,
  });
  ctx.moveCursor(18);

  if (data.summary) {
    drawWrappedText(ctx, data.summary, startX + 40, contentWidth - 80, fonts.serif, 10, COLORS.slate700, {
      lineHeight: 15,
      align: 'center',
    });
    ctx.moveCursor(14);
  }

  if (data.skills.length > 0) {
    drawSectionTitle(ctx, 'Core Competencies', startX, contentWidth, fonts.sansBold, 8, COLORS.slate400, 14);
    const skillsLine = data.skills.join(' • ');
    drawWrappedText(ctx, skillsLine, startX, contentWidth, fonts.serif, 9, COLORS.slate800, {
      lineHeight: 12,
      align: 'center',
    });
    ctx.moveCursor(14);
  }

  if (data.experience.length > 0) {
    drawWrappedText(ctx, 'Experience', startX, contentWidth, fonts.serifBold, 14, COLORS.slate900, {
      lineHeight: 18,
    });
    ctx.page.drawLine({
      start: { x: startX, y: ctx.cursorY + 4 },
      end: { x: startX + contentWidth, y: ctx.cursorY + 4 },
      thickness: 1,
      color: COLORS.slate200,
    });
    ctx.moveCursor(16);

    const leftWidth = 120;
    const gap = 12;
    const rightX = startX + leftWidth + gap;
    const rightWidth = contentWidth - leftWidth - gap;

    for (const exp of data.experience) {
      const dateText = `${exp.startDate} — ${exp.isCurrent ? 'Present' : exp.endDate}`;
      drawTextLine(ctx.page, dateText, startX, ctx.cursorY, fonts.serif, 9, COLORS.slate500, leftWidth);

      drawWrappedText(ctx, exp.role, rightX, rightWidth, fonts.serifBold, 11, COLORS.slate900, {
        lineHeight: 14,
        paragraphGap: 4,
      });
      drawWrappedText(ctx, exp.company, rightX, rightWidth, fonts.serifItalic, 9.5, COLORS.slate700, {
        lineHeight: 12,
        paragraphGap: 4,
      });
      drawWrappedText(ctx, exp.description, rightX, rightWidth, fonts.serif, 9, COLORS.slate700, {
        lineHeight: 12,
        paragraphGap: 8,
      });

      ctx.moveCursor(8);
    }
  }

  if (data.projects.length > 0) {
    drawWrappedText(ctx, 'Projects', startX, contentWidth, fonts.serifBold, 14, COLORS.slate900, {
      lineHeight: 18,
    });
    ctx.page.drawLine({
      start: { x: startX, y: ctx.cursorY + 4 },
      end: { x: startX + contentWidth, y: ctx.cursorY + 4 },
      thickness: 1,
      color: COLORS.slate200,
    });
    ctx.moveCursor(16);

    for (const proj of data.projects) {
      const nameLine = proj.link ? `${proj.name} (${proj.link})` : proj.name;
      drawWrappedText(ctx, nameLine, startX, contentWidth, fonts.serifBold, 10, COLORS.slate900, {
        lineHeight: 13,
        paragraphGap: 4,
      });
      drawWrappedText(ctx, proj.description, startX, contentWidth, fonts.serif, 9, COLORS.slate600, {
        lineHeight: 12,
        paragraphGap: 10,
      });
    }
  }

  if (data.education.length > 0) {
    drawWrappedText(ctx, 'Education', startX, contentWidth, fonts.serifBold, 14, COLORS.slate900, {
      lineHeight: 18,
    });
    ctx.page.drawLine({
      start: { x: startX, y: ctx.cursorY + 4 },
      end: { x: startX + contentWidth, y: ctx.cursorY + 4 },
      thickness: 1,
      color: COLORS.slate200,
    });
    ctx.moveCursor(14);

    for (const edu of data.education) {
      const dateText = `${edu.startDate} — ${edu.endDate}`;
      drawLeftRightLine(
        ctx,
        edu.school,
        dateText,
        startX,
        contentWidth,
        fonts.serifBold,
        fonts.serif,
        10,
        9,
        COLORS.slate900,
        COLORS.slate500
      );
      drawWrappedText(ctx, edu.degree, startX, contentWidth, fonts.serifItalic, 9, COLORS.slate600, {
        lineHeight: 12,
        paragraphGap: 8,
      });
    }
  }
};

const drawSidebarLeftColumn = (
  page: PDFPage,
  data: ResumeData,
  fonts: FontSet,
  sidebarWidth: number,
  padding: number
) => {
  const startX = padding;
  const maxWidth = sidebarWidth - padding * 2;
  let y = A4_HEIGHT_PT - padding;

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

  drawBlock(data.fullName, fonts.sansBold, 16, COLORS.white, 18);
  drawBlock(data.title, fonts.sans, 10.5, COLORS.indigo400, 14);
  y -= 6;

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
      y: y - 7,
      size: 7,
      font: fonts.sansBold,
      color: COLORS.slate500,
    });
    y -= 12;
    const lines = wrapText(item.value, fonts.sans, 9, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x: startX, y: y - 9, size: 9, font: fonts.sans, color: COLORS.slate300 });
      y -= 12;
    }
    y -= 4;
  }

  if (data.skills.length > 0) {
    page.drawText('SKILLS', {
      x: startX,
      y: y - 8,
      size: 8,
      font: fonts.sansBold,
      color: COLORS.white,
    });
    y -= 14;

    const chipFontSize = 8;
    const chipGap = 4;
    let chipX = startX;
    let chipY = y;
    for (const skill of data.skills) {
      const label = skill.trim();
      if (!label) continue;
      const chipWidth = measureTextWidth(fonts.sans, chipFontSize, label) + 10;
      if (chipX + chipWidth > startX + maxWidth) {
        chipX = startX;
        chipY -= 14;
      }
      page.drawRectangle({
        x: chipX,
        y: chipY - 10,
        width: chipWidth,
        height: 12,
        color: COLORS.slate800,
      });
      page.drawText(label, {
        x: chipX + 5,
        y: chipY - 8,
        size: chipFontSize,
        font: fonts.sans,
        color: COLORS.slate300,
      });
      chipX += chipWidth + chipGap;
    }
    y = chipY - 18;
  }

  if (data.education.length > 0) {
    page.drawText('EDUCATION', {
      x: startX,
      y: y - 8,
      size: 8,
      font: fonts.sansBold,
      color: COLORS.white,
    });
    y -= 16;

    for (const edu of data.education) {
      drawBlock(edu.school, fonts.sansBold, 9, COLORS.white, 12);
      drawBlock(edu.degree, fonts.sans, 8, COLORS.slate300, 10);
      drawBlock(`${edu.startDate} — ${edu.endDate}`, fonts.sans, 7, COLORS.slate500, 10);
      y -= 6;
    }
  }
};

const renderSidebarTemplate = (data: ResumeData, pdfDoc: PDFDocument, fonts: FontSet) => {
  const sidebarWidth = 200;
  const sidebarPadding = 24;
  const mainPadding = 28;
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
    ctx.ensureSpace(24);
    const lineY = ctx.cursorY - 10;
    ctx.page.drawRectangle({
      x: mainX,
      y: lineY,
      width: 24,
      height: 2,
      color: COLORS.slate900,
    });
    ctx.page.drawText(title.toUpperCase(), {
      x: mainX + 32,
      y: ctx.cursorY - 14,
      size: 12,
      font: fonts.sansBold,
      color: COLORS.slate800,
    });
    ctx.moveCursor(26);
  };

  if (data.summary) {
    sectionTitle('Profile');
    drawWrappedText(ctx, data.summary, mainX, mainWidth, fonts.sans, 9.5, COLORS.slate600, {
      lineHeight: 13,
      paragraphGap: 6,
    });
    ctx.moveCursor(10);
  }

  if (data.experience.length > 0) {
    sectionTitle('Experience');
    for (const exp of data.experience) {
      drawWrappedText(ctx, exp.role, mainX, mainWidth, fonts.sansBold, 11, COLORS.slate900, {
        lineHeight: 14,
        paragraphGap: 4,
      });
      const meta = `${exp.company}  |  ${exp.startDate} — ${exp.isCurrent ? 'Present' : exp.endDate}`;
      drawWrappedText(ctx, meta, mainX, mainWidth, fonts.sansBold, 9, COLORS.indigo500, {
        lineHeight: 12,
        paragraphGap: 4,
      });
      drawWrappedText(ctx, exp.description, mainX, mainWidth, fonts.sans, 9, COLORS.slate600, {
        lineHeight: 12,
        paragraphGap: 8,
      });
      ctx.moveCursor(6);
    }
  }

  if (data.projects.length > 0) {
    sectionTitle('Projects');
    for (const proj of data.projects) {
      drawWrappedText(ctx, proj.name, mainX, mainWidth, fonts.sansBold, 10, COLORS.slate900, {
        lineHeight: 13,
        paragraphGap: 4,
      });
      if (proj.link) {
        drawWrappedText(ctx, proj.link, mainX, mainWidth, fonts.sans, 8.5, COLORS.indigo500, {
          lineHeight: 11,
          paragraphGap: 2,
        });
      }
      drawWrappedText(ctx, proj.description, mainX, mainWidth, fonts.sans, 9, COLORS.slate600, {
        lineHeight: 12,
        paragraphGap: 10,
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

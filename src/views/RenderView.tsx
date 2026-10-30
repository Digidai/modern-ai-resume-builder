import React, { useEffect, useState } from 'react';
import ResumePreview from '../components/ResumePreview';
import { preloadResumeTemplate } from '../components/ResumeTemplateRenderer';
import { useSeo, SEO_ROBOTS_NOINDEX } from '../hooks/useSeo';
import { largestScaleForPages, measurePrintLayout } from '../utils/printLayout';
import { SCALE_MIN } from '../constants/design';
import { isFullBleedTemplate } from '../constants/templates';
import { decodeResumePayload, readResumeHash } from '../shared/resumeLink';
import { sanitizeResumeData } from '../utils/resumeData';
import type { ResumeData } from '../types';
import { paperSize } from '../constants/print';

/**
 * Bare paper (A4 or US Letter) for `/render/#resume=<payload>`: the Worker's agent PDF endpoint opens this page in
 * Cloudflare Browser Rendering and prints it. Nothing is saved; `data-render-state` on <html> tells
 * the printer when the template and fonts are ready (`ready`) or the payload was invalid (`error`),
 * `data-render-pages` is the printed page count (paginated the way print does), and
 * `data-render-fit-scale` the largest scale that fits one page when it runs longer.
 */
const RenderView: React.FC = () => {
  const [data, setData] = useState<ResumeData | null>(null);
  const root = document.documentElement;

  useSeo({
    title: 'Resume | ModernCV',
    description: 'Printable resume rendered by ModernCV.',
    canonical: '/render/',
    robots: SEO_ROBOTS_NOINDEX,
  });

  useEffect(() => {
    let cancelled = false;
    root.classList.remove('dark');
    void (async () => {
      const payload = readResumeHash(window.location.hash);
      const parsed = payload ? sanitizeResumeData(await decodeResumePayload(payload)) : null;
      if (!parsed) {
        root.dataset.renderState = 'error';
        return;
      }
      await preloadResumeTemplate(parsed.templateId);
      if (!cancelled) setData(parsed);
    })();
    return () => {
      cancelled = true;
    };
  }, [root]);

  useEffect(() => {
    if (!data) return;
    let frame = 0;
    // Lazy templates suspend once even when preloaded; wait for the real template, then fonts.
    const waitForTemplate = () => {
      const paper = document.getElementById('resume-render');
      if (!paper || paper.querySelector('[data-template-loading]')) {
        frame = requestAnimationFrame(waitForTemplate);
        return;
      }
      void document.fonts.ready.then(() =>
        requestAnimationFrame(() => {
          const fullBleed = isFullBleedTemplate(data.templateId);
          const pages = measurePrintLayout(paper, fullBleed).pages;
          root.dataset.renderPages = String(pages);
          // For a longer resume, the largest text size that would fit one page (empty when none does).
          if (pages > 1) root.dataset.renderFitScale = String(largestScaleForPages(paper, fullBleed, data.design.scale, SCALE_MIN) ?? '');
          root.dataset.renderState = 'ready';
        })
      );
    };
    waitForTemplate();
    return () => cancelAnimationFrame(frame);
  }, [data, root]);

  if (!data) return null;
  // In print the page box sets the width; a fixed page width would overflow the margin-inset content area and shrink.
  return (
    <main className="mx-auto bg-white print:w-full!" style={{ width: `${paperSize(data.design.paper).widthMm}mm` }}>
      <ResumePreview data={data} id="resume-render" showPageBreaks={false} />
    </main>
  );
};

export default RenderView;

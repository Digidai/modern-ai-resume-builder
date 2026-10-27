import React, { useEffect, useState } from 'react';
import ResumePreview from '../components/ResumePreview';
import { preloadResumeTemplate } from '../components/ResumeTemplateRenderer';
import { useSeo, SEO_ROBOTS_NOINDEX } from '../hooks/useSeo';
import { PRINT_CONFIG } from '../constants/print';
import { decodeResumePayload, readResumeHash } from '../shared/resumeLink';
import { sanitizeResumeData } from '../utils/resumeData';
import type { ResumeData } from '../types';

const PAGE_HEIGHT_PX = (PRINT_CONFIG.PAGE_HEIGHT_MM / 25.4) * 96;

/**
 * Bare A4 paper for `/render/#resume=<payload>`: the Worker's agent PDF endpoint opens this page in
 * Cloudflare Browser Rendering and prints it. Nothing is saved; `data-render-state` on <html> tells
 * the printer when the template and fonts are ready (`ready`) or the payload was invalid (`error`),
 * and `data-render-pages` reports the height in A4 pages.
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
          root.dataset.renderPages = (paper.offsetHeight / PAGE_HEIGHT_PX).toFixed(2);
          root.dataset.renderState = 'ready';
        })
      );
    };
    waitForTemplate();
    return () => cancelAnimationFrame(frame);
  }, [data, root]);

  if (!data) return null;
  return (
    <main className="mx-auto w-[210mm] bg-white">
      <ResumePreview data={data} id="resume-render" showPageBreaks={false} />
    </main>
  );
};

export default RenderView;

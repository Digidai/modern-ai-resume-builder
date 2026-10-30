import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import ResumePreview from '../components/ResumePreview';
import { TEMPLATE_IDS } from '../constants/templates';
import { loadRoleExample } from '../data/roleExamples';
import { getPersonaFullNameForJobTitle } from '../data/personas';
import { exampleToResume } from '../shared/roleExample.mjs';
import { BLANK_RESUME_DATA, createId } from '../utils/resumeData';
import type { ResumeData } from '../types';
import { trimExample, TRIM_LEVELS } from '../shared/trimExample.mjs';
import { MM_TO_PX, paperSize } from '../constants/print';
/** Highest page ratio at scale 1 that still fits at the 0.85 minimum (zoom shrinks height at least linearly). */
const MAX_RATIO = 1.22;

/**
 * Dev-only: renders a job title's example resume (exactly as the job page builds it) in templates at
 * true page size (A4, or US Letter with &paper=letter) and publishes each paper height on <html data-fit="{id: px}"> for scripts/roles-fit.
 * /dev/fit?title=Software%20Engineer&only=noir,swiss&scale=0.95
 * &auto=1 raises the trim level until every template is under MAX_RATIO, then publishes { level, heights }.
 * &level=N applies N trim steps; &scales={"noir":0.9} sets a per-template scale (verification pass).
 */
const FitCheck: React.FC = () => {
  const [params] = useSearchParams();
  const title = params.get('title') ?? '';
  const only = params.get('only')?.split(',').filter(Boolean);
  const scale = Number(params.get('scale')) || 1;
  const page = paperSize(params.get('paper'));
  const PAGE_PX = page.heightMm * MM_TO_PX;
  const auto = params.get('auto') === '1';
  const scales = JSON.parse(params.get('scales') || '{}') as Record<string, number>;
  const [level, setLevel] = useState(Number(params.get('level')) || 0);
  const [example, setExample] = useState<Awaited<ReturnType<typeof loadRoleExample>>>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);

  useEffect(() => {
    void loadRoleExample(title).then((found) => {
      if (!found) document.documentElement.dataset.fit = 'missing';
      else setExample(found);
    });
  }, [title]);

  useEffect(() => {
    if (!example) return;
    const data = exampleToResume({ title, fullName: getPersonaFullNameForJobTitle(title), example: trimExample(example, level), makeId: createId });
    setResume({ ...BLANK_RESUME_DATA, ...data, design: { ...BLANK_RESUME_DATA.design, scale, paper: page.id } } as ResumeData);
  }, [example, level, title, scale, page.id]);

  useEffect(() => {
    if (!resume) return;
    let frame = 0;
    const measure = () => {
      if (document.querySelector('[data-template-loading]')) {
        frame = requestAnimationFrame(measure);
        return;
      }
      void document.fonts.ready.then(() =>
        requestAnimationFrame(() => {
          const heights: Record<string, number> = {};
          document.querySelectorAll<HTMLElement>('[data-fit-id]').forEach((el) => {
            heights[el.dataset.fitId!] = el.offsetHeight;
          });
          const worst = Math.max(...Object.values(heights)) / PAGE_PX;
          if (auto && worst > MAX_RATIO && level < TRIM_LEVELS) setLevel(level + 1);
          else document.documentElement.dataset.fit = JSON.stringify({ level, heights });
        })
      );
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [resume]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!resume) return null;
  return (
    <div className="bg-slate-300">
      {(only ?? TEMPLATE_IDS).map((id) => (
        <div key={id} data-fit-id={id} className="bg-white" style={{ width: `${page.widthMm}mm` }}>
          <ResumePreview
            data={{ ...resume, templateId: id, design: { ...resume.design, scale: scales[id] ?? resume.design.scale } }}
            id=""
            showPageBreaks={false}
          />
        </div>
      ))}
    </div>
  );
};

export default FitCheck;

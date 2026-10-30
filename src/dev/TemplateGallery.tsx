import React from 'react';
import { paperSize } from '../constants/print';
import { useSearchParams } from 'react-router';
import ResumePreview from '../components/ResumePreview';
import { TEMPLATE_IDS } from '../constants/templates';
import { FIXTURES, SAMPLE_AWARDS, SAMPLE_PHOTO, SAMPLE_PUBLICATIONS, SAMPLE_TALKS, SAMPLE_TEACHING, type FixtureName } from './fixtures';

/**
 * Dev-only template gallery (not bundled in production).
 * /dev/templates?f=long            → every template, scaled down
 * /dev/templates?t=modern&f=sparse → one template at true page size, for screenshots (&paper=letter for US Letter)
 * Optional design overrides: &accent=%23A0442A  &font=garamond  &scale=0.9  &photo=1 (sample photo)  &pubs=1 (sample publications, awards, talks and teaching)  &hours=1 (40 hours per week on every job)
 */
const TemplateGallery: React.FC = () => {
  const [params] = useSearchParams();
  const fixtureName = (params.get('f') as FixtureName) || 'default';
  const baseFixture = FIXTURES[fixtureName] ?? FIXTURES.default;
  const single = params.get('t');
  const accent = params.get('accent');
  const paper = paperSize(params.get('paper'));
  const fixture = {
    ...baseFixture,
    ...(params.get('photo') === '1' ? { photo: SAMPLE_PHOTO } : {}),
    ...(params.get('pubs') === '1' ? { publications: SAMPLE_PUBLICATIONS, awards: SAMPLE_AWARDS, talks: SAMPLE_TALKS, teaching: SAMPLE_TEACHING } : {}),
    ...(params.get('hours') === '1' ? { experience: baseFixture.experience.map((exp) => ({ ...exp, hours: '40' })) } : {}),
    design: {
      accent: accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : '',
      font: params.get('font') || 'template',
      scale: Number(params.get('scale')) || 1,
      paper: paper.id,
    },
  };

  if (single) {
    return (
      <div className="min-h-screen bg-slate-300 p-8">
        <div className="mx-auto bg-white" style={{ width: `${paper.widthMm}mm` }} data-testid="paper">
          <ResumePreview data={{ ...fixture, templateId: single }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-300 p-6">
      <div className="mb-4 flex gap-3 text-sm">
        {(Object.keys(FIXTURES) as FixtureName[]).map((name) => (
          <a key={name} href={`?f=${name}`} className={name === fixtureName ? 'font-bold underline' : 'underline'}>
            {name}
          </a>
        ))}
      </div>
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))' }}>
        {TEMPLATE_IDS.map((id) => (
          <a key={id} href={`?t=${id}&f=${fixtureName}`} className="block">
            <div className="text-sm font-semibold mb-1">{id}</div>
            <div className="bg-white origin-top-left" style={{ zoom: 0.5, width: `${paper.widthMm}mm` }}>
              <ResumePreview data={{ ...fixture, templateId: id }} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TemplateGallery;

import type { buildRoleGuide } from '../shared/roleGuide.mjs';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from './Icons';

type RoleGuideData = ReturnType<typeof buildRoleGuide>;

interface RoleGuideProps {
  title: string;
  guide: RoleGuideData;
  onPickTemplate: (templateId: string) => void;
}

const Card = ({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-rule bg-surface p-6 shadow-card ${className}`}>
    <h3 className="font-display text-lg font-semibold tracking-display text-ink">{title}</h3>
    <div className="mt-3 text-[15px] leading-6 text-muted">{children}</div>
  </section>
);

/** Role-specific writing guide and FAQ shown under the template picker (also prerendered for SEO). */
export const RoleGuide = ({ title, guide, onPickTemplate }: RoleGuideProps) => (
  <div className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 pb-16 sm:px-6 md:scroll-mt-20" id="guide">
    <div className="border-t border-rule pt-12">
      <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">How to write a {title} resume</h2>
      <p className="mt-3 max-w-3xl text-base leading-[26px] text-muted">
        {guide.intro} {guide.advice}
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Sections, in order">
          <ol className="list-decimal space-y-1 pl-5 marker:text-muted">
            {guide.sections.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-3">
            <span className="font-medium text-ink">Length: </span>
            {guide.length}
          </p>
          <p className="mt-2">
            <span className="font-medium text-ink">Summary: </span>
            {guide.summaryTip}
          </p>
        </Card>

        <Card title="Skills to feature">
          <ul className="divide-y divide-rule border-y border-rule">
            {guide.skills.map((s) => (
              <li key={s} className="py-1 text-ink">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-3">Match the exact wording in the job posting; ATS keyword matching is literal.</p>
        </Card>

        <Card title="Example bullet points">
          <ul className="space-y-2">
            {guide.bullets.map((b) => (
              <li key={b} className="border-l-2 border-rule pl-3 text-ink">
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-3">Quantify with {guide.metrics.slice(0, 4).join(', ')}.</p>
        </Card>

        <Card title="Tips from recruiters" className="lg:col-span-2">
          <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">
            {guide.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Card>

        <Card title="Recommended templates" className="md:col-span-2 lg:col-span-1">
          <ul className="divide-y divide-rule border-y border-rule">
            {guide.recommended.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onPickTemplate(t.id)}
                  className="focus-ring group w-full py-2 text-left"
                >
                  <span className="flex items-baseline justify-between gap-2 font-medium text-ink group-hover:text-accent group-hover:underline group-hover:underline-offset-4">
                    {t.name}
                    {t.atsFriendly && <span className="tag no-underline">ATS</span>}
                  </span>
                  <span className="block text-sm text-muted">{t.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="mt-16 font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">{title} resume FAQ</h2>
      <div className="mt-6 max-w-3xl divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
        {guide.faqs.map((faq, i) => (
          <details key={faq.question} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-ink transition-colors marker:hidden hover:bg-tint focus-visible:bg-tint focus-visible:outline-none sm:px-6 [&::-webkit-details-marker]:hidden">
              <h3 className="text-base">{faq.question}</h3>
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-[15px] leading-[25px] text-muted sm:px-6">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </div>
);

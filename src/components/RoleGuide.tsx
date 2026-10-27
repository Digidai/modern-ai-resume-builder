import type { buildRoleGuide } from '../shared/roleGuide.mjs';
import type { ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from './Icons';

type RoleGuideData = ReturnType<typeof buildRoleGuide>;

interface RoleGuideProps {
  title: string;
  guide: RoleGuideData;
  onPickTemplate: (templateId: string) => void;
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    <div className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</div>
  </section>
);

/** Role-specific writing guide and FAQ shown under the template picker (also prerendered for SEO). */
export const RoleGuide = ({ title, guide, onPickTemplate }: RoleGuideProps) => (
  <div className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 pb-16 sm:px-6 md:scroll-mt-20" id="guide">
    <div className="border-t border-slate-200 pt-12 dark:border-slate-800">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">How to write a {title} resume</h2>
      <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
        {guide.intro} {guide.advice}
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Sections, in order">
          <ol className="list-decimal space-y-1 pl-5 marker:text-slate-400">
            {guide.sections.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-3">
            <span className="font-medium text-slate-800 dark:text-slate-200">Length: </span>
            {guide.length}
          </p>
          <p className="mt-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">Summary: </span>
            {guide.summaryTip}
          </p>
        </Card>

        <Card title="Skills to feature">
          <ul className="flex flex-wrap gap-1.5">
            {guide.skills.map((s) => (
              <li key={s} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-3">Match the exact wording in the job posting; ATS keyword matching is literal.</p>
        </Card>

        <Card title="Example bullet points">
          <ul className="space-y-2">
            {guide.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">Quantify with {guide.metrics.slice(0, 4).join(', ')}.</p>
        </Card>

        <Card title="Tips from recruiters">
          <ul className="list-disc space-y-1.5 pl-5 marker:text-slate-400">
            {guide.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Card>

        <Card title="Recommended templates">
          <ul className="space-y-2">
            {guide.recommended.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onPickTemplate(t.id)}
                  className="group w-full rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5"
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                    {t.name}
                    {t.atsFriendly && (
                      <span className="rounded bg-emerald-50 px-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        ATS
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{t.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="mt-14 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title} resume FAQ</h2>
      <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {guide.faqs.map((faq, i) => (
          <details key={faq.question} className="group px-5 py-4" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900 marker:hidden dark:text-white [&::-webkit-details-marker]:hidden">
              <h3 className="text-base">{faq.question}</h3>
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </div>
);

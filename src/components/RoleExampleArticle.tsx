import { useState } from 'react';
import { exampleToText, formatRange, toBullets, type RoleExample } from '../shared/roleExample.mjs';
import { Button } from './Button';

interface RoleExampleArticleProps {
  title: string;
  fullName: string;
  example: RoleExample;
  onStart: () => void;
}

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="kicker border-b border-rule pb-1.5 text-muted">
    {children}
  </h3>
);

/**
 * The job page's example resume as readable text (also prerendered by scripts/seo-postbuild.mjs),
 * so people can read, copy or start from it and search engines see unique content per role.
 */
export const RoleExampleArticle = ({ title, fullName, example, onStart }: RoleExampleArticleProps) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exampleToText(title, example));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-4 sm:px-6" id="example" aria-labelledby="example-heading">
      <div className="border-t border-rule pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="example-heading" className="font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">
              {title} resume example
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-[26px] text-muted">
              A complete, realistic example written for this role. Read it for structure and wording, copy it, or open it in the editor and replace the details with your own.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copy}>
              {copied ? 'Copied' : 'Copy text'}
            </Button>
            <Button onClick={onStart}>
              Edit this example
            </Button>
          </div>
        </div>

        <article className="mt-8 max-w-4xl rounded-[4px] border border-rule bg-surface p-6 text-[15px] leading-relaxed text-ink sm:p-10">
          <header>
            <p className="font-display text-2xl font-semibold tracking-display text-ink">{fullName}</p>
            <p className="font-medium text-muted">{title}</p>
          </header>

          <div className="mt-6 space-y-7">
            <div>
              <SectionTitle>Summary</SectionTitle>
              <p className="mt-3">{example.summary}</p>
            </div>

            <div>
              <SectionTitle>Experience</SectionTitle>
              <div className="mt-3 space-y-5">
                {example.experience.map((e) => (
                  <div key={`${e.company}-${e.startDate}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h4 className="font-semibold text-ink">{e.role}</h4>
                      <span className="text-sm text-muted">{formatRange(e)}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {e.company}
                      {e.location ? ` · ${e.location}` : ''}
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-muted">
                      {toBullets(e.description).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {example.projects?.length > 0 && (
              <div>
                <SectionTitle>Projects</SectionTitle>
                <div className="mt-3 space-y-3">
                  {example.projects.map((p) => (
                    <div key={p.name}>
                      <h4 className="font-semibold text-ink">
                        {p.name}
                        {p.link && <span className="ml-2 text-sm font-normal text-muted">{p.link}</span>}
                      </h4>
                      <p>{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {example.education.length > 0 && (
              <div>
                <SectionTitle>Education</SectionTitle>
                <div className="mt-3 space-y-2">
                  {example.education.map((ed) => (
                    <div key={`${ed.school}-${ed.degree}`} className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p>
                        <span className="font-semibold text-ink">{ed.degree}</span>, {ed.school}
                      </p>
                      <span className="text-sm text-muted">{formatRange(ed)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {example.skills.length > 0 && (
              <div>
                <SectionTitle>Skills</SectionTitle>
                <ul className="mt-3 space-y-1">
                  {example.skills.map((s) => {
                    const [group, items] = s.includes(':') ? [s.slice(0, s.indexOf(':')), s.slice(s.indexOf(':') + 1)] : ['', s];
                    return (
                      <li key={s}>
                        {group && <span className="font-semibold text-ink">{group}: </span>}
                        {items.trim()}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

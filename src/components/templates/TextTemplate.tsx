import React from 'react';
import { TemplateProps, Citation, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Text": a resume that is only text. No rules, capitals, colour or icons: the hierarchy comes from
// weight, size and white space alone, like a well-set plain document. One sans-serif face, one column.

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[7px] text-[15px] font-bold leading-tight text-(--accent) break-after-avoid">{title}</h2>
        {children}
    </section>
);

const bodyText = 'text-[13.5px] leading-[1.55] text-neutral-800 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-neutral-400';
const metaText = 'text-[13.5px] leading-snug text-neutral-500 wrap-break-word';

export const TextTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const publications = data.publications ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[20px] bg-white px-[19mm] py-[17mm] font-sans text-neutral-900 [--accent:var(--rs-accent,#0A0A0A)]">
            {(name || title || contacts.length > 0) && (
                <header className="break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[23px] font-bold leading-[1.2] text-neutral-950 wrap-break-word">{name}</div>}
                    {title && <p className="text-[15px] leading-snug text-neutral-600 wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <p className="mt-[8px] text-[13px] leading-[1.6] text-neutral-600">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    <span className="inline-block max-w-full">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                        {index < contacts.length - 1 && <span aria-hidden className="mr-[10px]">,</span>}
                                    </span>{' '}
                                </React.Fragment>
                            ))}
                        </p>
                    )}
                </header>
            )}

            {summary && (
                <Section title="Summary">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    <div className="flex flex-col gap-[14px]">
                        {data.experience.map((exp) => {
                            const heading = exp.role.trim() || exp.company.trim();
                            const company = exp.role.trim() ? exp.company.trim() : '';
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    {heading && <h3 className="text-[14px] font-semibold leading-snug text-neutral-950 wrap-break-word">{heading}</h3>}
                                    {(company || dates) && <p className={metaText}>{[company, dates].filter(Boolean).join(', ')}</p>}
                                    <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    <div className="flex flex-col gap-[11px]">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                {proj.name.trim() && <h3 className="text-[14px] font-semibold leading-snug text-neutral-950 wrap-break-word">{proj.name}</h3>}
                                {proj.link.trim() && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className={`${metaText} block wrap-anywhere hover:underline underline-offset-2`}>
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <div className="flex flex-col gap-[9px]">
                        {data.education.map((edu) => {
                            const heading = edu.degree.trim() || edu.school.trim();
                            const school = edu.degree.trim() ? edu.school.trim() : '';
                            const dates = formatDateRange(edu.startDate, edu.endDate);
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    {heading && <h3 className="text-[14px] font-semibold leading-snug text-neutral-950 wrap-break-word">{heading}</h3>}
                                    {(school || dates) && <p className={metaText}>{[school, dates].filter(Boolean).join(', ')}</p>}
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {publications.length > 0 && (
                <Section title="Publications">
                    <ul className="flex flex-col gap-[6px]">
                        {publications.map((pub) => (
                            <li key={pub.id} className={`${bodyText} break-inside-avoid`}>
                                <Citation pub={pub} owner={data.fullName} />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    <ul className="flex flex-col gap-[3px]">
                        {skillGroups.map((group, index) => (
                            <li key={index} className={bodyText}>
                                {group.category && <span className="font-semibold text-neutral-950">{group.category}: </span>}
                                {group.items.join(', ')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
};

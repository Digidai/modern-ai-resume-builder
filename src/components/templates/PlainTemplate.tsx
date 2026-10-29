import React from 'react';
import { TemplateProps, AwardLine, Citation, TalkLine, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Plain": the most basic resume there is. Black text in one sans-serif face, one column, left
// aligned, no colour, icons or boxes. Section headings are small capitals over a single hairline;
// entries put the role and dates on one line and the organisation under it.

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[8px] border-b border-neutral-300 pb-[3px] text-[12.5px] font-semibold uppercase tracking-[0.1em] text-(--accent) break-after-avoid">{title}</h2>
        {children}
    </section>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-neutral-800 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-neutral-500';
const dateClass = 'shrink-0 whitespace-nowrap text-[13px] tabular-nums text-neutral-600';

const EntryHead: React.FC<{ title: string; subtitle?: string; dates?: string }> = ({ title, subtitle, dates }) => (
    <>
        <div className="flex items-baseline justify-between gap-4">
            {title && <h3 className="min-w-0 text-[14px] font-semibold leading-snug text-neutral-950 wrap-break-word">{title}</h3>}
            {dates && <span className={dateClass}>{dates}</span>}
        </div>
        {subtitle && <p className="text-[13.5px] leading-snug text-neutral-700 wrap-break-word">{subtitle}</p>}
    </>
);

export const PlainTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const publications = data.publications ?? [];
    const awards = data.awards ?? [];
    const talks = data.talks ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[16px] bg-white px-[17mm] py-[15mm] font-sans text-neutral-900 [--accent:var(--rs-accent,#171717)]">
            {(name || title || contacts.length > 0) && (
                <header className="break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[27px] font-semibold leading-[1.15] tracking-[-0.01em] text-neutral-950 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[2px] text-[15px] leading-snug text-neutral-700 wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <p className="mt-[7px] text-[13px] leading-[1.55] text-neutral-700">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    <span className="inline-block max-w-full">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                        {index < contacts.length - 1 && <span aria-hidden className="mx-[7px] text-neutral-400">·</span>}
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
                    <div className="flex flex-col gap-[12px]">
                        {data.experience.map((exp) => {
                            const heading = exp.role.trim() || exp.company.trim();
                            const company = exp.role.trim() ? exp.company.trim() : '';
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <EntryHead title={heading} subtitle={company} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                    <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    <div className="flex flex-col gap-[10px]">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                <div className="flex items-baseline justify-between gap-4">
                                    {proj.name.trim() && <h3 className="min-w-0 text-[14px] font-semibold leading-snug text-neutral-950 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[13px] text-neutral-600 wrap-anywhere hover:underline underline-offset-2">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                </div>
                                <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <div className="flex flex-col gap-[8px]">
                        {data.education.map((edu) => {
                            const heading = edu.degree.trim() || edu.school.trim();
                            const school = edu.degree.trim() ? edu.school.trim() : '';
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    <EntryHead title={heading} subtitle={school} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {publications.length > 0 && (
                <Section title="Publications">
                    <ul className="flex flex-col gap-[5px]">
                        {publications.map((pub) => (
                            <li key={pub.id} className={`${bodyText} break-inside-avoid`}>
                                <Citation pub={pub} owner={data.fullName} />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {awards.length > 0 && (
                <Section title="Grants and awards">
                    <ul className="flex flex-col gap-[5px]">
                        {awards.map((award) => (
                            <li key={award.id} className={`${bodyText} break-inside-avoid`}>
                                <AwardLine award={award} />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {talks.length > 0 && (
                <Section title="Talks">
                    <ul className="flex flex-col gap-[5px]">
                        {talks.map((talk) => (
                            <li key={talk.id} className={`${bodyText} break-inside-avoid`}>
                                <TalkLine talk={talk} />
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

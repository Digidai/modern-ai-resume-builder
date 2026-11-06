import React from 'react';
import { TemplateProps, ContactLink, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Seoul", after the Korean 이력서 used by the big Korean job boards: a 3×4 photo on the left with
// the name and a labelled details grid beside it, then sections opened by a heavy black rule and
// laid out as tables with a grey header row (Period · Organization · Position). Bullets sit under
// their row. Reads as one column, top to bottom.

const bodyText = 'text-[13.5px] leading-[1.5] text-neutral-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[1px] marker:text-neutral-400';
const GRID = 'grid grid-cols-[36mm_minmax(0,1fr)_minmax(0,0.9fr)] gap-x-[4mm]';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[6px] border-b-[2px] border-neutral-900 pb-[4px] text-[15px] font-bold tracking-[0.04em] text-neutral-900 break-after-avoid">
            <span aria-hidden className="mr-[7px] inline-block h-[10px] w-[10px] bg-(--accent) align-[0px]" />
            {title}
        </h2>
        {children}
    </section>
);

/** Grey header row of a section table. */
const HeadRow: React.FC<{ cells: [string, string, string] }> = ({ cells }) => (
    <div aria-hidden className={`${GRID} bg-neutral-100 px-[8px] py-[4px] text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-600 break-after-avoid`}>
        {cells.map((cell, index) => <span key={index}>{cell}</span>)}
    </div>
);

export const SeoulTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[18px] bg-white px-[15mm] py-[14mm] font-sans text-neutral-900 [--accent:var(--rs-accent,#2B4C8C)]">
            <header className="flex items-stretch gap-[7mm] break-inside-avoid">
                <Portrait
                    data={data}
                    className="h-[44mm] w-[33mm] border border-neutral-300"
                    fallbackClassName="bg-neutral-100 text-[32px] font-bold tracking-[0.04em] text-neutral-500"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                    {name && <div role="heading" aria-level={1} className="text-[32px] font-bold leading-[1.1] tracking-[-0.01em] text-neutral-900 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[4px] text-[15.5px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <dl className="mt-[10px] grid grid-cols-[22mm_minmax(0,1fr)] border-t-[2px] border-neutral-900 text-[12.5px] leading-snug">
                            {contacts.map((entry) => (
                                <React.Fragment key={entry.id}>
                                    <dt className="border-b border-neutral-200 bg-neutral-50 px-[8px] py-[4px] font-semibold text-neutral-500">{entry.label}</dt>
                                    <dd className="min-w-0 border-b border-neutral-200 px-[9px] py-[4px] text-neutral-800">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                    </dd>
                                </React.Fragment>
                            ))}
                        </dl>
                    )}
                </div>
            </header>

            {summary && (
                <Section title="Profile">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    <HeadRow cells={['Period', 'Company', 'Position']} />
                    <div className="divide-y divide-neutral-200">
                        {data.experience.map((exp) => (
                            <article key={exp.id} className="px-[8px] py-[7px] break-inside-avoid">
                                <div className={`${GRID} items-baseline`}>
                                    <span className="text-[12.5px] tabular-nums text-neutral-500 wrap-break-word">{formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}</span>
                                    <h3 className="text-[14px] font-bold leading-snug text-neutral-900 wrap-break-word">{exp.company}</h3>
                                    <p className="text-[13.5px] font-semibold leading-snug text-(--accent) wrap-break-word">{exp.role}</p>
                                </div>
                                <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <HeadRow cells={['Period', 'School', 'Degree']} />
                    <div className="divide-y divide-neutral-200">
                        {data.education.map((edu) => (
                            <div key={edu.id} className={`${GRID} items-baseline px-[8px] py-[6px] break-inside-avoid`}>
                                <span className="text-[12.5px] tabular-nums text-neutral-500 wrap-break-word">{formatDateRange(edu.startDate, edu.endDate)}</span>
                                <span className="text-[14px] font-bold leading-snug text-neutral-900 wrap-break-word">{edu.school}</span>
                                <span className="text-[13.5px] leading-snug text-neutral-700 wrap-break-word">{edu.degree}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    <div className="divide-y divide-neutral-200">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="px-[8px] py-[6px] break-inside-avoid">
                                <div className="flex items-baseline justify-between gap-4">
                                    {proj.name.trim() && <h3 className="min-w-0 text-[14px] font-bold leading-snug text-neutral-900 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="ml-auto min-w-0 text-right text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
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

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.some((group) => group.category) ? (
                        <dl className="divide-y divide-neutral-200">
                            {skillGroups.map((group, index) => (
                                <div key={index} className="grid grid-cols-[36mm_minmax(0,1fr)] gap-x-[4mm] px-[8px] py-[5px] break-inside-avoid">
                                    <dt className="text-[12.5px] font-semibold text-neutral-500 wrap-break-word">{group.category}</dt>
                                    <dd className={bodyText}>{group.items.join(', ')}</dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className={`px-[8px] ${bodyText}`}>{skillGroups.flatMap((group) => group.items).join(', ')}</p>
                    )}
                </Section>
            )}
        </div>
    );
};

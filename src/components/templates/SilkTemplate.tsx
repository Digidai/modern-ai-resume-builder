import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Centered italic serif title between two accent hairlines — the Silk signature. */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mb-3.5 flex items-center gap-4 break-after-avoid">
        <div aria-hidden className="h-px flex-1 bg-(--accent)/30" />
        <h2 className="font-garamond text-[22px] leading-tight italic text-(--accent)">{children}</h2>
        <div aria-hidden className="h-px flex-1 bg-(--accent)/30" />
    </div>
);

/**
 * Every entry shares one rhythm: organisation + dates in a right-aligned gutter, the detail to the
 * right of a hairline. Keeps the date slot identical across sections.
 */
const Entry: React.FC<{ aside: React.ReactNode; children?: React.ReactNode }> = ({ aside, children }) => (
    <article className="grid break-inside-avoid grid-cols-[44mm_minmax(0,1fr)] gap-x-6">
        <div className="min-w-0 text-right">{aside}</div>
        <div className="min-w-0 border-l border-(--accent)/25 pl-6">{children}</div>
    </article>
);

const Org: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="font-garamond text-[17px] leading-snug italic text-stone-900">{children}</div>
);

const Dates: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mt-1 text-xs font-medium tracking-wider whitespace-nowrap uppercase tabular-nums text-stone-600">{children}</div>
);

const descriptionList = 'list-disc space-y-1 pl-4 marker:text-(--accent)/60';
const body = 'text-[14px] leading-[1.5] text-stone-700';

export const SilkTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex flex-1 flex-col bg-stone-50 px-[18mm] pt-[14mm] pb-[13mm] font-source-sans text-stone-800 wrap-break-word [--accent:var(--rs-accent,#57534E)]">
            <header className="mb-6 text-center">
                <h1 className="font-garamond text-[42px] leading-tight italic text-stone-900">{data.fullName}</h1>
                {data.title.trim() && (
                    <p className="mt-1.5 text-[13px] font-semibold tracking-[0.28em] uppercase text-stone-600">{data.title}</p>
                )}
                {contacts.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[13.5px] text-stone-700">
                        {contacts.map((entry) => (
                            <ContactLink key={entry.key} entry={entry} className="min-w-0 border-b border-(--accent)/25 pb-px wrap-anywhere" />
                        ))}
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-6">
                {data.summary.trim() && (
                    <section className="mx-auto max-w-[148mm] text-center">
                        <p className="font-garamond text-[16.5px] leading-[1.45] italic text-stone-700">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <SectionTitle>Experience</SectionTitle>
                        <div className="flex flex-col gap-4">
                            {data.experience.map((exp) => {
                                const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                return (
                                    <Entry
                                        key={exp.id}
                                        aside={
                                            <>
                                                {exp.company && <Org>{exp.company}</Org>}
                                                {dates && <Dates>{dates}</Dates>}
                                            </>
                                        }
                                    >
                                        {exp.role && <h3 className="pt-0.5 text-[13.5px] font-bold tracking-[0.12em] uppercase text-stone-900">{exp.role}</h3>}
                                        <RichText text={exp.description} className={`mt-1.5 ${body}`} listClassName={descriptionList} />
                                    </Entry>
                                );
                            })}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <SectionTitle>Projects</SectionTitle>
                        <div className="flex flex-col gap-4">
                            {data.projects.map((proj) => (
                                <Entry key={proj.id} aside={proj.name && <Org>{proj.name}</Org>}>
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block pt-0.5 text-[13px] text-stone-600 underline decoration-(--accent)/30 underline-offset-2 wrap-anywhere">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className={`${proj.link.trim() ? 'mt-1' : 'pt-0.5'} ${body}`} listClassName={descriptionList} />
                                </Entry>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <SectionTitle>Education</SectionTitle>
                        <div className="flex flex-col gap-3">
                            {data.education.map((edu) => {
                                const dates = formatDateRange(edu.startDate, edu.endDate);
                                return (
                                    <Entry
                                        key={edu.id}
                                        aside={
                                            <>
                                                {edu.school && <Org>{edu.school}</Org>}
                                                {dates && <Dates>{dates}</Dates>}
                                            </>
                                        }
                                    >
                                        {edu.degree && <div className="pt-0.5 font-garamond text-[17px] leading-snug text-stone-800">{edu.degree}</div>}
                                    </Entry>
                                );
                            })}
                        </div>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section>
                        <SectionTitle>Skills</SectionTitle>
                        <div className="flex flex-col gap-1.5">
                            {skillGroups.map((group, i) => (
                                group.category ? (
                                <Entry key={i} aside={<Org>{group.category}</Org>}>
                                    <ul className={`flex flex-wrap gap-x-5 gap-y-0.5 pt-0.5 ${body}`}>
                                        {group.items.map((item, j) => (
                                            <li key={j} className="min-w-0">{item}</li>
                                        ))}
                                    </ul>
                                </Entry>
                                ) : (
                                    <ul key={i} className={`flex flex-wrap justify-center gap-x-5 gap-y-0.5 ${body}`}>
                                        {group.items.map((item, j) => (
                                            <li key={j} className="min-w-0">{item}</li>
                                        ))}
                                    </ul>
                                )
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

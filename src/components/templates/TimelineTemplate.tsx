import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Modern accent" single column with a timeline: a tinted accent line runs down the dated sections
// (Experience, Education) with an accent dot per entry; each entry's dates sit beside the dot,
// above the role, so text still reads top to bottom.

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[5.5px] break-after-avoid border-b border-(--accent)/30 pb-1 text-[14px] font-semibold uppercase leading-tight tracking-[0.08em] text-(--accent)">
        {children}
    </h2>
);

const bodyText = 'text-[13.5px] leading-[1.45] text-[#374151] wrap-break-word';
const bodyList = 'list-disc pl-4 space-y-[2.5px] marker:text-(--accent)/60';

/** One entry on the rail: dot + dates first, then the heading lines and body. */
const TimelineEntry: React.FC<{ dates: string; children: React.ReactNode }> = ({ dates, children }) => (
    <article className="relative break-inside-avoid pl-[18px]">
        <span aria-hidden className="absolute top-[5px] -left-[4.5px] size-2 rounded-full bg-(--accent) ring-[3px] ring-white" />
        {dates && <div className="text-[12.5px] font-medium leading-[18px] tabular-nums text-[#4B5563]">{dates}</div>}
        {children}
    </article>
);

const Rail: React.FC<{ children: React.ReactNode; gap: string }> = ({ children, gap }) => (
    <div className={`ml-[5px] mt-2.5 flex flex-col border-l-[1.33px] border-(--accent)/30 ${gap}`}>{children}</div>
);

export const TimelineTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);

    return (
        <div className="flex flex-1 flex-col px-[16mm] py-[14mm] font-sans text-[#1F2937] [--accent:var(--rs-accent,#4338CA)]">
            <header className="mb-[4mm]">
                {data.fullName.trim() && <h1 className="text-[34.5px] font-bold leading-[1.15] tracking-[-0.015em] text-[#1F2937] wrap-break-word">{data.fullName}</h1>}
                {data.title.trim() && <p className="mt-1 text-[16px] font-medium leading-snug text-(--accent) wrap-break-word">{data.title}</p>}
                {contacts.length > 0 && (
                    /* Each item carries its own leading "·" in a clipped gutter, so separators never dangle. */
                    <div className="mt-2.5 overflow-hidden">
                        <div className="-ml-[18px] flex flex-wrap items-center gap-y-0.5 text-[12.75px] text-[#4B5563]">
                            {contacts.map((entry) => (
                                <span key={entry.key} className="flex min-w-0 items-baseline before:w-[18px] before:shrink-0 before:text-center before:text-[#9CA3AF] before:content-['·']">
                                    <ContactLink entry={entry} className="min-w-0 wrap-anywhere" />
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-[13px]">
                {data.summary.trim() && (
                    <section>
                        <SectionTitle>Profile</SectionTitle>
                        <p className={`mt-2 ${bodyText}`}>{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <SectionTitle>Experience</SectionTitle>
                        <Rail gap="gap-3.5">
                            {data.experience.map((exp) => (
                                <TimelineEntry key={exp.id} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}>
                                    {exp.role.trim() && <h3 className="text-[14.5px] font-semibold leading-snug text-[#111827] wrap-break-word">{exp.role}</h3>}
                                    {exp.company.trim() && <div className="text-[13.5px] font-medium leading-snug text-(--accent) wrap-break-word">{exp.company}</div>}
                                    <RichText text={exp.description} className={`mt-1.5 ${bodyText}`} listClassName={bodyList} />
                                </TimelineEntry>
                            ))}
                        </Rail>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <SectionTitle>Projects</SectionTitle>
                        <div className="mt-2 flex flex-col gap-2.5">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="break-inside-avoid">
                                    {(proj.name.trim() || proj.link.trim()) && (
                                        <div className="flex flex-wrap items-baseline gap-x-2.5">
                                            {proj.name.trim() && <h3 className="min-w-0 text-[14.5px] font-semibold leading-snug text-[#111827] wrap-break-word">{proj.name}</h3>}
                                            {proj.link.trim() && (
                                                <a
                                                    href={toHref(proj.link)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="min-w-0 text-[12.5px] text-[#4B5563] wrap-anywhere hover:underline underline-offset-2"
                                                >
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <RichText text={proj.description} className={`mt-1 ${bodyText}`} listClassName={bodyList} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <SectionTitle>Education</SectionTitle>
                        <Rail gap="gap-2.5">
                            {data.education.map((edu) => (
                                <TimelineEntry key={edu.id} dates={formatDateRange(edu.startDate, edu.endDate)}>
                                    {edu.degree.trim() && <h3 className="text-[14.5px] font-semibold leading-snug text-[#111827] wrap-break-word">{edu.degree}</h3>}
                                    {edu.school.trim() && <div className="text-[13.5px] font-medium leading-snug text-(--accent) wrap-break-word">{edu.school}</div>}
                                </TimelineEntry>
                            ))}
                        </Rail>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section className="break-inside-avoid">
                        <SectionTitle>Skills</SectionTitle>
                        {hasCategories ? (
                            <div className="mt-2 flex flex-col gap-1">
                                {skillGroups.map((group, index) => (
                                    <p key={index} className={bodyText}>
                                        {group.category && <span className="font-semibold text-[#111827]">{group.category}: </span>}
                                        {group.items.join(' · ')}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className={`mt-2 ${bodyText}`}>{skillGroups[0].items.join(' · ')}</p>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

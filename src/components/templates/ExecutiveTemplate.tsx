import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Centered serif title between two hairlines: the Executive signature. */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mb-3 flex items-center gap-4 break-after-avoid">
        <div aria-hidden="true" className="h-px flex-1 bg-(--accent)/35" />
        <h2 className="shrink-0 font-playfair text-[17px] font-bold uppercase tracking-[0.16em] text-(--accent)">{children}</h2>
        <div aria-hidden="true" className="h-px flex-1 bg-(--accent)/35" />
    </div>
);

const bodyText = 'text-[14.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.15em] space-y-[3px] marker:text-(--accent)';
const entryTitle = 'min-w-0 text-[15.5px] font-bold leading-snug text-slate-900 wrap-break-word';
const dateClass = 'shrink-0 whitespace-nowrap text-[13px] font-bold tabular-nums text-slate-600';

/** Confident centered executive layout: large Playfair name, centered rule-flanked headings, Lato body. */
export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);

    return (
        <div className="flex flex-1 flex-col gap-6 font-lato text-slate-800 [--accent:var(--rs-accent,#1E3A5F)]">
            <header className="flex flex-col items-center text-center">
                {data.fullName.trim() && (
                    <div role="heading" aria-level={1} className="font-playfair text-[40px] font-bold leading-[1.1] tracking-[0.01em] text-slate-900 wrap-break-word">{data.fullName}</div>
                )}
                {data.title.trim() && (
                    <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.24em] text-(--accent) wrap-break-word">{data.title}</p>
                )}
                {contacts.length > 0 && (
                    <div className="mt-4 flex w-full flex-wrap justify-center gap-x-6 gap-y-1 border-y border-(--accent) py-2 text-[13.5px] text-slate-700">
                        {contacts.map((entry) => (
                            <ContactLink key={entry.id} entry={entry} className="min-w-0 wrap-anywhere" />
                        ))}
                    </div>
                )}
            </header>

            {data.summary.trim() && (
                <section>
                    <SectionTitle>Professional Summary</SectionTitle>
                    <p className={`${bodyText} mx-auto max-w-[160mm] text-center whitespace-pre-line`}>{data.summary.trim()}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-[18px]">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            const heading = exp.company.trim() || exp.role.trim();
                            const role = exp.company.trim() ? exp.role.trim() : '';
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    {(heading || dates) && (
                                        <div className="flex items-baseline justify-between gap-4">
                                            <h3 className={entryTitle}>{heading}</h3>
                                            {dates && <span className={dateClass}>{dates}</span>}
                                        </div>
                                    )}
                                    {role && <div className="text-[14.5px] italic text-(--accent) wrap-break-word">{role}</div>}
                                    <RichText text={exp.description} className={`mt-1.5 ${bodyText}`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <SectionTitle>Projects</SectionTitle>
                    <div className="flex flex-col gap-3.5">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                {(proj.name.trim() || proj.link.trim()) && (
                                    <div className="flex flex-wrap items-baseline gap-x-3">
                                        {proj.name.trim() && <h3 className={entryTitle}>{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a
                                                href={toHref(proj.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="min-w-0 text-[13px] italic text-slate-600 wrap-anywhere hover:underline underline-offset-2"
                                            >
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                    </div>
                                )}
                                <RichText text={proj.description} className={`mt-1 ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {skillGroups.length > 0 && (
                <section className="break-inside-avoid">
                    <SectionTitle>Core Competencies</SectionTitle>
                    <div className="flex flex-col gap-1.5">
                        {skillGroups.map((group, groupIndex) => (
                            <ul key={groupIndex} className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[14.5px] leading-snug text-slate-800">
                                {hasCategories && <li className="font-bold text-slate-900 wrap-break-word">{group.category || 'Other'}:</li>}
                                {group.items.map((skill, index) => (
                                    <li key={index} className="min-w-0 wrap-break-word">
                                        {skill}
                                    </li>
                                ))}
                            </ul>
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
                            const heading = edu.school.trim() || edu.degree.trim();
                            const degree = edu.school.trim() ? edu.degree.trim() : '';
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className={entryTitle}>{heading}</h3>
                                        {dates && <span className={dateClass}>{dates}</span>}
                                    </div>
                                    {degree && <div className="text-[14.5px] italic text-slate-700 wrap-break-word">{degree}</div>}
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

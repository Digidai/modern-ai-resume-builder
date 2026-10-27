import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3.5 border-b border-slate-300 pb-1.5 font-serif text-[21px] font-semibold leading-tight text-(--accent) break-after-avoid">
        {children}
    </h2>
);

/** Date gutter on the left, content on the right: the Minimalist signature. */
const GutterRow: React.FC<{ aside?: string; children: React.ReactNode }> = ({ aside, children }) => (
    <article className="grid grid-cols-[32mm_1fr] gap-x-5 break-inside-avoid">
        <div className="pt-[3px] text-[12.5px] font-medium leading-snug tabular-nums text-slate-500">{aside}</div>
        <div className="min-w-0">{children}</div>
    </article>
);

const entryTitle = 'text-[16px] font-semibold leading-snug text-slate-900 wrap-break-word';
const entrySubtitle = 'font-serif text-[15px] italic leading-snug text-slate-700 wrap-break-word';
const bodyText = 'mt-1.5 text-[14.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-0.5 marker:text-slate-400';

/** Quiet, centered serif header over a single column with a left date gutter. */
export const MinimalistTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);

    return (
        <div className="flex flex-1 flex-col gap-6 font-source-sans text-slate-800 [--accent:var(--rs-accent,#0F172A)]">
            <header className="flex flex-col items-center border-b-2 border-(--accent) pb-5 text-center">
                {data.fullName.trim() && (
                    <div role="heading" aria-level={1} className="font-serif text-[38px] font-bold leading-[1.1] tracking-[-0.01em] text-slate-900 wrap-break-word">{data.fullName}</div>
                )}
                {data.title.trim() && <p className="mt-1.5 font-serif text-[18px] italic text-slate-600 wrap-break-word">{data.title}</p>}
                {contacts.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[14px] text-slate-600">
                        {contacts.map((entry) => (
                            <ContactLink key={entry.id} entry={entry} className="min-w-0 wrap-anywhere" />
                        ))}
                    </div>
                )}
            </header>

            {data.summary.trim() && (
                <section className="mx-auto max-w-[150mm] text-center">
                    <p className="font-serif text-[15px] leading-[1.6] whitespace-pre-line text-slate-700 wrap-break-word">{data.summary.trim()}</p>
                </section>
            )}

            {skillGroups.length > 0 && (
                <section className="break-inside-avoid border-y border-slate-200 py-3.5 text-center">
                    <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-(--accent)">Skills</h2>
                    <div className="flex flex-col gap-1.5">
                        {skillGroups.map((group, groupIndex) => (
                            <ul key={groupIndex} className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[14.5px] leading-snug text-slate-800">
                                {hasCategories && <li className="font-semibold text-slate-900 wrap-break-word">{group.category || 'Other'}:</li>}
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

            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-5">
                        {data.experience.map((exp) => {
                            const heading = exp.role.trim() || exp.company.trim();
                            const company = exp.role.trim() ? exp.company.trim() : '';
                            return (
                                <GutterRow key={exp.id} aside={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}>
                                    {heading && <h3 className={entryTitle}>{heading}</h3>}
                                    {company && <div className={entrySubtitle}>{company}</div>}
                                    <RichText text={exp.description} className={bodyText} listClassName={listClass} />
                                </GutterRow>
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
                            <GutterRow key={proj.id}>
                                {(proj.name.trim() || proj.link.trim()) && (
                                    <div className="flex flex-wrap items-baseline gap-x-3">
                                        {proj.name.trim() && <h3 className={`min-w-0 ${entryTitle}`}>{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a
                                                href={toHref(proj.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="min-w-0 font-serif text-[14px] italic text-slate-600 wrap-anywhere hover:underline underline-offset-2"
                                            >
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                    </div>
                                )}
                                <RichText text={proj.description} className={bodyText} listClassName={listClass} />
                            </GutterRow>
                        ))}
                    </div>
                </section>
            )}

            {data.education.length > 0 && (
                <section>
                    <SectionTitle>Education</SectionTitle>
                    <div className="flex flex-col gap-4">
                        {data.education.map((edu) => {
                            const heading = edu.school.trim() || edu.degree.trim();
                            const degree = edu.school.trim() ? edu.degree.trim() : '';
                            return (
                                <GutterRow key={edu.id} aside={formatDateRange(edu.startDate, edu.endDate)}>
                                    {heading && <h3 className={entryTitle}>{heading}</h3>}
                                    {degree && <div className={entrySubtitle}>{degree}</div>}
                                </GutterRow>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

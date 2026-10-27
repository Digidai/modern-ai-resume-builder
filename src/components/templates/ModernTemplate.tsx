import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3 border-b border-(--accent)/30 pb-1.5 text-[13.5px] font-bold uppercase tracking-[0.1em] text-(--accent) break-after-avoid">
        {children}
    </h2>
);

const bodyText = 'text-[14px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[3px] marker:text-(--accent)';
const dateClass = 'shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500';

/** Single-column "modern accent" layout: accent title, accent headings over a tinted rule, right-aligned dates. */
export const ModernTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);

    return (
        <div className="flex flex-1 flex-col gap-7 font-sans text-slate-800 [--accent:var(--rs-accent,#4338CA)]">
            <header>
                {data.fullName.trim() && (
                    <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-slate-900 wrap-break-word">{data.fullName}</h1>
                )}
                {data.title.trim() && <p className="mt-1.5 text-[17px] font-medium leading-snug text-(--accent) wrap-break-word">{data.title}</p>}
                {contacts.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-slate-600">
                        {contacts.map((entry) => (
                            <ContactItem key={entry.id} entry={entry} iconClassName="h-3.5 w-3.5 text-(--accent)" />
                        ))}
                    </div>
                )}
            </header>

            {data.summary.trim() && (
                <section>
                    <SectionTitle>Profile</SectionTitle>
                    <p className={`${bodyText} whitespace-pre-line`}>{data.summary.trim()}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-[18px]">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            const heading = exp.role.trim() || exp.company.trim();
                            const company = exp.role.trim() ? exp.company.trim() : '';
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    {(heading || dates) && (
                                        <div className="flex items-baseline justify-between gap-4">
                                            <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word">{heading}</h3>
                                            {dates && <span className={dateClass}>{dates}</span>}
                                        </div>
                                    )}
                                    {company && <div className="text-[14px] font-medium text-slate-600 wrap-break-word">{company}</div>}
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
                                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                                        {proj.name.trim() && (
                                            <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>
                                        )}
                                        {proj.link.trim() && (
                                            <a
                                                href={toHref(proj.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="min-w-0 text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2"
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
                    <SectionTitle>Skills</SectionTitle>
                    <div className="flex flex-col gap-2">
                        {skillGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className={hasCategories ? 'grid grid-cols-[30mm_1fr] items-baseline gap-x-3' : ''}>
                                {hasCategories && (
                                    <div className="text-[13px] font-semibold text-slate-900 wrap-break-word">{group.category || 'Other'}</div>
                                )}
                                <ul className="flex flex-wrap gap-1.5">
                                    {group.items.map((skill, index) => (
                                        <li
                                            key={index}
                                            className="rounded-[5px] bg-(--accent)/8 px-2 py-[3px] text-[13px] font-medium leading-snug text-slate-800 wrap-anywhere"
                                        >
                                            {skill}
                                        </li>
                                    ))}
                                </ul>
                            </div>
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
                                        <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word">{heading}</h3>
                                        {dates && <span className={dateClass}>{dates}</span>}
                                    </div>
                                    {degree && <div className="text-[14px] text-slate-600 wrap-break-word">{degree}</div>}
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-2 border-b border-(--accent)/40 pb-[3px] text-[12.5px] font-bold uppercase tracking-[0.14em] text-(--accent) break-after-avoid">
        {children}
    </h2>
);

const bodyText = 'text-[14px] leading-[1.42] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.05em] space-y-px marker:text-slate-400';
const dateClass = 'shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500';

/** Dense single column for long histories: tight rhythm, one-line entry headers, dates on the right. */
export const CompactTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex flex-1 flex-col gap-4 font-source-sans text-[14px] leading-[1.42] text-slate-800 [--accent:var(--rs-accent,#1D4ED8)]">
            <header className="flex items-end justify-between gap-6 border-b-2 border-(--accent) pb-3">
                {(data.fullName.trim() || data.title.trim()) && (
                    <div className="min-w-0 flex-1">
                        {data.fullName.trim() && (
                            <h1 className="text-[30px] font-bold leading-[1.05] tracking-[-0.01em] text-slate-900 wrap-break-word">{data.fullName}</h1>
                        )}
                        {data.title.trim() && <p className="mt-1 text-[16px] font-semibold text-(--accent) wrap-break-word">{data.title}</p>}
                    </div>
                )}
                {contacts.length > 0 && (
                    <ul className="max-w-[48%] shrink-0 text-right text-[13px] leading-[1.45] text-slate-600">
                        {contacts.map((entry) => (
                            <li key={entry.key} className="wrap-anywhere">
                                <ContactLink entry={entry} />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {data.summary.trim() && (
                <section>
                    <SectionHeading>Summary</SectionHeading>
                    <p className={`${bodyText} whitespace-pre-line`}>{data.summary.trim()}</p>
                </section>
            )}

            {skillGroups.length > 0 && (
                <section className="break-inside-avoid">
                    <SectionHeading>Skills</SectionHeading>
                    <div className="flex flex-col gap-0.5">
                        {skillGroups.map((group, groupIndex) => (
                            <p key={groupIndex} className="text-slate-800 wrap-break-word">
                                {group.category && <span className="font-bold text-slate-900">{group.category}: </span>}
                                {group.items.join(', ')}
                            </p>
                        ))}
                    </div>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionHeading>Experience</SectionHeading>
                    <div className="flex flex-col gap-3">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            const role = exp.role.trim();
                            const company = exp.company.trim();
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    {(role || company || dates) && (
                                        <div className="flex items-baseline justify-between gap-4">
                                            <h3 className="min-w-0 wrap-break-word">
                                                {role && <span className="font-bold text-slate-900">{role}</span>}
                                                {role && company && (
                                                    <span className="mx-1.5 text-slate-400" aria-hidden="true">
                                                        |
                                                    </span>
                                                )}
                                                {company && <span className="font-semibold text-slate-600">{company}</span>}
                                            </h3>
                                            {dates && <span className={dateClass}>{dates}</span>}
                                        </div>
                                    )}
                                    <RichText text={exp.description} className={`mt-0.5 ${bodyText} space-y-0.5`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <SectionHeading>Projects</SectionHeading>
                    <div className="flex flex-col gap-2.5">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                {(proj.name.trim() || proj.link.trim()) && (
                                    <div className="flex flex-wrap items-baseline gap-x-2.5">
                                        {proj.name.trim() && <h3 className="min-w-0 font-bold text-slate-900 wrap-break-word">{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a
                                                href={toHref(proj.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="min-w-0 text-[13px] text-(--accent) wrap-anywhere hover:underline underline-offset-2"
                                            >
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                    </div>
                                )}
                                <RichText text={proj.description} className={`mt-0.5 ${bodyText} space-y-0.5`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {data.education.length > 0 && (
                <section>
                    <SectionHeading>Education</SectionHeading>
                    <div className="flex flex-col gap-1.5">
                        {data.education.map((edu) => {
                            const dates = formatDateRange(edu.startDate, edu.endDate);
                            const school = edu.school.trim();
                            const degree = edu.degree.trim();
                            return (
                                <article key={edu.id} className="flex items-baseline justify-between gap-4 break-inside-avoid">
                                    <h3 className="min-w-0 wrap-break-word">
                                        {school && <span className="font-bold text-slate-900">{school}</span>}
                                        {school && degree && (
                                            <span className="mx-1.5 text-slate-400" aria-hidden="true">
                                                |
                                            </span>
                                        )}
                                        {degree && <span className="text-slate-700">{degree}</span>}
                                    </h3>
                                    {dates && <span className={dateClass}>{dates}</span>}
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

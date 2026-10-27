import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3 flex items-center gap-2.5 font-mono text-[13.5px] font-bold uppercase tracking-[0.06em] text-slate-900 break-after-avoid">
        <span className="text-(--accent)" aria-hidden="true">
            #
        </span>
        <span className="shrink-0">{children}</span>
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
    </h2>
);

const bodyText = 'text-[14px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-[square] pl-[1.1em] space-y-[3px] marker:text-(--accent)';
const metaClass = 'font-mono text-[12.5px] tabular-nums text-slate-500';

/** Developer-flavoured single column: monospace name, headings, dates and tags over a readable sans body. */
export const TechTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex flex-1 flex-col gap-6 font-sans text-slate-800 [--accent:var(--rs-accent,#3E6B4F)]">
            <header>
                {data.fullName.trim() && (
                    <div role="heading" aria-level={1} className="font-mono text-[30px] font-bold leading-[1.15] tracking-[-0.02em] text-slate-900 wrap-break-word">
                        {data.fullName}
                        <span aria-hidden="true" className="ml-1.5 inline-block h-[0.78em] w-[0.42em] translate-y-[0.08em] bg-(--accent)" />
                    </div>
                )}
                {data.title.trim() && (
                    <p className="mt-1.5 font-mono text-[15px] text-slate-600 wrap-break-word">
                        <span className="text-(--accent)" aria-hidden="true">
                            {'// '}
                        </span>
                        {data.title}
                    </p>
                )}
                {contacts.length > 0 && (
                    <ul className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12.5px] text-slate-800 print:bg-transparent">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="min-w-0 wrap-anywhere">
                                <span className="text-(--accent)">{entry.key}</span>
                                <span className="text-slate-500">: </span>
                                <ContactLink entry={entry} />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {data.summary.trim() && (
                <section>
                    <SectionHeading>Summary</SectionHeading>
                    <p className={`${bodyText} border-l-2 border-(--accent)/30 pl-3 whitespace-pre-line`}>{data.summary.trim()}</p>
                </section>
            )}

            {skillGroups.length > 0 && (
                <section className="break-inside-avoid">
                    <SectionHeading>Skills</SectionHeading>
                    <div className="flex flex-col gap-2">
                        {skillGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="flex flex-wrap items-baseline gap-1.5">
                                {group.category && <h3 className="mr-1 font-mono text-[12.5px] font-bold text-(--accent) wrap-break-word">{group.category}:</h3>}
                                {group.items.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="max-w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-px font-mono text-[12.5px] text-slate-800 wrap-break-word print:bg-transparent"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionHeading>Experience</SectionHeading>
                    <div className="flex flex-col gap-[18px]">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            const role = exp.role.trim();
                            const company = exp.company.trim();
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    {(role || company || dates) && (
                                        <div className="flex items-baseline justify-between gap-4">
                                            <h3 className="min-w-0 text-[15px] leading-snug wrap-break-word">
                                                {role && <span className="font-bold text-slate-900">{role}</span>}
                                                {role && company && <span className="font-mono text-(--accent)"> @ </span>}
                                                {company && <span className="font-semibold text-slate-700">{company}</span>}
                                            </h3>
                                            {dates && <span className={`shrink-0 whitespace-nowrap ${metaClass}`}>{dates}</span>}
                                        </div>
                                    )}
                                    <RichText text={exp.description} className={`mt-1.5 ${bodyText}`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <SectionHeading>Projects</SectionHeading>
                    <div className="flex flex-col gap-3.5">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                {(proj.name.trim() || proj.link.trim()) && (
                                    <div className="flex flex-wrap items-baseline gap-x-3">
                                        {proj.name.trim() && <h3 className="min-w-0 text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a
                                                href={toHref(proj.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="min-w-0 font-mono text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2"
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

            {data.education.length > 0 && (
                <section>
                    <SectionHeading>Education</SectionHeading>
                    <div className="flex flex-col gap-2.5">
                        {data.education.map((edu) => {
                            const dates = formatDateRange(edu.startDate, edu.endDate);
                            const heading = edu.school.trim() || edu.degree.trim();
                            const degree = edu.school.trim() ? edu.degree.trim() : '';
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="min-w-0 text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>
                                        {dates && <span className={`shrink-0 whitespace-nowrap ${metaClass}`}>{dates}</span>}
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

import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Portrait": a soft, tinted sidebar with a round photo at the top, contact details, skills and
// education; the main column carries the name, profile, experience and projects. Both columns
// are `.page-frame`s, so the tint and the margins continue on every printed page.

const SideHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[8px] text-[12px] font-bold uppercase tracking-[0.18em] text-(--accent) break-after-avoid">{children}</h2>
);

const MainHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] flex items-center gap-[10px] text-[15px] font-bold uppercase tracking-[0.14em] text-slate-900 break-after-avoid">
        {children}
        <span aria-hidden className="h-px flex-1 bg-slate-200" />
    </h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)/70';

export const PortraitTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-row font-lato text-slate-800 [--accent:var(--rs-accent,#9A4A2A)] [--side:color-mix(in_oklab,var(--accent)_9%,white)]">
            <aside className="page-frame flex w-[66mm] shrink-0 flex-col gap-[22px] bg-(--side) pt-[14mm] pr-[7mm] pb-[12mm] pl-[11mm] print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                <Portrait
                    data={data}
                    className="mx-auto h-[38mm] w-[38mm] rounded-full ring-[4px] ring-white"
                    fallbackClassName="bg-(--accent) text-[40px] font-bold tracking-[0.04em] text-white"
                />

                {contacts.length > 0 && (
                    <section>
                        <SideHeading>Contact</SideHeading>
                        <div className="flex flex-col gap-[6px] text-[12.5px] leading-snug text-slate-700">
                            {contacts.map((entry) => (
                                <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" fit />
                            ))}
                        </div>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section>
                        <SideHeading>Skills</SideHeading>
                        <div className="flex flex-col gap-[9px]">
                            {skillGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="break-inside-avoid">
                                    {group.category && <h3 className="mb-[4px] text-[12.5px] font-bold text-slate-900 wrap-break-word">{group.category}</h3>}
                                    <ul className="flex flex-wrap gap-[4px]">
                                        {group.items.map((skill, index) => (
                                            <li key={index} className="rounded-[3px] bg-white px-[7px] py-[2px] text-[12px] leading-snug text-slate-700 wrap-anywhere">
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
                        <SideHeading>Education</SideHeading>
                        <div className="flex flex-col gap-[10px]">
                            {data.education.map((edu) => {
                                const heading = edu.school.trim() || edu.degree.trim();
                                const degree = edu.school.trim() ? edu.degree.trim() : '';
                                const dates = formatDateRange(edu.startDate, edu.endDate);
                                return (
                                    <article key={edu.id} className="break-inside-avoid">
                                        {heading && <h3 className="text-[13.5px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                        {degree && <p className="text-[12.5px] leading-snug text-slate-700 wrap-break-word">{degree}</p>}
                                        {dates && <p className="mt-[2px] text-[12px] tabular-nums text-slate-500">{dates}</p>}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}
            </aside>

            <main className="page-frame flex min-w-0 flex-1 flex-col gap-[18px] bg-white pt-[14mm] pr-[13mm] pb-[12mm] pl-[9mm]">
                {(name || title) && (
                    <header className="break-inside-avoid">
                        {name && <div role="heading" aria-level={1} className="text-[33px] font-bold leading-[1.1] tracking-[-0.005em] text-slate-900 wrap-break-word">{name}</div>}
                        {title && <p className="mt-[5px] text-[15px] font-bold uppercase leading-snug tracking-[0.12em] text-(--accent) wrap-break-word">{title}</p>}
                    </header>
                )}

                {summary && (
                    <section>
                        <MainHeading>Profile</MainHeading>
                        <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <MainHeading>Experience</MainHeading>
                        <div className="flex flex-col gap-[13px]">
                            {data.experience.map((exp) => {
                                const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                const heading = exp.role.trim() || exp.company.trim();
                                const company = exp.role.trim() ? exp.company.trim() : '';
                                return (
                                    <article key={exp.id} className="break-inside-avoid">
                                        {heading && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                        {(company || dates) && (
                                            <div className="flex items-baseline justify-between gap-4">
                                                <span className="min-w-0 text-[13.5px] font-semibold text-(--accent) wrap-break-word">{company}</span>
                                                {dates && <span className="shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500">{dates}</span>}
                                            </div>
                                        )}
                                        <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <MainHeading>Projects</MainHeading>
                        <div className="flex flex-col gap-[10px]">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="break-inside-avoid">
                                    {proj.name.trim() && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Summit": the corporate photo resume. A full-width accent band carries a square photo, the name,
// the title and the contact details; below, a wide main column (profile, experience, projects) and
// a narrow right column (skills, education) separated by a hairline. The right column is a
// `.page-frame`, so its rule and margins continue on later printed pages.

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] text-[14px] font-bold uppercase tracking-[0.08em] text-(--accent) break-after-avoid">{children}</h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

export const SummitTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col font-roboto text-slate-800 [--accent:var(--rs-accent,#1E4A7A)]">
            <header className="flex items-center gap-[8mm] bg-(--accent) px-[14mm] py-[10mm] text-white break-inside-avoid print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                <Portrait
                    data={data}
                    className="h-[36mm] w-[36mm] rounded-[6px] border-[3px] border-white/90"
                    fallbackClassName="bg-white/15 text-[36px] font-bold tracking-[0.04em] text-white"
                />
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="text-[32px] font-bold leading-[1.08] tracking-[-0.005em] wrap-break-word">{name}</div>}
                    {title && <p className="mt-[4px] text-[15.5px] leading-snug text-white/85 wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <ul className="mt-[10px] grid grid-cols-2 gap-x-[16px] gap-y-[4px] text-[12px] leading-snug text-white/90">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="min-w-0">
                                    <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-white/70" fit />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </header>

            <div className="flex flex-1 flex-row">
                <main className="page-frame flex min-w-0 flex-1 flex-col gap-[17px] pt-[9mm] pr-[7mm] pb-[12mm] pl-[14mm]">
                    {summary && (
                        <section>
                            <Heading>Profile</Heading>
                            <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <Heading>Experience</Heading>
                            <div className="flex flex-col gap-[13px]">
                                {data.experience.map((exp) => {
                                    const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                    const heading = exp.role.trim() || exp.company.trim();
                                    const company = exp.role.trim() ? exp.company.trim() : '';
                                    return (
                                        <article key={exp.id} className="break-inside-avoid">
                                            <div className="flex items-baseline justify-between gap-4">
                                                {heading && <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                                {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500">{dates}</span>}
                                            </div>
                                            {company && <p className="text-[13.5px] font-medium text-(--accent) wrap-break-word">{company}</p>}
                                            <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <Heading>Projects</Heading>
                            <div className="flex flex-col gap-[10px]">
                                {data.projects.map((proj) => (
                                    <article key={proj.id} className="break-inside-avoid">
                                        {proj.name.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
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

                <aside className="page-frame flex w-[58mm] shrink-0 flex-col gap-[18px] border-l border-slate-200 pt-[9mm] pr-[12mm] pb-[12mm] pl-[7mm]">
                    {skillGroups.length > 0 && (
                        <section>
                            <Heading>Skills</Heading>
                            <div className="flex flex-col gap-[9px]">
                                {skillGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="break-inside-avoid">
                                        {group.category && <h3 className="mb-[3px] text-[12.5px] font-bold text-slate-900 wrap-break-word">{group.category}</h3>}
                                        <ul className="flex flex-col gap-[2px] text-[12.5px] leading-snug text-slate-700">
                                            {group.items.map((skill, index) => (
                                                <li key={index} className="wrap-anywhere">{skill}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <Heading>Education</Heading>
                            <div className="flex flex-col gap-[10px]">
                                {data.education.map((edu) => {
                                    const heading = edu.degree.trim() || edu.school.trim();
                                    const school = edu.degree.trim() ? edu.school.trim() : '';
                                    const dates = formatDateRange(edu.startDate, edu.endDate);
                                    return (
                                        <article key={edu.id} className="break-inside-avoid">
                                            {heading && <h3 className="text-[13px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                            {school && <p className="text-[12.5px] leading-snug text-slate-700 wrap-break-word">{school}</p>}
                                            {dates && <p className="mt-[2px] text-[12px] tabular-nums text-slate-500">{dates}</p>}
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
};

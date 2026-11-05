import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Frame", after the sidebar photo resume made common by resume.io and Zety: the photo fills the top
// of a light grey sidebar edge to edge, with contact details, skills and education below it; the
// main column opens with a large name and title, then the profile and experience. Both columns are
// `.page-frame`s, so the sidebar tint and the margins continue on every printed page.

const SideHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[8px] text-[12.5px] font-bold uppercase tracking-[0.18em] text-slate-900 break-after-avoid">{children}</h2>
);

const MainHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] flex items-center gap-[9px] text-[15px] font-bold uppercase tracking-[0.12em] text-slate-900 break-after-avoid">
        <span aria-hidden className="h-[14px] w-[4px] bg-(--accent)" />
        {children}
    </h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

export const FrameTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-row font-source-sans text-slate-800 [--accent:var(--rs-accent,#C0533A)]">
            <aside className="page-frame flex w-[68mm] shrink-0 flex-col gap-[20px] bg-[#EEF0F3] pb-[12mm] print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                <Portrait
                    data={data}
                    className="h-[80mm] w-full"
                    fallbackClassName="bg-(--accent) text-[54px] font-bold tracking-[0.04em] text-white"
                />

                <div className="flex flex-col gap-[20px] px-[9mm] first:pt-[14mm]">
                    {contacts.length > 0 && (
                        <section>
                            <SideHeading>Contact</SideHeading>
                            <div className="flex flex-col gap-[7px] text-[12.5px] leading-snug text-slate-700">
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
                                        {group.category && <h3 className="mb-[3px] text-[12.5px] font-bold text-slate-900 wrap-break-word">{group.category}</h3>}
                                        <ul className={`text-[12.5px] leading-snug text-slate-700 ${listClass}`}>
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
                            <SideHeading>Education</SideHeading>
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
                </div>
            </aside>

            <main className="page-frame flex min-w-0 flex-1 flex-col gap-[18px] bg-white pt-[14mm] pr-[13mm] pb-[12mm] pl-[10mm]">
                {(name || title) && (
                    <header className="border-b border-slate-200 pb-[14px] break-inside-avoid">
                        {name && <div role="heading" aria-level={1} className="text-[36px] font-bold leading-[1.05] tracking-[-0.01em] text-slate-900 wrap-break-word">{name}</div>}
                        {title && <p className="mt-[6px] text-[16px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>}
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
                                        <div className="flex items-baseline justify-between gap-4">
                                            {heading && <h3 className="min-w-0 text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                            {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500">{dates}</span>}
                                        </div>
                                        {company && <p className="text-[13.5px] font-semibold text-(--accent) wrap-break-word">{company}</p>}
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

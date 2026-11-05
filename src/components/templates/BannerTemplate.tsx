import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Banner", after the classic Novorésumé-style layout: name, title and a short profile on the left
// of the header with a square photo on the right, a full-width accent strip carrying the contact
// details, then a wide column (experience, projects) beside a narrow one (skills as tags,
// education). The right column is a `.page-frame` so its margins continue on later pages.

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] border-b-[2px] border-(--accent) pb-[3px] text-[14.5px] font-bold uppercase tracking-[0.1em] text-(--accent) break-after-avoid">{children}</h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

export const BannerTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col font-inter text-slate-900 [--accent:var(--rs-accent,#1B6EA8)]">
            <header className="flex items-start gap-[8mm] px-[14mm] pt-[13mm] pb-[7mm] break-inside-avoid">
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="text-[32px] font-bold leading-[1.08] tracking-[-0.015em] text-slate-900 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[4px] text-[16px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {summary && <p className="mt-[8px] text-[13px] italic leading-[1.5] text-slate-600 whitespace-pre-line wrap-break-word">{summary}</p>}
                </div>
                <Portrait
                    data={data}
                    className="h-[36mm] w-[36mm] rounded-[4px]"
                    fallbackClassName="bg-(--accent)/12 text-[36px] font-bold tracking-[0.04em] text-(--accent)"
                />
            </header>

            {contacts.length > 0 && (
                <ul className="flex flex-wrap gap-x-[18px] gap-y-[4px] bg-(--accent) px-[14mm] py-[7px] text-[12.5px] leading-snug text-white break-inside-avoid print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                    {contacts.map((entry) => (
                        <li key={entry.id} className="max-w-full">
                            <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-white/80" className="wrap-anywhere" />
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-1 flex-row">
                <main className="page-frame flex min-w-0 flex-1 flex-col gap-[17px] pt-[8mm] pr-[6mm] pb-[12mm] pl-[14mm]">
                    {data.experience.length > 0 && (
                        <section>
                            <Heading>Work Experience</Heading>
                            <div className="flex flex-col gap-[13px]">
                                {data.experience.map((exp) => {
                                    const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                    const heading = exp.role.trim() || exp.company.trim();
                                    const company = exp.role.trim() ? exp.company.trim() : '';
                                    return (
                                        <article key={exp.id} className="break-inside-avoid">
                                            {heading && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                            {company && <p className="text-[14px] leading-snug text-slate-700 wrap-break-word">{company}</p>}
                                            {dates && <p className="text-[12.5px] italic tabular-nums text-(--accent)">{dates}</p>}
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
                                        {proj.name.trim() && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] italic text-(--accent) wrap-anywhere hover:underline underline-offset-2">
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

                <aside className="page-frame flex w-[62mm] shrink-0 flex-col gap-[17px] pt-[8mm] pr-[14mm] pb-[12mm] pl-[4mm]">
                    {skillGroups.length > 0 && (
                        <section>
                            <Heading>Skills</Heading>
                            <div className="flex flex-col gap-[9px]">
                                {skillGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="break-inside-avoid">
                                        {group.category && <h3 className="mb-[4px] text-[12.5px] font-bold text-slate-900 wrap-break-word">{group.category}</h3>}
                                        <ul className="flex flex-wrap gap-[4px]">
                                            {group.items.map((skill, index) => (
                                                <li key={index} className="rounded-[3px] border border-(--accent)/45 px-[6px] py-[1px] text-[12px] leading-snug text-slate-800 wrap-anywhere">
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
                            <Heading>Education</Heading>
                            <div className="flex flex-col gap-[10px]">
                                {data.education.map((edu) => {
                                    const heading = edu.degree.trim() || edu.school.trim();
                                    const school = edu.degree.trim() ? edu.school.trim() : '';
                                    const dates = formatDateRange(edu.startDate, edu.endDate);
                                    return (
                                        <article key={edu.id} className="break-inside-avoid">
                                            {heading && <h3 className="text-[13.5px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                            {school && <p className="text-[13px] leading-snug text-slate-700 wrap-break-word">{school}</p>}
                                            {dates && <p className="text-[12px] italic tabular-nums text-(--accent)">{dates}</p>}
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

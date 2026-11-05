import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Onyx": the dark-sidebar photo resume that the big online builders made popular. A charcoal
// column with a round photo, contact details, skills and education sits beside a white main column
// with the name, profile and an experience list marked by accent dots. Both columns are
// `.page-frame`s, so the dark column and the margins continue on every printed page.

const SideHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] border-b border-white/20 pb-[4px] text-[12.5px] font-semibold uppercase tracking-[0.2em] text-white break-after-avoid">{children}</h2>
);

const MainHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[10px] text-[15px] font-bold uppercase tracking-[0.16em] text-neutral-900 break-after-avoid">
        {children}
        <span aria-hidden className="mt-[5px] block h-[3px] w-[28px] bg-(--accent)" />
    </h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-neutral-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

export const OnyxTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-row font-montserrat text-neutral-800 [--accent:var(--rs-accent,#2A9D8F)]">
            <aside className="page-frame flex w-[68mm] shrink-0 flex-col gap-[22px] bg-[#23272E] pt-[14mm] pr-[8mm] pb-[12mm] pl-[10mm] text-neutral-300 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                <Portrait
                    data={data}
                    className="mx-auto h-[40mm] w-[40mm] rounded-full border-[3px] border-(--accent)"
                    fallbackClassName="bg-white/10 text-[40px] font-semibold tracking-[0.04em] text-white"
                />

                {contacts.length > 0 && (
                    <section>
                        <SideHeading>Contact</SideHeading>
                        <div className="flex flex-col gap-[7px] text-[12px] leading-snug text-neutral-300">
                            {contacts.map((entry) => (
                                <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" fit />
                            ))}
                        </div>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section>
                        <SideHeading>Skills</SideHeading>
                        <div className="flex flex-col gap-[10px]">
                            {skillGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="break-inside-avoid">
                                    {group.category && <h3 className="mb-[4px] text-[12.5px] font-semibold text-white wrap-break-word">{group.category}</h3>}
                                    <ul className="flex flex-col gap-[3px] text-[12px] leading-snug">
                                        {group.items.map((skill, index) => (
                                            <li key={index} className="flex gap-[7px] wrap-anywhere">
                                                <span aria-hidden className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-(--accent)" />
                                                <span className="min-w-0">{skill}</span>
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
                                const heading = edu.degree.trim() || edu.school.trim();
                                const school = edu.degree.trim() ? edu.school.trim() : '';
                                const dates = formatDateRange(edu.startDate, edu.endDate);
                                return (
                                    <article key={edu.id} className="break-inside-avoid">
                                        {heading && <h3 className="text-[12.5px] font-semibold leading-snug text-white wrap-break-word">{heading}</h3>}
                                        {school && <p className="text-[12px] leading-snug wrap-break-word">{school}</p>}
                                        {dates && <p className="mt-[2px] text-[11.5px] tabular-nums text-neutral-400">{dates}</p>}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}
            </aside>

            <main className="page-frame flex min-w-0 flex-1 flex-col gap-[18px] bg-white pt-[14mm] pr-[12mm] pb-[12mm] pl-[10mm]">
                {(name || title) && (
                    <header className="break-inside-avoid">
                        {name && <div role="heading" aria-level={1} className="text-[32px] font-bold uppercase leading-[1.08] tracking-[0.04em] text-neutral-900 wrap-break-word">{name}</div>}
                        {title && <p className="mt-[6px] text-[14.5px] font-medium uppercase leading-snug tracking-[0.18em] text-(--accent) wrap-break-word">{title}</p>}
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
                                        {heading && <h3 className="text-[14.5px] font-bold leading-snug text-neutral-900 wrap-break-word">{heading}</h3>}
                                        {(company || dates) && (
                                            <div className="flex items-baseline justify-between gap-4">
                                                <span className="min-w-0 text-[13px] font-semibold text-neutral-600 wrap-break-word">{company}</span>
                                                {dates && <span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-(--accent)">{dates}</span>}
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
                                    {proj.name.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-neutral-900 wrap-break-word">{proj.name}</h3>}
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

import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SidebarHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3 border-b-2 border-(--accent)/25 pb-1.5 font-montserrat text-[12px] font-bold uppercase tracking-[0.14em] text-(--accent) break-after-avoid">
        {children}
    </h2>
);

const MainHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3.5 flex items-center gap-2.5 font-montserrat text-[18px] font-bold text-(--accent) break-after-avoid">
        <span className="h-5 w-1.5 shrink-0 rounded-full bg-(--accent)" aria-hidden="true" />
        {children}
    </h2>
);

const bodyText = 'text-[14.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[3px] marker:text-(--accent)';
const entryTitle = 'font-montserrat text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word';

/**
 * Accent header band over two columns: a tinted sidebar (contact, skills, education) and a main
 * column with a timeline for experience. Full-bleed, so it owns its page margins.
 */
export const CreativeTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasHeader = data.fullName.trim() || data.title.trim();

    return (
        <div className="flex flex-1 flex-col font-lato text-slate-800 [--accent:var(--rs-accent,#047857)]">
            {hasHeader && (
                <header className="bg-(--accent) px-[12mm] pt-[13mm] pb-[10mm] text-white print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                    {data.fullName.trim() && (
                        <h1 className="font-montserrat text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] wrap-break-word">{data.fullName}</h1>
                    )}
                    {data.title.trim() && (
                        <p className="mt-2 text-[17px] font-bold uppercase tracking-[0.12em] text-white/90 wrap-break-word">{data.title}</p>
                    )}
                </header>
            )}

            <div className="flex flex-1">
                <aside className="flex w-[34%] shrink-0 flex-col gap-7 bg-(--accent)/6 pt-[9mm] pr-[7mm] pb-[12mm] pl-[12mm] print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                    {contacts.length > 0 && (
                        <section>
                            <SidebarHeading>Contact</SidebarHeading>
                            <ul className="flex flex-col gap-2 text-[13.5px] text-slate-700">
                                {contacts.map((entry) => {
                                    const Icon = entry.icon;
                                    return (
                                        <li key={entry.key} className="flex min-w-0 items-start gap-2">
                                            <Icon className="mt-[3px] h-3.5 w-3.5 shrink-0 text-(--accent)" />
                                            <ContactLink entry={entry} className="min-w-0 leading-snug wrap-anywhere" />
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    {skillGroups.length > 0 && (
                        <section className="break-inside-avoid">
                            <SidebarHeading>Skills</SidebarHeading>
                            <div className="flex flex-col gap-3">
                                {skillGroups.map((group, groupIndex) => (
                                    <div key={groupIndex}>
                                        {group.category && <h3 className="mb-1.5 text-[13px] font-bold text-slate-900 wrap-break-word">{group.category}</h3>}
                                        <ul className="flex flex-wrap gap-1.5">
                                            {group.items.map((skill, index) => (
                                                <li
                                                    key={index}
                                                    className="max-w-full rounded border border-(--accent)/25 bg-white px-2 py-[3px] text-[12.5px] leading-snug text-slate-800 wrap-break-word"
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
                            <SidebarHeading>Education</SidebarHeading>
                            <div className="flex flex-col gap-4">
                                {data.education.map((edu) => {
                                    const dates = formatDateRange(edu.startDate, edu.endDate);
                                    return (
                                        <article key={edu.id} className="break-inside-avoid">
                                            {edu.school.trim() && <h3 className="text-[14px] font-bold leading-snug text-slate-900 wrap-break-word">{edu.school}</h3>}
                                            {edu.degree.trim() && <div className="mt-0.5 text-[13.5px] leading-snug text-slate-700 wrap-break-word">{edu.degree}</div>}
                                            {dates && <div className="mt-1 text-[12.5px] font-bold tabular-nums text-(--accent)">{dates}</div>}
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </aside>

                <main className="flex min-w-0 flex-1 flex-col gap-7 pt-[9mm] pr-[13mm] pb-[12mm] pl-[8mm]">
                    {data.summary.trim() && (
                        <section>
                            <MainHeading>Profile</MainHeading>
                            <p className={`${bodyText} whitespace-pre-line`}>{data.summary.trim()}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <MainHeading>Experience</MainHeading>
                            <div className="flex flex-col">
                                {data.experience.map((exp) => {
                                    const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                    const heading = exp.role.trim() || exp.company.trim();
                                    const company = exp.role.trim() ? exp.company.trim() : '';
                                    return (
                                        <article key={exp.id} className="relative ml-1 border-l-2 border-(--accent)/20 pb-5 pl-5 last:pb-0 break-inside-avoid">
                                            <span
                                                className="absolute -left-[7px] top-[5px] h-3 w-3 rounded-full border-[3px] border-(--accent) bg-white"
                                                aria-hidden="true"
                                            />
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className={`min-w-0 ${entryTitle}`}>{heading}</h3>
                                                {dates && (
                                                    <span className="shrink-0 whitespace-nowrap rounded bg-(--accent)/10 px-2 py-0.5 text-[12.5px] font-bold tabular-nums text-slate-700">
                                                        {dates}
                                                    </span>
                                                )}
                                            </div>
                                            {company && <div className="mt-0.5 text-[14.5px] font-bold text-(--accent) wrap-break-word">{company}</div>}
                                            <RichText text={exp.description} className={`mt-1.5 ${bodyText}`} listClassName={listClass} />
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <MainHeading>Projects</MainHeading>
                            <div className="flex flex-col gap-4">
                                {data.projects.map((proj) => (
                                    <article key={proj.id} className="break-inside-avoid">
                                        {proj.name.trim() && <h3 className={entryTitle}>{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a
                                                href={toHref(proj.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-0.5 block text-[12.5px] font-bold text-(--accent) wrap-anywhere hover:underline underline-offset-2"
                                            >
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                        <RichText text={proj.description} className={`mt-1 ${bodyText}`} listClassName={listClass} />
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

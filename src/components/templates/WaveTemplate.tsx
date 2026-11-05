import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Wave", after the curved-header photo resume that is one of the most used designs on Canva: an
// accent band with a wavy lower edge crosses the top of the first page, a round photo overlaps it,
// and the name and title sit below the wave on white. Below, a main column with dotted experience entries
// and a right column with contact details, skills and education.

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] text-[15px] font-bold uppercase tracking-[0.08em] text-slate-900 break-after-avoid">
        {children}
        <span aria-hidden className="mt-[4px] block h-[2px] w-[34px] rounded-full bg-(--accent)" />
    </h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

export const WaveTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="relative flex flex-1 flex-col font-montserrat text-slate-900 [--accent:var(--rs-accent,#2563A8)]">
            <svg aria-hidden viewBox="0 0 210 32" preserveAspectRatio="none" className="absolute top-0 left-0 h-[32mm] w-full text-(--accent) print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                <path d="M0 26C40 30 70 24 100 18C140 10 170 22 210 14V18C170 26 140 14 100 22C70 28 40 34 0 30Z" fill="currentColor" opacity="0.3" />
                <path d="M0 0H210V14C170 22 140 10 100 18C70 24 40 30 0 26Z" fill="currentColor" />
            </svg>

            <header className="relative flex items-start gap-[8mm] px-[14mm] pt-[11mm] pb-[6mm] break-inside-avoid">
                <Portrait
                    data={data}
                    className="h-[40mm] w-[40mm] rounded-full ring-[5px] ring-white"
                    fallbackClassName="bg-white text-[40px] font-bold tracking-[0.04em] text-(--accent)"
                />
                <div className="min-w-0 flex-1 pt-[25mm]">
                    {name && <div role="heading" aria-level={1} className="text-[31px] font-bold leading-[1.08] tracking-[-0.005em] text-slate-900 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[6px] text-[14.5px] font-semibold uppercase leading-snug tracking-[0.08em] text-(--accent) wrap-break-word">{title}</p>}
                </div>
            </header>

            <div className="relative flex flex-1 flex-row">
                <div className="page-frame flex min-w-0 flex-1 flex-col gap-[17px] pt-[6mm] pr-[7mm] pb-[12mm] pl-[14mm]">
                    {summary && (
                        <section>
                            <Heading>About Me</Heading>
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
                                        <article key={exp.id} className="relative pl-[16px] break-inside-avoid">
                                            <span aria-hidden className="absolute top-[6px] left-0 h-[8px] w-[8px] rounded-full bg-(--accent)" />
                                            {heading && <h3 className="text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                            {(company || dates) && (
                                                <p className="text-[13px] leading-snug text-slate-600 wrap-break-word">
                                                    {company && <span className="font-semibold">{company}</span>}
                                                    {company && dates && <span className="text-slate-400"> | </span>}
                                                    {dates && <span className="tabular-nums">{dates}</span>}
                                                </p>
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
                </div>

                <aside className="page-frame flex w-[64mm] shrink-0 flex-col gap-[18px] pt-[6mm] pr-[13mm] pb-[12mm] pl-[5mm]">
                    {contacts.length > 0 && (
                        <section>
                            <Heading>Contact</Heading>
                            <div className="flex flex-col gap-[7px] text-[12px] leading-snug text-slate-700">
                                {contacts.map((entry) => (
                                    <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" fit />
                                ))}
                            </div>
                        </section>
                    )}

                    {skillGroups.length > 0 && (
                        <section>
                            <Heading>Skills</Heading>
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

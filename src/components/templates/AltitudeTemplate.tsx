import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Altitude", after the AltaCV LaTeX layout: a bold uppercase name with an accent tagline and an
// icon contact row, then a 63/37 two-column body. The main column (profile, experience, projects)
// comes first in the DOM; the side column (skills as outlined tags, education) is placed on the
// right with grid placement. Entries are separated by dashed dividers and carry a calendar-icon
// date on the right of their second line.

const CalendarGlyph: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
        <rect x="2" y="3" width="12" height="11" rx="1.5" />
        <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" strokeLinecap="round" />
    </svg>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[8px] break-after-avoid border-b-2 border-(--accent) pb-[3px] text-[17px] font-bold uppercase leading-tight tracking-[0.04em] text-(--accent)">
        {children}
    </h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-[#333333] wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';
const divider = 'border-t border-dashed border-[#BBBBBB] pt-[9px] first:border-t-0 first:pt-0';

const Dates: React.FC<{ value: string }> = ({ value }) => (
    <span className="ml-auto inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap text-[12.5px] tabular-nums text-[#555555]">
        <CalendarGlyph className="h-[12px] w-[12px] text-(--accent)" />
        {value}
    </span>
);

export const AltitudeTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    const hasMain = Boolean(summary) || data.experience.length > 0 || data.projects.length > 0;
    const hasSide = skillGroups.length > 0 || data.education.length > 0;

    return (
        <div className="flex flex-1 flex-col gap-[7mm] px-[14mm] py-[13mm] font-roboto text-[#222222] [--accent:var(--rs-accent,#6B3E6E)]">
            {(name || title || contacts.length > 0) && (
                <header className="break-inside-avoid">
                    {name && <h1 className="text-[36px] font-bold uppercase leading-[1.08] tracking-[0.01em] text-[#222222] wrap-break-word">{name}</h1>}
                    {title && <p className="mt-[4px] text-[17px] font-medium leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <div className="mt-[9px] flex flex-wrap gap-x-[18px] gap-y-[4px] text-[13px] text-[#444444]">
                            {contacts.map((entry) => (
                                <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" />
                            ))}
                        </div>
                    )}
                </header>
            )}

            {(hasMain || hasSide) && (
                <div className="grid grid-cols-[minmax(0,63fr)_minmax(0,37fr)] gap-x-[8mm]">
                    {hasMain && (
                        <main className={`${hasSide ? 'col-start-1' : 'col-span-2'} row-start-1 flex min-w-0 flex-col gap-[6mm]`}>
                            {summary && (
                                <section>
                                    <SectionTitle>Profile</SectionTitle>
                                    <p className={`${bodyText} whitespace-pre-line border-l-[3px] border-(--accent)/40 pl-[10px] italic`}>{summary}</p>
                                </section>
                            )}

                            {data.experience.length > 0 && (
                                <section>
                                    <SectionTitle>Experience</SectionTitle>
                                    <div className="flex flex-col gap-[9px]">
                                        {data.experience.map((exp) => {
                                            const role = exp.role.trim();
                                            const company = exp.company.trim();
                                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                            const heading = role || company;
                                            const sub = role ? company : '';
                                            return (
                                                <article key={exp.id} className={`break-inside-avoid ${divider}`}>
                                                    {heading && <h3 className="text-[15.5px] font-semibold leading-snug text-[#222222] wrap-break-word">{heading}</h3>}
                                                    {(sub || dates) && (
                                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                                                            <span className="min-w-0 text-[14px] font-medium leading-snug text-(--accent) wrap-break-word">{sub}</span>
                                                            {dates && <Dates value={dates} />}
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
                                    <SectionTitle>Projects</SectionTitle>
                                    <div className="flex flex-col gap-[9px]">
                                        {data.projects.map((proj) => (
                                            <article key={proj.id} className={`break-inside-avoid ${divider}`}>
                                                {proj.name.trim() && <h3 className="text-[15.5px] font-semibold leading-snug text-[#222222] wrap-break-word">{proj.name}</h3>}
                                                {proj.link.trim() && (
                                                    <a
                                                        href={toHref(proj.link)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-[13px] font-medium text-(--accent) wrap-anywhere hover:underline"
                                                    >
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
                    )}

                    {hasSide && (
                        <aside className={`${hasMain ? 'col-start-2' : 'col-span-2'} row-start-1 flex min-w-0 flex-col gap-[6mm]`}>
                            {skillGroups.length > 0 && (
                                <section className="break-inside-avoid">
                                    <SectionTitle>Skills</SectionTitle>
                                    <div className="flex flex-col gap-[8px]">
                                        {skillGroups.map((group, index) => (
                                            <div key={index}>
                                                {group.category && <h3 className="mb-[4px] text-[13.5px] font-semibold text-[#222222] wrap-break-word">{group.category}</h3>}
                                                <ul className="flex flex-wrap gap-[5px]">
                                                    {group.items.map((skill, itemIndex) => (
                                                        <li
                                                            key={itemIndex}
                                                            className="max-w-full rounded-[4px] border border-(--accent)/55 px-[7px] py-[2px] text-[12.5px] leading-snug text-[#333333] wrap-anywhere"
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
                                    <div className="flex flex-col gap-[9px]">
                                        {data.education.map((edu) => {
                                            const degree = edu.degree.trim();
                                            const school = edu.school.trim();
                                            const dates = formatDateRange(edu.startDate, edu.endDate);
                                            return (
                                                <article key={edu.id} className={`break-inside-avoid ${divider}`}>
                                                    {(degree || school) && <h3 className="text-[14.5px] font-semibold leading-snug text-[#222222] wrap-break-word">{degree || school}</h3>}
                                                    {degree && school && <p className="text-[13.5px] font-medium leading-snug text-(--accent) wrap-break-word">{school}</p>}
                                                    {dates && (
                                                        <div className="mt-[2px] flex justify-end">
                                                            <Dates value={dates} />
                                                        </div>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </aside>
                    )}
                </div>
            )}
        </div>
    );
};

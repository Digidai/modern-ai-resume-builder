import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Halo": a soft, friendly layout. A full-bleed header washed with an accent gradient holds an
// initials avatar (no photo needed), an IBM Plex Serif name and an icon contact row. Below, a
// rounded tinted card on the left carries skills and education, beside the main column. The main
// column comes first in the DOM and the card is placed left with grid placement.

const initialsOf = (name: string): string => {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const first = Array.from(words[0])[0] ?? '';
    const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? '' : '';
    return (first + last).toUpperCase();
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[8px] flex items-center gap-[8px] break-after-avoid font-plex-serif text-[18px] font-semibold leading-tight text-slate-900">
        <span aria-hidden className="h-[8px] w-[8px] shrink-0 rounded-full bg-(--accent) ring-[3px] ring-(--accent)/20" />
        {children}
    </h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';
const dateClass = 'shrink-0 whitespace-nowrap text-[12.5px] font-medium tabular-nums text-slate-500';

export const HaloTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();
    const initials = initialsOf(name);
    const hasHeader = Boolean(name || title || contacts.length);

    const hasMain = Boolean(summary) || data.experience.length > 0 || data.projects.length > 0;
    const hasSide = skillGroups.length > 0 || data.education.length > 0;

    return (
        <div className="flex flex-1 flex-col font-sans text-slate-800 [--accent:var(--rs-accent,#4338CA)]">
            {hasHeader && (
                <header className="flex items-center gap-[6mm] bg-linear-to-br from-(--accent)/20 via-(--accent)/8 to-(--accent)/2 px-[15mm] pt-[12mm] pb-[8mm] break-inside-avoid">
                    {initials && (
                        <div
                            aria-hidden
                            className="flex h-[25mm] w-[25mm] shrink-0 items-center justify-center rounded-full bg-(--accent) font-plex-serif text-[34px] font-semibold tracking-[0.02em] text-white ring-[5px] ring-white/80"
                        >
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        {name && <h1 className="font-plex-serif text-[34px] font-semibold leading-[1.1] text-slate-900 wrap-break-word">{name}</h1>}
                        {title && <p className="mt-[4px] text-[14px] font-semibold uppercase leading-snug tracking-[0.14em] text-(--accent) wrap-break-word">{title}</p>}
                        {contacts.length > 0 && (
                            <div className="mt-[9px] flex flex-wrap gap-x-[16px] gap-y-[4px] text-[13px] text-slate-700">
                                {contacts.map((entry) => (
                                    <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" />
                                ))}
                            </div>
                        )}
                    </div>
                </header>
            )}

            {(hasMain || hasSide) && (
                <div className={`grid grid-cols-[58mm_minmax(0,1fr)] items-start gap-x-[7mm] px-[15mm] pb-[13mm] ${hasHeader ? 'pt-[7mm]' : 'pt-[13mm]'}`}>
                    {hasMain && (
                        <main className={`${hasSide ? 'col-start-2' : 'col-span-2'} row-start-1 flex min-w-0 flex-col gap-[6mm]`}>
                            {summary && (
                                <section>
                                    <SectionTitle>Profile</SectionTitle>
                                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                                </section>
                            )}

                            {data.experience.length > 0 && (
                                <section>
                                    <SectionTitle>Experience</SectionTitle>
                                    <div className="flex flex-col gap-[12px]">
                                        {data.experience.map((exp) => {
                                            const role = exp.role.trim();
                                            const company = exp.company.trim();
                                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                            return (
                                                <article key={exp.id} className="break-inside-avoid">
                                                    {(role || company || dates) && (
                                                        <div className="flex items-baseline justify-between gap-4">
                                                            <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word">{role || company}</h3>
                                                            {dates && <span className={dateClass}>{dates}</span>}
                                                        </div>
                                                    )}
                                                    {role && company && <p className="text-[14px] font-medium leading-snug text-(--accent) wrap-break-word">{company}</p>}
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
                                    <div className="flex flex-col gap-[10px]">
                                        {data.projects.map((proj) => (
                                            <article key={proj.id} className="break-inside-avoid">
                                                {(proj.name.trim() || proj.link.trim()) && (
                                                    <div className="flex flex-wrap items-baseline gap-x-3">
                                                        {proj.name.trim() && <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                                        {proj.link.trim() && (
                                                            <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[12.5px] text-(--accent) wrap-anywhere hover:underline">
                                                                {displayUrl(proj.link)}
                                                            </a>
                                                        )}
                                                    </div>
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
                        <aside
                            className={`${hasMain ? 'col-start-1' : 'col-span-2'} row-start-1 flex min-w-0 flex-col gap-[6mm] rounded-[14px] border border-(--accent)/15 bg-(--accent)/5 px-[5mm] py-[5mm]`}
                        >
                            {skillGroups.length > 0 && (
                                <section className="break-inside-avoid">
                                    <SectionTitle>Skills</SectionTitle>
                                    <div className="flex flex-col gap-[8px]">
                                        {skillGroups.map((group, index) => (
                                            <div key={index}>
                                                {group.category && <h3 className="mb-[4px] text-[13px] font-semibold text-slate-900 wrap-break-word">{group.category}</h3>}
                                                <ul className="flex flex-wrap gap-[5px]">
                                                    {group.items.map((skill, itemIndex) => (
                                                        <li key={itemIndex} className="max-w-full rounded-full bg-white px-[9px] py-[2px] text-[12.5px] leading-snug text-slate-800 ring-1 ring-(--accent)/20 wrap-anywhere">
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
                                    <div className="flex flex-col gap-[10px]">
                                        {data.education.map((edu) => {
                                            const degree = edu.degree.trim();
                                            const school = edu.school.trim();
                                            const dates = formatDateRange(edu.startDate, edu.endDate);
                                            return (
                                                <article key={edu.id} className="break-inside-avoid">
                                                    {(degree || school) && <h3 className="text-[14px] font-semibold leading-snug text-slate-900 wrap-break-word">{degree || school}</h3>}
                                                    {degree && school && <p className="text-[13.5px] leading-snug text-slate-700 wrap-break-word">{school}</p>}
                                                    {dates && <p className="mt-[1px] text-right text-[12.5px] font-medium tabular-nums text-slate-500">{dates}</p>}
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

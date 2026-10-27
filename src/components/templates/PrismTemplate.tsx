import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Prism": an angular, energetic layout. A full-bleed accent header with a slanted lower edge
// over a lighter offset facet, a Montserrat name in white, skewed date tags and parallelogram
// heading markers. Experience and projects run in one column; education and skills close the page
// side by side.

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] flex items-center gap-[10px] break-after-avoid font-montserrat text-[14.5px] font-bold uppercase leading-tight tracking-[0.14em] text-slate-900">
        <span aria-hidden className="h-[15px] w-[11px] shrink-0 -skew-x-[18deg] bg-(--accent)" />
        <span className="shrink-0">{children}</span>
        <span aria-hidden className="h-px min-w-6 flex-1 bg-slate-200" />
    </h2>
);

const bodyText = 'text-[14px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

const DateTag: React.FC<{ value: string }> = ({ value }) => (
    <span className="ml-auto inline-block shrink-0 -skew-x-[14deg] bg-(--accent)/10 px-[8px] py-[1px]">
        <span className="inline-block skew-x-[14deg] whitespace-nowrap text-[12.5px] font-semibold tabular-nums text-(--accent)">{value}</span>
    </span>
);

export const PrismTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();
    const hasHeader = Boolean(name || title || contacts.length);
    const hasBottom = data.education.length > 0 || skillGroups.length > 0;

    return (
        <div className="flex flex-1 flex-col font-source-sans text-slate-800 [--accent:var(--rs-accent,#A0442A)] [--accent-light:color-mix(in_oklab,var(--accent)_18%,white)]">
            {hasHeader && (
                <header className="relative break-inside-avoid">
                    <div aria-hidden className="absolute inset-0 bg-(--accent)/30 [clip-path:polygon(0_0,100%_0,100%_100%,0_calc(100%-10mm))]" />
                    <div className="relative bg-(--accent) px-[15mm] pt-[12mm] pb-[15mm] text-white [clip-path:polygon(0_0,100%_0,100%_calc(100%-11mm),0_calc(100%-2mm))]">
                        {name && <h1 className="font-montserrat text-[34px] font-extrabold uppercase leading-[1.08] tracking-[-0.005em] wrap-break-word">{name}</h1>}
                        {title && <p className="mt-[5px] font-montserrat text-[14px] font-semibold uppercase leading-snug tracking-[0.18em] text-(--accent-light) wrap-break-word">{title}</p>}
                        {contacts.length > 0 && (
                            <div className="mt-[10px] flex flex-wrap gap-x-[18px] gap-y-[4px] text-[13.5px] text-white">
                                {contacts.map((entry) => (
                                    <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent-light)" />
                                ))}
                            </div>
                        )}
                    </div>
                </header>
            )}

            <div className={`flex flex-col gap-[6mm] px-[15mm] pb-[13mm] ${hasHeader ? 'pt-[4mm]' : 'pt-[13mm]'}`}>
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
                                                <h3 className="min-w-0 text-[15.5px] font-bold leading-snug text-slate-900 wrap-break-word">{role || company}</h3>
                                                {dates && <DateTag value={dates} />}
                                            </div>
                                        )}
                                        {role && company && <p className="text-[14px] font-semibold uppercase leading-snug tracking-[0.06em] text-(--accent) wrap-break-word">{company}</p>}
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
                        <div className="grid grid-cols-2 gap-x-[7mm] gap-y-[10px]">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="min-w-0 break-inside-avoid border-l-2 border-(--accent)/40 pl-[10px]">
                                    {proj.name.trim() && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-(--accent) wrap-anywhere hover:underline">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {hasBottom && (
                    <div className="grid grid-cols-2 gap-x-[8mm] gap-y-[6mm]">
                        {data.education.length > 0 && (
                            <section className={`min-w-0 ${skillGroups.length ? '' : 'col-span-2'}`}>
                                <SectionTitle>Education</SectionTitle>
                                <div className="flex flex-col gap-[9px]">
                                    {data.education.map((edu) => {
                                        const degree = edu.degree.trim();
                                        const school = edu.school.trim();
                                        const dates = formatDateRange(edu.startDate, edu.endDate);
                                        return (
                                            <article key={edu.id} className="break-inside-avoid">
                                                {(degree || school || dates) && (
                                                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-[2px]">
                                                        <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{degree || school}</h3>
                                                        {dates && <DateTag value={dates} />}
                                                    </div>
                                                )}
                                                {degree && school && <p className="text-[13.5px] leading-snug text-slate-700 wrap-break-word">{school}</p>}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {skillGroups.length > 0 && (
                            <section className={`min-w-0 break-inside-avoid ${data.education.length ? '' : 'col-span-2'}`}>
                                <SectionTitle>Skills</SectionTitle>
                                <div className="flex flex-col gap-[7px]">
                                    {skillGroups.map((group, index) => (
                                        <div key={index}>
                                            {group.category && <h3 className="mb-[3px] text-[13.5px] font-bold text-slate-900 wrap-break-word">{group.category}</h3>}
                                            <ul className="flex flex-wrap gap-[6px]">
                                                {group.items.map((skill, itemIndex) => (
                                                    <li key={itemIndex} className="max-w-full -skew-x-[14deg] bg-slate-100 px-[8px] py-[1px]">
                                                        <span className="block skew-x-[14deg] text-[13px] leading-snug text-slate-800 wrap-anywhere">{skill}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

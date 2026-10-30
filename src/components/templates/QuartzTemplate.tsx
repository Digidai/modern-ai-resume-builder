import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3.5 border-b-2 border-(--accent) pb-1.5 font-jetbrains text-[12px] font-bold uppercase tracking-[0.16em] text-slate-900 break-after-avoid">
        {children}
    </h2>
);

/** The template's single date slot: a bordered mono tag on the right of the entry title. */
const DateTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="shrink-0 whitespace-nowrap border border-(--accent) px-1.5 py-px font-jetbrains text-[12px] font-medium tabular-nums text-slate-900">
        {children}
    </span>
);

const BULLETS = 'list-[square] space-y-1 pl-4 marker:text-(--accent)';

export const QuartzTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    // Contact details live in the side panel, so the two-panel frame keeps its structure even with sparse data.
    const hasSide = contacts.length > 0 || skillGroups.length > 0 || data.education.length > 0;

    const main = (
        <div className="flex min-w-0 flex-col gap-6">
            {data.summary.trim() && (
                <section>
                    <SectionTitle>Profile</SectionTitle>
                    <p className="text-[14px] font-medium text-slate-800">{data.summary}</p>
                </section>
            )}
            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-5">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    {(exp.role || dates) && (
                                        <div className="flex items-start justify-between gap-4">
                                            <h3 className="min-w-0 text-[15.5px] font-bold leading-snug text-slate-900">{exp.role}</h3>
                                            {dates && <DateTag>{dates}</DateTag>}
                                        </div>
                                    )}
                                    {exp.company && (
                                        <div className="mt-0.5 text-[12px] font-bold uppercase tracking-wider text-slate-600">{exp.company}</div>
                                    )}
                                    <RichText text={exp.description} className="mt-2 text-[13.5px] text-slate-700" listClassName={BULLETS} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
            {data.projects.length > 0 && (
                <section>
                    <SectionTitle>Projects</SectionTitle>
                    <div className="flex flex-col gap-4">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                {proj.name && <h3 className="text-[14.5px] font-bold leading-snug text-slate-900">{proj.name}</h3>}
                                {proj.link.trim() && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="mt-0.5 block font-jetbrains text-[12px] text-slate-600 wrap-anywhere hover:underline">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                <RichText text={proj.description} className="mt-1.5 text-[13.5px] text-slate-700" listClassName={BULLETS} />
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );

    return (
        <div className="flex flex-1 flex-col bg-white p-[10mm] font-inter text-[14px] leading-[1.5] text-slate-900 wrap-break-word [--accent:var(--rs-accent,#0F172A)]">
            <div className="page-frame flex flex-1 flex-col border-2 border-(--accent)">
                <header className="border-b-2 border-(--accent) px-[8mm] pt-[7mm] pb-[6mm]">
                    {data.fullName && (
                        <div role="heading" aria-level={1} className="text-[38px] font-bold uppercase leading-[1.05] tracking-tight text-slate-900">{data.fullName}</div>
                    )}
                    {data.title.trim() && (
                        <p className="mt-3 inline-block max-w-full bg-(--accent) px-2.5 py-1 text-[13px] font-semibold uppercase leading-snug tracking-[0.16em] text-white">
                            {data.title}
                        </p>
                    )}
                </header>

                {hasSide ? (
                    <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                        <aside className="page-frame flex min-w-0 flex-col gap-6 border-r-2 border-(--accent) bg-(--accent)/5 px-[6mm] py-[6mm]">
                            {contacts.length > 0 && (
                                <section>
                                    <SectionTitle>Contact</SectionTitle>
                                    <ul className="flex flex-col gap-1.5 text-[12.5px] text-slate-800">
                                        {contacts.map((entry) => (
                                            <li key={entry.id} className="min-w-0">
                                                <ContactItem entry={entry} iconClassName="h-3.5 w-3.5 text-(--accent)" fit />
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                            {skillGroups.length > 0 && (
                                <section>
                                    <SectionTitle>Skills</SectionTitle>
                                    <div className="flex flex-col gap-3">
                                        {skillGroups.map((group, gi) => (
                                            <div key={gi} className="min-w-0">
                                                {group.category && (
                                                    <div className="mb-0.5 font-jetbrains text-[12px] font-bold uppercase tracking-wider text-slate-600">{group.category}</div>
                                                )}
                                                <ul className="flex flex-col">
                                                    {group.items.map((skill, i) => (
                                                        <li key={i} className="flex items-baseline gap-2.5 border-b border-(--accent)/15 py-1 text-[13.5px] font-medium last:border-b-0">
                                                            <span aria-hidden className="h-1.5 w-1.5 shrink-0 -translate-y-px bg-(--accent)" />
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
                                    <SectionTitle>Education</SectionTitle>
                                    <div className="flex flex-col gap-3">
                                        {data.education.map((edu) => {
                                            const dates = formatDateRange(edu.startDate, edu.endDate);
                                            return (
                                                <article key={edu.id} className="break-inside-avoid border border-(--accent)/25 bg-white p-3">
                                                    {edu.school && <h3 className="text-[14px] font-bold leading-snug">{edu.school}</h3>}
                                                    {edu.degree && <div className="mt-0.5 text-[13.5px] leading-snug text-slate-700">{edu.degree}</div>}
                                                    {dates && <div className="mt-2"><DateTag>{dates}</DateTag></div>}
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </aside>
                        <div className="page-frame min-w-0 px-[7mm] py-[6mm]">{main}</div>
                    </div>
                ) : (
                    <div className="page-frame flex-1 px-[8mm] py-[6mm]">{main}</div>
                )}
            </div>
        </div>
    );
};

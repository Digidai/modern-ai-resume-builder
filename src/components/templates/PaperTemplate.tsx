import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Newspaper column head: small tracked caps over an accent rule. */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3 border-b border-(--accent) pb-1 text-xs font-bold tracking-[0.2em] text-black uppercase break-after-avoid">{children}</h2>
);

const descriptionList = 'list-disc space-y-0.5 pl-4 marker:text-(--accent)';
const dateClass = 'text-xs italic whitespace-nowrap tabular-nums text-stone-600';

export const PaperTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSide = data.education.length > 0 || skillGroups.length > 0;

    const main = (
        <div className="flex min-w-0 flex-col gap-6">
            {data.summary.trim() && (
                <section>
                    <p className="text-[15px] leading-normal first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-playfair first-letter:text-[50px] first-letter:leading-[0.8] first-letter:font-black first-letter:text-(--accent)">
                        {data.summary}
                    </p>
                </section>
            )}
            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Professional Experience</SectionTitle>
                    <div className="flex flex-col gap-4">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="min-w-0 text-[17px] leading-snug font-bold">{exp.role}</h3>
                                        {dates && <span className={`shrink-0 ${dateClass}`}>{dates}</span>}
                                    </div>
                                    {exp.company && <div className="mt-0.5 text-[13px] font-semibold tracking-wide text-stone-700 uppercase">{exp.company}</div>}
                                    <RichText text={exp.description} className="mt-1.5 text-[14px] leading-normal text-stone-800" listClassName={descriptionList} />
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
                                <div className="flex flex-wrap items-baseline gap-x-3">
                                    {proj.name && <h3 className="text-[16px] leading-snug font-bold">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[13px] italic text-stone-600 wrap-anywhere hover:underline">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                </div>
                                <RichText text={proj.description} className="mt-1 text-[14px] leading-normal text-stone-800" listClassName={descriptionList} />
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );

    return (
        <div className="flex flex-1 flex-col bg-[#fffef8] px-[16mm] pt-[13mm] pb-[12mm] font-charis text-stone-900 wrap-break-word [--accent:var(--rs-accent,#111111)]">
            <header className="border-y-4 border-double border-(--accent) py-4 text-center">
                <h1 className="font-playfair text-[46px] leading-[1.1] font-black tracking-tight">{data.fullName}</h1>
                {data.title.trim() && <p className="mt-1 text-[17px] italic text-stone-700">{data.title}</p>}
            </header>
            {contacts.length > 0 && (
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 border-b border-stone-300 py-2 text-[13px] text-stone-700">
                    {contacts.map((entry) => (
                        <ContactLink key={entry.key} entry={entry} className="min-w-0 wrap-anywhere" />
                    ))}
                </div>
            )}

            <div className="mt-6 flex flex-1 flex-col">
                {hasSide ? (
                    <div className="grid flex-1 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-7">
                        {main}
                        <aside className="flex min-w-0 flex-col gap-6 border-l border-stone-300 pl-6">
                            {data.education.length > 0 && (
                                <section>
                                    <SectionTitle>Education</SectionTitle>
                                    <div className="flex flex-col gap-3">
                                        {data.education.map((edu) => {
                                            const dates = formatDateRange(edu.startDate, edu.endDate);
                                            return (
                                                <div key={edu.id} className="break-inside-avoid text-[14px] leading-snug">
                                                    {edu.school && <div className="font-bold">{edu.school}</div>}
                                                    {edu.degree && <div className="mt-0.5 italic text-stone-700">{edu.degree}</div>}
                                                    {dates && <div className={`mt-1 ${dateClass}`}>{dates}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                            {skillGroups.length > 0 && (
                                <section>
                                    <SectionTitle>Skills</SectionTitle>
                                    <div className="flex flex-col gap-2 text-[14px] leading-snug">
                                        {skillGroups.map((group, i) => (
                                            <div key={i}>
                                                {group.category && <h3 className="mb-0.5 font-bold">{group.category}</h3>}
                                                <ul className="flex flex-col gap-0.5">
                                                    {group.items.map((skill, j) => (
                                                        <li key={j}>{skill}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </aside>
                    </div>
                ) : (
                    main
                )}
            </div>
        </div>
    );
};

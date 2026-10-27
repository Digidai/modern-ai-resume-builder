import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3.5 text-xs font-bold tracking-[0.25em] text-(--accent-light) uppercase break-after-avoid">{children}</h2>
);

const descriptionList = 'list-disc space-y-1 pl-4 marker:text-(--accent-light)/70';
const body = 'text-[13.5px] leading-normal text-zinc-300';

export const NoirTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSide = skillGroups.length > 0 || data.education.length > 0;

    const main = (
        <div className="flex min-w-0 flex-col gap-6">
            {data.summary.trim() && (
                <section>
                    <SectionTitle>Profile</SectionTitle>
                    <p className="text-[14.5px] leading-normal text-zinc-200">{data.summary}</p>
                </section>
            )}
            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-5">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            return (
                                <article key={exp.id} className="break-inside-avoid border-l-2 border-zinc-700 pl-5">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="min-w-0 text-[17px] leading-snug font-medium text-white">{exp.role}</h3>
                                        {dates && <span className="shrink-0 text-xs whitespace-nowrap tabular-nums text-zinc-400">{dates}</span>}
                                    </div>
                                    {exp.company && <div className="mt-0.5 text-[14px] font-medium text-(--accent-light)">{exp.company}</div>}
                                    <RichText text={exp.description} className={`mt-2 ${body}`} listClassName={descriptionList} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
            {data.projects.length > 0 && (
                <section>
                    <SectionTitle>Projects</SectionTitle>
                    <div className="flex flex-col gap-5">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid border-l-2 border-zinc-700 pl-5">
                                {proj.name && <h3 className="text-[16px] leading-snug font-medium text-white">{proj.name}</h3>}
                                {proj.link.trim() && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-[13px] text-(--accent-light) wrap-anywhere hover:underline">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                <RichText text={proj.description} className={`mt-1.5 ${body}`} listClassName={descriptionList} />
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );

    return (
        <div className="flex flex-1 flex-col bg-zinc-900 px-[15mm] pt-[13mm] pb-[12mm] font-sans text-zinc-100 wrap-break-word [--accent-light:oklch(from_var(--accent)_0.82_min(c,0.14)_h)] [--accent:var(--rs-accent,#A16207)]">
            <header className="mb-6 border-b border-zinc-700 pb-6">
                <div role="heading" aria-level={1} className="font-raleway text-[42px] leading-tight font-light tracking-wide text-white">{data.fullName}</div>
                {data.title.trim() && (
                    <p className="mt-1.5 text-[14px] font-medium tracking-[0.28em] text-(--accent-light) uppercase">{data.title}</p>
                )}
                {contacts.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-x-7 gap-y-1.5 text-[13.5px] text-zinc-300">
                        {contacts.map((entry) => (
                            <ContactItem key={entry.id} entry={entry} iconClassName="h-3.5 w-3.5 text-(--accent-light)" />
                        ))}
                    </div>
                )}
            </header>

            {hasSide ? (
                <div className="grid flex-1 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-9">
                    {main}
                    <aside className="flex min-w-0 flex-col gap-6 border-l border-zinc-700 pl-7">
                        {skillGroups.length > 0 && (
                            <section>
                                <SectionTitle>Skills</SectionTitle>
                                <div className="flex flex-col gap-3">
                                    {skillGroups.map((group, i) => (
                                        <div key={i}>
                                            {group.category && <h3 className="mb-1 text-[13.5px] font-medium text-white">{group.category}</h3>}
                                            <ul className="flex flex-col gap-1 text-[13.5px] text-zinc-200">
                                                {group.items.map((skill, j) => (
                                                    <li key={j} className="flex items-baseline gap-2.5">
                                                        <span aria-hidden className="shrink-0 text-(--accent-light)">—</span>
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
                                <div className="flex flex-col gap-4">
                                    {data.education.map((edu) => {
                                        const dates = formatDateRange(edu.startDate, edu.endDate);
                                        return (
                                            <div key={edu.id} className="break-inside-avoid">
                                                {edu.school && <div className="text-[14px] leading-snug font-medium text-white">{edu.school}</div>}
                                                {edu.degree && <div className="mt-0.5 text-[13.5px] leading-snug text-zinc-300">{edu.degree}</div>}
                                                {dates && <div className="mt-1 text-xs tabular-nums text-zinc-400">{dates}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            ) : (
                main
            )}
        </div>
    );
};

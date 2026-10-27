import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3 text-xs font-bold tracking-[0.25em] text-(--accent) uppercase break-after-avoid">{children}</h2>
);

const descriptionList = 'list-disc space-y-0.5 pl-4 marker:text-(--accent)/50';
const body = 'text-[13.5px] leading-normal text-slate-700';

export const ModaTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSide = skillGroups.length > 0 || data.education.length > 0;

    const main = (
        <main className="flex min-w-0 flex-col gap-6">
            {data.summary.trim() && (
                <section>
                    <SectionTitle>Profile</SectionTitle>
                    <p className="text-[14px] leading-normal text-slate-800">{data.summary}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-4.5">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="min-w-0 text-[15.5px] leading-snug font-bold text-slate-900">{exp.role}</h3>
                                        {dates && <span className="shrink-0 text-xs whitespace-nowrap tabular-nums text-slate-600">{dates}</span>}
                                    </div>
                                    {exp.company && <div className="mt-0.5 text-[13.5px] font-medium text-slate-600">{exp.company}</div>}
                                    <RichText text={exp.description} className={`mt-1.5 ${body}`} listClassName={descriptionList} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <SectionTitle>Projects</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="min-w-0 break-inside-avoid rounded-lg border border-slate-200 p-3.5">
                                {proj.name && <h3 className="text-[14px] leading-snug font-bold text-slate-900">{proj.name}</h3>}
                                {proj.link.trim() && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-xs text-(--accent) wrap-anywhere hover:underline">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                <RichText text={proj.description} className={`mt-1.5 ${body}`} listClassName={descriptionList} />
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );

    return (
        <div className="flex flex-1 flex-col bg-white px-[16mm] pt-[14mm] pb-[12mm] font-sans text-slate-900 wrap-break-word [--accent:var(--rs-accent,#8A2C3F)]">
            <header className="mb-7 border-b border-(--accent) pb-6 text-center">
                <div role="heading" aria-level={1} className="font-playfair text-[44px] leading-[1.1] font-bold text-slate-950">{data.fullName}</div>
                {data.title.trim() && <p className="mt-2 text-[13px] font-medium tracking-[0.3em] text-slate-600 uppercase">{data.title}</p>}
                {contacts.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-[13px] text-slate-700">
                        {contacts.map((entry) => (
                            <ContactItem key={entry.id} entry={entry} iconClassName="h-3.5 w-3.5 text-(--accent)" />
                        ))}
                    </div>
                )}
            </header>

            {hasSide ? (
                <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-8">
                    <aside className="flex min-w-0 flex-col gap-6 border-r border-slate-200 pr-7">
                        {skillGroups.length > 0 && (
                            <section>
                                <SectionTitle>Skills</SectionTitle>
                                <div className="flex flex-col gap-3">
                                    {skillGroups.map((group, i) => (
                                        <div key={i}>
                                            {group.category && <h3 className="mb-1.5 text-[13px] font-semibold text-slate-900">{group.category}</h3>}
                                            <ul className="flex flex-wrap gap-1.5">
                                                {group.items.map((skill, j) => (
                                                    <li key={j} className="max-w-full rounded-full border border-slate-300 px-2.5 py-0.5 text-[13px] text-slate-800">
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
                                <div className="flex flex-col gap-3.5">
                                    {data.education.map((edu) => {
                                        const dates = formatDateRange(edu.startDate, edu.endDate);
                                        return (
                                            <div key={edu.id} className="break-inside-avoid">
                                                {edu.school && <div className="text-[14px] leading-snug font-semibold">{edu.school}</div>}
                                                {edu.degree && <div className="mt-0.5 text-[13.5px] leading-snug text-slate-700">{edu.degree}</div>}
                                                {dates && <div className="mt-1 text-xs tabular-nums text-slate-600">{dates}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </aside>
                    {main}
                </div>
            ) : (
                main
            )}
        </div>
    );
};

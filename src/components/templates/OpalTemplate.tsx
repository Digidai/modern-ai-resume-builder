import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.25em] text-(--accent) mb-3.5 break-after-avoid">
        <span className="h-px flex-1 bg-(--accent)/20" aria-hidden="true" />
        {children}
        <span className="h-px flex-1 bg-(--accent)/20" aria-hidden="true" />
    </h2>
);

/** Title left, dates right; the single date slot used by every section. */
const EntryHead: React.FC<{ title: string; dates: string }> = ({ title, dates }) => (
    <div className="flex justify-between items-baseline gap-4">
        {title && <h3 className="text-[15px] font-semibold text-slate-900 leading-snug min-w-0 wrap-break-word">{title}</h3>}
        {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] font-medium text-slate-500 tabular-nums">{dates}</span>}
    </div>
);

const listClass = 'list-disc pl-4 space-y-0.5 marker:text-(--accent)/60';

export const OpalTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skills = groupSkills(data.skills).flatMap((group) => group.items);

    return (
        <div className="flex flex-col flex-1 gap-6 px-[16mm] pt-[13mm] pb-[12mm] bg-white font-inter text-[14px] leading-normal text-slate-700 [--accent:var(--rs-accent,#47607A)]">
            <header className="text-center">
                <div role="heading" aria-level={1} className="font-raleway text-[38px] font-light tracking-wide leading-tight text-slate-900 wrap-break-word">{data.fullName}</div>
                {data.title && <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-[0.22em] text-(--accent) wrap-break-word">{data.title}</p>}
                {contacts.length > 0 && (
                    <ul className="mt-4 flex justify-center flex-wrap gap-2 text-[12.5px] font-medium text-slate-700">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="max-w-full min-w-0 bg-(--accent)/5 border border-(--accent)/15 px-3 py-0.5 rounded-full">
                                <ContactItem entry={entry} iconClassName="w-3 h-3 text-(--accent)" />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {data.summary && (
                <section className="bg-(--accent)/5 px-9 py-4 rounded-2xl text-center">
                    <p className="leading-[1.6] text-slate-700 whitespace-pre-line wrap-break-word">{data.summary}</p>
                </section>
            )}

            {skills.length > 0 && (
                <section>
                    <SectionHeading>Skills</SectionHeading>
                    <ul className="flex flex-wrap justify-center gap-2">
                        {skills.map((skill, i) => (
                            <li key={i} className="max-w-full text-[13px] border border-(--accent)/20 px-3 py-0.5 rounded-md text-slate-700 wrap-break-word">{skill}</li>
                        ))}
                    </ul>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionHeading>Experience</SectionHeading>
                    <div className="flex flex-col">
                        {data.experience.map((exp) => (
                            <div key={exp.id} className="relative pl-6 pb-4.5 last:pb-0 border-l border-(--accent)/25 ml-[5px] break-inside-avoid">
                                <span className="absolute -left-[5px] top-[6px] w-[9px] h-[9px] rounded-full bg-white border-2 border-(--accent)" aria-hidden="true" />
                                <EntryHead title={exp.role} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                {exp.company && <div className="text-[13.5px] text-slate-500 mt-0.5 wrap-break-word">{exp.company}</div>}
                                {exp.description && (
                                    <RichText text={exp.description} className="mt-1.5 text-slate-600 wrap-break-word" listClassName={listClass} />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <SectionHeading>Projects</SectionHeading>
                    <div className="flex flex-col gap-3">
                        {data.projects.map((proj) => (
                            <div key={proj.id} className="min-w-0 bg-(--accent)/5 px-5 py-3.5 rounded-xl break-inside-avoid">
                                {proj.name && <h3 className="font-semibold text-slate-900 text-[14.5px] leading-snug wrap-break-word">{proj.name}</h3>}
                                {proj.link && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12px] text-(--accent) wrap-anywhere mt-0.5 hover:underline">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                {proj.description && (
                                    <RichText text={proj.description} className="mt-1.5 text-[13.5px] text-slate-600 leading-normal wrap-break-word" listClassName={listClass} />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.education.length > 0 && (
                <section>
                    <SectionHeading>Education</SectionHeading>
                    <div className="flex flex-col gap-3">
                        {data.education.map((edu) => (
                            <div key={edu.id} className="break-inside-avoid">
                                <EntryHead title={edu.school} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                {edu.degree && <div className="text-[13.5px] text-slate-500 mt-0.5 wrap-break-word">{edu.degree}</div>}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Small-caps heading on a full-width hairline, the way a LaTeX CV sets \section. */
const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="flex items-baseline gap-3 mb-3 break-after-avoid">
        <span className="shrink-0 text-[17px] font-semibold [font-variant-caps:small-caps] tracking-[0.08em] text-(--accent)">{children}</span>
        <span className="flex-1 border-b border-(--accent)/45 translate-y-[-0.3em]" aria-hidden="true" />
    </h2>
);

/** Row 1: bold primary + dates (right); row 2: italic secondary. Shared by education and experience. */
const EntryHead: React.FC<{ primary: string; secondary: string; dates: string }> = ({ primary, secondary, dates }) => (
    <>
        <div className="flex justify-between items-baseline gap-4">
            {primary && <h3 className="font-bold text-[15px] text-slate-900 leading-snug min-w-0 wrap-break-word">{primary}</h3>}
            {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[13.5px] text-slate-700 tabular-nums">{dates}</span>}
        </div>
        {secondary && <div className="italic text-[14.5px] text-slate-700 leading-snug wrap-break-word">{secondary}</div>}
    </>
);

const listClass = 'list-disc pl-5 space-y-0.5 marker:text-slate-500';

export const AcademicTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex flex-col flex-1 gap-[22px] font-charis text-[14.5px] leading-normal text-slate-900 [--accent:var(--rs-accent,#23395B)]">
            <header className="flex justify-between items-end gap-8 pb-3 border-b-[3px] border-double border-(--accent)">
                <div className="min-w-0">
                    <div role="heading" aria-level={1} className="text-[30px] font-bold leading-[1.1] [font-variant-caps:small-caps] tracking-[0.04em] text-(--accent) wrap-break-word">
                        {data.fullName}
                    </div>
                    {data.title && <p className="italic text-[15px] text-slate-700 mt-1 wrap-break-word">{data.title}</p>}
                </div>
                {contacts.length > 0 && (
                    <ul className="max-w-[48%] shrink-0 flex flex-col items-end text-right text-[13px] text-slate-700 leading-[1.45]">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="min-w-0 max-w-full wrap-anywhere">
                                <ContactLink entry={entry} />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {data.summary && (
                <section>
                    <SectionHeading>Profile</SectionHeading>
                    <p className="pl-[4mm] leading-[1.55] whitespace-pre-line wrap-break-word">{data.summary}</p>
                </section>
            )}

            {data.education.length > 0 && (
                <section>
                    <SectionHeading>Education</SectionHeading>
                    <div className="pl-[4mm] flex flex-col gap-2.5">
                        {data.education.map((edu) => (
                            <div key={edu.id} className="break-inside-avoid">
                                <EntryHead primary={edu.school} secondary={edu.degree} dates={formatDateRange(edu.startDate, edu.endDate)} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionHeading>Experience</SectionHeading>
                    <div className="pl-[4mm] flex flex-col gap-3.5">
                        {data.experience.map((exp) => (
                            <div key={exp.id} className="break-inside-avoid">
                                <EntryHead primary={exp.company} secondary={exp.role} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                {exp.description && (
                                    <RichText text={exp.description} className="mt-1.5 leading-normal wrap-break-word" listClassName={listClass} />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <SectionHeading>Projects</SectionHeading>
                    {/* Reference-list rhythm: hanging indent, title first, link in italics. */}
                    <div className="pl-[4mm] flex flex-col gap-2.5">
                        {data.projects.map((proj) => (
                            <div key={proj.id} className="pl-[5mm] -indent-[5mm] break-inside-avoid">
                                <div className="wrap-break-word">
                                    {proj.name && <span className="font-bold text-[15px]">{proj.name}</span>}
                                    {proj.name && proj.link && <span className="text-slate-500">{'. '}</span>}
                                    {proj.link && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="italic text-[13.5px] text-slate-700 wrap-anywhere hover:underline">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                </div>
                                {proj.description && (
                                    <RichText text={proj.description} className="mt-0.5 indent-0 leading-normal wrap-break-word" listClassName={listClass} />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {skillGroups.length > 0 && (
                <section className="break-inside-avoid">
                    <SectionHeading>Skills</SectionHeading>
                    <div className="pl-[4mm] flex flex-col gap-1">
                        {skillGroups.map((group, i) => (
                            <p key={i} className="leading-normal wrap-break-word">
                                {group.category && <span className="font-bold">{group.category}: </span>}
                                {group.items.join(', ')}
                            </p>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

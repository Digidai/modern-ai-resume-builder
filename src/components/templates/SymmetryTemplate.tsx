import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** A centered title flanked by hairlines — the template's signature divider. */
const Divider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-4 mb-4 break-after-avoid">
        <div className="h-px bg-(--accent)/30 flex-1" aria-hidden="true" />
        <h2 className="font-playfair text-[18px] italic leading-tight text-slate-900">{children}</h2>
        <div className="h-px bg-(--accent)/30 flex-1" aria-hidden="true" />
    </div>
);

/** "Secondary · dates" under an entry title; drops the dot when either side is empty. */
const Meta: React.FC<{ secondary?: React.ReactNode; dates?: string }> = ({ secondary, dates }) =>
    secondary || dates ? (
        <div className="flex flex-wrap justify-center items-baseline gap-x-2 text-[13px] leading-snug mt-0.5">
            {secondary && <span className="italic text-slate-700 min-w-0 wrap-break-word">{secondary}</span>}
            {secondary && dates && <span className="text-(--accent)" aria-hidden="true">·</span>}
            {dates && <span className="text-[12px] uppercase tracking-[0.12em] text-slate-500 tabular-nums whitespace-nowrap">{dates}</span>}
        </div>
    ) : null;

const BULLETS = 'list-disc pl-4 space-y-0.5 marker:text-(--accent)/60';

export const SymmetryTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasEducation = data.education.length > 0;
    const hasProjects = data.projects.length > 0;

    const education = hasEducation && (
        <section className="min-w-0">
            <Divider>Education</Divider>
            <div className="flex flex-col gap-3.5 text-center">
                {data.education.map((edu) => (
                    <article key={edu.id} className="break-inside-avoid">
                        {edu.school && <h3 className="font-playfair text-[16px] text-slate-900 leading-snug wrap-break-word">{edu.school}</h3>}
                        <Meta secondary={edu.degree} dates={formatDateRange(edu.startDate, edu.endDate)} />
                    </article>
                ))}
            </div>
        </section>
    );

    const projects = hasProjects && (
        <section className="min-w-0">
            <Divider>Projects</Divider>
            <div className="flex flex-col gap-3.5 text-center">
                {data.projects.map((proj) => (
                    <article key={proj.id} className="break-inside-avoid">
                        {proj.name && <h3 className="font-playfair text-[16px] text-slate-900 leading-snug wrap-break-word">{proj.name}</h3>}
                        {proj.link.trim() && (
                            <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] italic text-slate-600 hover:underline underline-offset-2 wrap-anywhere">
                                {displayUrl(proj.link)}
                            </a>
                        )}
                        <RichText text={proj.description} className="mt-1 text-[13.5px] text-slate-700 wrap-break-word" listClassName="space-y-0.5" />
                    </article>
                ))}
            </div>
        </section>
    );

    return (
        <div className="flex-1 flex flex-col bg-(--accent)/4 text-slate-800 font-serif text-[14px] leading-[1.55] px-[17mm] pt-[14mm] pb-[12mm] [--accent:var(--rs-accent,#475569)]">
            <header className="text-center mb-6">
                {data.fullName && (
                    <h1 className="font-playfair text-[38px] tracking-wide text-slate-900 leading-[1.15] wrap-break-word">{data.fullName}</h1>
                )}
                {data.title && (
                    <p className="text-[12.5px] uppercase tracking-[0.28em] text-(--accent) mt-2 wrap-break-word">{data.title}</p>
                )}
                {contacts.length > 0 && (
                    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-[13px] italic text-slate-600">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="min-w-0 max-w-full">
                                <ContactLink entry={entry} className="wrap-anywhere" />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            <div className="flex flex-col gap-6 w-full">
                {data.summary.trim() && (
                    <section className="text-center px-[8mm]">
                        <div className="w-10 h-px bg-(--accent)/50 mx-auto mb-3.5" aria-hidden="true" />
                        <h2 className="sr-only">Profile</h2>
                        <p className="italic text-[14.5px] text-slate-700 leading-[1.7] wrap-break-word">{data.summary}</p>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section className="text-center">
                        <Divider>Skills</Divider>
                        <div className="flex flex-col gap-1">
                            {skillGroups.map((group, gi) => (
                                <p key={gi} className="wrap-break-word">
                                    {group.category && <span className="italic text-slate-600">{group.category}: </span>}
                                    {group.items.map((skill, i) => (
                                        <React.Fragment key={i}>
                                            {i > 0 && <span className="text-(--accent) px-2" aria-hidden="true">·</span>}
                                            <span className="text-slate-800 whitespace-nowrap">{skill}</span>
                                        </React.Fragment>
                                    ))}
                                </p>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <Divider>Experience</Divider>
                        <div className="flex flex-col gap-4">
                            {data.experience.map((exp) => (
                                <article key={exp.id} className="break-inside-avoid">
                                    <div className="text-center">
                                        {exp.role && <h3 className="font-playfair text-[17px] text-slate-900 leading-snug wrap-break-word">{exp.role}</h3>}
                                        <Meta secondary={exp.company} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                    </div>
                                    <RichText
                                        text={exp.description}
                                        className="mt-1.5 w-fit max-w-[150mm] mx-auto text-slate-700 wrap-break-word"
                                        listClassName={BULLETS}
                                    />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {(hasEducation || hasProjects) && (
                    <div className={hasEducation && hasProjects ? 'grid grid-cols-2 gap-10' : 'w-2/3 mx-auto'}>
                        {education}
                        {projects}
                    </div>
                )}
            </div>
        </div>
    );
};

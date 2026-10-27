import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="inline-block bg-(--accent) text-white px-3 py-1 font-montserrat text-[12px] font-extrabold uppercase tracking-[0.2em] mb-4 break-after-avoid">
        {children}
    </h2>
);

const SquareBullets = "relative pl-4 before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:bg-(--accent)";

const DateTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="shrink-0 whitespace-nowrap bg-neutral-100 px-2 py-0.5 text-[12px] font-bold tabular-nums text-neutral-800">{children}</span>
);

export const IronTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasEducation = data.education.length > 0;

    return (
        <div className="flex-1 flex flex-col bg-white text-neutral-900 font-inter text-[14px] leading-[1.5] [--accent:var(--rs-accent,#111111)] [--accent-light:color-mix(in_oklab,var(--accent)_38%,white)]">
            <header className="bg-neutral-950 text-white px-[14mm] pt-[13mm] pb-[9mm] border-b-[6px] border-(--accent)">
                {data.fullName && (
                    <h1 className="font-montserrat text-[42px] font-black uppercase tracking-tight leading-[1.05] wrap-break-word">{data.fullName}</h1>
                )}
                {data.title && (
                    <p className="font-montserrat text-[15px] font-bold uppercase tracking-[0.18em] text-(--accent-light) mt-3 leading-snug wrap-break-word">{data.title}</p>
                )}
                {contacts.length > 0 && (
                    <ul className="flex flex-wrap gap-x-6 gap-y-1.5 mt-5 pt-4 border-t border-neutral-700 text-[12.5px] font-medium text-neutral-200">
                        {contacts.map((entry) => {
                            const Icon = entry.icon;
                            return (
                                <li key={entry.id} className="flex items-center gap-2 min-w-0 max-w-full">
                                    <Icon className="w-3.5 h-3.5 shrink-0 text-(--accent-light)" />
                                    <ContactLink entry={entry} className="wrap-anywhere min-w-0" />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </header>

            <div className="flex-1 px-[14mm] pt-[9mm] pb-[12mm] flex flex-col gap-7">
                {data.summary.trim() && (
                    <section>
                        <Label>Profile</Label>
                        <p className="text-[14.5px] font-medium wrap-break-word">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <Label>Experience</Label>
                        <div className="border-l-4 border-(--accent) pl-6 flex flex-col gap-5">
                            {data.experience.map((exp) => {
                                const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                return (
                                    <article key={exp.id} className="break-inside-avoid">
                                        {(exp.role || dates) && (
                                            <div className="flex justify-between items-start gap-4">
                                                <h3 className="font-montserrat text-[17px] font-extrabold uppercase leading-tight min-w-0 wrap-break-word">{exp.role}</h3>
                                                {dates && <DateTag>{dates}</DateTag>}
                                            </div>
                                        )}
                                        {exp.company && <div className="text-[14.5px] font-bold text-neutral-600 mt-0.5 wrap-break-word">{exp.company}</div>}
                                        <RichText text={exp.description} className="mt-2 wrap-break-word" listClassName="space-y-1" itemClassName={SquareBullets} />
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <Label>Projects</Label>
                        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="min-w-0 border-t-2 border-(--accent) pt-3 break-inside-avoid">
                                    {proj.name && <h3 className="font-montserrat text-[15px] font-extrabold uppercase leading-tight wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12px] font-semibold text-neutral-600 mt-1 underline underline-offset-2 wrap-anywhere">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className="mt-2 text-[13.5px] wrap-break-word" listClassName="space-y-1" itemClassName={SquareBullets} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {(hasEducation || skillGroups.length > 0) && (
                    <div className="grid grid-cols-2 gap-10">
                        {hasEducation && (
                            <section className="min-w-0">
                                <Label>Education</Label>
                                <div className="flex flex-col gap-4">
                                    {data.education.map((edu) => {
                                        const dates = formatDateRange(edu.startDate, edu.endDate);
                                        return (
                                            <article key={edu.id} className="border-b-2 border-neutral-200 pb-4 last:border-b-0 last:pb-0 break-inside-avoid">
                                                {edu.school && <div className="text-[15px] font-bold leading-snug wrap-break-word">{edu.school}</div>}
                                                {edu.degree && <div className="text-neutral-700 font-medium wrap-break-word">{edu.degree}</div>}
                                                {dates && <div className="mt-1.5"><DateTag>{dates}</DateTag></div>}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {skillGroups.length > 0 && (
                            <section className={hasEducation ? 'min-w-0' : 'min-w-0 col-span-2'}>
                                <Label>Skills</Label>
                                <div className="flex flex-col gap-3">
                                    {skillGroups.map((group, gi) => (
                                        <div key={gi} className="min-w-0">
                                            {group.category && (
                                                <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-500 mb-1.5 wrap-break-word">{group.category}</div>
                                            )}
                                            <ul className="flex flex-wrap gap-x-3 gap-y-2.5">
                                                {group.items.map((skill, i) => (
                                                    <li key={i} className="text-[14px] font-extrabold leading-none border-b-2 border-(--accent) pb-1 wrap-break-word max-w-full">{skill}</li>
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

import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** One section: a side label in the left column, content on the right (DOM order = reading order). */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <section className="grid grid-cols-[30mm_minmax(0,1fr)] gap-[7mm]">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] leading-[20px] text-(--accent) break-after-avoid">{label}</h2>
        <div className="min-w-0">{children}</div>
    </section>
);

const BULLETS = 'list-disc pl-4 space-y-1 marker:text-(--accent)/50';

export const LateralTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-700 font-inter text-[13.5px] leading-[1.5] px-[16mm] py-[14mm] [--accent:var(--rs-accent,#334155)]">
            <header className="grid grid-cols-[30mm_minmax(0,1fr)] gap-[7mm] border-b border-slate-200 pb-7 mb-7">
                <div className="pt-[14px]" aria-hidden="true">
                    <div className="w-10 h-1 bg-(--accent)" />
                </div>
                <div className="min-w-0">
                    {data.fullName && (
                        <h1 className="text-[34px] font-bold tracking-tight leading-[1.1] text-slate-900 wrap-break-word">{data.fullName}</h1>
                    )}
                    {data.title && <p className="text-[16px] font-medium text-slate-600 mt-1.5 leading-snug wrap-break-word">{data.title}</p>}
                    {contacts.length > 0 && (
                        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-[12.5px] text-slate-600">
                            {contacts.map((entry) => {
                                const Icon = entry.icon;
                                return (
                                    <li key={entry.key} className="flex items-center gap-1.5 min-w-0 max-w-full">
                                        <Icon className="w-3.5 h-3.5 shrink-0 text-(--accent)/70" />
                                        <ContactLink entry={entry} className="wrap-anywhere min-w-0" />
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </header>

            <div className="flex flex-col gap-7">
                {data.summary.trim() && (
                    <Row label="Profile">
                        <p className="text-slate-700 wrap-break-word">{data.summary}</p>
                    </Row>
                )}

                {data.experience.length > 0 && (
                    <Row label="Experience">
                        <div className="flex flex-col gap-5">
                            {data.experience.map((exp) => {
                                const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                return (
                                    <article key={exp.id} className="break-inside-avoid">
                                        {(exp.role || dates) && (
                                            <div className="flex justify-between items-baseline gap-4">
                                                <h3 className="text-[15.5px] font-semibold text-slate-900 leading-snug min-w-0 wrap-break-word">{exp.role}</h3>
                                                {dates && <span className="text-[12px] text-slate-500 tabular-nums whitespace-nowrap shrink-0">{dates}</span>}
                                            </div>
                                        )}
                                        {exp.company && <div className="text-slate-600 font-medium wrap-break-word">{exp.company}</div>}
                                        <RichText text={exp.description} className="mt-1.5 text-slate-700 wrap-break-word" listClassName={BULLETS} />
                                    </article>
                                );
                            })}
                        </div>
                    </Row>
                )}

                {data.projects.length > 0 && (
                    <Row label="Projects">
                        <div className="flex flex-col gap-4">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="break-inside-avoid">
                                    {(proj.name || proj.link.trim()) && (
                                        <div className="flex flex-wrap items-baseline gap-x-3">
                                            {proj.name && <h3 className="text-[15px] font-semibold text-slate-900 leading-snug wrap-break-word">{proj.name}</h3>}
                                            {proj.link.trim() && (
                                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="text-[12px] text-slate-500 hover:underline underline-offset-2 wrap-anywhere min-w-0">
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <RichText text={proj.description} className="mt-1 text-slate-700 wrap-break-word" listClassName={BULLETS} />
                                </article>
                            ))}
                        </div>
                    </Row>
                )}

                {data.education.length > 0 && (
                    <Row label="Education">
                        <div className="flex flex-col gap-3">
                            {data.education.map((edu) => {
                                const dates = formatDateRange(edu.startDate, edu.endDate);
                                return (
                                    <article key={edu.id} className="break-inside-avoid">
                                        {(edu.school || dates) && (
                                            <div className="flex justify-between items-baseline gap-4">
                                                <h3 className="text-[15px] font-semibold text-slate-900 leading-snug min-w-0 wrap-break-word">{edu.school}</h3>
                                                {dates && <span className="text-[12px] text-slate-500 tabular-nums whitespace-nowrap shrink-0">{dates}</span>}
                                            </div>
                                        )}
                                        {edu.degree && <div className="text-slate-600 wrap-break-word">{edu.degree}</div>}
                                    </article>
                                );
                            })}
                        </div>
                    </Row>
                )}

                {skillGroups.length > 0 && (
                    <Row label="Skills">
                        <div className="flex flex-col gap-2">
                            {skillGroups.map((group, gi) =>
                                group.category ? (
                                    <p key={gi} className="wrap-break-word">
                                        <span className="font-semibold text-slate-900">{group.category}: </span>
                                        {group.items.join(', ')}
                                    </p>
                                ) : (
                                    <ul key={gi} className="flex flex-wrap gap-1.5">
                                        {group.items.map((skill, i) => (
                                            <li key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 text-[12.5px] rounded wrap-break-word max-w-full">{skill}</li>
                                        ))}
                                    </ul>
                                )
                            )}
                        </div>
                    </Row>
                )}
            </div>
        </div>
    );
};

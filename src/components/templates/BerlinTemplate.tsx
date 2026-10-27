import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Picks a display size that keeps the longest word of the name on one line at 210mm. */
const nameSizeClass = (name: string): string => {
    const longestWord = Math.max(0, ...name.split(/\s+/).map((word) => word.length));
    if (longestWord <= 10 && name.length <= 18) return 'text-[64px]';
    if (longestWord <= 14) return 'text-[52px]';
    return 'text-[44px]';
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <section className="grid grid-cols-[34mm_minmax(0,1fr)] gap-6 py-5 first:pt-0 last:pb-0">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-(--accent) pt-[3px] break-after-avoid">{label}</h2>
        <div className="min-w-0">{children}</div>
    </section>
);

/** Title left, dates right; the one date slot every section uses. */
const EntryHead: React.FC<{ title: string; dates: string; titleClass: string }> = ({ title, dates, titleClass }) => (
    <div className="flex justify-between items-baseline gap-5">
        {title && <h3 className={`${titleClass} font-bold leading-tight min-w-0 wrap-break-word`}>{title}</h3>}
        {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] font-bold tabular-nums">{dates}</span>}
    </div>
);

const itemClass = "relative pl-4 before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:bg-(--accent)";

export const BerlinTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex-1 flex flex-col bg-white text-black font-sans text-[14px] leading-[1.55] px-[16mm] pt-[13mm] pb-[12mm] [--accent:var(--rs-accent,#111111)]">
            <header className="pb-6 border-b-[6px] border-(--accent) mb-6">
                <h1 className={`${nameSizeClass(data.fullName)} font-black uppercase tracking-tight leading-[0.95] pt-1 wrap-break-word`}>
                    {data.fullName}
                </h1>
                {(data.title || contacts.length > 0) && (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-8 items-end mt-4">
                        <p className="text-[18px] font-bold uppercase tracking-wide leading-snug wrap-break-word">{data.title}</p>
                        {contacts.length > 0 && (
                            <ul className="text-right text-[12.5px] font-medium leading-snug space-y-0.5 max-w-[80mm]">
                                {contacts.map((entry) => (
                                    <li key={entry.key} className="wrap-anywhere">
                                        <ContactLink entry={entry} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </header>

            <div className="flex flex-col divide-y divide-black">
                {data.summary && (
                    <Row label="Profile">
                        <p className="text-[15px] leading-[1.6] font-medium whitespace-pre-line wrap-break-word">{data.summary}</p>
                    </Row>
                )}

                {data.experience.length > 0 && (
                    <Row label="Experience">
                        <div className="flex flex-col gap-5">
                            {data.experience.map((exp) => (
                                <article key={exp.id} className="break-inside-avoid">
                                    <EntryHead title={exp.role} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} titleClass="text-[17px] uppercase" />
                                    {exp.company && <div className="text-neutral-600 font-medium mt-0.5 wrap-break-word">{exp.company}</div>}
                                    {exp.description && (
                                        <RichText text={exp.description} className="mt-2 text-neutral-800 wrap-break-word" listClassName="space-y-1" itemClassName={itemClass} />
                                    )}
                                </article>
                            ))}
                        </div>
                    </Row>
                )}

                {data.projects.length > 0 && (
                    <Row label="Projects">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="min-w-0 break-inside-avoid">
                                    {proj.name && <h3 className="text-[15px] font-bold uppercase leading-tight wrap-break-word">{proj.name}</h3>}
                                    {proj.link && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-neutral-600 mt-0.5 underline underline-offset-2 wrap-anywhere">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    {proj.description && (
                                        <RichText text={proj.description} className="mt-1.5 text-[13.5px] leading-normal text-neutral-800 wrap-break-word" listClassName="space-y-1" itemClassName={itemClass} />
                                    )}
                                </article>
                            ))}
                        </div>
                    </Row>
                )}

                {data.education.length > 0 && (
                    <Row label="Education">
                        <div className="flex flex-col gap-3">
                            {data.education.map((edu) => (
                                <article key={edu.id} className="break-inside-avoid">
                                    <EntryHead title={edu.school} dates={formatDateRange(edu.startDate, edu.endDate)} titleClass="text-[16px]" />
                                    {edu.degree && <div className="text-neutral-700 mt-0.5 wrap-break-word">{edu.degree}</div>}
                                </article>
                            ))}
                        </div>
                    </Row>
                )}

                {skillGroups.length > 0 && (
                    <Row label="Skills">
                        <div className="flex flex-col gap-2">
                            {skillGroups.map((group, gi) => (
                                <div key={gi} className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 font-semibold">
                                    {group.category && <h3 className="w-full text-[12px] font-bold uppercase tracking-[0.14em] text-neutral-600">{group.category}</h3>}
                                    {group.items.map((skill, i) => (
                                        <span key={i} className="flex items-center gap-2 min-w-0 wrap-break-word">
                                            <span className="w-1.5 h-1.5 bg-(--accent) shrink-0" aria-hidden="true" />
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </Row>
                )}
            </div>
        </div>
    );
};

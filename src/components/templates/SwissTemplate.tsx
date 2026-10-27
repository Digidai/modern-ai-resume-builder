import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const CONTACT_LABELS = { email: 'Email', phone: 'Phone', location: 'Location', website: 'Website', linkedin: 'LinkedIn' } as const;

/** One row of the grid: label in the narrow left column, content in the wide right column. */
const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <section className="grid grid-cols-[36mm_minmax(0,1fr)] gap-x-6 border-t-[3px] border-slate-900 pt-2.5">
        <h2 className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-900 pt-[3px] break-after-avoid">{label}</h2>
        <div className="min-w-0">{children}</div>
    </section>
);

/** Title left, dates right on the same baseline; the one date slot used by every section. */
const EntryHead: React.FC<{ title: string; dates: string; size: string }> = ({ title, dates, size }) => (
    <div className="flex justify-between items-baseline gap-4">
        {title && <h3 className={`${size} font-bold leading-tight min-w-0 wrap-break-word`}>{title}</h3>}
        {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] font-bold text-slate-600 tabular-nums">{dates}</span>}
    </div>
);

const listClass = 'list-[square] pl-4 space-y-0.5 marker:text-(--accent)';

export const SwissTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex flex-col flex-1 gap-5 font-inter text-[14px] leading-normal text-slate-900 [--accent:var(--rs-accent,#111111)]">
            <header className="flex flex-col gap-3.5">
                <div className="bg-(--accent) text-white px-7 py-6">
                    <h1 className="text-[40px] font-black uppercase tracking-tighter leading-[1.02] wrap-break-word">{data.fullName}</h1>
                    {data.title && <p className="mt-2.5 text-[17px] font-bold uppercase tracking-tight text-white/85 wrap-break-word">{data.title}</p>}
                </div>
                {contacts.length > 0 && (
                    <ul className="grid grid-cols-3 gap-x-6 gap-y-2 text-[13px] font-medium">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="min-w-0 border-t-2 border-slate-900 pt-1.5 leading-snug">
                                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">{entry.label}</span>
                                <ContactLink entry={entry} className="wrap-anywhere" />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {data.summary && (
                <Section label="Profile">
                    <p className="text-[15px] leading-[1.5] whitespace-pre-line wrap-break-word">{data.summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section label="Experience">
                    <div className="flex flex-col gap-4">
                        {data.experience.map((exp) => (
                            <div key={exp.id} className="break-inside-avoid">
                                <EntryHead title={exp.role} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} size="text-[17px]" />
                                {exp.company && <div className="text-[13px] font-bold uppercase tracking-wide text-slate-600 mt-0.5 wrap-break-word">{exp.company}</div>}
                                {exp.description && (
                                    <RichText text={exp.description} className="mt-1.5 text-slate-800 wrap-break-word" listClassName={listClass} />
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section label="Projects">
                    <div className="grid grid-cols-2 gap-4">
                        {data.projects.map((proj) => (
                            <div key={proj.id} className="min-w-0 bg-slate-100 p-3.5 break-inside-avoid">
                                {proj.name && <h3 className="font-bold text-[15px] leading-tight wrap-break-word">{proj.name}</h3>}
                                {proj.link && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12px] font-medium text-slate-600 wrap-anywhere mt-1 hover:underline">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                {proj.description && (
                                    <RichText text={proj.description} className="mt-1.5 text-[13.5px] leading-snug text-slate-800 wrap-break-word" listClassName={listClass} />
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section label="Education">
                    <div className="flex flex-col gap-3">
                        {data.education.map((edu) => (
                            <div key={edu.id} className="break-inside-avoid">
                                <EntryHead title={edu.school} dates={formatDateRange(edu.startDate, edu.endDate)} size="text-[15px]" />
                                {edu.degree && <div className="text-slate-700 mt-0.5 wrap-break-word">{edu.degree}</div>}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section label="Skills">
                    <div className="flex flex-col gap-2.5">
                        {skillGroups.map((group, gi) =>
                            group.category ? (
                                <p key={gi} className="wrap-break-word">
                                    <span className="font-bold">{group.category}</span>
                                    <span className="text-slate-400 px-2" aria-hidden="true">/</span>
                                    {group.items.join(', ')}
                                </p>
                            ) : (
                                <ul key={gi} className="grid grid-cols-3 gap-x-6 gap-y-1.5">
                                    {group.items.map((skill, i) => (
                                        <li key={i} className="min-w-0 font-semibold border-l-4 border-(--accent) pl-2 leading-tight wrap-break-word">{skill}</li>
                                    ))}
                                </ul>
                            )
                        )}
                    </div>
                </Section>
            )}
        </div>
    );
};

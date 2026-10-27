import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const card = 'rounded-2xl bg-white/85 px-5 py-4 shadow-sm ring-1 ring-slate-900/5';
const descriptionList = 'list-disc space-y-0.5 pl-4 marker:text-(--accent-2)';
const body = 'text-[13.5px] leading-normal text-slate-700';

/**
 * Pill heading. Pop alternates two colours: the accent and `--accent-2`, a pink-shifted mix of the
 * accent, so any accent the user picks keeps the playful two-tone look with white text ≥ 4.5:1.
 */
const Badge: React.FC<{ tone?: 'accent' | 'accent-2'; children: React.ReactNode }> = ({ tone = 'accent', children }) => (
    <h2
        className={`mb-3 inline-block rounded-full px-3.5 py-1 font-montserrat text-xs font-bold tracking-wider text-white uppercase break-after-avoid ${
            tone === 'accent' ? 'bg-(--accent)' : 'bg-(--accent-2)'
        }`}
    >
        {children}
    </h2>
);

/** Title left, date chip right: the one date slot used by every dated entry. */
const EntryHead: React.FC<{ title: string; subtitle?: string; dates?: string; small?: boolean }> = ({ title, subtitle, dates, small }) => (
    <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
            {title && <h3 className={`${small ? 'text-[14px]' : 'text-[15px]'} leading-snug font-bold text-slate-900`}>{title}</h3>}
            {subtitle && <div className="text-[13.5px] leading-snug font-semibold text-(--accent)">{subtitle}</div>}
        </div>
        {dates && (
            <span className="shrink-0 rounded-full bg-(--accent)/10 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums text-(--accent)">{dates}</span>
        )}
    </div>
);

export const PopTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSkills = skillGroups.length > 0;
    const hasEducation = data.education.length > 0;

    return (
        <div className="flex flex-1 flex-col bg-linear-to-br from-(--accent)/8 via-white to-(--accent-2)/8 px-[14mm] pt-[12mm] pb-[11mm] font-sans text-slate-800 wrap-break-word [--accent-2:color-mix(in_oklab,var(--accent)_45%,#BE185D)] [--accent:var(--rs-accent,#4F46E5)]">
            <header className="mb-6">
                <h1 className="font-montserrat text-[36px] leading-tight font-extrabold tracking-tight text-slate-900">{data.fullName}</h1>
                {data.title.trim() && (
                    <p className="mt-1.5 inline-block max-w-full rounded-2xl bg-(--accent) px-4 py-1 text-sm font-bold text-white">{data.title}</p>
                )}
                {contacts.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2 text-[13px] text-slate-700">
                        {contacts.map((entry) => (
                            <span key={entry.id} className="inline-flex max-w-full rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-900/5">
                                <ContactItem entry={entry} iconClassName="h-3.5 w-3.5 text-(--accent)" />
                            </span>
                        ))}
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-5">
                {data.summary.trim() && (
                    <section className={card}>
                        <p className="text-[14px] leading-normal text-slate-700">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <Badge>Experience</Badge>
                        <div className="flex flex-col gap-3">
                            {data.experience.map((exp) => (
                                <article key={exp.id} className={`${card} break-inside-avoid`}>
                                    <EntryHead title={exp.role} subtitle={exp.company} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                    <RichText text={exp.description} className={`mt-2 ${body}`} listClassName={descriptionList} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <Badge tone="accent-2">Projects</Badge>
                        <div className="grid grid-cols-2 gap-3">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className={`${card} min-w-0 break-inside-avoid`}>
                                    {proj.name && <h3 className="text-[15px] leading-snug font-bold text-slate-900">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-xs font-medium text-(--accent-2) wrap-anywhere hover:underline">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className={`mt-1.5 ${body}`} listClassName={descriptionList} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {(hasSkills || hasEducation) && (
                    <div className="grid grid-cols-2 gap-3">
                        {hasSkills && (
                            <section className={`${card} min-w-0 break-inside-avoid ${hasEducation ? '' : 'col-span-2'}`}>
                                <Badge>Skills</Badge>
                                <div className="flex flex-col gap-2">
                                    {skillGroups.map((group, i) => (
                                        <div key={i}>
                                            {group.category && <h3 className="mb-1 text-xs font-bold tracking-wide text-slate-600 uppercase">{group.category}</h3>}
                                            <ul className="flex flex-wrap gap-1.5">
                                                {group.items.map((skill, j) => (
                                                    <li key={j} className="max-w-full rounded-full bg-linear-to-r from-(--accent)/12 to-(--accent-2)/12 px-3 py-0.5 text-[13px] font-medium text-slate-800">
                                                        {skill}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {hasEducation && (
                            <section className={`${card} min-w-0 break-inside-avoid ${hasSkills ? '' : 'col-span-2'}`}>
                                <Badge tone="accent-2">Education</Badge>
                                <div className="flex flex-col gap-2.5">
                                    {data.education.map((edu) => (
                                        <div key={edu.id}>
                                            <EntryHead small title={edu.school} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                            {edu.degree && <div className="text-[13.5px] leading-snug text-slate-700">{edu.degree}</div>}
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

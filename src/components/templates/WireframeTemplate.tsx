import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const CONTACT_LABELS = { email: 'EML', phone: 'TEL', location: 'LOC', website: 'WEB', linkedin: 'LNK' } as const;

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="flex items-center gap-2 font-jetbrains text-[12px] font-bold uppercase tracking-[0.18em] text-slate-900 mb-3.5 break-after-avoid">
        <span className="w-2 h-2 bg-(--accent) shrink-0" aria-hidden="true" />
        {children}
    </h2>
);

/** Empty space at the bottom of a column reads as a blueprint grid rather than a blank box. */
const Canvas: React.FC = () => (
    <div
        className="flex-1 min-h-[5mm] not-first:border-t-2 border-(--accent) bg-[radial-gradient(var(--dot)_1px,transparent_1.5px)] bg-[length:4mm_4mm] bg-center"
        aria-hidden="true"
    />
);

const itemClass = "relative pl-4 before:content-['-'] before:absolute before:left-0 before:font-jetbrains before:text-slate-500";

export const WireframeTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSidebar = skillGroups.length > 0 || data.education.length > 0;
    const sectionClass = 'p-5 [&+&]:border-t-2 [&+&]:border-(--accent)';

    return (
        <div className="flex-1 flex flex-col bg-white font-sans text-[14px] leading-normal text-slate-800 p-[8mm] [--accent:var(--rs-accent,#0F172A)] [--dot:color-mix(in_oklab,var(--accent)_28%,transparent)]">
            <div className="flex-1 flex flex-col border-2 border-(--accent)">
                <header className="border-b-2 border-(--accent) grid grid-cols-[minmax(0,1fr)_auto] gap-8 px-6 py-6">
                    <div className="min-w-0">
                        <h1 className="font-jetbrains text-[26px] leading-tight font-bold uppercase tracking-[0.1em] text-slate-900 wrap-break-word">{data.fullName}</h1>
                        {data.title && (
                            <p className="inline-block max-w-full mt-3 border border-(--accent) px-2 py-0.5 font-jetbrains text-[13px] text-slate-900 wrap-break-word">{data.title}</p>
                        )}
                    </div>
                    {contacts.length > 0 && (
                        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 font-jetbrains text-[12px] max-w-[80mm] self-start">
                            {contacts.map((entry) => (
                                <React.Fragment key={entry.id}>
                                    <dt className="text-[11px] leading-[1.6] text-slate-500 tracking-widest">{entry.key === 'link' ? entry.label.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'URL' : CONTACT_LABELS[entry.key]}</dt>
                                    <dd className="border-b border-dashed border-slate-300 pb-0.5 wrap-anywhere text-slate-900">
                                        <ContactLink entry={entry} />
                                    </dd>
                                </React.Fragment>
                            ))}
                        </dl>
                    )}
                </header>

                <div className="flex flex-1">
                    <main className="flex-1 min-w-0 flex flex-col">
                        {data.summary && (
                            <section className={sectionClass}>
                                <Heading>Summary</Heading>
                                <p className="leading-[1.55] whitespace-pre-line wrap-break-word">{data.summary}</p>
                            </section>
                        )}

                        {data.experience.length > 0 && (
                            <section className={sectionClass}>
                                <Heading>Experience</Heading>
                                <div className="flex flex-col gap-4">
                                    {data.experience.map((exp) => {
                                        const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                        return (
                                            <article key={exp.id} className="break-inside-avoid">
                                                <div className="flex justify-between items-baseline gap-4">
                                                    {exp.role && <h3 className="font-bold uppercase text-[14px] tracking-wide text-slate-900 leading-snug min-w-0 wrap-break-word">{exp.role}</h3>}
                                                    {dates && <span className="ml-auto shrink-0 whitespace-nowrap font-jetbrains text-[12px] text-slate-600 tabular-nums">{dates}</span>}
                                                </div>
                                                {exp.company && <div className="font-jetbrains text-[13px] text-slate-600 wrap-break-word">@ {exp.company}</div>}
                                                {exp.description && (
                                                    <RichText text={exp.description} className="mt-1.5 text-slate-700 wrap-break-word" listClassName="space-y-0.5" itemClassName={itemClass} />
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {data.projects.length > 0 && (
                            <section className={sectionClass}>
                                <Heading>Projects</Heading>
                                <div className="flex flex-col gap-3">
                                    {data.projects.map((proj) => (
                                        <article key={proj.id} className="border border-dashed border-(--accent)/50 px-3.5 py-3 break-inside-avoid">
                                            {proj.name && <h3 className="font-bold text-slate-900 wrap-break-word">{proj.name}</h3>}
                                            {proj.link && (
                                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block font-jetbrains text-[12px] text-slate-600 underline underline-offset-2 wrap-anywhere">
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                            {proj.description && (
                                                <RichText text={proj.description} className="mt-1.5 text-slate-700 wrap-break-word" listClassName="space-y-0.5" itemClassName={itemClass} />
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}
                        {!hasSidebar && <Canvas />}
                    </main>

                    {hasSidebar && (
                        <aside className="w-[33%] shrink-0 border-l-2 border-(--accent) flex flex-col">
                            {skillGroups.length > 0 && (
                                <section className={sectionClass}>
                                    <Heading>Skills</Heading>
                                    <div className="flex flex-col gap-3">
                                        {skillGroups.map((group, gi) => (
                                            <div key={gi} className="break-inside-avoid">
                                                {group.category && <h3 className="font-jetbrains text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1 wrap-break-word">{group.category}</h3>}
                                                <ul className="space-y-1">
                                                    {group.items.map((skill, i) => (
                                                        <li key={i} className="flex gap-2 min-w-0 leading-snug">
                                                            <span className="font-jetbrains text-slate-500 shrink-0" aria-hidden="true">+</span>
                                                            <span className="min-w-0 wrap-break-word">{skill}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {data.education.length > 0 && (
                                <section className={sectionClass}>
                                    <Heading>Education</Heading>
                                    <div className="flex flex-col gap-3">
                                        {data.education.map((edu) => {
                                            const dates = formatDateRange(edu.startDate, edu.endDate);
                                            return (
                                                <div key={edu.id} className="border border-(--accent)/40 px-3 py-2.5 break-inside-avoid">
                                                    {edu.school && <h3 className="font-bold text-slate-900 leading-snug wrap-break-word">{edu.school}</h3>}
                                                    {edu.degree && <div className="leading-snug mt-0.5 wrap-break-word">{edu.degree}</div>}
                                                    {dates && <div className="font-jetbrains text-[12px] text-slate-600 mt-1.5 tabular-nums">{dates}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                            <Canvas />
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

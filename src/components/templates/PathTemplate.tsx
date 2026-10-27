import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** A milestone on the timeline: a solid accent node + section heading. */
const Milestone: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="relative pl-9">
        <span className="absolute left-0 top-[3px] w-4 h-4 rounded-full bg-(--accent) ring-4 ring-white" aria-hidden="true" />
        <h2 className="font-raleway text-[12.5px] font-bold uppercase tracking-[0.16em] text-slate-900 mb-3.5 leading-[22px] break-after-avoid">{title}</h2>
        {children}
    </section>
);

/** A small stop on the timeline for an individual entry. */
const Stop: React.FC = () => (
    <span className="absolute -left-[32px] top-[7px] w-2.5 h-2.5 rounded-full bg-white border-2 border-(--accent) ring-[3px] ring-white" aria-hidden="true" />
);

/** Second entry line: organisation on the left, the date pill on the right — the template's one date slot. */
const SubLine: React.FC<{ left?: string; dates?: string }> = ({ left, dates }) =>
    left || dates ? (
        <div className="flex flex-wrap justify-between items-baseline gap-x-4 gap-y-0.5 mt-0.5">
            <div className="text-slate-600 font-semibold min-w-0 wrap-break-word">{left}</div>
            {dates && (
                <div className="text-[12px] font-semibold text-(--accent) bg-(--accent)/8 px-2 py-px rounded tabular-nums whitespace-nowrap">{dates}</div>
            )}
        </div>
    ) : null;

const BULLETS = 'list-disc pl-4 space-y-1 marker:text-(--accent)/50';

export const PathTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasTimeline = Boolean(data.summary.trim()) || data.experience.length > 0 || data.education.length > 0;
    const hasSidebar = skillGroups.length > 0 || data.projects.length > 0;

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-700 font-source-sans text-[14px] leading-[1.5] px-[14mm] py-[13mm] [--accent:var(--rs-accent,#4338CA)]">
            <header className="pl-9 mb-8">
                {data.fullName && (
                    <h1 className="font-raleway text-[34px] font-bold tracking-tight leading-[1.15] text-(--accent) wrap-break-word">{data.fullName}</h1>
                )}
                {data.title && <p className="font-raleway text-[17px] font-semibold text-slate-800 mt-1 leading-snug wrap-break-word">{data.title}</p>}
                {contacts.length > 0 && (
                    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-[13px] text-slate-600">
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
            </header>

            <div className="flex flex-1 gap-9">
                {hasTimeline && (
                    <div className="flex-1 min-w-0">
                        <div className="relative flex flex-col gap-8">
                            <div className="absolute left-[7px] top-2 bottom-1 w-0.5 bg-(--accent)/15" aria-hidden="true" />
                            {data.summary.trim() && (
                                <Milestone title="Profile">
                                    <p className="text-slate-700 wrap-break-word">{data.summary}</p>
                                </Milestone>
                            )}

                            {data.experience.length > 0 && (
                                <Milestone title="Experience">
                                    <div className="flex flex-col gap-5">
                                        {data.experience.map((exp) => (
                                            <article key={exp.id} className="relative break-inside-avoid">
                                                <Stop />
                                                {exp.role && <h3 className="text-[15.5px] font-bold text-slate-900 leading-snug wrap-break-word">{exp.role}</h3>}
                                                <SubLine left={exp.company} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                                <RichText text={exp.description} className="mt-1.5 text-slate-700 wrap-break-word" listClassName={BULLETS} />
                                            </article>
                                        ))}
                                    </div>
                                </Milestone>
                            )}

                            {data.education.length > 0 && (
                                <Milestone title="Education">
                                    <div className="flex flex-col gap-4">
                                        {data.education.map((edu) => (
                                            <article key={edu.id} className="relative break-inside-avoid">
                                                <Stop />
                                                {edu.school && <h3 className="text-[15.5px] font-bold text-slate-900 leading-snug wrap-break-word">{edu.school}</h3>}
                                                <SubLine left={edu.degree} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                            </article>
                                        ))}
                                    </div>
                                </Milestone>
                            )}
                        </div>
                    </div>
                )}

                {hasSidebar && (
                    <aside className={hasTimeline ? 'w-[33%] shrink-0 flex flex-col gap-7' : 'flex-1 flex flex-col gap-7'}>
                        {skillGroups.length > 0 && (
                            <section className="bg-slate-50 border border-slate-100 p-5 rounded-2xl break-inside-avoid">
                                <h2 className="font-raleway text-[12.5px] font-bold uppercase tracking-[0.16em] text-slate-900 mb-3 break-after-avoid">Skills</h2>
                                <div className="flex flex-col gap-3">
                                    {skillGroups.map((group, gi) => (
                                        <div key={gi} className="min-w-0">
                                            {group.category && <div className="text-[12px] font-semibold text-slate-500 mb-1 wrap-break-word">{group.category}</div>}
                                            <ul className="flex flex-wrap gap-1.5">
                                                {group.items.map((skill, i) => (
                                                    <li key={i} className="bg-white border border-(--accent)/20 px-2.5 py-px rounded-full text-[13px] font-semibold text-slate-800 wrap-break-word max-w-full">{skill}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.projects.length > 0 && (
                            <section>
                                <h2 className="font-raleway text-[12.5px] font-bold uppercase tracking-[0.16em] text-slate-900 mb-3 break-after-avoid">Projects</h2>
                                <div className="flex flex-col gap-4">
                                    {data.projects.map((proj) => (
                                        <article key={proj.id} className="border-l-2 border-(--accent)/30 pl-4 py-0.5 break-inside-avoid">
                                            {proj.name && <h3 className="text-[15px] font-bold text-slate-900 leading-snug wrap-break-word">{proj.name}</h3>}
                                            {proj.link.trim() && (
                                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12px] text-(--accent) mt-0.5 hover:underline underline-offset-2 wrap-anywhere">
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                            <RichText text={proj.description} className="mt-1 text-[13.5px] text-slate-700 wrap-break-word" listClassName={BULLETS} />
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
};

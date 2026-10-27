import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const MainHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-(--accent) border-b border-(--accent)/35 pb-1.5 mb-3.5 break-after-avoid">
        {children}
    </h2>
);

const SideHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-900 mb-3 break-after-avoid">{children}</h2>
);

const listClass = 'list-disc pl-4 space-y-1 marker:text-(--accent)';

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSidebar = skillGroups.length > 0 || data.education.length > 0;

    return (
        <div
            className="flex flex-col flex-1 bg-white font-sans text-slate-800 [--accent:var(--rs-accent,#1E40AF)] [--accent-dark:color-mix(in_oklab,var(--accent)_26%,#0b1120)] [--accent-light:color-mix(in_oklab,var(--accent)_38%,white)]"
        >
            <header className="bg-(--accent-dark) text-white px-[13mm] pt-[11mm] pb-[10mm] flex justify-between items-center gap-8 border-b-4 border-(--accent)">
                <div className="min-w-0 flex-1">
                    <h1 className="text-[32px] font-bold tracking-tight leading-tight wrap-break-word">{data.fullName}</h1>
                    {data.title && <p className="text-(--accent-light) text-[16px] font-medium mt-1.5 wrap-break-word">{data.title}</p>}
                </div>
                {contacts.length > 0 && (
                    <ul className="max-w-[46%] shrink-0 flex flex-col items-end gap-1.5 text-[13px] text-white/85">
                        {contacts.map((entry) => {
                            const Icon = entry.icon;
                            return (
                                <li key={entry.key} className="flex items-start justify-end gap-2 min-w-0 max-w-full text-right">
                                    <ContactLink entry={entry} className="min-w-0 wrap-anywhere leading-snug" />
                                    <Icon className="w-3.5 h-3.5 mt-[2px] shrink-0 text-(--accent-light)" />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </header>

            <div className="flex flex-1">
                <main className={`flex-1 min-w-0 pl-[13mm] ${hasSidebar ? 'pr-[8mm]' : 'pr-[13mm]'} pt-[9mm] pb-[11mm] flex flex-col gap-7`}>
                    {data.summary && (
                        <section>
                            <MainHeading>Profile</MainHeading>
                            <p className="text-[14px] text-slate-700 leading-[1.6] whitespace-pre-line wrap-break-word">{data.summary}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <MainHeading>Experience</MainHeading>
                            <div className="flex flex-col gap-4">
                                {data.experience.map((exp) => {
                                    const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                    return (
                                        <div key={exp.id} className="break-inside-avoid">
                                            <div className="flex justify-between items-baseline gap-4">
                                                {exp.role && <h3 className="font-bold text-slate-900 text-[15px] leading-snug min-w-0 wrap-break-word">{exp.role}</h3>}
                                                {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12px] font-semibold text-slate-600 tabular-nums">{dates}</span>}
                                            </div>
                                            {exp.company && <div className="text-[14px] text-(--accent) font-semibold mt-0.5 wrap-break-word">{exp.company}</div>}
                                            {exp.description && (
                                                <RichText text={exp.description} className="mt-1.5 text-[14px] text-slate-700 leading-normal wrap-break-word" listClassName={listClass} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <MainHeading>Projects</MainHeading>
                            <div className="flex flex-col gap-3.5">
                                {data.projects.map((proj) => (
                                    <div key={proj.id} className="break-inside-avoid">
                                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                                            {proj.name && <h3 className="font-bold text-slate-900 text-[15px] leading-snug min-w-0 wrap-break-word">{proj.name}</h3>}
                                            {proj.link && (
                                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[12px] text-(--accent) wrap-anywhere hover:underline">
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                        </div>
                                        {proj.description && (
                                            <RichText text={proj.description} className="mt-1 text-[14px] text-slate-700 leading-normal wrap-break-word" listClassName={listClass} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {hasSidebar && (
                    <aside className="w-[31%] shrink-0 bg-(--accent)/5 border-l border-(--accent)/15 pl-[7mm] pr-[13mm] pt-[9mm] pb-[11mm] flex flex-col gap-7">
                        {skillGroups.length > 0 && (
                            <section>
                                <SideHeading>Skills</SideHeading>
                                <div className="flex flex-col gap-3">
                                    {skillGroups.map((group, gi) => (
                                        <div key={gi} className="break-inside-avoid">
                                            {group.category && <h3 className="text-[12px] font-semibold uppercase tracking-wide text-(--accent) mb-1 wrap-break-word">{group.category}</h3>}
                                            <ul className="flex flex-col">
                                                {group.items.map((skill, i) => (
                                                    <li key={i} className="text-[13.5px] text-slate-800 leading-snug py-[5px] border-b border-slate-900/10 last:border-b-0 wrap-break-word">
                                                        {skill}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.education.length > 0 && (
                            <section>
                                <SideHeading>Education</SideHeading>
                                <div className="flex flex-col gap-4">
                                    {data.education.map((edu) => {
                                        const dates = formatDateRange(edu.startDate, edu.endDate);
                                        return (
                                            <div key={edu.id} className="break-inside-avoid">
                                                {edu.school && <h3 className="font-bold text-slate-900 text-[13.5px] leading-snug wrap-break-word">{edu.school}</h3>}
                                                {edu.degree && <div className="text-[13.5px] text-slate-700 leading-snug mt-0.5 wrap-break-word">{edu.degree}</div>}
                                                {dates && <div className="text-[12px] font-semibold text-slate-600 mt-1 tabular-nums">{dates}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
};

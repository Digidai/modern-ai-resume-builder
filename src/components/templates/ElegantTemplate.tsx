import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const MainHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="flex items-baseline gap-3 font-playfair text-[21px] leading-tight text-stone-900 mb-3.5 break-after-avoid">
        {children}
        <span className="flex-1 border-b border-stone-300" aria-hidden="true" />
    </h2>
);

const SideHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="font-playfair italic text-[18px] leading-tight text-(--accent) pb-1.5 mb-3 border-b border-(--accent)/25 break-after-avoid">{children}</h2>
);

const listClass = 'list-disc pl-4 space-y-1 marker:text-(--accent)';

export const ElegantTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSidebar = skillGroups.length > 0 || data.education.length > 0;
    const hasMain = Boolean(data.summary) || data.experience.length > 0 || data.projects.length > 0;

    return (
        <div className="flex flex-col flex-1 font-lato text-[14px] leading-normal text-stone-800 [--accent:var(--rs-accent,#92400E)]">
            <header className="pb-5 mb-6 border-b border-stone-300">
                <div role="heading" aria-level={1} className="font-playfair text-[42px] font-normal tracking-tight leading-[1.1] text-stone-900 wrap-break-word">{data.fullName}</div>
                {data.title && <p className="font-playfair italic text-[19px] text-(--accent) mt-1.5 wrap-break-word">{data.title}</p>}
                {contacts.length > 0 && (
                    <ul className="mt-3.5 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-stone-600 leading-snug">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="min-w-0 max-w-full">
                                <ContactLink entry={entry} className="wrap-anywhere" />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            <div className={hasSidebar && hasMain ? 'grid grid-cols-[minmax(0,1fr)_50mm] gap-9' : 'flex flex-col gap-7'}>
                {hasMain && (
                    <main className="min-w-0 flex flex-col gap-7">
                        {data.summary && (
                            <section>
                                <MainHeading>Profile</MainHeading>
                                <p className="font-playfair italic text-[15.5px] leading-[1.6] text-stone-700 whitespace-pre-line wrap-break-word">{data.summary}</p>
                            </section>
                        )}

                        {data.experience.length > 0 && (
                            <section>
                                <MainHeading>Experience</MainHeading>
                                <div className="flex flex-col gap-5">
                                    {data.experience.map((exp) => {
                                        const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                        return (
                                            <div key={exp.id} className="break-inside-avoid">
                                                <div className="flex justify-between items-baseline gap-4">
                                                    {exp.role && <h3 className="font-bold text-[15.5px] text-stone-900 leading-snug min-w-0 wrap-break-word">{exp.role}</h3>}
                                                    {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[13px] italic text-stone-500 tabular-nums">{dates}</span>}
                                                </div>
                                                {exp.company && <div className="text-(--accent) font-bold mt-0.5 text-[12.5px] uppercase tracking-[0.12em] wrap-break-word">{exp.company}</div>}
                                                {exp.description && (
                                                    <RichText text={exp.description} className="mt-2 text-stone-700 wrap-break-word" listClassName={listClass} />
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
                                <div className="flex flex-col gap-4">
                                    {data.projects.map((proj) => (
                                        <div key={proj.id} className="break-inside-avoid">
                                            {proj.name && <h3 className="font-bold text-[15px] text-stone-900 leading-snug wrap-break-word">{proj.name}</h3>}
                                            {proj.link && (
                                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[13px] italic text-(--accent) wrap-anywhere mt-0.5 hover:underline">
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                            {proj.description && (
                                                <RichText text={proj.description} className="mt-1.5 text-stone-700 wrap-break-word" listClassName={listClass} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </main>
                )}

                {hasSidebar && (
                    <aside className={`min-w-0 flex flex-col gap-7 ${hasMain ? 'border-l border-stone-200 pl-7' : ''}`}>
                        {data.education.length > 0 && (
                            <section>
                                <SideHeading>Education</SideHeading>
                                <div className="flex flex-col gap-4">
                                    {data.education.map((edu) => {
                                        const dates = formatDateRange(edu.startDate, edu.endDate);
                                        return (
                                            <div key={edu.id} className="break-inside-avoid">
                                                {edu.school && <h3 className="font-bold text-stone-900 text-[14px] leading-snug wrap-break-word">{edu.school}</h3>}
                                                {edu.degree && <div className="text-[13.5px] italic text-stone-700 leading-snug mt-0.5 wrap-break-word">{edu.degree}</div>}
                                                {dates && <div className="text-[12.5px] italic text-stone-500 mt-1 tabular-nums">{dates}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {skillGroups.length > 0 && (
                            <section>
                                <SideHeading>Skills</SideHeading>
                                <div className="flex flex-col gap-3">
                                    {skillGroups.map((group, gi) => (
                                        <div key={gi} className="break-inside-avoid">
                                            {group.category && <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-stone-500 mb-1 wrap-break-word">{group.category}</h3>}
                                            <ul className="flex flex-col gap-1 text-[14px] text-stone-800 leading-snug">
                                                {group.items.map((skill, i) => (
                                                    <li key={i} className="wrap-break-word">{skill}</li>
                                                ))}
                                            </ul>
                                        </div>
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

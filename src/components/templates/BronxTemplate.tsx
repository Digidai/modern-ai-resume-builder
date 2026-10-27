import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Poster-sized name: as big as possible while the longest word still fits on one line. */
const nameSizeClass = (name: string): string => {
    const longestWord = Math.max(0, ...name.split(/\s+/).map((word) => word.length));
    if (longestWord <= 9) return 'text-[80px]';
    if (longestWord <= 12) return 'text-[64px]';
    if (longestWord <= 16) return 'text-[48px]';
    return 'text-[40px]';
};

const Heading: React.FC<{ children: React.ReactNode; ruled?: boolean }> = ({ children, ruled }) => (
    <h2
        className={`font-montserrat text-[12px] font-extrabold uppercase tracking-[0.22em] break-after-avoid ${
            ruled ? 'border-b-2 border-(--accent) pb-2 mb-5' : 'border-b border-neutral-300 pb-2 mb-3.5'
        }`}
    >
        {children}
    </h2>
);

/** The template's single date slot: a solid tag above the entry title. */
const DateTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-block font-montserrat text-[12px] font-bold bg-(--accent) text-white px-2 py-px mb-1.5 tabular-nums">{children}</span>
);

const DASH_ITEM = "relative pl-5 before:content-['—'] before:absolute before:left-0 before:font-bold before:text-(--accent)";

export const BronxTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasSide = Boolean(data.summary.trim()) || skillGroups.length > 0 || data.education.length > 0;
    const hasMain = data.experience.length > 0 || data.projects.length > 0;

    return (
        <div className="flex-1 flex flex-col bg-white text-neutral-900 font-inter text-[14px] leading-[1.5] px-[14mm] pt-[13mm] pb-[12mm] [--accent:var(--rs-accent,#111111)]">
            <header className="mb-8">
                {data.fullName && (
                    <div role="heading" aria-level={1} className={`${nameSizeClass(data.fullName)} font-montserrat font-black uppercase tracking-tight leading-[0.95] wrap-break-word`}>
                        {data.fullName}
                    </div>
                )}
                <div className="border-t-[5px] border-(--accent) mt-5 pt-4">
                    {data.title && <p className="font-montserrat text-[19px] font-bold uppercase tracking-wide leading-tight wrap-break-word">{data.title}</p>}
                    {contacts.length > 0 && (
                        // The negative margin + overflow-hidden clips the slash of whichever item starts a line,
                        // so wrapped rows never begin with an orphan separator.
                        <div className="overflow-hidden mt-2.5">
                            <ul className="flex flex-wrap gap-y-1 -ml-6 text-[12.5px] font-semibold text-neutral-700">
                                {contacts.map((entry) => (
                                    <li key={entry.id} className="relative pl-6 min-w-0 max-w-full before:content-['/'] before:absolute before:left-2 before:text-neutral-400">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </header>

            <div className={hasSide && hasMain ? 'grid grid-cols-[1fr_2fr] gap-11' : 'flex flex-col gap-9'}>
                {hasSide && (
                    <aside className="flex flex-col gap-7 min-w-0">
                        {data.summary.trim() && (
                            <section>
                                <Heading>Profile</Heading>
                                <p className="text-[14px] font-medium leading-[1.5] wrap-break-word">{data.summary}</p>
                            </section>
                        )}

                        {skillGroups.length > 0 && (
                            <section>
                                <Heading>Skills</Heading>
                                <div className="flex flex-col gap-3">
                                    {skillGroups.map((group, gi) => (
                                        <div key={gi} className="min-w-0">
                                            {group.category && (
                                                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-1 wrap-break-word">{group.category}</div>
                                            )}
                                            <ul className="flex flex-col gap-0.5">
                                                {group.items.map((skill, i) => (
                                                    <li key={i} className="font-montserrat text-[14.5px] font-bold leading-snug wrap-break-word">{skill}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.education.length > 0 && (
                            <section>
                                <Heading>Education</Heading>
                                <div className="flex flex-col gap-4">
                                    {data.education.map((edu) => {
                                        const dates = formatDateRange(edu.startDate, edu.endDate);
                                        return (
                                            <article key={edu.id} className="break-inside-avoid">
                                                {dates && <DateTag>{dates}</DateTag>}
                                                {edu.school && <h3 className="font-montserrat text-[15px] font-bold leading-snug wrap-break-word">{edu.school}</h3>}
                                                {edu.degree && <div className="text-[13.5px] text-neutral-600 mt-0.5 leading-snug wrap-break-word">{edu.degree}</div>}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </aside>
                )}

                {hasMain && (
                    <main className="flex flex-col gap-7 min-w-0">
                        {data.experience.length > 0 && (
                            <section>
                                <Heading ruled>Experience</Heading>
                                <div className="flex flex-col gap-6">
                                    {data.experience.map((exp) => {
                                        const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                        return (
                                            <article key={exp.id} className="break-inside-avoid">
                                                {dates && <DateTag>{dates}</DateTag>}
                                                {exp.role && <h3 className="font-montserrat text-[19px] font-bold leading-[1.15] tracking-tight wrap-break-word">{exp.role}</h3>}
                                                {exp.company && <div className="text-[15px] font-medium text-neutral-600 mt-0.5 wrap-break-word">{exp.company}</div>}
                                                <RichText
                                                    text={exp.description}
                                                    className="mt-2 text-neutral-800 wrap-break-word"
                                                    listClassName="space-y-1"
                                                    itemClassName={DASH_ITEM}
                                                />
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {data.projects.length > 0 && (
                            <section>
                                <Heading ruled>Projects</Heading>
                                <div className="flex flex-col gap-5">
                                    {data.projects.map((proj) => (
                                        <article key={proj.id} className="break-inside-avoid">
                                            {proj.name && <h3 className="font-montserrat text-[17px] font-bold leading-tight tracking-tight wrap-break-word">{proj.name}</h3>}
                                            {proj.link.trim() && (
                                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12px] font-semibold text-neutral-600 mt-1 underline decoration-(--accent) underline-offset-2 wrap-anywhere">
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                            <RichText
                                                text={proj.description}
                                                className="mt-1.5 text-neutral-700 wrap-break-word"
                                                listClassName="space-y-1"
                                                itemClassName={DASH_ITEM}
                                            />
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}
                    </main>
                )}
            </div>
        </div>
    );
};

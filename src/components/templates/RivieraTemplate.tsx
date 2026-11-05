import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Riviera": the centred, photo-first CV common in France, Spain and Italy. A round photo sits
// above a serif name, the title and a single line of contact details; below, a single column with
// centred headings between hairlines, so it stays calm and reads top to bottom.

const bodyText = 'text-[13.5px] leading-[1.5] text-stone-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[10px] flex items-center gap-[12px] text-[13.5px] font-semibold uppercase tracking-[0.08em] text-(--accent) break-after-avoid">
            <span aria-hidden className="h-px flex-1 bg-stone-300" />
            {title}
            <span aria-hidden className="h-px flex-1 bg-stone-300" />
        </h2>
        <div className="flex flex-col gap-[11px]">{children}</div>
    </section>
);

export const RivieraTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[18px] bg-white px-[18mm] py-[14mm] font-lato text-stone-800 [--accent:var(--rs-accent,#8A6A4A)]">
            <header className="flex flex-col items-center text-center break-inside-avoid">
                <Portrait
                    data={data}
                    className="mb-[10px] h-[33mm] w-[33mm] rounded-full ring-[1.5px] ring-(--accent) ring-offset-[3px]"
                    fallbackClassName="bg-(--accent)/10 text-[34px] font-semibold tracking-[0.04em] text-(--accent)"
                />
                {name && <div role="heading" aria-level={1} className="font-playfair text-[34px] font-semibold leading-[1.1] text-stone-900 wrap-break-word">{name}</div>}
                {title && <p className="mt-[5px] text-[13.5px] font-semibold uppercase leading-snug tracking-[0.08em] text-(--accent) wrap-break-word">{title}</p>}
                {contacts.length > 0 && (
                    <ul className="mt-[9px] flex flex-wrap justify-center gap-x-[14px] gap-y-[3px] text-[12.5px] leading-snug text-stone-600">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="max-w-full">
                                <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-(--accent)" className="wrap-anywhere" />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {summary && (
                <Section title="Profile">
                    <p className={`${bodyText} whitespace-pre-line text-center`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => {
                        const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                        return (
                            <article key={exp.id} className="break-inside-avoid">
                                <div className="flex items-baseline justify-between gap-4">
                                    <h3 className="min-w-0 text-[14.5px] leading-snug wrap-break-word">
                                        {exp.role.trim() && <span className="font-bold text-stone-900">{exp.role}</span>}
                                        {exp.role.trim() && exp.company.trim() && <span className="text-stone-400"> · </span>}
                                        {exp.company.trim() && <span className="italic text-stone-700">{exp.company}</span>}
                                    </h3>
                                    {dates && <span className="shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-stone-500">{dates}</span>}
                                </div>
                                <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        );
                    })}
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => {
                        const dates = formatDateRange(edu.startDate, edu.endDate);
                        return (
                            <article key={edu.id} className="flex items-baseline justify-between gap-4 break-inside-avoid">
                                <p className="min-w-0 text-[14px] leading-snug wrap-break-word">
                                    {edu.degree.trim() && <span className="font-bold text-stone-900">{edu.degree}</span>}
                                    {edu.degree.trim() && edu.school.trim() && <span className="text-stone-400"> · </span>}
                                    {edu.school.trim() && <span className="italic text-stone-700">{edu.school}</span>}
                                </p>
                                {dates && <span className="shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-stone-500">{dates}</span>}
                            </article>
                        );
                    })}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <article key={proj.id} className="break-inside-avoid">
                            <h3 className="text-[14.5px] leading-snug wrap-break-word">
                                {proj.name.trim() && <span className="font-bold text-stone-900">{proj.name}</span>}
                                {proj.name.trim() && proj.link.trim() && <span className="text-stone-400"> · </span>}
                                {proj.link.trim() && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                            </h3>
                            <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.some((group) => group.category) ? (
                        <div className="flex flex-col gap-[4px]">
                            {skillGroups.map((group, index) => (
                                <p key={index} className={`${bodyText} break-inside-avoid`}>
                                    {group.category && <span className="font-bold text-stone-900">{group.category}: </span>}
                                    {group.items.join(', ')}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <p className={`${bodyText} text-center`}>{skillGroups.flatMap((group) => group.items).join(' · ')}</p>
                    )}
                </Section>
            )}
        </div>
    );
};

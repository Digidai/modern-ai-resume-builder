import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Dubai", after the CV format common in the UAE, Saudi Arabia and the wider Gulf: a gold rule
// across the top, a framed photo beside the name and title, contact details in two columns, a
// profile, then a Core Competencies grid before a single-column career history. Headings carry a
// small gold diamond; the body stays plain so it reads well when printed or forwarded.

const bodyText = 'text-[13.5px] leading-[1.5] text-neutral-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[9px] flex items-center gap-[9px] text-[14.5px] font-bold uppercase tracking-[0.08em] text-[#14324A] break-after-avoid">
            <span aria-hidden className="h-[8px] w-[8px] rotate-45 bg-(--accent)" />
            {title}
            <span aria-hidden className="h-px flex-1 bg-(--accent)/40" />
        </h2>
        {children}
    </section>
);

export const DubaiTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const allSkills = skillGroups.flatMap((group) => group.items);
    const categorized = skillGroups.some((group) => group.category);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[17px] border-t-[6mm] border-(--accent) bg-white px-[15mm] pt-[11mm] pb-[13mm] font-raleway text-neutral-900 [--accent:var(--rs-accent,#906F36)] print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
            <header className="break-inside-avoid">
                <div className="flex items-center gap-[7mm]">
                    <Portrait
                        data={data}
                        className="h-[38mm] w-[32mm] rounded-[3px] border-[2px] border-(--accent) p-[2px]"
                        fallbackClassName="bg-[#14324A] text-[32px] font-bold tracking-[0.04em] text-white"
                    />
                    <div className="min-w-0 flex-1">
                        {name && <div role="heading" aria-level={1} className="text-[33px] font-bold leading-[1.08] text-[#14324A] wrap-break-word">{name}</div>}
                        {title && <p className="mt-[6px] text-[15.5px] font-semibold uppercase leading-snug tracking-[0.08em] text-(--accent) wrap-break-word">{title}</p>}
                    </div>
                </div>
                {contacts.length > 0 && (
                    <ul className="mt-[12px] grid grid-cols-2 gap-x-[8mm] gap-y-[4px] border-y border-(--accent)/40 py-[8px] text-[12.5px] leading-snug text-neutral-700">
                        {contacts.map((entry) => (
                            <li key={entry.id} className="min-w-0">
                                <ContactItem entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" fit />
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            {summary && (
                <Section title="Professional Summary">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Core Competencies">
                    {categorized ? (
                        <div className="flex flex-col gap-[4px]">
                            {skillGroups.map((group, index) => (
                                <p key={index} className={`${bodyText} break-inside-avoid`}>
                                    {group.category && <span className="font-bold text-[#14324A]">{group.category}: </span>}
                                    {group.items.join(', ')}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <ul className="grid grid-cols-3 gap-x-[6mm] gap-y-[4px] text-[13px] leading-snug text-neutral-700">
                            {allSkills.map((skill, index) => (
                                <li key={index} className="flex min-w-0 gap-[7px] wrap-anywhere">
                                    <span aria-hidden className="mt-[6px] h-[5px] w-[5px] shrink-0 rotate-45 bg-(--accent)" />
                                    <span className="min-w-0">{skill}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Professional Experience">
                    <div className="flex flex-col gap-[13px]">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            const heading = exp.role.trim() || exp.company.trim();
                            const company = exp.role.trim() ? exp.company.trim() : '';
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <div className="flex items-baseline justify-between gap-4">
                                        {heading && <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-[#14324A] wrap-break-word">{heading}</h3>}
                                        {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] font-semibold tabular-nums text-(--accent)">{dates}</span>}
                                    </div>
                                    {company && <p className="text-[13.5px] font-semibold text-neutral-600 wrap-break-word">{company}</p>}
                                    <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <div className="flex flex-col gap-[8px]">
                        {data.education.map((edu) => {
                            const dates = formatDateRange(edu.startDate, edu.endDate);
                            return (
                                <article key={edu.id} className="flex items-baseline justify-between gap-4 break-inside-avoid">
                                    <div className="min-w-0">
                                        {edu.degree.trim() && <h3 className="text-[14px] font-bold leading-snug text-[#14324A] wrap-break-word">{edu.degree}</h3>}
                                        {edu.school.trim() && <p className="text-[13px] leading-snug text-neutral-600 wrap-break-word">{edu.school}</p>}
                                    </div>
                                    {dates && <span className="shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-neutral-500">{dates}</span>}
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    <div className="flex flex-col gap-[10px]">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                {proj.name.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-[#14324A] wrap-break-word">{proj.name}</h3>}
                                {proj.link.trim() && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

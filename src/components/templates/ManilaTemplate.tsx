import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Manila", after the photo resume expected across the Philippines, Indonesia, Malaysia and
// Vietnam: name, title and contact details on the left with a square 2×2 ID photo on the right,
// then full-width tinted heading bars and a single column. Skills sit in two columns at the end.

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[9px] border-l-[4px] border-(--accent) bg-(--accent)/10 px-[10px] py-[4px] text-[14px] font-bold uppercase tracking-[0.08em] text-(--accent) break-after-avoid print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
            {title}
        </h2>
        <div className="px-[2px]">{children}</div>
    </section>
);

export const ManilaTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[16px] bg-white px-[15mm] py-[14mm] font-roboto text-slate-900 [--accent:var(--rs-accent,#0E6E6E)]">
            <header className="flex items-start justify-between gap-[8mm] break-inside-avoid">
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="text-[33px] font-bold uppercase leading-[1.08] tracking-[0.02em] text-slate-900 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[5px] text-[16px] font-medium leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <ul className="mt-[11px] flex flex-col gap-[3px] text-[12.5px] leading-snug text-slate-600">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="max-w-full">
                                    <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-(--accent)" className="wrap-anywhere" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Portrait
                    data={data}
                    className="h-[38mm] w-[38mm] border-[3px] border-white shadow-[0_0_0_1px_rgb(203_213_225)]"
                    fallbackClassName="bg-(--accent)/10 text-[36px] font-bold tracking-[0.04em] text-(--accent)"
                />
            </header>

            {summary && (
                <Section title="Career Objective">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Work Experience">
                    <div className="flex flex-col gap-[12px]">
                        {data.experience.map((exp) => {
                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            const heading = exp.role.trim() || exp.company.trim();
                            const company = exp.role.trim() ? exp.company.trim() : '';
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <div className="flex items-baseline justify-between gap-4">
                                        {heading && <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                        {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500">{dates}</span>}
                                    </div>
                                    {company && <p className="text-[13.5px] font-medium text-(--accent) wrap-break-word">{company}</p>}
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
                                        {edu.degree.trim() && <h3 className="text-[14px] font-bold leading-snug text-slate-900 wrap-break-word">{edu.degree}</h3>}
                                        {edu.school.trim() && <p className="text-[13px] leading-snug text-slate-600 wrap-break-word">{edu.school}</p>}
                                    </div>
                                    {dates && <span className="shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500">{dates}</span>}
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
                                {proj.name.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
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

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.some((group) => group.category) ? (
                        <div className="flex flex-col gap-[4px]">
                            {skillGroups.map((group, index) => (
                                <p key={index} className={`${bodyText} break-inside-avoid`}>
                                    {group.category && <span className="font-bold text-slate-900">{group.category}: </span>}
                                    {group.items.join(', ')}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <ul className={`grid grid-cols-2 gap-x-[8mm] ${listClass} ${bodyText}`}>
                            {skillGroups.flatMap((group) => group.items).map((skill, index) => (
                                <li key={index} className="wrap-anywhere">{skill}</li>
                            ))}
                        </ul>
                    )}
                </Section>
            )}
        </div>
    );
};

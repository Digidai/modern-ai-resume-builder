import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Munich", after the German tabular Lebenslauf: name, title and contact details on the left, a
// 35×45 mm passport photo on the right, then sections ruled in the accent colour with the dates in
// a fixed left column and the entry beside them. The most common photo CV in Germany, Austria
// and Switzerland.

const COLUMNS = 'grid grid-cols-[36mm_minmax(0,1fr)] gap-x-[6mm]';
const bodyText = 'text-[13.5px] leading-[1.48] text-neutral-700 wrap-break-word';
const listClass = 'list-disc pl-[1.05em] space-y-[1px] marker:text-(--accent)';
const leftText = 'pt-[1px] text-[12.5px] leading-snug text-neutral-500 tabular-nums wrap-break-word';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[9px] border-b-[1.5px] border-(--accent) pb-[3px] text-[14px] font-bold uppercase tracking-[0.08em] text-(--accent) break-after-avoid">{title}</h2>
        <div className="flex flex-col gap-[10px]">{children}</div>
    </section>
);

const Row: React.FC<{ left?: string; children: React.ReactNode }> = ({ left, children }) => (
    <div className={`${COLUMNS} break-inside-avoid`}>
        <div className={leftText}>{left}</div>
        <div className="min-w-0">{children}</div>
    </div>
);

export const MunichTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[18px] bg-white px-[17mm] py-[15mm] font-source-sans text-neutral-900 [--accent:var(--rs-accent,#1F3A5F)]">
            <header className="flex items-start justify-between gap-[8mm] break-inside-avoid">
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="text-[34px] font-semibold leading-[1.08] tracking-[-0.01em] text-neutral-900 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[5px] text-[16px] leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <ul className="mt-[12px] flex flex-col gap-[3px] text-[12.5px] leading-snug text-neutral-600">
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
                    className="h-[45mm] w-[34mm] border border-neutral-200"
                    fallbackClassName="bg-(--accent)/10 text-[34px] font-semibold tracking-[0.04em] text-(--accent)"
                />
            </header>

            {summary && (
                <Section title="Profile">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => (
                        <Row key={exp.id} left={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}>
                            {exp.role.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-neutral-900 wrap-break-word">{exp.role}</h3>}
                            {exp.company.trim() && <p className="text-[13.5px] leading-snug text-neutral-600 wrap-break-word">{exp.company}</p>}
                            <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </Row>
                    ))}
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => (
                        <Row key={edu.id} left={formatDateRange(edu.startDate, edu.endDate)}>
                            {edu.degree.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-neutral-900 wrap-break-word">{edu.degree}</h3>}
                            {edu.school.trim() && <p className="text-[13.5px] leading-snug text-neutral-600 wrap-break-word">{edu.school}</p>}
                        </Row>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <Row key={proj.id} left={proj.name}>
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className={bodyText} listClassName={listClass} />
                        </Row>
                    ))}
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.some((group) => group.category) ? (
                        skillGroups.map((group, index) => (
                            <Row key={index} left={group.category}>
                                <p className={bodyText}>{group.items.join(', ')}</p>
                            </Row>
                        ))
                    ) : (
                        <p className={bodyText}>{skillGroups.flatMap((group) => group.items).join(', ')}</p>
                    )}
                </Section>
            )}
        </div>
    );
};

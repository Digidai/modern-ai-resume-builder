import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Essential": the plain black-and-white resume with a photo, as in the basic word-processor
// templates. A 3:4 photo beside the name, title and contact lines; bold capital headings over a
// full-width hairline; role and employer on the left with dates on the right. No colour unless the
// user picks an accent.

const bodyText = 'text-[13.5px] leading-[1.5] text-neutral-800 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[1px] marker:text-neutral-500';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[8px] border-b border-neutral-900 pb-[3px] text-[14px] font-bold uppercase tracking-[0.08em] text-(--accent) break-after-avoid">{title}</h2>
        <div className="flex flex-col gap-[10px]">{children}</div>
    </section>
);

const EntryHead: React.FC<{ left: React.ReactNode; right?: string }> = ({ left, right }) => (
    <div className="flex items-baseline justify-between gap-4">
        <p className="min-w-0 text-[14px] leading-snug wrap-break-word">{left}</p>
        {right && <span className="shrink-0 whitespace-nowrap text-[13px] tabular-nums text-neutral-700">{right}</span>}
    </div>
);

export const EssentialTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[16px] bg-white px-[16mm] py-[14mm] font-sans text-neutral-900 [--accent:var(--rs-accent,#111111)]">
            <header className="flex items-start gap-[7mm] break-inside-avoid">
                <Portrait
                    data={data}
                    className="h-[37mm] w-[28mm] border border-neutral-300"
                    fallbackClassName="bg-neutral-100 text-[28px] font-bold tracking-[0.04em] text-neutral-600"
                />
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="text-[30px] font-bold leading-[1.1] text-neutral-950 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[3px] text-[15.5px] leading-snug text-neutral-700 wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <ul className="mt-[9px] grid grid-cols-2 gap-x-[6mm] gap-y-[3px] text-[12.5px] leading-snug text-neutral-700">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="min-w-0">
                                    <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-neutral-500" fit />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </header>

            {summary && (
                <Section title="Summary">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => (
                        <article key={exp.id} className="break-inside-avoid">
                            <EntryHead
                                left={
                                    <>
                                        {exp.role.trim() && <span className="font-bold">{exp.role}</span>}
                                        {exp.role.trim() && exp.company.trim() && ', '}
                                        {exp.company.trim() && <span>{exp.company}</span>}
                                    </>
                                }
                                right={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                            />
                            <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => (
                        <article key={edu.id} className="break-inside-avoid">
                            <EntryHead
                                left={
                                    <>
                                        {edu.degree.trim() && <span className="font-bold">{edu.degree}</span>}
                                        {edu.degree.trim() && edu.school.trim() && ', '}
                                        {edu.school.trim() && <span>{edu.school}</span>}
                                    </>
                                }
                                right={formatDateRange(edu.startDate, edu.endDate)}
                            />
                        </article>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <article key={proj.id} className="break-inside-avoid">
                            <EntryHead
                                left={
                                    <>
                                        {proj.name.trim() && <span className="font-bold">{proj.name}</span>}
                                        {proj.name.trim() && proj.link.trim() && ', '}
                                        {proj.link.trim() && (
                                            <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="text-neutral-700 wrap-anywhere underline-offset-2 hover:underline">
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                    </>
                                }
                            />
                            <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    <div className="flex flex-col gap-[3px]">
                        {skillGroups.map((group, index) => (
                            <p key={index} className={`${bodyText} break-inside-avoid`}>
                                {group.category && <span className="font-bold text-neutral-950">{group.category}: </span>}
                                {group.items.join(', ')}
                            </p>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

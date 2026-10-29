import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Wall Street": the investment-banking resume format (as in the Wall Street Oasis template).
// Times, half-inch margins, centred capitalised name over one contact line, bold capitalised
// section headings on a full-width black rule, education first, the firm in bold with dates on the
// right and the title in italics below, and a closing "Skills & Interests" block. No summary
// heading: a summary, if any, sits under the header as one plain paragraph.

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-[11px] first:mt-0">
        <h2 className="mb-[5px] border-b border-(--accent) pb-[1px] text-[13.33px] font-bold uppercase tracking-[0.04em] text-(--accent) break-after-avoid">{title}</h2>
        {children}
    </section>
);

const bodyText = 'text-[13.33px] leading-[1.38] text-black wrap-break-word';
const listClass = 'list-disc pl-[18px] space-y-0 marker:text-[10px]';

const Entry: React.FC<{ primary: string; secondary?: string; dates?: string; children?: React.ReactNode }> = ({ primary, secondary, dates, children }) => (
    <article className="mt-[6px] first:mt-0 break-inside-avoid">
        <div className="flex items-baseline justify-between gap-4">
            {primary && <h3 className="min-w-0 text-[13.33px] font-bold uppercase leading-snug wrap-break-word">{primary}</h3>}
            {dates && <span className="shrink-0 whitespace-nowrap text-[13.33px] font-bold tabular-nums">{dates}</span>}
        </div>
        {secondary && <p className="text-[13.33px] italic leading-snug wrap-break-word">{secondary}</p>}
        {children}
    </article>
);

export const WallStreetTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col bg-white px-[12.7mm] py-[12.7mm] font-tinos text-black [--accent:var(--rs-accent,#000000)]">
            {(name || title || contacts.length > 0) && (
                <header className="mb-[10px] text-center break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[21px] font-bold uppercase leading-tight tracking-[0.06em] wrap-break-word">{name}</div>}
                    {title && <p className="text-[13.33px] italic leading-snug wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <p className="mt-[2px] text-[13.33px] leading-[1.45] text-balance">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    <span className="inline-block max-w-full">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                        {index < contacts.length - 1 && <span aria-hidden className="mx-[6px]">|</span>}
                                    </span>{' '}
                                </React.Fragment>
                            ))}
                        </p>
                    )}
                </header>
            )}

            {summary && <p className={`${bodyText} mb-[8px] whitespace-pre-line`}>{summary}</p>}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => (
                        <Entry
                            key={edu.id}
                            primary={edu.school.trim() || edu.degree.trim()}
                            secondary={edu.school.trim() ? edu.degree.trim() : ''}
                            dates={formatDateRange(edu.startDate, edu.endDate)}
                        />
                    ))}
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => (
                        <Entry
                            key={exp.id}
                            primary={exp.company.trim() || exp.role.trim()}
                            secondary={exp.company.trim() ? exp.role.trim() : ''}
                            dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                        >
                            <RichText text={exp.description} className={`mt-[1px] ${bodyText}`} listClassName={listClass} />
                        </Entry>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <Entry key={proj.id} primary={proj.name.trim()}>
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[13.33px] italic wrap-anywhere hover:underline underline-offset-2">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className={`mt-[1px] ${bodyText}`} listClassName={listClass} />
                        </Entry>
                    ))}
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills & Interests">
                    <ul className="flex flex-col">
                        {skillGroups.map((group, index) => (
                            <li key={index} className={bodyText}>
                                <span className="font-bold">{group.category || 'Skills'}: </span>
                                {group.items.join(', ')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
};

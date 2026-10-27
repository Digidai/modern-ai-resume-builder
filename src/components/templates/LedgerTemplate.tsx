import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Ledger", after moderncv's banking style: a left-aligned bold name in the accent (first
// names a tint lighter) with the title beside it in grey, an icon contact line, a tinted
// accent rule, bold accent headings, and "Title, Employer" lines with bold right-aligned dates.

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-[18px] first:mt-0">
        <h2 className="text-[19.2px] font-bold leading-tight text-(--accent) mb-[7px] break-after-avoid">{title}</h2>
        {children}
    </section>
);

const listClass = 'list-disc pl-[18px] space-y-[2px] marker:text-(--accent)';
const bodyClass = 'text-[14.67px] leading-[1.42] wrap-break-word';

const EntryHead: React.FC<{ title: string; subtitle?: string; dates?: string; href?: string }> = ({ title, subtitle, dates, href }) => (
    <div className="flex justify-between items-baseline gap-x-5">
        <p className="min-w-0 text-[14.67px] leading-snug wrap-break-word">
            {title && <span className="font-bold text-neutral-900">{title}</span>}
            {title && subtitle && ', '}
            {subtitle &&
                (href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="italic text-neutral-700 wrap-anywhere hover:underline">
                        {subtitle}
                    </a>
                ) : (
                    <span className="italic text-neutral-800">{subtitle}</span>
                ))}
        </p>
        {dates && <span className="shrink-0 whitespace-nowrap text-[14px] font-bold text-neutral-700 tabular-nums">{dates}</span>}
    </div>
);

export const LedgerTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);
    const summary = data.summary.trim();
    const nameParts = data.fullName.trim().split(/\s+/).filter(Boolean);
    const lastName = nameParts.pop() ?? '';
    const firstNames = nameParts.join(' ');
    const hasHeader = Boolean(lastName || data.title.trim() || contacts.length);

    return (
        <div className="flex-1 flex flex-col bg-white text-neutral-800 font-garamond px-[18mm] py-[15mm] [--accent:var(--rs-accent,#2F5A8A)]">
            {hasHeader && (
                <header className="break-inside-avoid">
                    {(lastName || data.title.trim()) && (
                        <div className="flex flex-wrap items-baseline gap-x-[14px] gap-y-[2px]">
                            {lastName && (
                                <div role="heading" aria-level={1} className="min-w-0 text-[34px] font-bold leading-[1.1] text-(--accent) wrap-break-word">
                                    {firstNames && <span className="text-[color-mix(in_oklab,var(--accent)_72%,white)]">{firstNames} </span>}
                                    {lastName}
                                </div>
                            )}
                            {data.title.trim() && (
                                <p className="min-w-0 text-[22px] font-medium leading-tight text-neutral-500 wrap-break-word">{data.title}</p>
                            )}
                        </div>
                    )}
                    {contacts.length > 0 && (
                        <p className="mt-[8px] flex flex-wrap gap-x-[18px] gap-y-[3px] text-[14.67px] leading-snug text-neutral-800">
                            {contacts.map((entry) => (
                                <ContactItem key={entry.id} entry={entry} iconClassName="w-[13px] h-[13px] text-(--accent)" />
                            ))}
                        </p>
                    )}
                    <div className="mt-[10px] border-t border-(--accent)/50" />
                </header>
            )}

            <div className={hasHeader ? 'mt-[16px]' : ''}>
                {summary && (
                    <Section title="Summary">
                        <p className={`${bodyClass} whitespace-pre-line`}>{summary}</p>
                    </Section>
                )}

                {data.experience.length > 0 && (
                    <Section title="Experience">
                        <div className="flex flex-col gap-[11px]">
                            {data.experience.map((exp) => (
                                <div key={exp.id} className="break-inside-avoid">
                                    <EntryHead
                                        title={exp.role || exp.company}
                                        subtitle={exp.role ? exp.company : ''}
                                        dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                                    />
                                    {exp.description.trim() && (
                                        <RichText text={exp.description} className={`mt-[3px] space-y-[3px] ${bodyClass}`} listClassName={listClass} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {data.education.length > 0 && (
                    <Section title="Education">
                        <div className="flex flex-col gap-[8px]">
                            {data.education.map((edu) => (
                                <div key={edu.id} className="break-inside-avoid">
                                    <EntryHead
                                        title={edu.degree || edu.school}
                                        subtitle={edu.degree ? edu.school : ''}
                                        dates={formatDateRange(edu.startDate, edu.endDate)}
                                    />
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {data.projects.length > 0 && (
                    <Section title="Projects">
                        <div className="flex flex-col gap-[10px]">
                            {data.projects.map((proj) => (
                                <div key={proj.id} className="break-inside-avoid">
                                    {(proj.name || proj.link) && (
                                        <EntryHead
                                            title={proj.name}
                                            subtitle={proj.link ? displayUrl(proj.link) : ''}
                                            href={proj.link ? toHref(proj.link) : undefined}
                                        />
                                    )}
                                    {proj.description.trim() && (
                                        <RichText text={proj.description} className={`mt-[3px] space-y-[3px] ${bodyClass}`} listClassName={listClass} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {skillGroups.length > 0 && (
                    <Section title="Skills">
                        <div className={`flex flex-col gap-[3px] ${bodyClass}`}>
                            {skillGroups.map((group, index) => (
                                <p key={index}>
                                    {(group.category || hasCategories) && (
                                        <span className="font-bold text-neutral-900">{group.category || 'Other'}: </span>
                                    )}
                                    {group.items.join(', ')}
                                </p>
                            ))}
                        </div>
                    </Section>
                )}
            </div>
        </div>
    );
};

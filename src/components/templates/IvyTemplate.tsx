import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Ivy", after the Harvard career-services format: Times-style type throughout, a modest
// centered bold name over a full-width hairline, a • separated contact line, centered
// title-case headings with no rules, and two-line entries with dates on the right.
// Accent (default near-black) drives the name and the header rule.

const CONTACT_ORDER = ['location', 'email', 'phone', 'linkedin', 'website'] as const;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-[14px] first:mt-0">
        <h2 className="text-center text-[16px] font-bold leading-tight mb-[6px] break-after-avoid">{title}</h2>
        {children}
    </section>
);

const listClass = 'list-disc pl-[22px] space-y-[1px] marker:text-[12px]';
const bodyClass = 'text-[14.67px] leading-[1.38] wrap-break-word';

export const IvyTemplate: React.FC<TemplateProps> = ({ data }) => {
    const entries = getContactEntries(data);
    const contacts = CONTACT_ORDER.flatMap((key) => entries.filter((entry) => entry.key === key));
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);
    const summary = data.summary.trim();
    const hasHeader = Boolean(data.fullName.trim() || data.title.trim() || contacts.length);

    return (
        <div className="flex-1 flex flex-col bg-white text-black font-tinos px-[12.7mm] py-[12.7mm] [--accent:var(--rs-accent,#111111)]">
            {hasHeader && (
                <header className="text-center break-inside-avoid">
                    {data.fullName.trim() && (
                        <h1 className="text-[20px] font-bold leading-tight text-(--accent) tracking-[0.01em] wrap-break-word">{data.fullName}</h1>
                    )}
                    {data.title.trim() && <p className="mt-[1px] text-[14.67px] leading-snug wrap-break-word">{data.title}</p>}
                    <div className="mt-[5px] border-t border-(--accent)" />
                    {contacts.length > 0 && (
                        <p className="mt-[4px] text-[14.67px] leading-[1.45] text-balance">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.key}>
                                    {index > 0 && ' '}
                                    <span className="inline-block max-w-full">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                        {index < contacts.length - 1 && <span aria-hidden="true" className="ml-[10px] mr-[6px]">•</span>}
                                    </span>
                                </React.Fragment>
                            ))}
                        </p>
                    )}
                </header>
            )}

            <div className={hasHeader ? 'mt-[14px]' : ''}>
                {summary && (
                    <Section title="Summary">
                        <p className={`${bodyClass} whitespace-pre-line`}>{summary}</p>
                    </Section>
                )}

                {data.education.length > 0 && (
                    <Section title="Education">
                        <div className="flex flex-col gap-[10px]">
                            {data.education.map((edu) => {
                                const dates = formatDateRange(edu.startDate, edu.endDate);
                                return (
                                    <div key={edu.id} className={`break-inside-avoid ${bodyClass}`}>
                                        {edu.school && edu.degree && <h3 className="font-bold">{edu.school}</h3>}
                                        <div className="flex justify-between items-baseline gap-x-4">
                                            <p className={`min-w-0 ${edu.school && edu.degree ? '' : 'font-bold'}`}>{edu.degree || edu.school}</p>
                                            {dates && <span className="shrink-0 whitespace-nowrap tabular-nums">{dates}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                )}

                {data.experience.length > 0 && (
                    <Section title="Experience">
                        <div className="flex flex-col gap-[10px]">
                            {data.experience.map((exp) => {
                                const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                return (
                                    <div key={exp.id} className={`break-inside-avoid ${bodyClass}`}>
                                        {exp.company && exp.role && <h3 className="font-bold">{exp.company}</h3>}
                                        <div className="flex justify-between items-baseline gap-x-4">
                                            <p className={`min-w-0 ${exp.company && exp.role ? 'italic' : 'font-bold'}`}>{exp.role || exp.company}</p>
                                            {dates && <span className="shrink-0 whitespace-nowrap tabular-nums">{dates}</span>}
                                        </div>
                                        {exp.description.trim() && (
                                            <RichText text={exp.description} className="mt-[2px] space-y-[2px]" listClassName={listClass} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                )}

                {data.projects.length > 0 && (
                    <Section title="Projects">
                        <div className="flex flex-col gap-[10px]">
                            {data.projects.map((proj) => (
                                <div key={proj.id} className={`break-inside-avoid ${bodyClass}`}>
                                    {(proj.name || proj.link) && (
                                        <div className="flex justify-between items-baseline gap-x-6">
                                            {proj.name && <h3 className="min-w-0 font-bold">{proj.name}</h3>}
                                            {proj.link && (
                                                <a
                                                    href={toHref(proj.link)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`min-w-0 wrap-anywhere hover:underline ${proj.name ? 'text-right max-w-[55%]' : ''}`}
                                                >
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {proj.description.trim() && (
                                        <RichText text={proj.description} className="mt-[2px] space-y-[2px]" listClassName={listClass} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {skillGroups.length > 0 && (
                    <Section title="Skills">
                        <div className={`flex flex-col gap-[2px] ${bodyClass}`}>
                            {skillGroups.map((group, index) => (
                                <p key={index}>
                                    {(group.category || hasCategories) && <span className="font-bold">{group.category || 'Other'}: </span>}
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

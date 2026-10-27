import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Classic ATS", after Jake's Resume: 12.7 mm margins, one column, centered small-caps name,
// small-caps headings over a hairline rule, two-row entries with right-aligned dates.
// Accent (default near-black) drives the headings, their rules and link underlines.

const CONTACT_ORDER = ['phone', 'email', 'linkedin', 'website', 'link', 'location'] as const;

const linkClass = 'underline decoration-(--accent)/70 decoration-[0.75px] underline-offset-[3px] wrap-anywhere';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-[13px] first:mt-0">
        <h2 className="text-[17.33px] leading-tight text-(--accent) [font-variant-caps:small-caps] tracking-[0.02em] border-b border-(--accent) pb-[2px] mb-[6px] break-after-avoid">
            {title}
        </h2>
        {children}
    </section>
);

const listClass = 'list-disc pl-[17px] space-y-[1px] marker:text-[11px] marker:text-neutral-800';

export const ClassicTemplate: React.FC<TemplateProps> = ({ data }) => {
    const entries = getContactEntries(data);
    const contacts = CONTACT_ORDER.flatMap((key) => entries.filter((entry) => entry.key === key));
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);
    const summary = data.summary.trim();

    return (
        <div className="flex-1 flex flex-col bg-white text-neutral-900 font-charis px-[12.7mm] py-[12.7mm] [--accent:var(--rs-accent,#111111)]">
            <header className="text-center break-inside-avoid">
                {data.fullName.trim() && (
                    <h1 className="text-[33px] font-bold leading-[1.1] [font-variant-caps:small-caps] tracking-[0.01em] wrap-break-word">
                        {data.fullName}
                    </h1>
                )}
                {data.title.trim() && <p className="mt-[3px] text-[14.67px] italic leading-snug text-neutral-800 wrap-break-word">{data.title}</p>}
                {contacts.length > 0 && (
                    <p className="mt-[5px] text-[13.33px] leading-[1.5] text-neutral-900 text-balance">
                        {contacts.map((entry, index) => (
                            <React.Fragment key={entry.id}>
                                {index > 0 && ' '}
                                <span className="inline-block max-w-full">
                                    <ContactLink entry={entry} className={entry.href && entry.key !== 'phone' ? linkClass : 'wrap-anywhere'} />
                                    {index < contacts.length - 1 && <span aria-hidden="true" className="ml-[9px] mr-[5px] text-neutral-500">|</span>}
                                </span>
                            </React.Fragment>
                        ))}
                    </p>
                )}
            </header>

            <div className={data.fullName.trim() || data.title.trim() || contacts.length ? 'mt-[12px]' : ''}>
                {summary && (
                    <Section title="Summary">
                        <p className="px-[14px] text-[13.33px] leading-[1.45] whitespace-pre-line wrap-break-word">{summary}</p>
                    </Section>
                )}

                {data.experience.length > 0 && (
                    <Section title="Experience">
                        <div className="flex flex-col gap-[8px] px-[14px]">
                            {data.experience.map((exp) => {
                                const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                return (
                                    <div key={exp.id} className="break-inside-avoid">
                                        <div className="flex justify-between items-baseline gap-x-4">
                                            <h3 className="min-w-0 text-[14.67px] font-bold leading-snug wrap-break-word">{exp.role || exp.company}</h3>
                                            {dates && <span className="shrink-0 whitespace-nowrap text-[13.33px] tabular-nums">{dates}</span>}
                                        </div>
                                        {exp.role && exp.company && (
                                            <p className="text-[13.33px] italic leading-snug wrap-break-word">{exp.company}</p>
                                        )}
                                        {exp.description.trim() && (
                                            <RichText
                                                text={exp.description}
                                                className="mt-[3px] text-[13.33px] leading-[1.4] wrap-break-word"
                                                listClassName={listClass}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                )}

                {data.projects.length > 0 && (
                    <Section title="Projects">
                        <div className="flex flex-col gap-[7px] px-[14px]">
                            {data.projects.map((proj) => (
                                <div key={proj.id} className="break-inside-avoid">
                                    {(proj.name || proj.link) && (
                                        <p className="text-[14.67px] leading-snug wrap-break-word">
                                            {proj.name && <span className="font-bold">{proj.name}</span>}
                                            {proj.name && proj.link && <span aria-hidden="true" className="mx-[6px] text-neutral-500">|</span>}
                                            {proj.link && (
                                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className={`text-[13.33px] italic ${linkClass}`}>
                                                    {displayUrl(proj.link)}
                                                </a>
                                            )}
                                        </p>
                                    )}
                                    {proj.description.trim() && (
                                        <RichText
                                            text={proj.description}
                                            className="mt-[3px] text-[13.33px] leading-[1.4] wrap-break-word"
                                            listClassName={listClass}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {data.education.length > 0 && (
                    <Section title="Education">
                        <div className="flex flex-col gap-[7px] px-[14px]">
                            {data.education.map((edu) => {
                                const dates = formatDateRange(edu.startDate, edu.endDate);
                                return (
                                    <div key={edu.id} className="break-inside-avoid">
                                        <div className="flex justify-between items-baseline gap-x-4">
                                            <h3 className="min-w-0 text-[14.67px] font-bold leading-snug wrap-break-word">{edu.school || edu.degree}</h3>
                                            {dates && <span className="shrink-0 whitespace-nowrap text-[13.33px] tabular-nums">{dates}</span>}
                                        </div>
                                        {edu.school && edu.degree && <p className="text-[13.33px] italic leading-snug wrap-break-word">{edu.degree}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                )}

                {skillGroups.length > 0 && (
                    <Section title={hasCategories ? 'Technical Skills' : 'Skills'}>
                        <div className="flex flex-col gap-[2px] px-[14px] text-[13.33px] leading-[1.45] wrap-break-word">
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

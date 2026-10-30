import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Jade": the layout most Chinese resumes use. Name, target role and a two-column contact grid on
// the left of the header with a one-inch ID photo (25 × 35 mm) on the right; sections open with a
// solid accent tab and a tinted rule; entries put role · company on the left and dates on the right.

const bodyText = 'text-[13.5px] leading-[1.55] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';
const dateClass = 'shrink-0 whitespace-nowrap text-[12.5px] font-medium tabular-nums text-slate-500';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[9px] flex items-stretch break-after-avoid">
            <span className="rounded-r-[3px] bg-(--accent) py-[3px] pr-[14px] pl-[10px] text-[14px] font-bold tracking-[0.08em] text-white">{title}</span>
            <span aria-hidden className="mb-[2px] flex-1 self-end border-b-2 border-(--accent)/25" />
        </h2>
        {children}
    </section>
);

const EntryHead: React.FC<{ title: string; subtitle?: string; dates?: string }> = ({ title, subtitle, dates }) => (
    <div className="flex items-baseline justify-between gap-4">
        <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">
            {title}
            {subtitle && <span className="font-semibold text-(--accent)">{`  |  ${subtitle}`}</span>}
        </h3>
        {dates && <span className={dateClass}>{dates}</span>}
    </div>
);

export const JadeTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[16px] bg-white px-[14mm] pt-[12mm] pb-[12mm] font-sans text-slate-800 [--accent:var(--rs-accent,#1F6F5C)]">
            {(name || title || contacts.length > 0) && (
                <header className="flex items-center gap-[8mm] border-b-[3px] border-(--accent) pb-[12px] break-inside-avoid">
                    <div className="min-w-0 flex-1">
                        {name && <div role="heading" aria-level={1} className="text-[32px] font-bold leading-[1.1] tracking-[0.02em] text-slate-900 wrap-break-word">{name}</div>}
                        {title && (
                            <p className="mt-[6px] text-[14.5px] leading-snug text-slate-600 wrap-break-word">
                                <span className="font-semibold text-slate-500">Target role </span>
                                <span className="font-semibold text-(--accent)">{title}</span>
                            </p>
                        )}
                        {contacts.length > 0 && (
                            <div className="mt-[10px] grid grid-cols-2 gap-x-[6mm] gap-y-[5px] text-[13px] text-slate-700">
                                {contacts.map((entry) => (
                                    <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" fit />
                                ))}
                            </div>
                        )}
                    </div>
                    <Portrait
                        data={data}
                        className="h-[35mm] w-[26mm] rounded-[2px]"
                        fallbackClassName="bg-(--accent)/10 text-[26px] font-bold tracking-[0.04em] text-(--accent)"
                    />
                </header>
            )}

            {summary && (
                <Section title="Profile">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    <div className="flex flex-col gap-[12px]">
                        {data.experience.map((exp) => {
                            const heading = exp.company.trim() || exp.role.trim();
                            const role = exp.company.trim() ? exp.role.trim() : '';
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <EntryHead title={heading} subtitle={role} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                    <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
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
                                <div className="flex items-baseline justify-between gap-4">
                                    {proj.name.trim() && <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                </div>
                                <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <div className="flex flex-col gap-[8px]">
                        {data.education.map((edu) => {
                            const heading = edu.school.trim() || edu.degree.trim();
                            const degree = edu.school.trim() ? edu.degree.trim() : '';
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    <EntryHead title={heading} subtitle={degree} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    <ul className="flex flex-col gap-[4px]">
                        {skillGroups.map((group, index) => (
                            <li key={index} className={`${bodyText} break-inside-avoid`}>
                                {group.category && <span className="font-bold text-slate-900">{group.category}: </span>}
                                {group.items.join(', ')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
};

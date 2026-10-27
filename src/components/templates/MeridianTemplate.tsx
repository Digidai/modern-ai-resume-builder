import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Meridian": a modern take on the Harvard serif resume. Left-aligned serif name, small-caps
// accent headings over a hairline, and a right-hand date rail: every dated entry carries its dates
// in a narrow column fenced off by a vertical hairline. Dates follow the heading in the DOM (grid
// placement moves them into the rail), so text extracts as heading → dates → company → bullets.

const SMALL_CAPS = '[font-variant-caps:small-caps]';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className={`mb-[9px] flex items-center gap-3 break-after-avoid text-[19px] font-semibold leading-tight tracking-[0.06em] text-(--accent) ${SMALL_CAPS}`}>
            <span className="shrink-0">{title}</span>
            <span aria-hidden className="h-px min-w-6 flex-1 bg-(--accent)/30" />
        </h2>
        {children}
    </section>
);

const bodyText = 'text-[14px] leading-[1.5] text-neutral-800 wrap-break-word';
const listClass = 'list-disc pl-[1.15em] space-y-[2px] marker:text-(--accent)/70';

/** Title, optional subtitle and body on the left; dates in the right rail spanning the whole entry. */
const RailEntry: React.FC<{ title: string; subtitle?: string; dates?: string; children?: React.ReactNode }> = ({ title, subtitle, dates, children }) => (
    <article className="grid grid-cols-[minmax(0,1fr)_33mm] grid-rows-[auto_auto_auto] gap-x-[6mm] break-inside-avoid">
        {title && <h3 className="col-start-1 row-start-1 text-[15.5px] font-semibold leading-snug text-neutral-950 wrap-break-word">{title}</h3>}
        {dates && (
            <p className={`col-start-2 row-start-1 row-end-4 border-l border-(--accent)/35 pt-[2px] text-right text-[13px] leading-snug text-neutral-600 tabular-nums`}>
                {dates}
            </p>
        )}
        {subtitle && <p className="col-start-1 row-start-2 text-[14px] italic leading-snug text-neutral-700 wrap-break-word">{subtitle}</p>}
        {children && <div className="col-start-1 row-start-3 min-w-0">{children}</div>}
    </article>
);

export const MeridianTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[18px] bg-white px-[16mm] py-[14mm] font-source-serif text-neutral-900 [--accent:var(--rs-accent,#7A2E39)]">
            {(name || title || contacts.length > 0) && (
                <header className="border-b border-neutral-300 pb-[12px] break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[34px] font-semibold leading-[1.1] tracking-[-0.01em] text-neutral-950 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[4px] text-[17px] italic leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <p className="mt-[8px] text-[13.5px] leading-[1.55] text-neutral-700">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    {index > 0 && ' '}
                                    <span className="inline-block max-w-full">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                        {index < contacts.length - 1 && <span aria-hidden className="ml-[9px] mr-[3px] text-(--accent)/60">·</span>}
                                    </span>
                                </React.Fragment>
                            ))}
                        </p>
                    )}
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
                            const role = exp.role.trim();
                            const company = exp.company.trim();
                            return (
                                <RailEntry
                                    key={exp.id}
                                    title={role || company}
                                    subtitle={role ? company : ''}
                                    dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                                >
                                    {exp.description.trim() && <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />}
                                </RailEntry>
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
                                {(proj.name.trim() || proj.link.trim()) && (
                                    <p className="leading-snug wrap-break-word">
                                        {proj.name.trim() && <span className="text-[15.5px] font-semibold text-neutral-950">{proj.name}</span>}
                                        {proj.name.trim() && proj.link.trim() && <span aria-hidden className="mx-[7px] text-neutral-400">—</span>}
                                        {proj.link.trim() && (
                                            <a
                                                href={toHref(proj.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[13.5px] italic text-(--accent) underline decoration-(--accent)/40 underline-offset-2 wrap-anywhere"
                                            >
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                    </p>
                                )}
                                {proj.description.trim() && <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />}
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <div className="flex flex-col gap-[10px]">
                        {data.education.map((edu) => {
                            const school = edu.school.trim();
                            const degree = edu.degree.trim();
                            return (
                                <RailEntry
                                    key={edu.id}
                                    title={school || degree}
                                    subtitle={school ? degree : ''}
                                    dates={formatDateRange(edu.startDate, edu.endDate)}
                                />
                            );
                        })}
                    </div>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    <div className={`flex flex-col gap-[3px] ${bodyText}`}>
                        {skillGroups.map((group, index) => (
                            <p key={index}>
                                {hasCategories && <span className="font-semibold text-neutral-950">{group.category || 'Other'}: </span>}
                                {group.items.join(hasCategories ? ', ' : ' · ')}
                            </p>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

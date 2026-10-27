import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Vital": a calm, clinical single-column resume for healthcare and other credential-led roles.
// Labelled contact details (Email, Phone…) in a two-column grid, and a tinted credentials block
// right after the profile so licences and certifications ("Licenses: RN, BLS") are seen first.
// Headings carry a short accent bar; dates sit right-aligned on the entry's first line.

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[8px] flex items-center gap-[9px] break-after-avoid border-b border-slate-200 pb-[5px] text-[14px] font-bold uppercase leading-tight tracking-[0.12em] text-slate-900">
        <span aria-hidden className="h-[14px] w-[4px] shrink-0 rounded-[1px] bg-(--accent)" />
        {children}
    </h2>
);

const bodyText = 'text-[14px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';
const dateClass = 'shrink-0 whitespace-nowrap text-[13px] tabular-nums text-slate-600';

const EntryHeader: React.FC<{ title: string; subtitle?: string; dates?: string }> = ({ title, subtitle, dates }) => (
    <>
        {(title || dates) && (
            <div className="flex items-baseline justify-between gap-4">
                <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word">{title}</h3>
                {dates && <span className={dateClass}>{dates}</span>}
            </div>
        )}
        {subtitle && <p className="text-[14px] font-semibold leading-snug text-(--accent) wrap-break-word">{subtitle}</p>}
    </>
);

export const VitalTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[17px] px-[16mm] py-[14mm] font-source-sans text-slate-800 [--accent:var(--rs-accent,#1F6E73)]">
            {(name || title || contacts.length > 0) && (
                <header className="break-inside-avoid">
                    {name && <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.01em] text-slate-900 wrap-break-word">{name}</h1>}
                    {title && <p className="mt-[3px] text-[17px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <dl className="mt-[10px] grid grid-cols-2 gap-x-[8mm] gap-y-[2px] border-t-2 border-(--accent) pt-[8px] text-[13.5px] leading-[1.45]">
                            {contacts.map((entry) => (
                                <div key={entry.id} className="flex min-w-0 items-baseline gap-[8px]">
                                    <dt className="w-[20mm] shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 wrap-break-word">{entry.label}</dt>
                                    <dd className="min-w-0 text-slate-800">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </header>
            )}

            {summary && (
                <section>
                    <SectionTitle>Profile</SectionTitle>
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </section>
            )}

            {skillGroups.length > 0 && (
                <section className="break-inside-avoid">
                    <SectionTitle>{hasCategories ? 'Credentials & Skills' : 'Skills'}</SectionTitle>
                    <div className="flex flex-col gap-[6px] rounded-[6px] border border-(--accent)/25 bg-(--accent)/5 px-[14px] py-[10px]">
                        {skillGroups.map((group, index) =>
                            group.category ? (
                                <div key={index} className="grid grid-cols-[36mm_minmax(0,1fr)] gap-x-4">
                                    <span className="text-[13.5px] font-bold leading-[1.5] text-slate-900 wrap-break-word">{group.category}</span>
                                    <span className={bodyText}>{group.items.join(', ')}</span>
                                </div>
                            ) : (
                                <ul key={index} className="grid grid-cols-3 gap-x-4 gap-y-[2px]">
                                    {hasCategories && <li className="col-span-3 text-[13.5px] font-bold leading-[1.5] text-slate-900">Other</li>}
                                    {group.items.map((skill, itemIndex) => (
                                        <li key={itemIndex} className={`flex min-w-0 items-baseline gap-[7px] ${bodyText}`}>
                                            <span aria-hidden className="relative top-[-2px] h-[5px] w-[5px] shrink-0 rounded-full bg-(--accent)" />
                                            <span className="min-w-0">{skill}</span>
                                        </li>
                                    ))}
                                </ul>
                            )
                        )}
                    </div>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-[12px]">
                        {data.experience.map((exp) => {
                            const role = exp.role.trim();
                            const company = exp.company.trim();
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <EntryHeader title={role || company} subtitle={role ? company : ''} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                    <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.education.length > 0 && (
                <section>
                    <SectionTitle>Education</SectionTitle>
                    <div className="flex flex-col gap-[9px]">
                        {data.education.map((edu) => {
                            const degree = edu.degree.trim();
                            const school = edu.school.trim();
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    <EntryHeader title={degree || school} subtitle={degree ? school : ''} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <SectionTitle>Projects</SectionTitle>
                    <div className="flex flex-col gap-[10px]">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                {(proj.name.trim() || proj.link.trim()) && (
                                    <div className="flex flex-wrap items-baseline gap-x-3">
                                        {proj.name.trim() && <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[13px] text-(--accent) wrap-anywhere hover:underline">
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                    </div>
                                )}
                                <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

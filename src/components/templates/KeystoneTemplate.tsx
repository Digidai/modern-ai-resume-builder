import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Keystone": a corporate single-column resume. Serif name on the left with contact details
// stacked on the right, a heavy accent rule under the header, and section headings set in a
// lightly tinted band with an accent edge. Entries lead with the organisation in caps (dates
// right-aligned), then the role in italics. One column, real text, standard headings.

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[9px] break-after-avoid border-l-[3px] border-(--accent) bg-(--accent)/8 px-[10px] py-[3px] text-[13.5px] font-bold uppercase leading-[1.5] tracking-[0.14em] text-(--accent)">
        {children}
    </h2>
);

const bodyText = 'text-[14px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-[square] pl-[1.1em] space-y-[2px] marker:text-(--accent)';
const dateClass = 'shrink-0 whitespace-nowrap text-[13px] font-bold tabular-nums text-slate-600';

const EntryHeader: React.FC<{ org: string; detail?: string; dates?: string }> = ({ org, detail, dates }) => (
    <>
        {(org || dates) && (
            <div className="flex items-baseline justify-between gap-4">
                <h3 className="min-w-0 text-[14.5px] font-bold uppercase leading-snug tracking-[0.06em] text-slate-900 wrap-break-word">{org}</h3>
                {dates && <span className={dateClass}>{dates}</span>}
            </div>
        )}
        {detail && <p className="text-[14.5px] italic leading-snug text-slate-700 wrap-break-word">{detail}</p>}
    </>
);

export const KeystoneTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const hasCategories = skillGroups.some((group) => group.category);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();
    const hasHeader = Boolean(name || title || contacts.length);

    return (
        <div className="flex flex-1 flex-col gap-[16px] px-[15mm] py-[13mm] font-lato text-slate-800 [--accent:var(--rs-accent,#2F5A8A)]">
            {hasHeader && (
                <header className="flex items-end justify-between gap-x-8 border-b-[3px] border-(--accent) pb-[12px] break-inside-avoid">
                    {(name || title) && (
                        <div className="min-w-0 flex-1">
                            {/* Very long names step down a size so they wrap to two lines, not three. */}
                            {name && <div role="heading" aria-level={1} className={`font-source-serif ${name.length > 28 ? 'text-[28px]' : 'text-[34px]'} font-semibold leading-[1.1] text-slate-900 wrap-break-word`}>{name}</div>}
                            {title && <p className="mt-[5px] text-[16px] font-bold leading-snug text-(--accent) wrap-break-word">{title}</p>}
                        </div>
                    )}
                    {contacts.length > 0 && (
                        <ul className="flex min-w-0 max-w-[76mm] shrink-0 flex-col gap-[1px] text-[13px] leading-[1.45] text-slate-600">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="min-w-0 text-right">
                                    <ContactLink entry={entry} className="wrap-anywhere" />
                                </li>
                            ))}
                        </ul>
                    )}
                </header>
            )}

            {summary && (
                <section>
                    <SectionTitle>Professional Summary</SectionTitle>
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <SectionTitle>Experience</SectionTitle>
                    <div className="flex flex-col gap-[12px]">
                        {data.experience.map((exp) => {
                            const company = exp.company.trim();
                            const role = exp.role.trim();
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    <EntryHeader org={company || role} detail={company ? role : ''} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                    <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
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
                                        {proj.name.trim() && (
                                            <h3 className="min-w-0 text-[14.5px] font-bold uppercase leading-snug tracking-[0.06em] text-slate-900 wrap-break-word">{proj.name}</h3>
                                        )}
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

            {data.education.length > 0 && (
                <section>
                    <SectionTitle>Education</SectionTitle>
                    <div className="flex flex-col gap-[9px]">
                        {data.education.map((edu) => {
                            const school = edu.school.trim();
                            const degree = edu.degree.trim();
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    <EntryHeader org={school || degree} detail={school ? degree : ''} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {skillGroups.length > 0 && (
                <section className="break-inside-avoid">
                    <SectionTitle>{hasCategories ? 'Skills' : 'Core Competencies'}</SectionTitle>
                    {hasCategories ? (
                        <div className="flex flex-col gap-[3px]">
                            {skillGroups.map((group, index) => (
                                <div key={index} className="grid grid-cols-[34mm_minmax(0,1fr)] gap-x-4">
                                    <span className="text-[13.5px] font-bold leading-[1.5] text-slate-900 wrap-break-word">{group.category || 'Other'}</span>
                                    <span className={bodyText}>{group.items.join(', ')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={bodyText}>
                            {skillGroups[0].items.map((skill, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <span aria-hidden className="mx-[7px] inline-block size-[0.34em] bg-(--accent) align-middle" />}
                                    <span className="inline-block max-w-full">{skill}</span>
                                </React.Fragment>
                            ))}
                        </p>
                    )}
                </section>
            )}
        </div>
    );
};

import React from 'react';
import { TemplateProps, AwardLine, Citation, TalkLine, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Graduate": for students and new graduates. Education comes first (put GPA, honours and relevant
// coursework in the degree line), then skills so a recruiter sees the toolkit at a glance, then
// internships and projects. One column, accent headings over a thin rule, Source Sans.

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[7px] flex items-center gap-[10px] text-[13px] font-bold uppercase tracking-[0.12em] text-(--accent) break-after-avoid">
            {title}
            <span aria-hidden className="h-px flex-1 bg-(--accent)/35" />
        </h2>
        {children}
    </section>
);

const bodyText = 'text-[14px] leading-[1.48] text-slate-800 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[1px] marker:text-(--accent)/70';
const dateClass = 'shrink-0 whitespace-nowrap text-[13px] tabular-nums text-slate-600';

const EntryHead: React.FC<{ title: string; subtitle?: string; dates?: string }> = ({ title, subtitle, dates }) => (
    <>
        <div className="flex items-baseline justify-between gap-4">
            {title && <h3 className="min-w-0 text-[15px] font-bold leading-snug text-slate-950 wrap-break-word">{title}</h3>}
            {dates && <span className={dateClass}>{dates}</span>}
        </div>
        {subtitle && <p className="text-[14px] italic leading-snug text-slate-700 wrap-break-word">{subtitle}</p>}
    </>
);

export const GraduateTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const publications = data.publications ?? [];
    const awards = data.awards ?? [];
    const talks = data.talks ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[15px] bg-white px-[15mm] py-[13mm] font-source-sans text-slate-900 [--accent:var(--rs-accent,#1F4E79)]">
            {(name || title || contacts.length > 0) && (
                <header className="break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[30px] font-bold leading-[1.1] text-slate-950 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[3px] text-[16px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <div className="mt-[7px] flex flex-wrap gap-x-[14px] gap-y-[3px] text-[13px] text-slate-700">
                            {contacts.map((entry) => (
                                <ContactItem key={entry.id} entry={entry} iconClassName="h-[12px] w-[12px] text-(--accent)" />
                            ))}
                        </div>
                    )}
                </header>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <div className="flex flex-col gap-[8px]">
                        {data.education.map((edu) => (
                            <article key={edu.id} className="break-inside-avoid">
                                <EntryHead
                                    title={edu.school.trim() || edu.degree.trim()}
                                    subtitle={edu.school.trim() ? edu.degree.trim() : ''}
                                    dates={formatDateRange(edu.startDate, edu.endDate)}
                                />
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {summary && (
                <Section title="Profile">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    <ul className="flex flex-col gap-[2px]">
                        {skillGroups.map((group, index) => (
                            <li key={index} className={bodyText}>
                                {group.category && <span className="font-bold text-slate-950">{group.category}: </span>}
                                {group.items.join(', ')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    <div className="flex flex-col gap-[11px]">
                        {data.experience.map((exp) => (
                            <article key={exp.id} className="break-inside-avoid">
                                <EntryHead
                                    title={exp.role.trim() || exp.company.trim()}
                                    subtitle={exp.role.trim() ? exp.company.trim() : ''}
                                    dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                                />
                                <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    <div className="flex flex-col gap-[9px]">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                <div className="flex items-baseline justify-between gap-4">
                                    {proj.name.trim() && <h3 className="min-w-0 text-[15px] font-bold leading-snug text-slate-950 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[13px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                </div>
                                <RichText text={proj.description} className={`mt-[2px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {publications.length > 0 && (
                <Section title="Publications">
                    <ul className="flex flex-col gap-[5px]">
                        {publications.map((pub) => (
                            <li key={pub.id} className={`${bodyText} break-inside-avoid`}>
                                <Citation pub={pub} owner={data.fullName} linkClassName="text-(--accent) wrap-anywhere hover:underline underline-offset-2" />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {awards.length > 0 && (
                <Section title="Grants and awards">
                    <ul className="flex flex-col gap-[5px]">
                        {awards.map((award) => (
                            <li key={award.id} className={`${bodyText} break-inside-avoid`}>
                                <AwardLine award={award} />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {talks.length > 0 && (
                <Section title="Talks">
                    <ul className="flex flex-col gap-[5px]">
                        {talks.map((talk) => (
                            <li key={talk.id} className={`${bodyText} break-inside-avoid`}>
                                <TalkLine talk={talk} />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
};

import React from 'react';
import { TemplateProps, AwardLine, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Campus": a student and graduate resume with a photo. A round photo beside the name, target role
// and contact row; Education comes first and leads with the school, then Projects before
// Experience (internships), Honors and Awards, and Skills. Headings carry a short accent bar.

const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[8px] flex items-center gap-[9px] text-[15px] font-bold leading-tight text-slate-900 break-after-avoid">
            <span aria-hidden className="h-[16px] w-[5px] rounded-full bg-(--accent)" />
            {title}
            <span aria-hidden className="h-px flex-1 bg-slate-200" />
        </h2>
        <div className="flex flex-col gap-[10px]">{children}</div>
    </section>
);

const Head: React.FC<{ title: React.ReactNode; right?: string }> = ({ title, right }) => (
    <div className="flex items-baseline justify-between gap-4">
        <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{title}</h3>
        {right && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500">{right}</span>}
    </div>
);

export const CampusTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const awards = data.awards ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[16px] bg-white px-[15mm] py-[13mm] font-source-sans text-slate-900 [--accent:var(--rs-accent,#3B5BDB)]">
            <header className="flex items-center gap-[7mm] rounded-[6px] bg-(--accent)/7 px-[6mm] py-[5mm] break-inside-avoid print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                <Portrait
                    data={data}
                    className="h-[30mm] w-[30mm] rounded-full ring-[3px] ring-white"
                    fallbackClassName="bg-(--accent) text-[30px] font-bold tracking-[0.04em] text-white"
                />
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="text-[31px] font-bold leading-[1.08] text-slate-900 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[3px] text-[15.5px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <ul className="mt-[8px] flex flex-wrap gap-x-[14px] gap-y-[3px] text-[12.5px] leading-snug text-slate-600">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="max-w-full">
                                    <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-(--accent)" className="wrap-anywhere" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </header>

            {summary && (
                <Section title="Profile">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => (
                        <article key={edu.id} className="break-inside-avoid">
                            <Head title={edu.school.trim() || edu.degree} right={formatDateRange(edu.startDate, edu.endDate)} />
                            {edu.school.trim() && edu.degree.trim() && <p className="text-[13.5px] leading-snug text-slate-700 wrap-break-word">{edu.degree}</p>}
                        </article>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <article key={proj.id} className="break-inside-avoid">
                            <Head title={proj.name} />
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => {
                        const heading = exp.role.trim() || exp.company.trim();
                        const company = exp.role.trim() ? exp.company.trim() : '';
                        return (
                            <article key={exp.id} className="break-inside-avoid">
                                <Head title={heading} right={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                {company && <p className="text-[13.5px] font-semibold text-(--accent) wrap-break-word">{company}</p>}
                                <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        );
                    })}
                </Section>
            )}

            {awards.length > 0 && (
                <Section title="Honors and Awards">
                    <ul className={`${listClass} ${bodyText}`}>
                        {awards.map((award) => (
                            <li key={award.id} className="break-inside-avoid">
                                <AwardLine award={award} titleClassName="font-semibold text-slate-900" />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="flex flex-wrap items-baseline gap-[5px] break-inside-avoid">
                            {group.category && <span className="mr-[3px] text-[13px] font-bold text-slate-900">{group.category}</span>}
                            {group.items.map((skill, index) => (
                                <span key={index} className="rounded-full bg-(--accent)/9 px-[9px] py-[1px] text-[12.5px] leading-snug text-slate-800 wrap-anywhere print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
};

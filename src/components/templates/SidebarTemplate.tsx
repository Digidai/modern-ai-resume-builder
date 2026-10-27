import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

const CONTACT_LABELS = {
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    website: 'Portfolio',
    linkedin: 'LinkedIn',
} as const;

const SidebarHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3 border-b border-white/15 pb-2 text-[11.5px] font-bold uppercase tracking-[0.2em] text-white break-after-avoid">{children}</h2>
);

const MainHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-3.5 flex items-center gap-3 text-[15px] font-bold uppercase tracking-[0.12em] text-slate-900 break-after-avoid">
        <span aria-hidden="true" className="h-[3px] w-6 shrink-0 rounded-full bg-(--accent)" />
        {children}
    </h2>
);

const bodyText = 'text-[14px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[3px] marker:text-slate-400';

/**
 * Two columns: an accent-tinted dark sidebar (name, contact, skills, education) beside the main
 * column (profile, experience, projects). Full-bleed, so it owns its page margins.
 */
export const SidebarTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    return (
        <div className="flex flex-1 flex-row font-roboto [--accent:var(--rs-accent,#4338CA)] [--accent-light:color-mix(in_oklab,var(--accent)_45%,white)] [--side:color-mix(in_oklab,var(--accent)_22%,#0f172a)]">
            <aside className="flex w-[70mm] shrink-0 flex-col gap-8 bg-(--side) pt-[15mm] pr-[8mm] pb-[12mm] pl-[12mm] text-slate-300 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                {(data.fullName.trim() || data.title.trim()) && (
                    <div>
                        {data.fullName.trim() && (
                            <h1 className="text-[27px] font-bold leading-[1.15] tracking-[-0.01em] text-white wrap-break-word">{data.fullName}</h1>
                        )}
                        {data.title.trim() && (
                            <p className="mt-2 text-[15px] font-medium leading-snug text-(--accent-light) wrap-break-word">{data.title}</p>
                        )}
                    </div>
                )}

                {contacts.length > 0 && (
                    <dl className="flex flex-col gap-2.5 text-[13px] leading-snug">
                        {contacts.map((entry) => (
                            <div key={entry.id} className="min-w-0">
                                <dt className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">{entry.key === 'link' ? entry.label : CONTACT_LABELS[entry.key]}</dt>
                                <dd className="text-white">
                                    <ContactLink entry={entry} className="wrap-anywhere" />
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}

                {skillGroups.length > 0 && (
                    <section className="break-inside-avoid">
                        <SidebarHeading>Skills</SidebarHeading>
                        <div className="flex flex-col gap-3">
                            {skillGroups.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {group.category && (
                                        <h3 className="mb-1.5 text-[12px] font-semibold text-(--accent-light) wrap-break-word">{group.category}</h3>
                                    )}
                                    <ul className="flex flex-wrap gap-1.5">
                                        {group.items.map((skill, index) => (
                                            <li key={index} className="rounded bg-white/10 px-2 py-[3px] text-[12.5px] leading-snug text-white wrap-anywhere">
                                                {skill}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <SidebarHeading>Education</SidebarHeading>
                        <div className="flex flex-col gap-4">
                            {data.education.map((edu) => {
                                const dates = formatDateRange(edu.startDate, edu.endDate);
                                const heading = edu.school.trim() || edu.degree.trim();
                                const degree = edu.school.trim() ? edu.degree.trim() : '';
                                return (
                                    <article key={edu.id} className="break-inside-avoid">
                                        {heading && <h3 className="text-[14px] font-bold leading-snug text-white wrap-break-word">{heading}</h3>}
                                        {degree && <div className="mt-0.5 text-[13px] leading-snug text-slate-200 wrap-break-word">{degree}</div>}
                                        {dates && <div className="mt-1 text-[12px] tabular-nums text-white/65">{dates}</div>}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}
            </aside>

            <main className="flex min-w-0 flex-1 flex-col gap-7 bg-white pt-[15mm] pr-[13mm] pb-[12mm] pl-[10mm] text-slate-800">
                {data.summary.trim() && (
                    <section>
                        <MainHeading>Profile</MainHeading>
                        <p className={`${bodyText} whitespace-pre-line`}>{data.summary.trim()}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <MainHeading>Experience</MainHeading>
                        <div className="ml-[3px] flex flex-col gap-5 border-l-2 border-(--accent)/20 pl-5">
                            {data.experience.map((exp) => {
                                const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                const heading = exp.role.trim() || exp.company.trim();
                                const company = exp.role.trim() ? exp.company.trim() : '';
                                return (
                                    <article key={exp.id} className="relative break-inside-avoid">
                                        <span aria-hidden="true" className="absolute -left-[27px] top-[6px] h-3 w-3 rounded-full border-2 border-white bg-(--accent)" />
                                        {heading && <h3 className="text-[15.5px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                        {(company || dates) && (
                                            <div className="mt-0.5 flex items-baseline justify-between gap-4">
                                                <span className="min-w-0 text-[14px] font-medium text-(--accent) wrap-break-word">{company}</span>
                                                {dates && <span className="shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-slate-500">{dates}</span>}
                                            </div>
                                        )}
                                        <RichText text={exp.description} className={`mt-1.5 ${bodyText}`} listClassName={listClass} />
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <MainHeading>Projects</MainHeading>
                        <div className="flex flex-col gap-4">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="break-inside-avoid">
                                    {proj.name.trim() && <h3 className="text-[15.5px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a
                                            href={toHref(proj.link)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-0.5 block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2"
                                        >
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className={`mt-1 ${bodyText}`} listClassName={listClass} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

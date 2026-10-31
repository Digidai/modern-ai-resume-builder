import React from 'react';
import { TemplateProps, AwardLine, ContactLink, RichText, displayUrl, getContactEntries, groupSkills, toHref } from './shared';

// "Federal": a USAJOBS-style federal resume. One plain column in a system sans, black text, and the
// details HR specialists check for every job spelled out: title (with series and grade), employer,
// start and end dates as MM/YYYY and hours per week. Duties and accomplishments follow as bullets.
// Skill groups named "Certifications: …", "Licenses: …" or "Security Clearance: …" get their own section, one per line, and
// grants and awards (`data.awards`) are listed as Honors and Awards.

const CLEARANCE = /clearance/i;
const CREDENTIALS = /certif|licen[cs]|clearance/i;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[7px] border-b-[1.5px] border-neutral-900 pb-[2px] text-[13px] font-bold uppercase tracking-[0.06em] text-(--accent) break-after-avoid">{title}</h2>
        {children}
    </section>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-neutral-900 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px]';
const metaText = 'text-[13px] leading-[1.45] text-neutral-800';

/** "2021-03" → "03/2021" (USAJOBS asks for month and year); other values are shown as typed. */
const monthYear = (value: string): string => {
    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(trimmed);
    return match ? `${match[2].padStart(2, '0')}/${match[1]}` : trimmed;
};

const dateRange = (start: string, end: string, isCurrent = false): string => {
    const from = monthYear(start);
    const to = isCurrent ? 'Present' : monthYear(end);
    return from && to ? `${from} – ${to}` : from || to;
};

/** "40" → "40 hours per week"; text that already says hours is kept as typed. */
const hoursText = (value: string | undefined): string => {
    const trimmed = (value ?? '').trim();
    return /^\d+(?:\.\d+)?$/.test(trimmed) ? `${trimmed} hours per week` : trimmed;
};

export const FederalTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const allGroups = groupSkills(data.skills);
    // One credential per line. With semicolons ("PMP, PMI, 2022; CGFM, AGA, 2020") each part keeps its commas.
    // A clearance ("Security Clearance: Top Secret/SCI, active") stays whole, keeps its label and comes first.
    const clearances: string[] = [];
    const certificates: string[] = [];
    for (const raw of data.skills) {
        const match = /^([^:]{1,40}):\s*(.+)$/.exec(raw.trim());
        if (!match || !CREDENTIALS.test(match[1])) continue;
        const [, category, list] = match;
        if (CLEARANCE.test(category)) clearances.push(...list.split(/\s*;\s*/).filter(Boolean).map((item) => `${category.trim()}: ${item}`));
        else certificates.push(...(list.includes(';') ? list.split(/\s*;\s*/).filter(Boolean) : groupSkills([raw])[0].items));
    }
    const credentials = [...clearances, ...certificates];
    const credentialsTitle = clearances.length ? (certificates.length ? 'Clearance, Certifications and Licenses' : 'Security Clearance') : 'Certifications and Licenses';
    const skillGroups = allGroups.filter((group) => !CREDENTIALS.test(group.category));
    const awards = data.awards ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[15px] bg-white px-[16mm] py-[14mm] font-sans text-neutral-900 [--accent:var(--rs-accent,#111111)]">
            {(name || title || contacts.length > 0) && (
                <header className="break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[25px] font-bold leading-[1.15] text-neutral-950 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[1px] text-[14.5px] leading-snug text-neutral-800 wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <p className="mt-[6px] text-[13px] leading-[1.55] text-neutral-800">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    <span className="inline-block max-w-full">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                        {index < contacts.length - 1 && <span aria-hidden className="mx-[7px] text-neutral-400">|</span>}
                                    </span>{' '}
                                </React.Fragment>
                            ))}
                        </p>
                    )}
                </header>
            )}

            {summary && (
                <Section title="Professional Summary">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Work Experience">
                    <div className="flex flex-col gap-[13px]">
                        {data.experience.map((exp) => {
                            const role = exp.role.trim();
                            const company = exp.company.trim();
                            const dates = dateRange(exp.startDate, exp.endDate, exp.isCurrent);
                            const hours = hoursText(exp.hours);
                            return (
                                <article key={exp.id} className="break-inside-avoid">
                                    {(role || company) && <h3 className="text-[14px] font-bold leading-snug text-neutral-950 wrap-break-word">{role || company}</h3>}
                                    {role && company && <p className={`${metaText} font-semibold wrap-break-word`}>{company}</p>}
                                    {(dates || hours) && (
                                        <p className={`${metaText} tabular-nums`}>
                                            {dates && <span className="whitespace-nowrap">{dates}</span>}
                                            {dates && hours && <span aria-hidden className="mx-[7px] text-neutral-400">|</span>}
                                            {hours && <span>{hours}</span>}
                                        </p>
                                    )}
                                    <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    <div className="flex flex-col gap-[8px]">
                        {data.education.map((edu) => {
                            const degree = edu.degree.trim();
                            const school = edu.school.trim();
                            const dates = dateRange(edu.startDate, edu.endDate);
                            return (
                                <article key={edu.id} className="break-inside-avoid">
                                    {(degree || school) && <h3 className="text-[14px] font-bold leading-snug text-neutral-950 wrap-break-word">{degree || school}</h3>}
                                    {(degree && school) || dates ? (
                                        <p className={`${metaText} wrap-break-word`}>
                                            {degree && school}
                                            {degree && school && dates && <span aria-hidden className="mx-[7px] text-neutral-400">|</span>}
                                            {dates && <span className="whitespace-nowrap tabular-nums">{dates}</span>}
                                        </p>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                </Section>
            )}

            {credentials.length > 0 && (
                <Section title={credentialsTitle}>
                    <ul className={`${listClass} ${bodyText}`}>
                        {credentials.map((item, index) => (
                            <li key={index} className="break-inside-avoid">
                                {item}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    <ul className="flex flex-col gap-[3px]">
                        {skillGroups.map((group, index) => (
                            <li key={index} className={bodyText}>
                                {group.category && <span className="font-bold text-neutral-950">{group.category}: </span>}
                                {group.items.join(', ')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {awards.length > 0 && (
                <Section title="Honors and Awards">
                    <ul className="flex flex-col gap-[4px]">
                        {awards.map((award) => (
                            <li key={award.id} className={`${bodyText} break-inside-avoid`}>
                                <AwardLine award={award} titleClassName="font-bold text-neutral-950" />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    <div className="flex flex-col gap-[10px]">
                        {data.projects.map((proj) => (
                            <article key={proj.id} className="break-inside-avoid">
                                <div className="flex items-baseline justify-between gap-4">
                                    {proj.name.trim() && <h3 className="min-w-0 text-[14px] font-bold leading-snug text-neutral-950 wrap-break-word">{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="min-w-0 text-[13px] text-neutral-700 wrap-anywhere hover:underline underline-offset-2">
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
        </div>
    );
};

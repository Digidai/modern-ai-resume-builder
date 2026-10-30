import React from 'react';
import { TemplateProps, AwardLine, Citation, ContactItem, RichText, TalkLine, TeachingLine, displayUrl, formatDate, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Oxford", after moderncv's classic style (the class's default and the most used LaTeX CV in
// Europe and academia): a large name with the title in grey under it, contacts stacked on the
// right, and a left column a quarter of the page wide. Each section heading starts with an accent
// bar in that column; entries put their dates there, right-aligned, and the role, employer and
// bullets beside them. Reading order stays dates → entry, so ATS parse it as one column.

const COLUMNS = 'grid grid-cols-[38mm_minmax(0,1fr)] gap-x-[5mm]';
const bodyText = 'text-[13.5px] leading-[1.48] text-neutral-800 wrap-break-word';
const listClass = 'list-disc pl-[1.05em] space-y-[1px] marker:text-(--accent)';
const leftText = 'pt-[1px] text-right text-[12.5px] leading-snug text-neutral-500 tabular-nums wrap-break-word';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className={`${COLUMNS} mb-[8px] items-center break-after-avoid`}>
            <span aria-hidden className="h-[7px] bg-(--accent)/70" />
            <span className="text-[18px] font-normal leading-tight text-(--accent)">{title}</span>
        </h2>
        <div className="flex flex-col gap-[9px]">{children}</div>
    </section>
);

const Row: React.FC<{ left?: string; children: React.ReactNode; className?: string }> = ({ left, children, className = '' }) => (
    <div className={`${COLUMNS} break-inside-avoid ${className}`}>
        <div className={leftText}>{left}</div>
        <div className="min-w-0">{children}</div>
    </div>
);

/** "2021–2025" or the formatted date range when months matter. */
const yearOf = (value: string) => {
    const formatted = formatDate(value);
    return /\d{4}$/.test(formatted) ? formatted.slice(-4) : formatted;
};

export const OxfordTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const publications = data.publications ?? [];
    const awards = data.awards ?? [];
    const talks = data.talks ?? [];
    const teaching = data.teaching ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[17px] bg-white px-[16mm] py-[15mm] font-source-sans text-neutral-900 [--accent:var(--rs-accent,#3873B3)]">
            {(name || title || contacts.length > 0) && (
                <header className="flex items-start justify-between gap-[8mm] break-inside-avoid">
                    <div className="min-w-[55mm] flex-1">
                        {name && <div role="heading" aria-level={1} className="text-[36px] font-normal leading-[1.05] tracking-[-0.01em] text-neutral-900 wrap-break-word">{name}</div>}
                        {title && <p className="mt-[5px] text-[17px] italic leading-snug text-neutral-500 wrap-break-word">{title}</p>}
                    </div>
                    {contacts.length > 0 && (
                        <ul className="flex max-w-[62%] shrink-0 flex-col items-end gap-[2px] pt-[3px] text-right text-[12.5px] leading-snug text-neutral-600">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="max-w-full">
                                    <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-(--accent)" className="wrap-anywhere" />
                                </li>
                            ))}
                        </ul>
                    )}
                </header>
            )}

            {summary && (
                <Section title="Summary">
                    <Row>
                        <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                    </Row>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => (
                        <Row key={exp.id} left={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}>
                            <p className="text-[14px] leading-snug wrap-break-word">
                                {exp.role.trim() && <span className="font-semibold text-neutral-950">{exp.role}</span>}
                                {exp.role.trim() && exp.company.trim() && ', '}
                                {exp.company.trim() && <span className="italic text-neutral-700">{exp.company}</span>}
                            </p>
                            <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </Row>
                    ))}
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => (
                        <Row key={edu.id} left={[yearOf(edu.startDate), yearOf(edu.endDate)].filter(Boolean).join('–')}>
                            <p className="text-[14px] leading-snug wrap-break-word">
                                {edu.degree.trim() && <span className="font-semibold text-neutral-950">{edu.degree}</span>}
                                {edu.degree.trim() && edu.school.trim() && ', '}
                                {edu.school.trim() && <span className="italic text-neutral-700">{edu.school}</span>}
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {publications.length > 0 && (
                <Section title="Publications">
                    {publications.map((pub) => (
                        <Row key={pub.id} left={pub.year}>
                            <p className={bodyText}>
                                <Citation pub={{ ...pub, year: '' }} owner={data.fullName} />
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {awards.length > 0 && (
                <Section title="Grants and awards">
                    {awards.map((award) => (
                        <Row key={award.id} left={award.year}>
                            <p className={bodyText}>
                                <AwardLine award={award} showYear={false} />
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {talks.length > 0 && (
                <Section title="Talks">
                    {talks.map((talk) => (
                        <Row key={talk.id} left={talk.year}>
                            <p className={bodyText}>
                                <TalkLine talk={talk} showYear={false} />
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {teaching.length > 0 && (
                <Section title="Teaching">
                    {teaching.map((entry) => (
                        <Row key={entry.id} left={entry.year}>
                            <p className={bodyText}>
                                <TeachingLine entry={entry} showYear={false} />
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <Row key={proj.id} left={proj.name}>
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[13px] italic text-neutral-600 wrap-anywhere hover:underline underline-offset-2">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className={bodyText} listClassName={listClass} />
                        </Row>
                    ))}
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.some((group) => group.category) ? (
                        skillGroups.map((group, index) => (
                            <Row key={index} left={group.category}>
                                <p className={bodyText}>{group.items.join(', ')}</p>
                            </Row>
                        ))
                    ) : (
                        <Row>
                            <p className={bodyText}>{skillGroups.flatMap((group) => group.items).join(', ')}</p>
                        </Row>
                    )}
                </Section>
            )}
        </div>
    );
};

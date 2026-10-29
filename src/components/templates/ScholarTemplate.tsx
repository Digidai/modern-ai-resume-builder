import React from 'react';
import { TemplateProps, AwardLine, Citation, TalkLine, ContactLink, RichText, displayUrl, formatDate, getContactEntries, groupSkills, toHref } from './shared';

// "Scholar": an academic CV for PhD students, postdocs and researchers. Source Serif, small-caps
// section headings over a hairline, and a left gutter that carries the years of each entry and the
// numbers of the publication list. Publications come right after education, numbered, with the
// owner's name in bold, followed by grants and awards and talks. Academic CVs run to several pages; entries never split across a page break.

const GUTTER = 'grid grid-cols-[22mm_minmax(0,1fr)] gap-x-[5mm]';
const bodyText = 'text-[14px] leading-[1.5] text-neutral-800 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[1px] marker:text-neutral-400';
const gutterText = 'pt-[1px] text-[13px] leading-snug text-neutral-600 tabular-nums wrap-break-word';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[8px] border-b border-(--accent)/40 pb-[2px] text-[17px] font-semibold tracking-[0.05em] text-(--accent) [font-variant-caps:small-caps] break-after-avoid">
            {title}
        </h2>
        <div className="flex flex-col gap-[9px]">{children}</div>
    </section>
);

/** Years: "2019–2024", "2021–present", or one year. */
const years = (start: string, end: string, isCurrent = false): string => {
    const year = (value: string) => {
        const formatted = formatDate(value);
        return /\d{4}$/.test(formatted) ? formatted.slice(-4) : formatted;
    };
    const from = year(start);
    const to = isCurrent ? 'present' : year(end);
    if (from && to && from !== to) return `${from}–${to}`;
    return from || to;
};

const Row: React.FC<{ gutter?: string; children: React.ReactNode }> = ({ gutter, children }) => (
    <div className={`${GUTTER} break-inside-avoid`}>
        <div className={gutterText}>{gutter}</div>
        <div className="min-w-0">{children}</div>
    </div>
);

export const ScholarTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const publications = data.publications ?? [];
    const awards = data.awards ?? [];
    const talks = data.talks ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[18px] bg-white px-[18mm] py-[16mm] font-source-serif text-neutral-900 [--accent:var(--rs-accent,#2B3A55)]">
            {(name || title || contacts.length > 0) && (
                <header className="break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[30px] font-semibold leading-[1.1] tracking-[-0.005em] text-neutral-950 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[3px] text-[16px] italic leading-snug text-neutral-700 wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <ul className="mt-[9px] grid grid-cols-2 gap-x-[8mm] gap-y-[2px] text-[13px] leading-snug text-neutral-700">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="min-w-0">
                                    <span className="text-neutral-500">{entry.label}: </span>
                                    <ContactLink entry={entry} className="wrap-anywhere" />
                                </li>
                            ))}
                        </ul>
                    )}
                </header>
            )}

            {summary && (
                <Section title="Research interests">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => {
                        const heading = edu.degree.trim() || edu.school.trim();
                        const school = edu.degree.trim() ? edu.school.trim() : '';
                        return (
                            <Row key={edu.id} gutter={years(edu.startDate, edu.endDate)}>
                                {heading && <h3 className="text-[14.5px] font-semibold leading-snug text-neutral-950 wrap-break-word">{heading}</h3>}
                                {school && <p className="text-[14px] italic leading-snug text-neutral-700 wrap-break-word">{school}</p>}
                            </Row>
                        );
                    })}
                </Section>
            )}

            {publications.length > 0 && (
                <Section title="Publications">
                    {publications.map((pub, index) => (
                        <Row key={pub.id} gutter={`[${index + 1}]`}>
                            <p className={bodyText}>
                                <Citation pub={pub} owner={data.fullName} linkClassName="text-(--accent) wrap-anywhere hover:underline underline-offset-2" />
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {awards.length > 0 && (
                <Section title="Grants and awards">
                    {awards.map((award) => (
                        <Row key={award.id} gutter={award.year}>
                            <p className={bodyText}>
                                <AwardLine award={award} showYear={false} titleClassName="font-semibold text-neutral-950" />
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {talks.length > 0 && (
                <Section title="Talks">
                    {talks.map((talk) => (
                        <Row key={talk.id} gutter={talk.year}>
                            <p className={bodyText}>
                                <TalkLine talk={talk} showYear={false} />
                            </p>
                        </Row>
                    ))}
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => {
                        const heading = exp.role.trim() || exp.company.trim();
                        const company = exp.role.trim() ? exp.company.trim() : '';
                        return (
                            <Row key={exp.id} gutter={years(exp.startDate, exp.endDate, exp.isCurrent)}>
                                {heading && <h3 className="text-[14.5px] font-semibold leading-snug text-neutral-950 wrap-break-word">{heading}</h3>}
                                {company && <p className="text-[14px] italic leading-snug text-neutral-700 wrap-break-word">{company}</p>}
                                <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </Row>
                        );
                    })}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <Row key={proj.id}>
                            {proj.name.trim() && <h3 className="text-[14.5px] font-semibold leading-snug text-neutral-950 wrap-break-word">{proj.name}</h3>}
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className={`mt-[2px] ${bodyText}`} listClassName={listClass} />
                        </Row>
                    ))}
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.map((group, index) => (
                        <Row key={index} gutter={group.category}>
                            <p className={bodyText}>{group.items.join(', ')}</p>
                        </Row>
                    ))}
                </Section>
            )}
        </div>
    );
};

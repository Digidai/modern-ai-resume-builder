import React from 'react';
import { TemplateProps, AwardLine, ContactLink, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Capital": the banking and finance resume (the format of the big investment banks and consultancies)
// with a small photo for London, Frankfurt, Zurich, Hong Kong and Singapore applications. Times, the
// name in capitals with one line of contacts, then Education first, dense sections under a hairline:
// firm in bold with the dates on the right, the role in italics below.

const bodyText = 'text-[13.5px] leading-[1.42] text-neutral-900 wrap-break-word';
const listClass = 'list-disc pl-[1.15em] space-y-0 marker:text-neutral-900';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[6px] border-b border-neutral-900 pb-[1px] text-[14.5px] font-bold uppercase tracking-[0.06em] text-(--accent) break-after-avoid">{title}</h2>
        <div className="flex flex-col gap-[8px]">{children}</div>
    </section>
);

const Line: React.FC<{ left: React.ReactNode; right?: string; italic?: boolean }> = ({ left, right, italic }) => (
    <div className={`flex items-baseline justify-between gap-4 ${italic ? 'italic' : ''}`}>
        <div className="min-w-0 text-[14px] leading-snug wrap-break-word">{left}</div>
        {right && <span className="shrink-0 whitespace-nowrap text-[13.5px] tabular-nums">{right}</span>}
    </div>
);

export const CapitalTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const awards = data.awards ?? [];
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[13px] bg-white px-[15mm] py-[13mm] font-tinos text-neutral-900 [--accent:var(--rs-accent,#0B2545)]">
            <header className="flex items-center gap-[6mm] break-inside-avoid">
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="text-[27px] font-bold uppercase leading-[1.1] tracking-[0.06em] text-(--accent) wrap-break-word">{name}</div>}
                    {title && <p className="mt-[2px] text-[15px] italic leading-snug text-neutral-800 wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <p className="mt-[6px] text-[13px] leading-[1.5] text-neutral-800">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    {index > 0 && <span aria-hidden className="text-neutral-400"> | </span>}
                                    <span className="inline-block max-w-full align-top">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                    </span>
                                </React.Fragment>
                            ))}
                        </p>
                    )}
                </div>
                <Portrait
                    data={data}
                    className="h-[32mm] w-[24mm] border border-neutral-300"
                    fallbackClassName="bg-neutral-100 text-[24px] font-bold text-(--accent)"
                />
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
                            <Line left={<span className="font-bold">{edu.school}</span>} right={formatDateRange(edu.startDate, edu.endDate)} />
                            {edu.degree.trim() && <Line italic left={edu.degree} />}
                        </article>
                    ))}
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => {
                        const firm = exp.company.trim() || exp.role.trim();
                        const role = exp.company.trim() ? exp.role.trim() : '';
                        return (
                            <article key={exp.id} className="break-inside-avoid">
                                <Line left={<span className="font-bold">{firm}</span>} right={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                {role && <Line italic left={role} />}
                                <RichText text={exp.description} className={`mt-[2px] ${bodyText}`} listClassName={listClass} />
                            </article>
                        );
                    })}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects and Transactions">
                    {data.projects.map((proj) => (
                        <article key={proj.id} className="break-inside-avoid">
                            <Line
                                left={
                                    <>
                                        {proj.name.trim() && <span className="font-bold">{proj.name}</span>}
                                        {proj.name.trim() && proj.link.trim() && ', '}
                                        {proj.link.trim() && (
                                            <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="italic wrap-anywhere underline-offset-2 hover:underline">
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                    </>
                                }
                            />
                            <RichText text={proj.description} className={`mt-[2px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {awards.length > 0 && (
                <Section title="Honors and Awards">
                    <ul className={`${listClass} ${bodyText}`}>
                        {awards.map((award) => (
                            <li key={award.id} className="break-inside-avoid">
                                <AwardLine award={award} titleClassName="font-bold" />
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills and Interests">
                    <div className="flex flex-col gap-[2px]">
                        {skillGroups.map((group, index) => (
                            <p key={index} className={`${bodyText} break-inside-avoid`}>
                                {group.category && <span className="font-bold">{group.category}: </span>}
                                {group.items.join(', ')}
                            </p>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

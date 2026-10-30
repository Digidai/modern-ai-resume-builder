import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Standard", after Gayle Laakmann McDowell's resume format (CareerCup, "Cracking the Coding
// Interview"), long recommended by tech recruiters: Times throughout, a large small-caps name
// centred over one line of contacts, bold small-caps section titles over a full-width rule, and
// entry headers in three parts: organisation (bold) on the left, role (italic) in the centre,
// dates on the right. Dense, black and white, one column.

const bodyText = 'text-[14px] leading-[1.38] text-black wrap-break-word';
const listClass = 'list-disc pl-[1.15em] space-y-[0.5px] marker:text-black';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="mb-[6px] border-b border-(--accent) pb-[1px] text-[16px] font-bold tracking-[0.03em] text-(--accent) [font-variant-caps:small-caps] break-after-avoid">{title}</h2>
        <div className="flex flex-col gap-[8px]">{children}</div>
    </section>
);

/** Left (bold), centre (italic), right (dates). Firm and dates take their natural width; the role gets the rest. */
const EntryHead: React.FC<{ left: string; center?: string; right?: string; href?: string }> = ({ left, center, right, href }) => (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-[4mm] text-[14px] leading-snug">
        <p className="min-w-0 max-w-[80mm] font-bold wrap-break-word">
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
                    {left}
                </a>
            ) : (
                left
            )}
        </p>
        <p className="min-w-0 text-center italic wrap-break-word">{center}</p>
        <p className="text-right tabular-nums whitespace-nowrap">{right}</p>
    </div>
);

export const StandardTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[13px] bg-white px-[14mm] py-[13mm] font-tinos text-black [--accent:var(--rs-accent,#111111)]">
            {(name || title || contacts.length > 0) && (
                <header className="text-center break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[32px] font-bold leading-[1.05] tracking-[0.02em] [font-variant-caps:small-caps] wrap-break-word">{name}</div>}
                    {title && <p className="mt-[2px] text-[15px] italic leading-snug wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <p className="mt-[4px] text-[13.5px] leading-[1.5]">
                            {contacts.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    <span className="inline-block max-w-full">
                                        <ContactLink entry={entry} className="wrap-anywhere" />
                                        {index < contacts.length - 1 && <span aria-hidden className="mx-[8px]">•</span>}
                                    </span>{' '}
                                </React.Fragment>
                            ))}
                        </p>
                    )}
                </header>
            )}

            {summary && (
                <Section title="Summary">
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.education.length > 0 && data.experience.length === 0 && <EducationSection data={data} />}

            {data.experience.length > 0 && (
                <Section title="Experience">
                    {data.experience.map((exp) => (
                        <article key={exp.id} className="break-inside-avoid">
                            <EntryHead left={exp.company.trim() || exp.role.trim()} center={exp.company.trim() ? exp.role.trim() : ''} right={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                            <RichText text={exp.description} className={`mt-[2px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <article key={proj.id} className="break-inside-avoid">
                            <EntryHead left={proj.name.trim()} center={proj.link.trim() ? displayUrl(proj.link) : ''} href={proj.link.trim() ? toHref(proj.link) : undefined} />
                            <RichText text={proj.description} className={`mt-[2px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {data.education.length > 0 && data.experience.length > 0 && <EducationSection data={data} />}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    <ul className="flex flex-col gap-[2px]">
                        {skillGroups.map((group, index) => (
                            <li key={index} className={bodyText}>
                                {group.category && <span className="font-bold">{group.category}: </span>}
                                {group.items.join(', ')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
};

const EducationSection: React.FC<{ data: TemplateProps['data'] }> = ({ data }) => (
    <Section title="Education">
        {data.education.map((edu) => (
            <article key={edu.id} className="break-inside-avoid">
                <EntryHead left={edu.school.trim() || edu.degree.trim()} center={edu.school.trim() ? edu.degree.trim() : ''} right={formatDateRange(edu.startDate, edu.endDate)} />
            </article>
        ))}
    </Section>
);

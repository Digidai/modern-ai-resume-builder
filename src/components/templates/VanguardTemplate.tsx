import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Awesome" archetype: Roboto header with light first name / bold last name, headings whose first
// three letters carry the accent with a rule filling the line, and two-row entries with dates right.

const SMALL_CAPS = '[font-variant-caps:small-caps]';

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="mb-[2.5mm] flex items-center gap-3 break-after-avoid font-roboto text-[21px] font-bold leading-tight text-[#333333]">
        <span className="shrink-0">
            <span className="text-(--accent)">{title.slice(0, 3)}</span>
            {title.slice(3)}
        </span>
        <span aria-hidden className="h-[1.2px] min-w-6 flex-1 bg-[#5D5D5D]" />
    </h2>
);

/** Row 1: organisation (bold) with an optional accent detail on the right; row 2: role in small caps, dates right. */
const EntryHeader: React.FC<{ title: string; aside?: React.ReactNode; subtitle?: string; dates?: string }> = ({ title, aside, subtitle, dates }) => (
    <>
        {(title || aside) && (
            <div className="flex items-baseline justify-between gap-4">
                <h3 className="min-w-0 text-[15px] font-bold leading-snug text-[#414141] wrap-break-word">{title}</h3>
                {aside}
            </div>
        )}
        {(subtitle || dates) && (
            <div className="flex items-baseline justify-between gap-4 text-[#5D5D5D]">
                <span className={`min-w-0 text-[14.5px] font-semibold leading-snug tracking-[0.02em] text-(--accent) wrap-break-word ${SMALL_CAPS}`}>{subtitle}</span>
                {dates && <span className="shrink-0 whitespace-nowrap text-[13px] italic tabular-nums">{dates}</span>}
            </div>
        )}
    </>
);

const bodyText = 'mt-1.5 text-[13.5px] leading-[1.45] text-[#333333] wrap-break-word';
const bodyList = 'list-disc pl-[2ex] space-y-0.5 text-justify marker:text-[#5D5D5D]';

export const VanguardTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const location = contacts.find((entry) => entry.key === 'location');
    const links = contacts.filter((entry) => entry.key !== 'location');
    const skillGroups = groupSkills(data.skills);

    const name = data.fullName.trim();
    const split = name.lastIndexOf(' ');
    const firstName = split > 0 ? name.slice(0, split) : '';
    const lastName = split > 0 ? name.slice(split + 1) : name;

    return (
        <div className="flex flex-1 flex-col px-[18mm] pt-[14mm] pb-[15mm] font-source-sans text-[#333333] [--accent:var(--rs-accent,#C62828)]">
            <header className="mb-[6mm] text-center">
                {name && (
                    <h1 className="font-roboto text-[42px] leading-[1.1] text-[#333333] wrap-break-word">
                        {firstName && <span className="font-light text-[#5D5D5D]">{firstName} </span>}
                        <span className="font-bold">{lastName}</span>
                    </h1>
                )}
                {data.title.trim() && (
                    <p className="mt-2 font-roboto text-[13px] font-medium uppercase tracking-[0.14em] text-(--accent) wrap-break-word">{data.title}</p>
                )}
                {location && <p className="mt-1.5 text-[13px] italic text-[#666666] wrap-break-word">{location.value}</p>}
                {links.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[12.5px] text-[#5D5D5D]">
                        {links.map((entry) => (
                            <ContactItem key={entry.key} entry={entry} iconClassName="w-3 h-3 text-(--accent)" />
                        ))}
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-[4mm]">
                {data.summary.trim() && (
                    <section>
                        <SectionTitle title="Summary" />
                        <p className="text-justify text-[13.5px] leading-[1.5] text-[#333333] wrap-break-word">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <SectionTitle title="Experience" />
                        <div className="flex flex-col gap-3">
                            {data.experience.map((exp) => {
                                const company = exp.company.trim();
                                return (
                                    <article key={exp.id} className="break-inside-avoid">
                                        <EntryHeader
                                            title={company || exp.role.trim()}
                                            subtitle={company ? exp.role.trim() : ''}
                                            dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                                        />
                                        <RichText text={exp.description} className={bodyText} listClassName={bodyList} />
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <SectionTitle title="Projects" />
                        <div className="flex flex-col gap-2.5">
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="break-inside-avoid">
                                    <EntryHeader
                                        title={proj.name.trim()}
                                        aside={
                                            proj.link.trim() ? (
                                                <a
                                                    href={toHref(proj.link)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="min-w-0 max-w-[55%] text-right text-[13px] italic text-(--accent) wrap-anywhere hover:underline underline-offset-2"
                                                >
                                                    {displayUrl(proj.link)}
                                                </a>
                                            ) : undefined
                                        }
                                    />
                                    <RichText text={proj.description} className={bodyText} listClassName={bodyList} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <SectionTitle title="Education" />
                        <div className="flex flex-col gap-2.5">
                            {data.education.map((edu) => {
                                const school = edu.school.trim();
                                return (
                                    <article key={edu.id} className="break-inside-avoid">
                                        <EntryHeader
                                            title={school || edu.degree.trim()}
                                            subtitle={school ? edu.degree.trim() : ''}
                                            dates={formatDateRange(edu.startDate, edu.endDate)}
                                        />
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section className="break-inside-avoid">
                        <SectionTitle title="Skills" />
                        <dl className="grid grid-cols-[fit-content(32%)_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13.5px] leading-[1.45]">
                            {skillGroups.map((group, index) => (
                                <React.Fragment key={index}>
                                    <dt className="text-right font-bold text-[#414141] wrap-break-word">{group.category || 'Skills'}</dt>
                                    <dd className="text-[#333333] wrap-break-word">{group.items.join(', ')}</dd>
                                </React.Fragment>
                            ))}
                        </dl>
                    </section>
                )}
            </div>
        </div>
    );
};

import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Deedy" two-column archetype: big centred Lato name (lighter first name), Raleway meta lines,
// a full-bleed hairline, then a 33/66 grid. The main column comes first in the DOM and is placed
// on the right with grid placement, so text extraction reads Summary/Experience before the sidebar.

const SMALL_CAPS = '[font-variant-caps:small-caps]';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-2 break-after-avoid text-[21px] font-light uppercase leading-tight tracking-[0.04em] text-(--accent)">{children}</h2>
);

const bodyText = 'text-[13.5px] leading-[1.45] text-[#2B2B2B] wrap-break-word';
const bodyList = 'list-disc pl-4 space-y-[1.5px] marker:text-[#6A6A6A]';

export const DuoTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const headerContacts = contacts.filter((entry) => entry.key === 'email' || entry.key === 'phone' || entry.key === 'location');
    const links = contacts.filter((entry) => entry.key === 'website' || entry.key === 'linkedin' || entry.key === 'link');
    const skillGroups = groupSkills(data.skills);

    const name = data.fullName.trim();
    const split = name.lastIndexOf(' ');
    const firstName = split > 0 ? name.slice(0, split) : '';
    const lastName = split > 0 ? name.slice(split + 1) : name;

    const hasMain = Boolean(data.summary.trim()) || data.experience.length > 0 || data.projects.length > 0;
    const hasSide = data.education.length > 0 || skillGroups.length > 0 || links.length > 0;
    const hasHeader = Boolean(name || data.title.trim() || headerContacts.length);

    return (
        <div className="flex flex-1 flex-col px-[13mm] pt-[11mm] pb-[12mm] font-lato text-[#2B2B2B] [--accent:var(--rs-accent,#3B3F45)]">
            {hasHeader && (
                <header className="-mx-[13mm] mb-[6mm] border-b border-(--accent)/40 px-[13mm] pb-[4mm] text-center">
                    {name && (
                        <div role="heading" aria-level={1} className="text-[52px] leading-[1.15] text-[#2B2B2B] wrap-break-word">
                            {firstName && <span className="font-light">{firstName} </span>}
                            <span className="font-normal">{lastName}</span>
                        </div>
                    )}
                    {data.title.trim() && (
                        <p className="mt-1 font-raleway text-[14px] font-medium uppercase tracking-[0.16em] text-(--accent) wrap-break-word">{data.title}</p>
                    )}
                    {headerContacts.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-7 gap-y-0.5 font-raleway text-[14px] font-medium text-[#5F5F5F]">
                            {headerContacts.map((entry) => (
                                <ContactLink key={entry.id} entry={entry} className="min-w-0 wrap-anywhere" />
                            ))}
                        </div>
                    )}
                </header>
            )}

            {(hasMain || hasSide) && (
                <div className="grid grid-cols-[minmax(0,33fr)_minmax(0,66fr)] gap-x-[7mm]">
                    {hasMain && (
                        <main className={`${hasSide ? 'col-start-2' : 'col-span-2'} row-start-1 flex min-w-0 flex-col gap-[5mm]`}>
                            {data.summary.trim() && (
                                <section>
                                    <SectionTitle>Summary</SectionTitle>
                                    <p className={bodyText}>{data.summary}</p>
                                </section>
                            )}

                            {data.experience.length > 0 && (
                                <section>
                                    <SectionTitle>Experience</SectionTitle>
                                    <div className="flex flex-col gap-3.5">
                                        {data.experience.map((exp) => {
                                            const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                            const company = exp.company.trim();
                                            const role = exp.role.trim();
                                            return (
                                                <article key={exp.id} className="break-inside-avoid">
                                                    {(company || role) && (
                                                        <h3 className="leading-snug wrap-break-word">
                                                            {company && <span className="text-[15.5px] font-bold uppercase tracking-[0.02em] text-[#333333]">{company}</span>}
                                                            {company && role && <span aria-hidden className="px-1.5 font-raleway text-[14.5px] text-[#8A8A8A]">|</span>}
                                                            {role && <span className={`font-raleway text-[14.5px] font-medium text-[#444444] ${SMALL_CAPS}`}>{role}</span>}
                                                        </h3>
                                                    )}
                                                    {dates && <div className="mt-0.5 font-raleway text-[13px] font-medium tabular-nums text-[#666666]">{dates}</div>}
                                                    <RichText text={exp.description} className={`mt-1.5 ${bodyText}`} listClassName={bodyList} />
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {data.projects.length > 0 && (
                                <section>
                                    <SectionTitle>Projects</SectionTitle>
                                    <div className="flex flex-col gap-3">
                                        {data.projects.map((proj) => (
                                            <article key={proj.id} className="break-inside-avoid">
                                                {proj.name.trim() && <h3 className="text-[15.5px] font-bold uppercase leading-snug tracking-[0.02em] text-[#333333] wrap-break-word">{proj.name}</h3>}
                                                {proj.link.trim() && (
                                                    <a
                                                        href={toHref(proj.link)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-0.5 block font-raleway text-[13px] font-medium text-[#666666] wrap-anywhere hover:underline underline-offset-2"
                                                    >
                                                        {displayUrl(proj.link)}
                                                    </a>
                                                )}
                                                <RichText text={proj.description} className={`mt-1.5 ${bodyText}`} listClassName={bodyList} />
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </main>
                    )}

                    {hasSide && (
                        <aside className={`${hasMain ? 'col-start-1' : 'col-span-2'} row-start-1 flex min-w-0 flex-col gap-[5mm]`}>
                            {data.education.length > 0 && (
                                <section>
                                    <SectionTitle>Education</SectionTitle>
                                    <div className="flex flex-col gap-3">
                                        {data.education.map((edu) => {
                                            const dates = formatDateRange(edu.startDate, edu.endDate);
                                            return (
                                                <article key={edu.id} className="break-inside-avoid">
                                                    {edu.school.trim() && <h3 className="text-[14px] font-bold uppercase leading-snug tracking-[0.02em] text-[#333333] wrap-break-word">{edu.school}</h3>}
                                                    {edu.degree.trim() && <p className="mt-0.5 text-[13.5px] leading-snug text-[#2B2B2B] wrap-break-word">{edu.degree}</p>}
                                                    {dates && <p className="mt-0.5 font-raleway text-[13px] font-medium tabular-nums text-[#666666]">{dates}</p>}
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {skillGroups.length > 0 && (
                                <section>
                                    <SectionTitle>Skills</SectionTitle>
                                    <div className="flex flex-col gap-2.5">
                                        {skillGroups.map((group, index) => (
                                            <div key={index} className="break-inside-avoid">
                                                {group.category && <h3 className="mb-0.5 text-[14px] font-bold uppercase tracking-[0.02em] text-[#333333] wrap-break-word">{group.category}</h3>}
                                                <p className="text-[13.5px] leading-[1.6] text-[#2B2B2B] wrap-break-word">
                                                    {group.items.map((item, itemIndex) => (
                                                        <React.Fragment key={itemIndex}>
                                                            {item}
                                                            {itemIndex < group.items.length - 1 && <span aria-hidden className="pl-1.5 pr-0.5 text-[#8A8A8A]">•</span>}{' '}
                                                        </React.Fragment>
                                                    ))}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {links.length > 0 && (
                                <section className="break-inside-avoid">
                                    <SectionTitle>Links</SectionTitle>
                                    <dl className="flex flex-col gap-2">
                                        {links.map((entry) => (
                                            <div key={entry.id}>
                                                <dt className="text-[14px] font-bold uppercase tracking-[0.02em] text-[#333333]">{entry.label}</dt>
                                                <dd className="font-raleway text-[13px] font-medium text-[#555555]">
                                                    <ContactLink entry={entry} className="wrap-anywhere" />
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </section>
                            )}
                        </aside>
                    )}
                </div>
            )}
        </div>
    );
};

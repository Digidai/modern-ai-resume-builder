import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Linen", after the beige minimalist photo resume that is the most used design on Canva: warm paper,
// a round photo beside a large serif name, then a narrow left column (contact, education, skills)
// and a main column whose experience hangs off a thin vertical timeline. Both columns are
// `.page-frame`s, so the paper colour and margins continue on every printed page.

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-[10px] border-b border-(--accent)/35 pb-[4px] text-[13.5px] font-bold uppercase tracking-[0.08em] text-(--accent) break-after-avoid">{children}</h2>
);

const bodyText = 'text-[13.5px] leading-[1.5] text-[#4A4038] wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)/70';

export const LinenTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col bg-[#F6F1EA] font-lato text-[#2F2924] [--accent:var(--rs-accent,#866747)] print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
            <header className="flex items-center gap-[8mm] px-[15mm] pt-[14mm] pb-[8mm] break-inside-avoid">
                <Portrait
                    data={data}
                    className="h-[36mm] w-[36mm] rounded-full ring-[5px] ring-white"
                    fallbackClassName="bg-(--accent) font-playfair text-[38px] font-semibold text-white"
                />
                <div className="min-w-0 flex-1">
                    {name && <div role="heading" aria-level={1} className="font-playfair text-[38px] font-semibold leading-[1.05] text-[#2F2924] wrap-break-word">{name}</div>}
                    {title && <p className="mt-[8px] text-[14px] font-semibold uppercase leading-snug tracking-[0.08em] text-(--accent) wrap-break-word">{title}</p>}
                </div>
            </header>

            <div className="flex flex-1 flex-row">
                <aside className="page-frame flex w-[62mm] shrink-0 flex-col gap-[20px] bg-[#F6F1EA] pt-[8mm] pr-[7mm] pb-[12mm] pl-[15mm]">
                    {contacts.length > 0 && (
                        <section>
                            <Heading>Contact</Heading>
                            <div className="flex flex-col gap-[7px] text-[12.5px] leading-snug text-[#4A4038]">
                                {contacts.map((entry) => (
                                    <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" fit />
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <Heading>Education</Heading>
                            <div className="flex flex-col gap-[10px]">
                                {data.education.map((edu) => {
                                    const heading = edu.degree.trim() || edu.school.trim();
                                    const school = edu.degree.trim() ? edu.school.trim() : '';
                                    const dates = formatDateRange(edu.startDate, edu.endDate);
                                    return (
                                        <article key={edu.id} className="break-inside-avoid">
                                            {heading && <h3 className="text-[13px] font-bold leading-snug text-[#2F2924] wrap-break-word">{heading}</h3>}
                                            {school && <p className="text-[12.5px] leading-snug text-[#4A4038] wrap-break-word">{school}</p>}
                                            {dates && <p className="mt-[2px] text-[12px] tabular-nums text-[#756B62]">{dates}</p>}
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {skillGroups.length > 0 && (
                        <section>
                            <Heading>Skills</Heading>
                            <div className="flex flex-col gap-[9px]">
                                {skillGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="break-inside-avoid">
                                        {group.category && <h3 className="mb-[3px] text-[12.5px] font-bold text-[#2F2924] wrap-break-word">{group.category}</h3>}
                                        <ul className={`text-[12.5px] leading-snug text-[#4A4038] ${listClass}`}>
                                            {group.items.map((skill, index) => (
                                                <li key={index} className="wrap-anywhere">{skill}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>

                <div className="page-frame flex min-w-0 flex-1 flex-col gap-[18px] bg-[#F6F1EA] pt-[8mm] pr-[15mm] pb-[12mm] pl-[6mm]">
                    {summary && (
                        <section>
                            <Heading>Profile</Heading>
                            <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <Heading>Experience</Heading>
                            <div className="flex flex-col">
                                {data.experience.map((exp) => {
                                    const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                                    const heading = exp.role.trim() || exp.company.trim();
                                    const company = exp.role.trim() ? exp.company.trim() : '';
                                    return (
                                        <article key={exp.id} className="relative border-l border-(--accent)/35 pb-[12px] pl-[14px] break-inside-avoid last:pb-0">
                                            <span aria-hidden className="absolute top-[5px] -left-[5px] h-[9px] w-[9px] rounded-full border-[2px] border-(--accent) bg-[#F6F1EA]" />
                                            {dates && <p className="text-[12px] font-semibold uppercase tabular-nums tracking-[0.08em] text-(--accent)">{dates}</p>}
                                            {heading && <h3 className="text-[14.5px] font-bold leading-snug text-[#2F2924] wrap-break-word">{heading}</h3>}
                                            {company && <p className="text-[13px] italic text-[#6B5F55] wrap-break-word">{company}</p>}
                                            <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <Heading>Projects</Heading>
                            <div className="flex flex-col gap-[10px]">
                                {data.projects.map((proj) => (
                                    <article key={proj.id} className="break-inside-avoid">
                                        {proj.name.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-[#2F2924] wrap-break-word">{proj.name}</h3>}
                                        {proj.link.trim() && (
                                            <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                                {displayUrl(proj.link)}
                                            </a>
                                        )}
                                        <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

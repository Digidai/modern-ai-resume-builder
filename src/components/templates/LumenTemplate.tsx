import React from 'react';
import { BookIcon, BriefcaseIcon, CodeIcon, PenIcon, SparklesIcon } from '../Icons';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Lumen", after billryan/resume (one of the most used LaTeX resumes on GitHub, common in China
// and for English tech applications): a centred name over one line of icon contacts, section
// titles led by a small icon in the accent and underlined by a hairline, and entries with the
// organisation in bold and its dates flush right, the role in italic under it. One column, so
// applicant tracking systems read it in order; the icons are decorative and hidden from them.

const bodyText = 'text-[13.5px] leading-[1.48] text-neutral-800 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[1px] marker:text-(--accent)';

type SectionIcon = React.ComponentType<{ className?: string }>;

const Section: React.FC<{ title: string; icon: SectionIcon; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <section>
        <h2 className="mb-[8px] flex items-center gap-[7px] border-b border-neutral-300 pb-[3px] text-[16.5px] font-bold leading-tight text-neutral-900 break-after-avoid">
            <span aria-hidden="true" className="flex shrink-0">
                <Icon className="h-[15px] w-[15px] text-(--accent)" />
            </span>
            {title}
        </h2>
        <div className="flex flex-col gap-[10px]">{children}</div>
    </section>
);

const EntryHead: React.FC<{ title: string; subtitle?: string; dates?: string; href?: string }> = ({ title, subtitle, dates, href }) => (
    <>
        <div className="flex items-baseline justify-between gap-4">
            {title && (
                <h3 className="min-w-0 text-[14px] font-bold leading-snug text-neutral-950 wrap-break-word">
                    {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
                            {title}
                        </a>
                    ) : (
                        title
                    )}
                </h3>
            )}
            {dates && <span className="shrink-0 whitespace-nowrap text-[13px] tabular-nums text-neutral-600">{dates}</span>}
        </div>
        {subtitle && <p className="text-[13.5px] italic leading-snug text-neutral-700 wrap-break-word">{subtitle}</p>}
    </>
);

export const LumenTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[15px] bg-white px-[16mm] py-[14mm] font-source-sans text-neutral-900 [--accent:var(--rs-accent,#1F4E79)]">
            {(name || title || contacts.length > 0) && (
                <header className="text-center break-inside-avoid">
                    {name && <div role="heading" aria-level={1} className="text-[31px] font-bold leading-[1.1] text-neutral-950 wrap-break-word">{name}</div>}
                    {title && <p className="mt-[2px] text-[15px] leading-snug text-(--accent) wrap-break-word">{title}</p>}
                    {contacts.length > 0 && (
                        <ul className="mt-[7px] flex flex-wrap justify-center gap-x-[14px] gap-y-[3px] text-[13px] leading-snug text-neutral-700">
                            {contacts.map((entry) => (
                                <li key={entry.id} className="max-w-full">
                                    <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-(--accent)" />
                                </li>
                            ))}
                        </ul>
                    )}
                </header>
            )}

            {summary && (
                <Section title="Summary" icon={PenIcon}>
                    <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                </Section>
            )}

            {data.education.length > 0 && data.experience.length === 0 && <EducationSection data={data} />}

            {data.experience.length > 0 && (
                <Section title="Experience" icon={BriefcaseIcon}>
                    {data.experience.map((exp) => (
                        <article key={exp.id} className="break-inside-avoid">
                            <EntryHead title={exp.company.trim() || exp.role.trim()} subtitle={exp.company.trim() ? exp.role.trim() : ''} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                            <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects" icon={CodeIcon}>
                    {data.projects.map((proj) => (
                        <article key={proj.id} className="break-inside-avoid">
                            <EntryHead title={proj.name.trim()} subtitle={proj.link.trim() ? displayUrl(proj.link) : ''} href={proj.link.trim() ? toHref(proj.link) : undefined} />
                            <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </article>
                    ))}
                </Section>
            )}

            {data.education.length > 0 && data.experience.length > 0 && <EducationSection data={data} />}

            {skillGroups.length > 0 && (
                <Section title="Skills" icon={SparklesIcon}>
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
        </div>
    );
};

const EducationSection: React.FC<{ data: TemplateProps['data'] }> = ({ data }) => (
    <Section title="Education" icon={BookIcon}>
        {data.education.map((edu) => (
            <article key={edu.id} className="break-inside-avoid">
                <EntryHead title={edu.school.trim() || edu.degree.trim()} subtitle={edu.school.trim() ? edu.degree.trim() : ''} dates={formatDateRange(edu.startDate, edu.endDate)} />
            </article>
        ))}
    </Section>
);

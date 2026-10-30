import React from 'react';
import { TemplateProps, ContactItem, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// "Europa": modelled on the Europass CV used across the EU. A 3:4 photo beside the name and an
// icon contact list, then sections set on a two-column grid: a narrow left column for dates and
// labels (right-aligned, muted) and the content on the right, each section opened by an accent
// label and a hairline rule. Dates come first in the DOM, as on the Europass form.

const LABEL = 'text-right text-[12.5px] leading-snug text-slate-500 tabular-nums wrap-break-word';
const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-(--accent)/70';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="flex flex-col gap-[10px]">
        <h2 className="grid grid-cols-[36mm_minmax(0,1fr)] items-center gap-x-[6mm] break-after-avoid">
            <span className="text-right text-[13px] font-bold uppercase tracking-[0.12em] text-(--accent)">{title}</span>
            <span aria-hidden className="h-[1.5px] bg-(--accent)/70" />
        </h2>
        {children}
    </section>
);

/** One row: a label or dates on the left, content on the right. */
const Row: React.FC<{ label?: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-[36mm_minmax(0,1fr)] gap-x-[6mm] break-inside-avoid">
        <div className={`${LABEL} pt-[2px]`}>{label}</div>
        <div className="min-w-0">{children}</div>
    </div>
);

export const EuropaTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();

    return (
        <div className="flex flex-1 flex-col gap-[18px] bg-white px-[14mm] pt-[13mm] pb-[12mm] font-source-sans text-slate-800 [--accent:var(--rs-accent,#1D4F91)]">
            {(name || title || contacts.length > 0) && (
                <header className="flex items-stretch gap-[6mm] break-inside-avoid">
                    <Portrait
                        data={data}
                        className="h-[40mm] w-[30mm] rounded-[2px] border border-slate-200"
                        fallbackClassName="bg-(--accent)/10 text-[30px] font-semibold tracking-[0.04em] text-(--accent)"
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                        {name && <div role="heading" aria-level={1} className="text-[31px] font-bold leading-[1.1] text-slate-900 wrap-break-word">{name}</div>}
                        {title && <p className="mt-[4px] text-[16px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>}
                        {contacts.length > 0 && (
                            <div className="mt-[10px] grid grid-cols-2 gap-x-[6mm] gap-y-[4px] border-t border-slate-200 pt-[9px] text-[13px] text-slate-700">
                                {contacts.map((entry) => (
                                    <ContactItem key={entry.id} entry={entry} iconClassName="h-[13px] w-[13px] text-(--accent)" fit />
                                ))}
                            </div>
                        )}
                    </div>
                </header>
            )}

            {summary && (
                <Section title="About me">
                    <Row>
                        <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                    </Row>
                </Section>
            )}

            {data.experience.length > 0 && (
                <Section title="Work experience">
                    {data.experience.map((exp) => {
                        const heading = exp.role.trim() || exp.company.trim();
                        const company = exp.role.trim() ? exp.company.trim() : '';
                        return (
                            <Row key={exp.id} label={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}>
                                {heading && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                {company && <p className="text-[13.5px] font-semibold leading-snug text-(--accent) wrap-break-word">{company}</p>}
                                <RichText text={exp.description} className={`mt-[4px] ${bodyText}`} listClassName={listClass} />
                            </Row>
                        );
                    })}
                </Section>
            )}

            {data.education.length > 0 && (
                <Section title="Education">
                    {data.education.map((edu) => {
                        const heading = edu.degree.trim() || edu.school.trim();
                        const school = edu.degree.trim() ? edu.school.trim() : '';
                        return (
                            <Row key={edu.id} label={formatDateRange(edu.startDate, edu.endDate)}>
                                {heading && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>}
                                {school && <p className="text-[13.5px] leading-snug text-slate-700 wrap-break-word">{school}</p>}
                            </Row>
                        );
                    })}
                </Section>
            )}

            {skillGroups.length > 0 && (
                <Section title="Skills">
                    {skillGroups.map((group, index) => (
                        <Row key={index} label={group.category}>
                            <p className={bodyText}>{group.items.join(' · ')}</p>
                        </Row>
                    ))}
                </Section>
            )}

            {data.projects.length > 0 && (
                <Section title="Projects">
                    {data.projects.map((proj) => (
                        <Row key={proj.id}>
                            {proj.name.trim() && <h3 className="text-[15px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </Row>
                    ))}
                </Section>
            )}
        </div>
    );
};

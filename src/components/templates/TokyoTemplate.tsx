import React from 'react';
import { TemplateProps, ContactLink, Portrait, RichText, displayUrl, formatDate, getContactEntries, groupSkills, toHref } from './shared';

// "Tokyo": inspired by the Japanese rirekisho form. A ruled header table with small field labels
// and a 3×4 photo box on the right, then every section is a bordered table: a tinted heading bar,
// a narrow date column (start → end on two lines, as on the form) and the entry on the right.

const CELL_LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500';
const bodyText = 'text-[13.5px] leading-[1.5] text-slate-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[2px] marker:text-slate-400';
const RULE = 'border-slate-400';

/** A bordered table section with a tinted heading bar; rows draw their own top rule. */
const Table: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className={`border ${RULE}`}>
        <h2 className={`flex items-center gap-[8px] border-b ${RULE} bg-(--accent)/7 px-[10px] py-[5px] text-[13px] font-bold uppercase tracking-[0.16em] text-slate-900 break-after-avoid`}>
            <span aria-hidden className="h-[11px] w-[3px] bg-(--accent)" />
            {title}
        </h2>
        <div className="divide-y divide-slate-300">{children}</div>
    </section>
);

/** Dates (start over end) in the left column, content on the right. */
const Row: React.FC<{ start?: string; end?: string; label?: string; children: React.ReactNode }> = ({ start, end, label, children }) => (
    <div className="grid grid-cols-[30mm_minmax(0,1fr)] break-inside-avoid">
        <div className={`border-r ${RULE} px-[10px] py-[5px] text-[12.5px] leading-snug text-slate-600 tabular-nums wrap-break-word`}>
            {label !== undefined ? label : (
                <>
                    {start && <div>{start}</div>}
                    {end && <div>{start ? '– ' : ''}{end}</div>}
                </>
            )}
        </div>
        <div className="min-w-0 px-[12px] py-[5px]">{children}</div>
    </div>
);

export const TokyoTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const name = data.fullName.trim();
    const title = data.title.trim();
    const summary = data.summary.trim();
    const hasPhoto = Boolean(data.photo || name);

    return (
        <div className="flex flex-1 flex-col gap-[12px] bg-white px-[13mm] pt-[12mm] pb-[11mm] font-sans text-slate-800 [--accent:var(--rs-accent,#A3243A)]">
            {(name || title || contacts.length > 0) && (
                <header className="flex flex-col gap-[6px] break-inside-avoid">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-(--accent)">Résumé</p>
                    <div className={`flex border ${RULE}`}>
                        <div className={`min-w-0 flex-1 divide-y divide-slate-300 ${hasPhoto ? `border-r ${RULE}` : ''}`}>
                            {name && (
                                <div className="px-[12px] pt-[6px] pb-[8px]">
                                    <p className={CELL_LABEL}>Name</p>
                                    <div role="heading" aria-level={1} className="mt-[2px] text-[29px] font-bold leading-[1.1] tracking-[0.01em] text-slate-900 wrap-break-word">{name}</div>
                                </div>
                            )}
                            {title && (
                                <div className="px-[12px] py-[6px]">
                                    <p className={CELL_LABEL}>Position</p>
                                    <p className="mt-[1px] text-[15px] font-semibold leading-snug text-(--accent) wrap-break-word">{title}</p>
                                </div>
                            )}
                            {contacts.length > 0 && (
                                <dl className="grid grid-cols-[24mm_minmax(0,1fr)] text-[13px] leading-snug">
                                    {contacts.map((entry, index) => (
                                        <React.Fragment key={entry.id}>
                                            <dt className={`${CELL_LABEL} border-r border-slate-300 px-[12px] py-[3px] leading-[1.7] ${index ? 'border-t' : ''}`}>{entry.label}</dt>
                                            <dd className={`min-w-0 border-slate-300 px-[10px] py-[3px] text-slate-800 ${index ? 'border-t' : ''}`}>
                                                <ContactLink entry={entry} className="wrap-anywhere" />
                                            </dd>
                                        </React.Fragment>
                                    ))}
                                </dl>
                            )}
                        </div>
                        {hasPhoto && (
                            <div className="flex w-[38mm] shrink-0 items-center justify-center p-[4mm]">
                                <Portrait
                                    data={data}
                                    className="h-[40mm] w-[30mm] border border-slate-300"
                                    fallbackClassName="bg-slate-100 text-[28px] font-semibold tracking-[0.06em] text-slate-500"
                                />
                            </div>
                        )}
                    </div>
                </header>
            )}

            {summary && (
                <section className={`border ${RULE} break-inside-avoid`}>
                    <h2 className={`flex items-center gap-[8px] border-b ${RULE} bg-(--accent)/7 px-[10px] py-[5px] text-[13px] font-bold uppercase tracking-[0.16em] text-slate-900`}>
                        <span aria-hidden className="h-[11px] w-[3px] bg-(--accent)" />
                        Profile
                    </h2>
                    <p className={`${bodyText} whitespace-pre-line px-[12px] py-[6px]`}>{summary}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <Table title="Work history">
                    {data.experience.map((exp) => {
                        const heading = exp.role.trim() || exp.company.trim();
                        const company = exp.role.trim() ? exp.company.trim() : '';
                        return (
                            <Row key={exp.id} start={formatDate(exp.startDate)} end={exp.isCurrent ? 'Present' : formatDate(exp.endDate)}>
                                <h3 className="text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">
                                    {heading}
                                    {company && <span className="font-semibold text-slate-600">{`, ${company}`}</span>}
                                </h3>
                                <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                            </Row>
                        );
                    })}
                </Table>
            )}

            {data.education.length > 0 && (
                <Table title="Education">
                    {data.education.map((edu) => {
                        const heading = edu.school.trim() || edu.degree.trim();
                        const degree = edu.school.trim() ? edu.degree.trim() : '';
                        return (
                            <Row key={edu.id} start={formatDate(edu.startDate)} end={formatDate(edu.endDate)}>
                                <h3 className="text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{heading}</h3>
                                {degree && <p className="text-[13.5px] leading-snug text-slate-700 wrap-break-word">{degree}</p>}
                            </Row>
                        );
                    })}
                </Table>
            )}

            {skillGroups.length > 0 && (
                <Table title="Skills and licences">
                    {skillGroups.map((group, index) => (
                        <Row key={index} label={group.category}>
                            <p className={bodyText}>{group.items.join(' · ')}</p>
                        </Row>
                    ))}
                </Table>
            )}

            {data.projects.length > 0 && (
                <Table title="Projects">
                    {data.projects.map((proj) => (
                        <Row key={proj.id} label="">
                            {proj.name.trim() && <h3 className="text-[14.5px] font-bold leading-snug text-slate-900 wrap-break-word">{proj.name}</h3>}
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                        </Row>
                    ))}
                </Table>
            )}
        </div>
    );
};

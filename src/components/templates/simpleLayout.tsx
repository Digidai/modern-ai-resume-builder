import React from 'react';
import { TemplateProps, ContactItem, ContactLink, Portrait, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

// One clean, single-column resume layout shared by several catalogue templates. Each template is a
// combination of a typeface, a header arrangement, a heading style, where dates sit and whether
// (and where) a photo shows. The reading order is always header → summary → experience →
// education → projects → skills, so templates without a photo stay ATS-friendly.

export interface SimpleStyle {
    /** Typeface class, e.g. `font-inter`. */
    font: string;
    /** Default accent; the user's accent (`--rs-accent`) wins. */
    accent: string;
    /** left: name block on the left; center: centred name and contacts; split: name left, contacts stacked right. */
    header: 'left' | 'center' | 'split';
    /** Name in capitals with tracking. */
    upperName?: boolean;
    /** rule: caps over a full-width rule; line: caps then a rule to the right; bar: accent bar on the left;
     *  tint: caps on a light band; short: bold title over a short accent stroke. */
    heading: 'rule' | 'line' | 'bar' | 'tint' | 'short';
    /** right: dates right-aligned on the title line; column: dates in a narrow left column. */
    dates: 'right' | 'column';
    /** accent: employer on its own line in the accent colour; italic: employer in italics below; inline: "Role, Employer". */
    company: 'accent' | 'italic' | 'inline';
    /** Contact entries with icons (photo templates) or as plain text separated by bars (ATS templates). */
    icons?: boolean;
    photo?: { side: 'left' | 'right' | 'top'; shape: 'round' | 'rect' };
}

const bodyText = 'text-[13.5px] leading-[1.5] text-neutral-700 wrap-break-word';
const listClass = 'list-disc pl-[1.1em] space-y-[1px] marker:text-(--accent)';
const COLUMN = 'grid grid-cols-[35mm_minmax(0,1fr)] gap-x-[5mm]';

const HEADINGS: Record<SimpleStyle['heading'], string> = {
    rule: 'border-b border-neutral-800 pb-[3px] text-[13.5px] font-bold uppercase tracking-[0.1em] text-(--accent)',
    line: 'flex items-center gap-[10px] text-[13.5px] font-bold uppercase tracking-[0.14em] text-(--accent) after:h-px after:flex-1 after:bg-neutral-300 after:content-[""]',
    bar: 'border-l-[4px] border-(--accent) pl-[9px] text-[15px] font-bold leading-tight text-neutral-900',
    tint: 'bg-neutral-100 px-[8px] py-[3px] text-[13.5px] font-bold uppercase tracking-[0.12em] text-(--accent) print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]',
    short: 'text-[15px] font-bold uppercase tracking-[0.08em] text-neutral-900 after:mt-[4px] after:block after:h-[2px] after:w-[30px] after:bg-(--accent) after:content-[""]',
};

export const createSimpleTemplate = (style: SimpleStyle): React.FC<TemplateProps> => {
    const SimpleTemplate: React.FC<TemplateProps> = ({ data }) => {
        const contacts = getContactEntries(data);
        const skillGroups = groupSkills(data.skills);
        const name = data.fullName.trim();
        const title = data.title.trim();
        const summary = data.summary.trim();
        const centered = style.header === 'center';
        const column = style.dates === 'column';

        const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title: heading, children }) => (
            <section>
                <h2 className={`mb-[8px] break-after-avoid ${HEADINGS[style.heading]}`}>{heading}</h2>
                <div className="flex flex-col gap-[10px]">{children}</div>
            </section>
        );

        /** One entry: a title, an optional employer line, dates and a body, laid out per `style.dates`. */
        const Entry: React.FC<{ heading: string; sub: string; dates: string; children?: React.ReactNode }> = ({ heading, sub, dates, children }) => {
            const inline = style.company === 'inline';
            const titleLine = (
                <h3 className="min-w-0 text-[14.5px] leading-snug wrap-break-word">
                    {heading && <span className="font-bold text-neutral-900">{heading}</span>}
                    {inline && heading && sub && <span className="text-neutral-700">, </span>}
                    {inline && sub && <span className="text-neutral-700">{sub}</span>}
                </h3>
            );
            const subLine = !inline && sub && (
                <p className={`text-[13.5px] leading-snug wrap-break-word ${style.company === 'accent' ? 'font-semibold text-(--accent)' : 'italic text-neutral-600'}`}>{sub}</p>
            );
            if (column) {
                return (
                    <article className={`${COLUMN} break-inside-avoid`}>
                        <p className="pt-[2px] text-[12.5px] leading-snug tabular-nums text-neutral-500 wrap-break-word">{dates}</p>
                        <div className="min-w-0">
                            {titleLine}
                            {subLine}
                            {children}
                        </div>
                    </article>
                );
            }
            return (
                <article className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-4">
                        {titleLine}
                        {dates && <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-neutral-500">{dates}</span>}
                    </div>
                    {subLine}
                    {children}
                </article>
            );
        };

        const photo = style.photo && (
            <Portrait
                data={data}
                className={style.photo.shape === 'round' ? 'h-[32mm] w-[32mm] rounded-full' : 'h-[38mm] w-[29mm] border border-neutral-200'}
                fallbackClassName="bg-(--accent)/10 text-[30px] font-bold tracking-[0.04em] text-(--accent)"
            />
        );

        const contactList = contacts.length > 0 && (
            style.icons ? (
                <ul className={`flex gap-y-[3px] text-[12.5px] leading-snug text-neutral-600 ${style.header === 'split' ? 'flex-col items-end text-right' : `flex-wrap gap-x-[14px] ${centered ? 'justify-center' : ''}`}`}>
                    {contacts.map((entry) => (
                        <li key={entry.id} className="max-w-full">
                            <ContactItem entry={entry} iconClassName="h-[12px] w-[12px] text-(--accent)" className="wrap-anywhere" />
                        </li>
                    ))}
                </ul>
            ) : style.header === 'split' ? (
                <ul className="flex flex-col items-end gap-y-[2px] text-right text-[12.5px] leading-snug text-neutral-700">
                    {contacts.map((entry) => (
                        <li key={entry.id} className="max-w-full">
                            <ContactLink entry={entry} className="wrap-anywhere" />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={`text-[12.5px] leading-[1.6] text-neutral-700 ${centered ? 'text-center' : ''}`}>
                    {contacts.map((entry, index) => (
                        <React.Fragment key={entry.id}>
                            {index > 0 && <span aria-hidden className="text-neutral-400"> | </span>}
                            <span className="inline-block max-w-full align-top">
                                <ContactLink entry={entry} className="wrap-anywhere" />
                            </span>
                        </React.Fragment>
                    ))}
                </p>
            )
        );

        const nameBlock = (
            <>
                {name && (
                    <div role="heading" aria-level={1} className={`text-[31px] font-bold leading-[1.1] text-neutral-950 wrap-break-word ${style.upperName ? 'uppercase tracking-[0.06em]' : 'tracking-[-0.01em]'}`}>
                        {name}
                    </div>
                )}
                {title && <p className="mt-[4px] text-[15.5px] font-medium leading-snug text-(--accent) wrap-break-word">{title}</p>}
            </>
        );

        let header: React.ReactNode;
        if (centered) {
            header = (
                <header className="flex flex-col items-center gap-[7px] text-center break-inside-avoid">
                    {photo && <div className="mb-[3px]">{photo}</div>}
                    <div>{nameBlock}</div>
                    {contactList}
                </header>
            );
        } else if (style.header === 'split') {
            header = (
                <header className="flex items-center gap-[7mm] border-b border-neutral-200 pb-[12px] break-inside-avoid">
                    {style.photo?.side === 'left' && photo}
                    <div className="min-w-0 flex-1">{nameBlock}</div>
                    <div className="max-w-[48%] shrink-0">{contactList}</div>
                </header>
            );
        } else {
            header = (
                <header className="flex items-center gap-[7mm] break-inside-avoid">
                    {style.photo?.side === 'left' && photo}
                    <div className="min-w-0 flex-1">
                        {nameBlock}
                        {contactList && <div className="mt-[8px]">{contactList}</div>}
                    </div>
                    {style.photo?.side === 'right' && photo}
                </header>
            );
        }

        return (
            <div className={`flex flex-1 flex-col gap-[16px] bg-white px-[16mm] py-[14mm] text-neutral-900 ${style.font}`} style={{ '--accent': `var(--rs-accent, ${style.accent})` } as React.CSSProperties}>
                {(name || title || contacts.length > 0 || data.photo) && header}

                {summary && (
                    <Section title="Summary">
                        <p className={`${bodyText} whitespace-pre-line`}>{summary}</p>
                    </Section>
                )}

                {data.experience.length > 0 && (
                    <Section title="Experience">
                        {data.experience.map((exp) => {
                            const heading = exp.role.trim() || exp.company.trim();
                            const sub = exp.role.trim() ? exp.company.trim() : '';
                            return (
                                <Entry key={exp.id} heading={heading} sub={sub} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}>
                                    <RichText text={exp.description} className={`mt-[3px] ${bodyText}`} listClassName={listClass} />
                                </Entry>
                            );
                        })}
                    </Section>
                )}

                {data.education.length > 0 && (
                    <Section title="Education">
                        {data.education.map((edu) => {
                            const heading = edu.degree.trim() || edu.school.trim();
                            const sub = edu.degree.trim() ? edu.school.trim() : '';
                            return <Entry key={edu.id} heading={heading} sub={sub} dates={formatDateRange(edu.startDate, edu.endDate)} />;
                        })}
                    </Section>
                )}

                {data.projects.length > 0 && (
                    <Section title="Projects">
                        {data.projects.map((proj) => (
                            // With a date column the project name takes the column, as in moderncv.
                            <Entry key={proj.id} heading={column ? '' : proj.name.trim()} sub="" dates={column ? proj.name.trim() : ''}>
                                {proj.link.trim() && (
                                    <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12.5px] text-(--accent) wrap-anywhere hover:underline underline-offset-2">
                                        {displayUrl(proj.link)}
                                    </a>
                                )}
                                <RichText text={proj.description} className={`mt-[2px] ${bodyText}`} listClassName={listClass} />
                            </Entry>
                        ))}
                    </Section>
                )}

                {skillGroups.length > 0 && (
                    <Section title="Skills">
                        {column && skillGroups.some((group) => group.category) ? (
                            skillGroups.map((group, index) => (
                                <div key={index} className={`${COLUMN} break-inside-avoid`}>
                                    <p className="text-[12.5px] font-semibold leading-snug text-neutral-500 wrap-break-word">{group.category}</p>
                                    <p className={bodyText}>{group.items.join(', ')}</p>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col gap-[3px]">
                                {skillGroups.map((group, index) => (
                                    <p key={index} className={`${bodyText} break-inside-avoid`}>
                                        {group.category && <span className="font-bold text-neutral-900">{group.category}: </span>}
                                        {group.items.join(', ')}
                                    </p>
                                ))}
                            </div>
                        )}
                    </Section>
                )}
            </div>
        );
    };
    return SimpleTemplate;
};

import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Keeps the oversized name on as few lines as possible without overflowing 210mm. */
const nameSizeClass = (name: string): string => {
    const longestWord = Math.max(0, ...name.split(/\s+/).map((word) => word.length));
    if (longestWord <= 10 && name.length <= 18) return 'text-[54px]';
    if (longestWord <= 14 && name.length <= 26) return 'text-[46px]';
    return 'text-[38px]';
};

const Section: React.FC<{ index: number; title: string; children: React.ReactNode }> = ({ index, title, children }) => (
    <section className="grid grid-cols-[15mm_minmax(0,1fr)] gap-4">
        <div className="font-montserrat text-[30px] font-extrabold text-(--accent)/25 leading-none tabular-nums select-none" aria-hidden="true">
            {String(index).padStart(2, '0')}
        </div>
        <div className="min-w-0">
            <h2 className="font-montserrat text-[12px] font-bold uppercase tracking-[0.2em] text-(--accent) mb-3 pt-1 break-after-avoid">{title}</h2>
            {children}
        </div>
    </section>
);

const BULLETS = 'list-disc pl-4 space-y-1 marker:text-(--accent)/60';

export const GintoTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);

    const sections: Array<{ title: string; body: React.ReactNode; half?: boolean }> = [];

    if (data.summary.trim()) {
        sections.push({
            title: 'Profile',
            body: <p className="text-[14px] text-slate-800 wrap-break-word">{data.summary}</p>,
        });
    }

    if (data.experience.length > 0) {
        sections.push({
            title: 'Experience',
            body: (
                <div className="flex flex-col gap-5">
                    {data.experience.map((exp) => {
                        const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
                        return (
                            <article key={exp.id} className="relative pl-6 border-l-2 border-slate-200 break-inside-avoid">
                                <span className="absolute -left-[7px] top-[5px] w-3 h-3 rounded-full bg-white border-[3px] border-(--accent)" aria-hidden="true" />
                                {(exp.role || dates) && (
                                    <div className="flex justify-between items-baseline gap-4">
                                        <h3 className="text-[16px] font-bold leading-snug text-slate-900 min-w-0 wrap-break-word">{exp.role}</h3>
                                        {dates && <span className="shrink-0 whitespace-nowrap text-[12px] font-medium text-slate-500 tabular-nums">{dates}</span>}
                                    </div>
                                )}
                                {exp.company && <div className="text-[14px] font-semibold text-slate-600 wrap-break-word">{exp.company}</div>}
                                <RichText text={exp.description} className="mt-1.5 text-slate-700 wrap-break-word" listClassName={BULLETS} />
                            </article>
                        );
                    })}
                </div>
            ),
        });
    }

    if (data.projects.length > 0) {
        sections.push({
            title: 'Projects',
            body: (
                <div className="grid grid-cols-2 gap-4">
                    {data.projects.map((proj) => (
                        <article key={proj.id} className="min-w-0 rounded-xl border border-slate-200 px-4 py-3 break-inside-avoid">
                            {proj.name && <h3 className="text-[15px] font-bold text-slate-900 leading-snug wrap-break-word">{proj.name}</h3>}
                            {proj.link.trim() && (
                                <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[12px] font-medium text-(--accent) mt-0.5 hover:underline underline-offset-2 wrap-anywhere">
                                    {displayUrl(proj.link)}
                                </a>
                            )}
                            <RichText text={proj.description} className="mt-1.5 text-[13.5px] text-slate-700 wrap-break-word" listClassName={BULLETS} />
                        </article>
                    ))}
                </div>
            ),
        });
    }

    if (data.education.length > 0) {
        sections.push({
            title: 'Education',
            half: true,
            body: (
                <div className="flex flex-col gap-3">
                    {data.education.map((edu) => {
                        const dates = formatDateRange(edu.startDate, edu.endDate);
                        return (
                            <article key={edu.id} className="min-w-0 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 break-inside-avoid">
                                {(edu.school || dates) && (
                                    <div className="flex flex-wrap justify-between items-baseline gap-x-3">
                                        <div className="text-[15px] font-bold text-slate-900 leading-snug min-w-0 wrap-break-word">{edu.school}</div>
                                        {dates && <span className="text-[12px] font-medium text-slate-500 tabular-nums whitespace-nowrap">{dates}</span>}
                                    </div>
                                )}
                                {edu.degree && <div className="text-slate-700 wrap-break-word">{edu.degree}</div>}
                            </article>
                        );
                    })}
                </div>
            ),
        });
    }

    if (skillGroups.length > 0) {
        sections.push({
            title: 'Skills',
            half: true,
            body: (
                <div className="flex flex-col gap-2.5">
                    {skillGroups.map((group, gi) => (
                        <div key={gi} className="min-w-0">
                            {group.category && <div className="text-[12px] font-semibold text-slate-500 mb-1 wrap-break-word">{group.category}</div>}
                            <ul className="flex flex-wrap gap-1.5">
                                {group.items.map((skill, i) => (
                                    <li key={i} className="bg-slate-900 text-white px-2.5 py-0.5 text-[12.5px] font-semibold rounded-full wrap-break-word max-w-full">{skill}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ),
        });
    }

    const halves = sections.filter((section) => section.half);
    const fullCount = sections.length - halves.length;

    return (
        <div className="flex-1 flex flex-col bg-white text-slate-900 font-inter text-[14px] leading-[1.5] px-[15mm] pt-[13mm] pb-[12mm] [--accent:var(--rs-accent,#A0442A)]">
            <header className="mb-7">
                {data.fullName && (
                    <div role="heading" aria-level={1} className={`${nameSizeClass(data.fullName)} font-montserrat font-extrabold tracking-tight leading-[1.05] wrap-break-word`}>
                        <span className="text-(--accent)" aria-hidden="true">.</span>
                        {data.fullName}
                    </div>
                )}
                {data.title && (
                    <p className="font-montserrat text-[16px] font-bold uppercase tracking-[0.14em] leading-snug mt-2.5 wrap-break-word">{data.title}</p>
                )}
                <div className="h-1 bg-slate-900 mt-4" aria-hidden="true" />
                {contacts.length > 0 && (
                    <ul className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3.5 text-[12.5px] font-medium text-slate-700">
                        {contacts.map((entry) => {
                            const Icon = entry.icon;
                            return (
                                <li key={entry.id} className="flex items-center gap-1.5 min-w-0 max-w-full">
                                    <Icon className="w-3.5 h-3.5 shrink-0 text-(--accent)" />
                                    <ContactLink entry={entry} className="wrap-anywhere min-w-0" />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </header>

            <div className="flex flex-col gap-6">
                {sections.filter((section) => !section.half).map((section, i) => (
                    <Section key={section.title} index={i + 1} title={section.title}>
                        {section.body}
                    </Section>
                ))}
                {/* Education and skills share the last row when both exist. */}
                {halves.length > 0 && (
                    <div className={halves.length > 1 ? 'grid grid-cols-2 gap-8' : ''}>
                        {halves.map((section, i) => (
                            <Section key={section.title} index={fullCount + i + 1} title={section.title}>
                                {section.body}
                            </Section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

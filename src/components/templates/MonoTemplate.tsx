import React from 'react';
import { TemplateProps, ContactLink, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Doc-comment heading with a trailing hairline: `/** @experience *\/ ────`. */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mb-2 flex items-center gap-3 break-after-avoid">
        <h2 className="shrink-0 text-[14px] font-bold text-(--accent-light)">
            <span className="font-normal text-slate-400">/** @</span>
            {children}
            <span className="font-normal text-slate-400"> */</span>
        </h2>
        <span aria-hidden className="h-px flex-1 bg-slate-700" />
    </div>
);

/** Role/school on the left, dates in a fixed right-hand chip — the only date slot in the template. */
const EntryHead: React.FC<{ title: string; dates?: string }> = ({ title, dates }) =>
    title || dates ? (
        <div className="flex items-start justify-between gap-4">
            <h3 className="min-w-0 text-[15px] leading-snug font-bold text-white">{title}</h3>
            {dates && (
                <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 text-xs whitespace-nowrap tabular-nums text-slate-300">{dates}</span>
            )}
        </div>
    ) : null;

const descriptionList = "list-['›_'] space-y-0.5 pl-4 marker:text-(--accent-light)";
const block = 'flex flex-col gap-3.5 border-l-2 border-slate-700 pl-4';

export const MonoTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const flatSkills = skillGroups.length === 1 && !skillGroups[0].category;

    const list = (items: string[]) => (
        <>
            <span className="text-slate-500">[</span>
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    <span className="text-slate-100">"{item}"</span>
                    {i < items.length - 1 && <span className="text-slate-500">, </span>}
                </React.Fragment>
            ))}
            <span className="text-slate-500">]</span>
        </>
    );

    return (
        <div className="flex flex-1 flex-col bg-slate-900 px-[15mm] pt-[11mm] pb-[10mm] font-jetbrains text-[13.5px] leading-normal text-slate-300 wrap-break-word [--accent-light:oklch(from_var(--accent)_0.8_min(c,0.13)_h)] [--accent:var(--rs-accent,#047857)]">
            <header className="mb-4 border-b border-slate-700 pb-4">
                <div className="mb-1.5 text-xs text-slate-400">// resume.tsx</div>
                <h1 className="text-[30px] leading-tight font-bold tracking-tight text-white">{data.fullName}</h1>
                {data.title.trim() && (
                    <p className="mt-1.5 text-[15px]">
                        <span className="text-slate-500">&lt;</span>
                        <span className="text-(--accent-light)">{data.title}</span>
                        <span className="text-slate-500"> /&gt;</span>
                    </p>
                )}
                {contacts.length > 0 && (
                    <div className="mt-3 text-[13px] leading-[1.45]">
                        <div>
                            <span className="text-(--accent-light)">const</span> <span className="text-white">contact</span>{' '}
                            <span className="text-slate-400">= {'{'}</span>
                        </div>
                        {contacts.map((entry) => (
                            <div key={entry.id} className="flex pl-5">
                                <span className="shrink-0 text-slate-400">{entry.key}:&nbsp;</span>
                                <span className="min-w-0 text-slate-100">
                                    "<ContactLink entry={entry} className="wrap-anywhere" />"<span className="text-slate-400">,</span>
                                </span>
                            </div>
                        ))}
                        <div className="text-slate-400">{'}'};</div>
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-4">
                {data.summary.trim() && (
                    <section>
                        <SectionTitle>summary</SectionTitle>
                        <p className="border-l-2 border-slate-700 pl-4">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <SectionTitle>experience</SectionTitle>
                        <div className={block}>
                            {data.experience.map((exp) => (
                                <article key={exp.id} className="break-inside-avoid">
                                    <EntryHead title={exp.role} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)} />
                                    {exp.company && <div className="mt-0.5 text-(--accent-light)">@ {exp.company}</div>}
                                    <RichText text={exp.description} className="mt-1.5" listClassName={descriptionList} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <SectionTitle>projects</SectionTitle>
                        <div className={block}>
                            {data.projects.map((proj) => (
                                <article key={proj.id} className="break-inside-avoid">
                                    <EntryHead title={proj.name} />
                                    {proj.link.trim() && (
                                        <a
                                            href={toHref(proj.link)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-0.5 block text-[13px] text-(--accent-light) underline decoration-(--accent-light)/40 underline-offset-2 wrap-anywhere"
                                        >
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className="mt-1.5" listClassName={descriptionList} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section className="break-inside-avoid">
                        <SectionTitle>skills</SectionTitle>
                        <div className="border-l-2 border-slate-700 pl-4">
                            {flatSkills ? (
                                <p>
                                    <span className="text-(--accent-light)">const</span> <span className="text-white">skills</span>{' '}
                                    <span className="text-slate-500">=</span> {list(skillGroups[0].items)}
                                    <span className="text-slate-500">;</span>
                                </p>
                            ) : (
                                <>
                                    <div>
                                        <span className="text-(--accent-light)">const</span> <span className="text-white">skills</span>{' '}
                                        <span className="text-slate-500">= {'{'}</span>
                                    </div>
                                    {skillGroups.map((group, i) => (
                                        <p key={i} className="pl-5">
                                            <span className="text-slate-400">{group.category || 'other'}: </span>
                                            {list(group.items)}
                                            <span className="text-slate-500">,</span>
                                        </p>
                                    ))}
                                    <div className="text-slate-500">{'}'};</div>
                                </>
                            )}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <SectionTitle>education</SectionTitle>
                        <div className={block}>
                            {data.education.map((edu) => (
                                <article key={edu.id} className="break-inside-avoid">
                                    <EntryHead title={edu.school} dates={formatDateRange(edu.startDate, edu.endDate)} />
                                    {edu.degree && <div className="mt-0.5">{edu.degree}</div>}
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

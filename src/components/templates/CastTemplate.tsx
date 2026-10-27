import React from 'react';
import { TemplateProps, ContactItem, RichText, displayUrl, formatDateRange, getContactEntries, groupSkills, toHref } from './shared';

/** Screenplay-style scene heading ("INT. EXPERIENCE — CONTINUOUS") trailed by an accent hairline. */
const SceneHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="mb-2.5 flex items-center gap-3 text-[13px] font-bold tracking-[0.18em] text-(--accent) uppercase break-after-avoid">
        <span className="shrink-0">{children}</span>
        <span aria-hidden className="h-px flex-1 bg-(--accent)/30" />
    </h2>
);

/** Dates sit in a left "slug" gutter like screenplay margin notes; the action column carries the text. */
const Shot: React.FC<{ dates?: string; children: React.ReactNode }> = ({ dates, children }) => (
    <article className="grid break-inside-avoid grid-cols-[38mm_minmax(0,1fr)] gap-5">
        <div className="pt-px text-xs tabular-nums text-slate-600">{dates}</div>
        <div className="min-w-0">{children}</div>
    </article>
);

const descriptionList = "list-['–_'] space-y-0.5 pl-4 marker:text-slate-500";
const entryTitle = 'font-bold tracking-wide text-slate-950 uppercase';

export const CastTemplate: React.FC<TemplateProps> = ({ data }) => {
    const contacts = getContactEntries(data);
    const skillGroups = groupSkills(data.skills);
    const flatSkills = skillGroups.length === 1 && !skillGroups[0].category;

    return (
        <div className="flex flex-1 flex-col bg-[#fafafa] px-[16mm] pt-[9mm] pb-[7mm] font-jetbrains text-[13.5px] leading-normal text-slate-800 wrap-break-word [--accent:var(--rs-accent,#1E293B)]">
            <header className="mb-4 border-b-2 border-(--accent) pb-4 text-center">
                <div className="mb-1.5 text-[11px] tracking-[0.3em] text-(--accent) uppercase">Fade in:</div>
                <div role="heading" aria-level={1} className="text-[28px] leading-tight font-bold tracking-[0.15em] text-slate-950 uppercase">{data.fullName}</div>
                {data.title.trim() && <p className="mt-1.5 text-[14px] tracking-wide text-slate-700">({data.title})</p>}
                {contacts.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[12.5px] text-slate-700">
                        {contacts.map((entry) => (
                            <ContactItem key={entry.id} entry={entry} iconClassName="h-3.5 w-3.5 text-(--accent)/70" />
                        ))}
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-4">
                {data.summary.trim() && (
                    <section>
                        <SceneHeading>INT. PROFILE — DAY</SceneHeading>
                        <p>{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <SceneHeading>INT. EXPERIENCE — CONTINUOUS</SceneHeading>
                        <div className="flex flex-col gap-3.5">
                            {data.experience.map((exp) => (
                                <Shot key={exp.id} dates={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}>
                                    {exp.role && <h3 className={entryTitle}>{exp.role}</h3>}
                                    {exp.company && <div className="text-slate-700">{exp.company}</div>}
                                    <RichText text={exp.description} className="mt-1" listClassName={descriptionList} />
                                </Shot>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <SceneHeading>INT. PROJECTS — NIGHT</SceneHeading>
                        <div className="flex flex-col gap-3.5">
                            {data.projects.map((proj) => (
                                <Shot key={proj.id}>
                                    {proj.name && <h3 className={entryTitle}>{proj.name}</h3>}
                                    {proj.link.trim() && (
                                        <a href={toHref(proj.link)} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-slate-600 underline decoration-(--accent)/30 underline-offset-2 wrap-anywhere">
                                            {displayUrl(proj.link)}
                                        </a>
                                    )}
                                    <RichText text={proj.description} className="mt-1" listClassName={descriptionList} />
                                </Shot>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <SceneHeading>INT. EDUCATION — FLASHBACK</SceneHeading>
                        <div className="flex flex-col gap-3">
                            {data.education.map((edu) => (
                                <Shot key={edu.id} dates={formatDateRange(edu.startDate, edu.endDate)}>
                                    {edu.school && <h3 className={entryTitle}>{edu.school}</h3>}
                                    {edu.degree && <div className="text-slate-700">{edu.degree}</div>}
                                </Shot>
                            ))}
                        </div>
                    </section>
                )}

                {skillGroups.length > 0 && (
                    <section className="break-inside-avoid">
                        <SceneHeading>INT. SKILLS — MONTAGE</SceneHeading>
                        {flatSkills ? (
                            <ul className="columns-3 gap-6">
                                {skillGroups[0].items.map((skill, i) => (
                                    <li key={i} className="flex break-inside-avoid gap-2">
                                        <span aria-hidden className="shrink-0 text-slate-500">–</span>
                                        <span className="min-w-0">{skill}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {skillGroups.map((group, i) => (
                                    <Shot key={i}>
                                        <p>
                                            {group.category && <span className="font-bold text-slate-950 uppercase">{group.category}: </span>}
                                            {group.items.join(', ')}
                                        </p>
                                    </Shot>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

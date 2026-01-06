import React from 'react';
import { TemplateProps } from './shared';

export const PaperTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] bg-[#fffef8] text-slate-900 font-serif p-12">
            <header className="text-center mb-8 border-b-2 border-black pb-6">
                <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>{data.fullName}</h1>
                <p className="text-lg text-slate-600 italic">{data.title}</p>
            </header>
            <div className="flex justify-center gap-6 text-xs text-slate-500 mb-8 border-b border-slate-200 pb-4">
                {[data.email, data.phone, data.location, data.website].filter(Boolean).map((t, i) => (
                    <span key={i} className="relative px-3">
                        {i > 0 && <span className="absolute -left-0.5 top-0">•</span>}
                        {t}
                    </span>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-6" style={{ columnGap: '2rem' }}>
                <div className="col-span-2 flex flex-col gap-8">
                    {data.summary && (
                        <section>
                            <p className="text-base leading-relaxed first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2">{data.summary}</p>
                        </section>
                    )}
                    {data.experience.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Professional Experience</h2>
                            <div className="flex flex-col gap-6">
                                {data.experience.map(exp => (
                                    <div key={exp.id}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-lg font-bold">{exp.role}</h3>
                                            <span className="text-xs text-slate-500 italic">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-600 mb-2">{exp.company}</div>
                                        <p className="text-sm leading-relaxed text-justify">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
                <div className="flex flex-col gap-6 border-l border-slate-200 pl-6">
                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Education</h2>
                            <div className="flex flex-col gap-4">
                                {data.education.map(edu => (
                                    <div key={edu.id} className="text-sm">
                                        <div className="font-bold">{edu.school}</div>
                                        <div className="italic text-slate-600">{edu.degree}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    {data.skills.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Expertise</h2>
                            <div className="flex flex-col gap-1">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="text-sm">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}
                    {data.projects.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Projects</h2>
                            <div className="flex flex-col gap-3">
                                {data.projects.map(proj => (
                                    <div key={proj.id} className="text-sm">
                                        <div className="font-bold">{proj.name}</div>
                                        <p className="text-xs text-slate-600 mt-0.5">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

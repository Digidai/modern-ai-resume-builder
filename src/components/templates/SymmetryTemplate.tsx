import React from 'react';
import { TemplateProps } from './shared';

export const SymmetryTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] bg-slate-50 text-slate-800 font-serif p-12">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-medium tracking-wide text-slate-900 mb-3">{data.fullName}</h1>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-6">{data.title}</p>
                <div className="flex justify-center gap-6 text-xs text-slate-500 italic font-medium">
                    {[data.email, data.phone, data.location].filter(Boolean).map((t, i) => (
                        <span key={i} className="relative px-2">
                            {i > 0 && <span className="absolute -left-3 top-0 opacity-30">/</span>}
                            {t}
                        </span>
                    ))}
                </div>
            </header>

            <div className="flex flex-col gap-10 max-w-3xl mx-auto w-full">

                {data.summary && (
                    <section className="text-center">
                        <div className="w-10 h-0.5 bg-slate-300 mx-auto mb-4"></div>
                        <p className="text-slate-600 leading-loose italic">{data.summary}</p>
                    </section>
                )}

                {data.skills.length > 0 && (
                    <section className="text-center">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Competencies</h2>
                        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2">
                            {data.skills.map((s, i) => (
                                <span key={i} className="text-sm font-medium text-slate-700 border-b border-transparent hover:border-slate-300 transition-colors">{s}</span>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <h2 className="text-lg font-medium italic text-slate-900">Professional Experience</h2>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <div className="flex flex-col gap-10">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="grid grid-cols-[1fr_3fr] gap-8">
                                    <div className="text-right pt-1">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</div>
                                        <div className="text-sm font-medium text-slate-800 mt-1">{exp.company}</div>
                                    </div>
                                    <div className="border-l border-slate-200 pl-8">
                                        <h3 className="text-xl font-medium text-slate-900 mb-2">{exp.role}</h3>
                                        <p className="text-sm text-slate-600 leading-relaxed text-justify">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-2 gap-12">
                    {data.education.length > 0 && (
                        <section>
                            <div className="h-px bg-slate-200 w-full mb-6 relative">
                                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-slate-50 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">Education</span>
                            </div>
                            <div className="flex flex-col gap-6 text-center">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-medium text-lg text-slate-900">{edu.school}</div>
                                        <div className="text-sm italic text-slate-600">{edu.degree}</div>
                                        <div className="text-xs text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <div className="h-px bg-slate-200 w-full mb-6 relative">
                                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-slate-50 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">Projects</span>
                            </div>
                            <div className="flex flex-col gap-6 text-center">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <div className="font-medium text-lg text-slate-900">{proj.name}</div>
                                        <p className="text-xs text-slate-500 mt-1 leading-normal">{proj.description}</p>
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

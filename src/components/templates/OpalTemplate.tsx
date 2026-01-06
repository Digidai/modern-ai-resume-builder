import React from 'react';
import { TemplateProps } from './shared';

export const OpalTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col gap-8 px-8 py-10 font-sans text-slate-700">
            <header className="text-center mb-4">
                <h1 className="text-4xl font-light tracking-wide text-slate-900 mb-2">{data.fullName}</h1>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400 mb-6">{data.title}</p>
                <div className="flex justify-center flex-wrap gap-6 text-xs text-slate-500 font-medium">
                    {[data.email, data.phone, data.website, data.location].filter(Boolean).map((t, i) => (
                        <span key={i} className="bg-slate-50 px-3 py-1 rounded-full">{t}</span>
                    ))}
                </div>
            </header>

            {data.summary && (
                <section className="bg-slate-50/50 p-6 rounded-2xl mx-auto max-w-2xl text-center">
                    <p className="text-sm leading-relaxed text-slate-600">{data.summary}</p>
                </section>
            )}

            <div className="grid grid-cols-[1fr_2px_1fr] gap-8">
                <div className="bg-gradient-to-b from-transparent via-slate-100 to-transparent"></div>
            </div>

            {/* Single Column Layout */}
            <div className="flex flex-col gap-10 max-w-3xl mx-auto w-full">

                {data.skills.length > 0 && (
                    <section className="text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                            {data.skills.map((s, i) => (
                                <span key={i} className="text-xs border border-slate-200 px-3 py-1 rounded-md text-slate-500">{s}</span>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <h2 className="text-xs font-bold uppercase text-slate-300 mb-6 text-center tracking-widest">Experience</h2>
                        <div className="flex flex-col gap-8">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="flex gap-4 group">
                                    <div className="w-24 pt-1 flex flex-col items-end text-right shrink-0">
                                        <span className="text-xs font-bold text-slate-900">{exp.startDate}</span>
                                        <span className="text-[10px] text-slate-400">{exp.isCurrent ? 'Present' : exp.endDate}</span>
                                    </div>
                                    <div className="w-px bg-slate-100 relative group-hover:bg-slate-200 transition-colors">
                                        <div className="absolute top-1.5 -left-1 w-2 h-2 rounded-full bg-white border-2 border-slate-200 group-hover:border-slate-400 transition-colors"></div>
                                    </div>
                                    <div className="pb-8">
                                        <h3 className="text-base font-medium text-slate-800">{exp.role}</h3>
                                        <div className="text-xs text-slate-500 mb-2">{exp.company}</div>
                                        <p className="text-sm text-slate-600 leading-relaxed font-light">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase text-slate-300 mb-6 text-center tracking-widest">Education</h2>
                            <div className="flex flex-col gap-4">
                                {data.education.map(edu => (
                                    <div key={edu.id} className="bg-slate-50 p-4 rounded-xl text-center">
                                        <div className="font-medium text-slate-900 text-sm">{edu.school}</div>
                                        <div className="text-xs text-slate-500 my-1">{edu.degree}</div>
                                        <div className="text-[10px] text-slate-400">{edu.startDate} — {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase text-slate-300 mb-6 text-center tracking-widest">Projects</h2>
                            <div className="flex flex-col gap-4">
                                {data.projects.map(proj => (
                                    <div key={proj.id} className="bg-slate-50 p-4 rounded-xl text-center">
                                        <div className="font-medium text-slate-900 text-sm">{proj.name}</div>
                                        <p className="text-xs text-slate-500 mt-2 leading-snug">{proj.description}</p>
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

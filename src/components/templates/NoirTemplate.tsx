import React from 'react';
import { TemplateProps } from './shared';

export const NoirTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] bg-zinc-900 text-zinc-100 font-sans p-12">
            <header className="mb-12 border-b border-zinc-700 pb-10">
                <h1 className="text-5xl font-light tracking-wide text-white mb-3">{data.fullName}</h1>
                <p className="text-lg text-amber-400 font-medium uppercase tracking-[0.3em] mb-8">{data.title}</p>
                <div className="flex gap-8 text-sm text-zinc-400">
                    {[data.email, data.phone, data.location].filter(Boolean).map((t, i) => (
                        <span key={i}>{t}</span>
                    ))}
                </div>
            </header>
            <div className="grid grid-cols-[2fr_1fr] gap-12 h-full">
                <div className="flex flex-col gap-10">
                    {data.summary && (
                        <section>
                            <p className="text-lg text-zinc-300 leading-relaxed font-light">{data.summary}</p>
                        </section>
                    )}
                    {data.experience.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-6">Experience</h2>
                            <div className="flex flex-col gap-8">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="border-l-2 border-zinc-700 pl-6 hover:border-amber-400 transition-colors">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className="text-xl font-medium text-white">{exp.role}</h3>
                                            <span className="text-xs text-zinc-500">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                        </div>
                                        <div className="text-amber-400 text-sm font-medium mb-3">{exp.company}</div>
                                        <p className="text-zinc-400 text-sm leading-relaxed">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
                <div className="flex flex-col gap-10 border-l border-zinc-800 pl-8">
                    {data.skills.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">Skills</h2>
                            <div className="flex flex-col gap-2">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="text-zinc-300 text-sm">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}
                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">Education</h2>
                            <div className="flex flex-col gap-4">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="text-white font-medium">{edu.school}</div>
                                        <div className="text-zinc-400 text-sm">{edu.degree}</div>
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

import React from 'react';
import { TemplateProps } from './shared';

export const GintoTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white text-slate-900 font-sans p-10">
            <header className="mb-12">
                <h1 className="text-6xl font-extrabold tracking-tighter mb-4"><span className="text-indigo-600">.</span>{data.fullName}</h1>
                <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4">
                    <p className="text-2xl font-bold uppercase tracking-widest">{data.title}</p>
                    <div className="text-right font-medium text-sm">
                        {[data.email, data.phone].filter(Boolean).join(' • ')}
                        {data.website && <div>{data.website}</div>}
                    </div>
                </div>
            </header>

            <div className="flex flex-col gap-10">

                {data.summary && (
                    <section className="grid grid-cols-[80px_1fr] gap-6">
                        <div className="text-4xl font-black text-indigo-100 leading-none select-none">01</div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-indigo-600">Profile</h2>
                            <p className="text-lg font-medium leading-relaxed">{data.summary}</p>
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section className="grid grid-cols-[80px_1fr] gap-6">
                        <div className="text-4xl font-black text-indigo-100 leading-none select-none">02</div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-indigo-600">Experience</h2>
                            <div className="flex flex-col gap-8">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100 hover:border-indigo-200 transition-colors">
                                        <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-600"></span>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-xl font-bold">{exp.role}</h3>
                                            <span className="font-mono text-sm text-slate-400 font-medium">{exp.startDate} — {exp.isCurrent ? 'Now' : exp.endDate}</span>
                                        </div>
                                        <div className="text-base font-bold text-slate-500 mb-2">{exp.company}</div>
                                        <p className="text-slate-700 leading-relaxed">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section className="grid grid-cols-[80px_1fr] gap-6">
                        <div className="text-4xl font-black text-indigo-100 leading-none select-none">03</div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-indigo-600">Education</h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                {data.education.map(edu => (
                                    <div key={edu.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="font-bold text-lg">{edu.school}</div>
                                        <div className="text-indigo-600 font-medium">{edu.degree}</div>
                                        <div className="text-sm text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-2 gap-10">
                    {data.skills.length > 0 && (
                        <section className="grid grid-cols-[80px_1fr] gap-6">
                            <div className="text-4xl font-black text-indigo-100 leading-none select-none">04</div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-indigo-600">Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.map((s, i) => (
                                        <span key={i} className="bg-slate-900 text-white px-3 py-1 text-sm font-bold rounded-full">{s}</span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section className="grid grid-cols-[80px_1fr] gap-6">
                            <div className="text-4xl font-black text-indigo-100 leading-none select-none">05</div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-indigo-600">Projects</h2>
                                <div className="flex flex-col gap-4">
                                    {data.projects.map(proj => (
                                        <div key={proj.id}>
                                            <div className="font-bold">{proj.name}</div>
                                            <p className="text-xs text-slate-500">{proj.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

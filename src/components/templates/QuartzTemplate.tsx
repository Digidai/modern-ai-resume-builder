import React from 'react';
import { TemplateProps } from './shared';

export const QuartzTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white text-slate-900 font-sans p-8">
            <div className="border-2 border-slate-900 h-full p-8 flex flex-col gap-8">
                <header className="border-b-2 border-slate-900 pb-8">
                    <h1 className="text-5xl font-bold uppercase tracking-tighter mb-4">{data.fullName}</h1>
                    <div className="flex justify-between items-end">
                        <p className="text-xl font-medium uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 inline-block">{data.title}</p>
                        <div className="text-right text-xs font-mono font-medium">
                            {[data.email, data.phone, data.location].filter(Boolean).map((t, i) => (
                                <div key={i}>{t}</div>
                            ))}
                        </div>
                    </div>
                </header>
                <div className="grid grid-cols-[1fr_2fr] gap-8 h-full">
                    <div className="flex flex-col gap-8 border-r-2 border-slate-900 pr-8">
                        {data.skills.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-1">Skills</h2>
                                <div className="flex flex-col gap-2">
                                    {data.skills.map((s, i) => (
                                        <div key={i} className="font-medium text-sm border border-slate-300 p-2 text-center bg-slate-50">{s}</div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {data.education.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-1">Education</h2>
                                <div className="flex flex-col gap-4">
                                    {data.education.map(edu => (
                                        <div key={edu.id} className="border border-slate-200 p-3 bg-slate-50">
                                            <div className="font-bold text-sm">{edu.school}</div>
                                            <div className="text-xs text-slate-600 mt-1">{edu.degree}</div>
                                            <div className="text-[10px] font-mono mt-2 text-slate-400">{edu.startDate} - {edu.endDate}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                    <div className="flex flex-col gap-8">
                        {data.summary && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-1">Profile</h2>
                                <p className="text-sm font-medium leading-relaxed">{data.summary}</p>
                            </section>
                        )}
                        {data.experience.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-1">Experience</h2>
                                <div className="flex flex-col gap-6">
                                    {data.experience.map(exp => (
                                        <div key={exp.id}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="text-lg font-bold">{exp.role}</h3>
                                                <span className="text-xs font-mono border border-slate-900 px-1">{exp.startDate} - {exp.isCurrent ? 'NOW' : exp.endDate}</span>
                                            </div>
                                            <div className="text-sm font-bold text-slate-500 mb-2 uppercase">{exp.company}</div>
                                            <p className="text-sm leading-relaxed text-slate-700">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

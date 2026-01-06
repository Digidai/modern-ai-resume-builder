import React from 'react';
import { TemplateProps } from './shared';

export const LateralTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white text-slate-800 font-sans p-10">
            <header className="border-b border-slate-200 pb-8 mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{data.fullName}</h1>
                <div className="flex justify-between items-end">
                    <p className="text-xl text-slate-500 font-medium">{data.title}</p>
                    <div className="text-right text-sm">
                        {[data.email, data.phone].filter(Boolean).join(' | ')}
                        {data.website && <div className="text-slate-400">{data.website}</div>}
                    </div>
                </div>
            </header>

            <div className="flex flex-col gap-10">

                {data.summary && (
                    <section className="grid grid-cols-[150px_1fr] gap-8">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">About</h2>
                        <p className="text-slate-600 leading-relaxed">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section className="grid grid-cols-[150px_1fr] gap-8">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">Experience</h2>
                        <div className="flex flex-col gap-8">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                                        <span className="text-sm text-slate-400">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                    </div>
                                    <div className="text-slate-500 font-medium mb-2">{exp.company}</div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section className="grid grid-cols-[150px_1fr] gap-8">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">Education</h2>
                        <div className="flex flex-col gap-4">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="font-bold text-slate-900">{edu.school}</div>
                                    <div className="text-slate-600 text-sm">{edu.degree}</div>
                                    <div className="text-xs text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-[150px_1fr] gap-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((s, i) => (
                            <span key={i} className="bg-slate-50 text-slate-600 px-2 py-1 text-sm rounded">{s}</span>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

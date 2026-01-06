import React from 'react';
import { TemplateProps } from './shared';

export const MonoTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] bg-slate-900 text-slate-100 font-mono p-10">
            <header className="mb-10">
                <div className="text-green-400 text-sm mb-2">// resume.tsx</div>
                <h1 className="text-4xl font-bold text-white mb-2">{data.fullName}</h1>
                <p className="text-lg text-slate-400 mb-4">&lt;{data.title} /&gt;</p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    {data.email && <span className="text-cyan-400">{data.email}</span>}
                    {data.phone && <span>{data.phone}</span>}
                    {data.location && <span>{data.location}</span>}
                    {data.website && <span className="text-cyan-400 underline">{data.website}</span>}
                </div>
            </header>
            <div className="flex flex-col gap-8">
                {data.summary && (
                    <section>
                        <h2 className="text-green-400 text-sm mb-2">/** @summary */</h2>
                        <p className="text-slate-300 leading-relaxed pl-4 border-l-2 border-slate-700">{data.summary}</p>
                    </section>
                )}
                {data.experience.length > 0 && (
                    <section>
                        <h2 className="text-green-400 text-sm mb-4">/** @experience */</h2>
                        <div className="flex flex-col gap-6 pl-4 border-l-2 border-slate-700">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-lg font-bold text-white">{exp.role}</h3>
                                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{exp.startDate} - {exp.isCurrent ? 'present' : exp.endDate}</span>
                                    </div>
                                    <div className="text-cyan-400 text-sm mb-2">@ {exp.company}</div>
                                    <p className="text-slate-400 text-sm leading-relaxed">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                <div className="grid grid-cols-2 gap-8">
                    {data.skills.length > 0 && (
                        <section>
                            <h2 className="text-green-400 text-sm mb-3">/** @skills */</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="bg-slate-800 text-slate-300 px-2 py-1 text-xs rounded">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}
                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-green-400 text-sm mb-3">/** @education */</h2>
                            <div className="flex flex-col gap-3">
                                {data.education.map(edu => (
                                    <div key={edu.id} className="text-sm">
                                        <div className="text-white">{edu.school}</div>
                                        <div className="text-slate-500">{edu.degree}</div>
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

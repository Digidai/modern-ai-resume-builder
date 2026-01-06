import React from 'react';
import { TemplateProps } from './shared';

export const WireframeTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white font-mono text-xs text-slate-800 p-8">
            <div className="border-2 border-slate-900 h-full flex flex-col">

                {/* Header Block */}
                <div className="border-b-2 border-slate-900 p-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">{data.fullName}</h1>
                        <p className="text-sm border inline-block px-2 py-0.5 border-slate-800">{data.title}</p>
                    </div>
                    <div className="text-right flex flex-col gap-1 items-end">
                        {[data.email, data.phone, data.website, data.location].filter(Boolean).map((t, i) => (
                            <div key={i} className="border-b border-slate-300 pb-0.5">{t}</div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-1">
                    {/* Left Sidebar Block */}
                    <div className="w-1/3 border-r-2 border-slate-900 flex flex-col">

                        {data.skills.length > 0 && (
                            <div className="p-4 border-b-2 border-slate-900">
                                <h2 className="font-bold underline mb-3 text-sm">SKILLS_LIST</h2>
                                <ul className="list-disc list-inside space-y-1 marker:text-slate-500">
                                    {data.skills.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {data.education.length > 0 && (
                            <div className="p-4 flex-1">
                                <h2 className="font-bold underline mb-3 text-sm">EDUCATION_DATA</h2>
                                <div className="flex flex-col gap-4">
                                    {data.education.map(edu => (
                                        <div key={edu.id} className="border border-slate-400 p-2 relative">
                                            <div className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-slate-500">Node</div>
                                            <div className="font-bold">{edu.school}</div>
                                            <div>{edu.degree}</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{edu.startDate} -&gt; {edu.endDate}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Block */}
                    <div className="w-2/3 flex flex-col">
                        {data.summary && (
                            <div className="p-4 border-b-2 border-slate-900">
                                <h2 className="font-bold underline mb-2 text-sm">SUMMARY</h2>
                                <p className="leading-relaxed">{data.summary}</p>
                            </div>
                        )}

                        {data.experience.length > 0 && (
                            <div className="p-4 flex-1 border-b-2 border-slate-900">
                                <h2 className="font-bold underline mb-4 text-sm">EXPERIENCE_LOG</h2>
                                <div className="flex flex-col gap-6">
                                    {data.experience.map(exp => (
                                        <div key={exp.id} className="grid grid-cols-[80px_1fr] gap-4 break-inside-avoid">
                                            <div className="text-[10px] border-r border-slate-300 pr-2 h-full">
                                                {exp.startDate}<br />
                                                |<br />
                                                {exp.isCurrent ? 'NOW' : exp.endDate}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm uppercase">{exp.role}</div>
                                                <div className="text-xs mb-2">@ {exp.company}</div>
                                                <p className="leading-snug text-slate-600">{exp.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.projects.length > 0 && (
                            <div className="p-4">
                                <h2 className="font-bold underline mb-4 text-sm">PROJECT_INDEX</h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {data.projects.map(proj => (
                                        <div key={proj.id} className="border border-dashed border-slate-400 p-2">
                                            <div className="font-bold">{proj.name}</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{proj.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

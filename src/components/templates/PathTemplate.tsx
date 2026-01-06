import React from 'react';
import { TemplateProps } from './shared';

export const PathTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white text-slate-800 font-sans p-10">
            <header className="pl-[29px]"> {/* Align with timeline line */}
                <h1 className="text-4xl font-bold text-indigo-600 mb-2">{data.fullName}</h1>
                <p className="text-xl font-medium text-slate-700 mb-6">{data.title}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mb-10">
                    {[data.email, data.phone].filter(Boolean).map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></div>
                            {t}
                        </div>
                    ))}
                    {data.location && (
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></div>
                            {data.location}
                        </div>
                    )}
                    {data.website && (
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></div>
                            {data.website}
                        </div>
                    )}
                </div>
            </header>

            <div className="flex gap-10 h-full">
                {/* Timeline Column */}
                <div className="flex-1 relative">
                    <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-indigo-100"></div>

                    <div className="flex flex-col gap-10 pb-10">
                        {data.summary && (
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm z-10"></div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-2">Profile</h2>
                                <p className="text-slate-600 leading-relaxed">{data.summary}</p>
                            </div>
                        )}

                        {data.experience.length > 0 && (
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm z-10"></div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-6">Experience Path</h2>
                                <div className="flex flex-col gap-8">
                                    {data.experience.map(exp => (
                                        <div key={exp.id} className="relative">
                                            <div className="absolute -left-[45px] top-1.5 w-2 h-2 rounded-full bg-indigo-200 border-2 border-white"></div>
                                            <div className="font-bold text-slate-900 text-lg">{exp.role}</div>
                                            <div className="flex justify-between items-baseline mb-2">
                                                <div className="text-indigo-600 font-medium">{exp.company}</div>
                                                <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{exp.startDate} - {exp.isCurrent ? 'Now' : exp.endDate}</div>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.education.length > 0 && (
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm z-10"></div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-6">Education</h2>
                                <div className="flex flex-col gap-6">
                                    {data.education.map(edu => (
                                        <div key={edu.id} className="relative">
                                            <div className="absolute -left-[45px] top-1.5 w-2 h-2 rounded-full bg-indigo-200 border-2 border-white"></div>
                                            <div className="font-bold text-slate-900">{edu.school}</div>
                                            <div className="text-sm text-slate-600">{edu.degree}</div>
                                            <div className="text-xs text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="w-1/3 pt-1">
                    <div className="sticky top-10 flex flex-col gap-10">
                        {data.skills.length > 0 && (
                            <section className="bg-slate-50 p-6 rounded-2xl">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-4">Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.map((s, i) => (
                                        <span key={i} className="bg-white border border-indigo-100 px-3 py-1 rounded-full text-xs font-medium text-indigo-800 shadow-sm">{s}</span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.projects.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-4 pl-2">Projects</h2>
                                <div className="flex flex-col gap-4">
                                    {data.projects.map(proj => (
                                        <div key={proj.id} className="border-l-2 border-indigo-100 pl-4 py-1 hover:border-indigo-400 transition-colors">
                                            <div className="font-bold text-slate-800">{proj.name}</div>
                                            <p className="text-xs text-slate-500 mt-1">{proj.description}</p>
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

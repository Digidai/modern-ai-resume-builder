import React from 'react';
import { TemplateProps } from './shared';

export const PopTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] bg-gradient-to-br from-indigo-50 to-pink-50 text-slate-800 font-sans p-10">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{data.fullName}</h1>
                <span className="inline-block bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-6">{data.title}</span>
                <div className="flex flex-wrap gap-3 text-sm">
                    {[data.email, data.phone, data.location].filter(Boolean).map((t, i) => (
                        <span key={i} className="bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">{t}</span>
                    ))}
                </div>
            </header>
            <div className="flex flex-col gap-8">
                {data.summary && (
                    <section className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                        <p className="text-slate-700 leading-relaxed">{data.summary}</p>
                    </section>
                )}
                {data.experience.length > 0 && (
                    <section>
                        <h2 className="inline-block bg-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">Experience</h2>
                        <div className="flex flex-col gap-6">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                                            <div className="text-indigo-600 font-medium">{exp.company}</div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{exp.startDate} - {exp.isCurrent ? 'Now' : exp.endDate}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                <div className="grid grid-cols-2 gap-6">
                    {data.skills.length > 0 && (
                        <section className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                            <h2 className="inline-block bg-emerald-500 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="bg-gradient-to-r from-indigo-100 to-pink-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}
                    {data.education.length > 0 && (
                        <section className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                            <h2 className="inline-block bg-amber-500 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">Education</h2>
                            <div className="flex flex-col gap-3">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-slate-900">{edu.school}</div>
                                        <div className="text-sm text-slate-600">{edu.degree}</div>
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

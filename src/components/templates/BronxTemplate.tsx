import React from 'react';
import { TemplateProps } from './shared';

export const BronxTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white text-slate-900 font-sans p-12">
            <header className="mb-16">
                <h1 className="text-8xl font-black tracking-tighter leading-[0.8] mb-6 uppercase break-words">{data.fullName}</h1>
                <div className="flex flex-col gap-2 border-t-4 border-black pt-6">
                    <div className="flex justify-between items-baseline">
                        <p className="text-2xl font-bold uppercase tracking-wide">{data.title}</p>
                        <div className="text-right font-bold text-sm">
                            {[data.email, data.phone].filter(Boolean).join('  /  ')}
                        </div>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-slate-500">
                        <div>{data.location}</div>
                        <div>{data.website}</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-[1fr_2fr] gap-16">

                <div className="flex flex-col gap-12">
                    {data.summary && (
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4">About</h2>
                            <p className="text-lg font-medium leading-tight">{data.summary}</p>
                        </section>
                    )}

                    {data.skills.length > 0 && (
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4">Skills</h2>
                            <div className="flex flex-col gap-2">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="text-xl font-bold leading-none hover:text-indigo-600 transition-colors cursor-default">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4">Education</h2>
                            <div className="flex flex-col gap-8">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-lg leading-tight">{edu.school}</div>
                                        <div className="text-sm font-medium text-slate-500 mt-1">{edu.degree}</div>
                                        <div className="text-xs font-bold mt-2">{edu.startDate} - {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="flex flex-col gap-16">
                    {data.experience.length > 0 && (
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 border-b-2 border-black pb-2">Experience</h2>
                            <div className="flex flex-col gap-12">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="group">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className="text-3xl font-bold leading-none group-hover:text-indigo-600 transition-colors">{exp.role}</h3>
                                            <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1">{exp.startDate} - {exp.isCurrent ? 'Now' : exp.endDate}</span>
                                        </div>
                                        <div className="text-xl font-medium text-slate-500 mb-4">{exp.company}</div>
                                        <p className="text-base font-medium leading-relaxed max-w-xl">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 border-b-2 border-black pb-2">Selected Projects</h2>
                            <div className="grid grid-cols-1 gap-8">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <div className="text-2xl font-bold mb-2">{proj.name}</div>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">{proj.description}</p>
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

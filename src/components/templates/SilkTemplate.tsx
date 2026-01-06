import React from 'react';
import { TemplateProps } from './shared';

export const SilkTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-stone-50 text-stone-800 font-sans p-12">
            <header className="text-center mb-16">
                <h1 className="text-5xl font-serif italic mb-4 text-stone-900">{data.fullName}</h1>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-500 mb-8">{data.title}</p>
                <div className="flex justify-center gap-8 text-sm font-medium text-stone-600">
                    {[data.email, data.phone, data.location].filter(Boolean).map((t, i) => (
                        <span key={i} className="border-b border-stone-200 pb-0.5">{t}</span>
                    ))}
                </div>
            </header>
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-12">
                {data.summary && (
                    <section className="text-center">
                        <p className="text-lg font-light leading-loose text-stone-700">{data.summary}</p>
                    </section>
                )}
                {data.experience.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-px bg-stone-200 flex-1"></div>
                            <h2 className="font-serif italic text-xl text-stone-400">Experience</h2>
                            <div className="h-px bg-stone-200 flex-1"></div>
                        </div>
                        <div className="flex flex-col gap-12">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="grid grid-cols-[1fr_3fr] gap-8">
                                    <div className="text-right">
                                        <div className="font-serif italic text-lg text-stone-900">{exp.company}</div>
                                        <div className="text-xs font-medium text-stone-400 mt-1 uppercase tracking-wider">{exp.startDate} — {exp.isCurrent ? 'Now' : exp.endDate}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-600 mb-3">{exp.role}</h3>
                                        <p className="text-stone-700 leading-relaxed font-light">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                <div className="grid grid-cols-2 gap-12">
                    {data.education.length > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="font-serif italic text-xl text-stone-400">Education</h2>
                                <div className="h-px bg-stone-200 flex-1"></div>
                            </div>
                            <div className="flex flex-col gap-6">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-stone-800">{edu.school}</div>
                                        <div className="text-sm text-stone-600 italic">{edu.degree}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    {data.skills.length > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="font-serif italic text-xl text-stone-400">Expertise</h2>
                                <div className="h-px bg-stone-200 flex-1"></div>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-3">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="text-sm font-light text-stone-700">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

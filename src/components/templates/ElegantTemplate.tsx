import React from 'react';
import { TemplateProps } from './shared';

export const ElegantTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full text-stone-800">
            <div className="flex justify-between items-end border-b-2 border-stone-300 pb-6 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-5xl font-light font-serif tracking-tight text-stone-900">{data.fullName}</h1>
                    <p className="text-xl text-stone-500 font-serif italic">{data.title}</p>
                </div>
                <div className="text-right text-sm text-stone-500 font-light flex flex-col gap-1">
                    {data.email && <div>{data.email}</div>}
                    {data.phone && <div>{data.phone}</div>}
                    {data.location && <div>{data.location}</div>}
                </div>
            </div>

            <div className="grid grid-cols-[1fr_2.5fr] gap-10">
                {/* Sidebar */}
                <div className="flex flex-col gap-8 text-right border-r border-stone-200 pr-8">
                    {data.skills.length > 0 && (
                        <section>
                            <h3 className="text-amber-700 font-serif text-lg italic mb-3">Expertise</h3>
                            <div className="flex flex-wrap justify-end gap-x-2 gap-y-1">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="text-sm font-medium text-stone-600">{s}{i < data.skills.length - 1 ? ',' : ''}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <h3 className="text-amber-700 font-serif text-lg italic mb-3">Education</h3>
                            <div className="flex flex-col gap-4">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-stone-900 text-sm">{edu.school}</div>
                                        <div className="text-sm italic text-stone-600">{edu.degree}</div>
                                        <div className="text-xs text-stone-400 mt-1">{edu.startDate}</div>
                                        <div className="text-xs text-stone-400">{edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {(data.website || data.linkedin) && (
                        <section>
                            <h3 className="text-amber-700 font-serif text-lg italic mb-3">Links</h3>
                            <div className="flex flex-col gap-1 text-sm text-stone-600">
                                {data.website && <div className="break-words">{data.website}</div>}
                                {data.linkedin && <div className="break-words">{data.linkedin}</div>}
                            </div>
                        </section>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex flex-col gap-10">
                    {data.summary && (
                        <section className="bg-stone-50 p-6 rounded-xl border border-stone-100">
                            <p className="text-stone-700 leading-relaxed font-serif text-lg italic text-center">"{data.summary}"</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <h3 className="text-xl font-serif text-stone-900 border-b border-stone-200 pb-2 mb-6">Professional History</h3>
                            <div className="flex flex-col gap-8">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="group">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="font-bold text-lg text-stone-900 group-hover:text-amber-700 transition-colors">{exp.role}</h4>
                                            <span className="text-sm text-stone-400 font-serif italic">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                        </div>
                                        <div className="text-amber-700 font-medium mb-2 text-sm uppercase tracking-wide">{exp.company}</div>
                                        <p className="text-stone-600 leading-relaxed text-sm">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <h3 className="text-xl font-serif text-stone-900 border-b border-stone-200 pb-2 mb-6">Key Projects</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <div className="font-bold text-stone-900 mb-1">{proj.name}</div>
                                        <p className="text-sm text-stone-600">{proj.description}</p>
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

import React from 'react';
import { TemplateProps } from './shared';

export const BerlinTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white text-black p-10 font-sans">
            <header className="pb-8 border-b-4 border-black mb-8">
                <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 leading-none">{data.fullName}</h1>
                <div className="flex justify-between items-end">
                    <p className="text-xl font-bold uppercase tracking-wide">{data.title}</p>
                    <div className="text-right text-sm font-medium">
                        {[data.email, data.phone, data.location].filter(Boolean).join(' / ')}
                        {data.website && <div>{data.website}</div>}
                    </div>
                </div>
            </header>

            <div className="flex flex-col gap-10">

                {data.summary && (
                    <section className="grid grid-cols-[150px_1fr] gap-8">
                        <h2 className="text-sm font-bold uppercase tracking-widest pt-1">About</h2>
                        <p className="text-lg leading-relaxed font-medium">{data.summary}</p>
                    </section>
                )}

                <div className="border-t border-black my-2"></div>

                {data.experience.length > 0 && (
                    <section className="grid grid-cols-[150px_1fr] gap-8">
                        <h2 className="text-sm font-bold uppercase tracking-widest pt-1">Experience</h2>
                        <div className="flex flex-col gap-10">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="grid grid-cols-[1fr_3fr] gap-6">
                                    <div>
                                        <div className="font-bold">{exp.startDate} –</div>
                                        <div className="font-bold">{exp.isCurrent ? 'Present' : exp.endDate}</div>
                                        <div className="text-sm text-slate-500 mt-1">{exp.company}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2 uppercase">{exp.role}</h3>
                                        <p className="text-base leading-relaxed text-slate-800">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="border-t border-black my-2"></div>

                <div className="grid grid-cols-2 gap-8">
                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">Education</h2>
                            <div className="flex flex-col gap-4">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-lg">{edu.school}</div>
                                        <div className="text-base">{edu.degree}</div>
                                        <div className="text-sm text-slate-500">{edu.startDate} – {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.skills.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">Competencies</h2>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {data.skills.map((s, i) => (
                                    <div key={i} className="font-medium text-base relative">
                                        <span className="absolute -left-3 top-2 w-1.5 h-1.5 bg-black rounded-full"></span>
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {data.projects.length > 0 && (
                    <>
                        <div className="border-t border-black my-2"></div>
                        <section className="grid grid-cols-[150px_1fr] gap-8">
                            <h2 className="text-sm font-bold uppercase tracking-widest pt-1">Projects</h2>
                            <div className="grid grid-cols-2 gap-8">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <div className="font-bold text-lg mb-1">{proj.name}</div>
                                        <p className="text-sm text-slate-600">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}

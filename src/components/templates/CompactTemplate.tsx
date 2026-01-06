import React from 'react';
import { TemplateProps } from './shared';

export const CompactTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col gap-5 text-sm">
            <header className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 uppercase leading-none">{data.fullName}</h1>
                    <p className="text-lg text-slate-600 font-medium mt-1">{data.title}</p>
                </div>
                <div className="text-right text-xs text-slate-500 leading-tight">
                    {data.email && <div>{data.email}</div>}
                    {data.phone && <div>{data.phone}</div>}
                    {data.location && <div>{data.location}</div>}
                    {data.website && <div>{data.website}</div>}
                    {data.linkedin && <div>{data.linkedin}</div>}
                </div>
            </header>

            {data.summary && (
                <section>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Summary</h3>
                    <p className="text-slate-800 leading-snug">{data.summary}</p>
                </section>
            )}

            <div className="grid grid-cols-1 gap-1">
                {data.skills.length > 0 && (
                    <section className="mb-2">
                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Skills</h3>
                        <p className="text-slate-800 font-medium text-xs">{data.skills.join(' • ')}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b border-slate-200">Experience</h3>
                        <div className="flex flex-col gap-3">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline">
                                        <div className="font-bold text-slate-900">{exp.role} <span className="font-normal text-slate-600">at {exp.company}</span></div>
                                        <div className="text-xs text-slate-500 whitespace-nowrap">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</div>
                                    </div>
                                    <p className="text-slate-700 mt-0.5 leading-snug text-xs">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-2 gap-4 mt-2">
                    {data.projects.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b border-slate-200">Projects</h3>
                            <div className="flex flex-col gap-2">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <div className="font-bold text-slate-900 text-xs">{proj.name}</div>
                                        <p className="text-slate-600 leading-tight text-xs">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b border-slate-200">Education</h3>
                            <div className="flex flex-col gap-2">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-slate-900 text-xs">{edu.school}</div>
                                        <div className="text-slate-600 text-xs">{edu.degree}</div>
                                        <div className="text-slate-400 text-[10px]">{edu.startDate} – {edu.endDate}</div>
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

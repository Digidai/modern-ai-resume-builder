import React from 'react';
import { TemplateProps } from './shared';

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col gap-6 font-serif">
            <header className="text-center pb-6 border-b-4 border-slate-800">
                <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-widest mb-2">{data.fullName}</h1>
                <div className="text-sm font-semibold tracking-widest text-slate-500 uppercase mb-4">{data.title}</div>
                <div className="flex justify-center flex-wrap gap-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {[data.email, data.phone, data.location, data.website].filter(Boolean).map((val, i) => (
                        <span key={i} className={i > 0 ? "border-l-2 border-slate-300 pl-4" : ""}>{val}</span>
                    ))}
                </div>
            </header>

            {data.summary && (
                <section>
                    <div className="flex items-center gap-4 mb-3">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Professional Summary</h2>
                        <div className="h-px bg-slate-300 w-full"></div>
                    </div>
                    <p className="text-sm text-slate-800 leading-7 text-justify">{data.summary}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Experience</h2>
                        <div className="h-px bg-slate-300 w-full"></div>
                    </div>
                    <div className="flex flex-col gap-5">
                        {data.experience.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-end mb-1">
                                    <h3 className="font-bold text-slate-900 text-base">{exp.company}</h3>
                                    <span className="text-sm font-bold text-slate-900">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                </div>
                                <div className="text-sm italic text-slate-600 mb-2">{exp.role}</div>
                                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-2 gap-8">
                {data.education.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Education</h2>
                            <div className="h-px bg-slate-300 w-full"></div>
                        </div>
                        <div className="flex flex-col gap-4">
                            {data.education.map((edu) => (
                                <div key={edu.id}>
                                    <div className="font-bold text-slate-900 text-sm">{edu.school}</div>
                                    <div className="text-sm text-slate-700">{edu.degree}</div>
                                    <div className="text-xs text-slate-500 italic mt-1">{edu.startDate} – {edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {data.skills.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Skills</h2>
                            <div className="h-px bg-slate-300 w-full"></div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {data.skills.map((skill, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-slate-800">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                    {skill}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

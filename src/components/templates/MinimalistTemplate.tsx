import React from 'react';
import { TemplateProps } from './shared';

export const MinimalistTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col gap-6 text-center md:text-left">
            <header className="flex flex-col items-center border-b-2 border-black pb-6 mb-2">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-2 tracking-tight">{data.fullName}</h1>
                <p className="text-lg md:text-xl text-slate-600 font-serif italic mb-4">{data.title}</p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                    {[data.email, data.phone, data.location, data.website, data.linkedin].filter(Boolean).map((item, i) => (
                        <span key={i} className="flex items-center">
                            {i > 0 && <span className="mx-2 text-slate-300">•</span>}
                            {item}
                        </span>
                    ))}
                </div>
            </header>

            {data.summary && (
                <section className="text-center max-w-2xl mx-auto">
                    <p className="text-slate-700 leading-relaxed text-sm md:text-base font-serif">{data.summary}</p>
                </section>
            )}

            {data.skills.length > 0 && (
                <section className="text-center border-y border-slate-100 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Core Competencies</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {data.skills.map((skill, index) => (
                            <span key={index} className="text-sm text-slate-800 font-medium">{skill}</span>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 gap-8 mt-4">
                {data.experience.length > 0 && (
                    <section>
                        <h2 className="text-xl font-serif font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Experience</h2>
                        <div className="flex flex-col gap-8">
                            {data.experience.map((exp) => (
                                <div key={exp.id} className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-2 md:gap-4">
                                    <div className="text-sm text-slate-500 font-medium pt-1">
                                        {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{exp.role}</h3>
                                        <div className="text-slate-700 font-medium italic mb-2 font-serif">{exp.company}</div>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <h2 className="text-xl font-serif font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.projects.map((proj) => (
                                <div key={proj.id}>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-slate-900">{proj.name}</h3>
                                        {proj.link && <span className="text-xs text-slate-400">{proj.link}</span>}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <h2 className="text-xl font-serif font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Education</h2>
                        <div className="flex flex-col gap-4">
                            {data.education.map((edu) => (
                                <div key={edu.id} className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{edu.school}</h3>
                                        <div className="text-slate-600 italic font-serif text-sm">{edu.degree}</div>
                                    </div>
                                    <div className="text-sm text-slate-500">{edu.startDate} — {edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

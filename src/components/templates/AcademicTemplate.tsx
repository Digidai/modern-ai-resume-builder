import React from 'react';
import { TemplateProps } from './shared';

export const AcademicTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col gap-4 font-serif text-slate-900">
            <header className="text-center border-b border-black pb-4 mb-2">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-1">{data.fullName}</h1>
                <div className="flex justify-center flex-wrap gap-3 text-sm">
                    {[data.location, data.phone, data.email, data.website].filter(Boolean).map((text, i) => (
                        <span key={i} className="flex items-center">
                            {i > 0 && <span className="mr-3">•</span>}
                            {text}
                        </span>
                    ))}
                </div>
            </header>

            {data.education.length > 0 && (
                <section>
                    <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-3">Education</h2>
                    <div className="flex flex-col gap-2">
                        {data.education.map((edu) => (
                            <div key={edu.id} className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-base">{edu.school}</div>
                                    <div className="italic text-slate-800">{edu.degree}</div>
                                </div>
                                <div className="text-sm font-medium whitespace-nowrap">{edu.startDate} – {edu.endDate}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-3">Professional Experience</h2>
                    <div className="flex flex-col gap-5">
                        {data.experience.map(exp => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline">
                                    <div className="font-bold text-lg">{exp.company}</div>
                                    <div className="text-sm font-medium">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</div>
                                </div>
                                <div className="italic text-slate-700 mb-1">{exp.role}</div>
                                <p className="text-sm leading-relaxed text-justify">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.projects.length > 0 && (
                <section>
                    <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-3">Projects</h2>
                    <div className="flex flex-col gap-3">
                        {data.projects.map(proj => (
                            <div key={proj.id}>
                                <div className="font-bold">{proj.name} <span className="font-normal text-sm italic ml-1">{proj.link && `(${proj.link})`}</span></div>
                                <p className="text-sm leading-snug">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.skills.length > 0 && (
                <section>
                    <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-2">Technical Skills</h2>
                    <p className="text-sm leading-relaxed">
                        {data.skills.join(', ')}
                    </p>
                </section>
            )}
        </div>
    );
};

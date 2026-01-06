import React from 'react';
import { TemplateProps } from './shared';

export const TechTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] gap-6 font-mono text-sm text-slate-800">
            <header className="mb-4">
                <h1 className="text-2xl font-bold text-indigo-600 mb-2">{`> ${data.fullName}`}</h1>
                <p className="text-slate-600 mb-4">{`// ${data.title}`}</p>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    {data.email && <span>{`const email = "${data.email}";`}</span>}
                    {data.phone && <span>{`const phone = "${data.phone}";`}</span>}
                    {data.location && <span>{`const loc = "${data.location}";`}</span>}
                </div>
            </header>

            {data.summary && (
                <section>
                    <h2 className="text-indigo-600 font-bold mb-2">/* SUMMARY */</h2>
                    <p className="text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-3">{data.summary}</p>
                </section>
            )}

            {data.skills.length > 0 && (
                <section>
                    <h2 className="text-indigo-600 font-bold mb-2">/* SKILLS */</h2>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs leading-6">
                        <span className="text-purple-600">export default</span> [
                        {data.skills.map((s, i) => (
                            <span key={i} className="text-slate-700"> "{s}"{i < data.skills.length - 1 ? ',' : ''}</span>
                        ))}
                        ]
                    </div>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <h2 className="text-indigo-600 font-bold mb-4">/* EXPERIENCE */</h2>
                    <div className="flex flex-col gap-6">
                        {data.experience.map(exp => (
                            <div key={exp.id}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-slate-900">{exp.role}</span>
                                    <span className="text-purple-600">@</span>
                                    <span className="font-bold text-slate-900">{exp.company}</span>
                                </div>
                                <div className="text-xs text-slate-400 mb-2">{`{ ${exp.startDate} ... ${exp.isCurrent ? 'NOW' : exp.endDate} }`}</div>
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.projects.length > 0 && (
                    <section>
                        <h2 className="text-indigo-600 font-bold mb-3">/* PROJECTS */</h2>
                        <div className="flex flex-col gap-4">
                            {data.projects.map(proj => (
                                <div key={proj.id}>
                                    <div className="font-bold text-slate-800">{proj.name}</div>
                                    <p className="text-slate-600 text-xs mt-1">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {data.education.length > 0 && (
                    <section>
                        <h2 className="text-indigo-600 font-bold mb-3">/* EDUCATION */</h2>
                        <div className="flex flex-col gap-4">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="font-bold text-slate-800">{edu.school}</div>
                                    <div className="text-xs text-slate-600">{edu.degree}</div>
                                    <div className="text-xs text-slate-400">{edu.startDate} - {edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

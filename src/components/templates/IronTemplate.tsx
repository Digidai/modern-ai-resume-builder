import React from 'react';
import { TemplateProps } from './shared';

export const IronTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] bg-white text-slate-900 font-sans">
            <header className="bg-black text-white p-10">
                <h1 className="text-5xl font-black tracking-tight mb-2 uppercase">{data.fullName}</h1>
                <p className="text-xl font-medium text-slate-400 uppercase tracking-widest mb-6">{data.title}</p>
                <div className="flex gap-6 text-sm font-bold text-slate-300">
                    {[data.email, data.phone].filter(Boolean).map((t, i) => <span key={i}>{t}</span>)}
                </div>
            </header>

            <div className="p-10 flex flex-col gap-10">

                {data.summary && (
                    <section>
                        <div className="bg-black text-white inline-block px-4 py-1 font-bold uppercase tracking-widest text-sm mb-4">Profile</div>
                        <p className="text-lg font-medium leading-relaxed max-w-3xl">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <div className="bg-black text-white inline-block px-4 py-1 font-bold uppercase tracking-widest text-sm mb-6">Experience</div>
                        <div className="border-l-4 border-black pl-6 flex flex-col gap-8">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-2xl font-bold uppercase">{exp.role}</h3>
                                        <span className="font-bold text-sm bg-slate-100 px-2 py-1">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                    </div>
                                    <div className="text-lg font-bold text-slate-500 mb-2">{exp.company}</div>
                                    <p className="text-base font-medium leading-relaxed">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-2 gap-10">
                    {data.education.length > 0 && (
                        <section>
                            <div className="bg-black text-white inline-block px-4 py-1 font-bold uppercase tracking-widest text-sm mb-6">Education</div>
                            <div className="flex flex-col gap-4">
                                {data.education.map(edu => (
                                    <div key={edu.id} className="border-b-2 border-slate-100 pb-4">
                                        <div className="font-bold text-lg">{edu.school}</div>
                                        <div className="text-slate-600 font-bold">{edu.degree}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.skills.length > 0 && (
                        <section>
                            <div className="bg-black text-white inline-block px-4 py-1 font-bold uppercase tracking-widest text-sm mb-6">Skills</div>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="font-black text-lg border-b-2 border-black leading-none">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

            </div>
        </div>
    )
}

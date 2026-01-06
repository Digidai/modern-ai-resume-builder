import React from 'react';
import { TemplateProps } from './shared';

export const SwissTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white font-sans text-slate-900 p-10 print:p-0">
            {/* Header Grid */}
            <div className="grid grid-cols-[1fr_2fr] gap-8 mb-12">
                <div className="bg-slate-900 text-white p-6 flex flex-col justify-between">
                    <h1 className="text-5xl font-black leading-none tracking-tighter uppercase">{data.fullName.split(' ').map((n, i) => <span key={i} className="block">{n}</span>)}</h1>
                </div>
                <div className="flex flex-col justify-end pb-2">
                    <p className="text-2xl font-bold uppercase tracking-tight mb-6 text-slate-900">{data.title}</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-medium">
                        {data.email && <div className="border-t-2 border-slate-900 pt-1">{data.email}</div>}
                        {data.phone && <div className="border-t-2 border-slate-900 pt-1">{data.phone}</div>}
                        {data.location && <div className="border-t-2 border-slate-900 pt-1">{data.location}</div>}
                        {data.website && <div className="border-t-2 border-slate-900 pt-1 break-words">{data.website}</div>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-[1fr_2fr] gap-8 flex-1">
                {/* Left Column */}
                <div className="flex flex-col gap-10">
                    {data.skills.length > 0 && (
                        <section>
                            <h2 className="text-sm font-black uppercase tracking-widest mb-4 break-after-avoid">Skills</h2>
                            <div className="flex flex-col gap-2">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="text-sm font-bold border-l-4 border-slate-900 pl-2 leading-none py-1">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-sm font-black uppercase tracking-widest mb-4 break-after-avoid">Education</h2>
                            <div className="flex flex-col gap-6">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-sm leading-tight">{edu.school}</div>
                                        <div className="text-sm text-slate-600 mt-1">{edu.degree}</div>
                                        <div className="text-xs font-mono mt-1 text-slate-500">{edu.startDate} – {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-12">
                    {data.summary && (
                        <section>
                            <p className="text-lg font-medium leading-relaxed indent-12">{data.summary}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b-4 border-slate-900 pb-2 break-after-avoid">Experience</h2>
                            <div className="flex flex-col gap-8">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="grid grid-cols-[100px_1fr] gap-6 break-inside-avoid">
                                        <div className="text-xs font-bold font-mono py-1">{exp.startDate}<br />|<br />{exp.isCurrent ? 'NOW' : exp.endDate}</div>
                                        <div>
                                            <h3 className="text-xl font-bold leading-none mb-1">{exp.role}</h3>
                                            <div className="text-sm font-bold uppercase tracking-wide mb-3 text-slate-500">{exp.company}</div>
                                            <p className="text-sm leading-relaxed text-slate-800">{exp.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b-4 border-slate-900 pb-2 break-after-avoid">Projects</h2>
                            <div className="grid grid-cols-2 gap-6">
                                {data.projects.map(proj => (
                                    <div key={proj.id} className="bg-slate-50 p-4 break-inside-avoid">
                                        <div className="font-bold text-base mb-2">{proj.name}</div>
                                        <p className="text-xs leading-relaxed text-slate-600">{proj.description}</p>
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

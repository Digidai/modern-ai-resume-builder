import React from 'react';
import { TemplateProps, ContactItem } from './shared';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from '../Icons';

export const ModaTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm] bg-white text-slate-900 p-12">
            <header className="text-center mb-10">
                <h1 className="text-5xl font-extrabold tracking-tight">{data.fullName}</h1>
                <p className="mt-2 text-sm uppercase tracking-[0.3em] text-slate-500">{data.title}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs text-slate-600">
                    {data.email && <ContactItem icon={MailIcon} value={data.email} />}
                    {data.phone && <ContactItem icon={PhoneIcon} value={data.phone} />}
                    {data.location && <ContactItem icon={MapPinIcon} value={data.location} />}
                    {data.website && <ContactItem icon={GlobeIcon} value={data.website} />}
                    {data.linkedin && <ContactItem icon={LinkedinIcon} value={data.linkedin} />}
                </div>
            </header>

            <div className="grid grid-cols-3 gap-8 flex-1">
                <aside className="col-span-1 flex flex-col gap-8 border-r border-slate-200 pr-6">
                    {data.skills.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((s, i) => (
                                    <span key={i} className="px-2 py-1 border border-slate-300 rounded-full text-xs">{s}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Education</h2>
                            <div className="flex flex-col gap-3 text-sm">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-semibold">{edu.school}</div>
                                        <div className="text-slate-600">{edu.degree}</div>
                                        <div className="text-xs text-slate-500">{edu.startDate} — {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>

                <main className="col-span-2 flex flex-col gap-8">
                    {data.summary && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Profile</h2>
                            <p className="text-sm leading-relaxed text-justify">{data.summary}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Experience</h2>
                            <div className="flex flex-col gap-6">
                                {data.experience.map(exp => (
                                    <div key={exp.id}>
                                        <div className="flex justify-between items-baseline gap-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{exp.role}</h3>
                                                <div className="text-sm text-slate-600">{exp.company}</div>
                                            </div>
                                            <div className="text-xs text-slate-500 whitespace-nowrap">
                                                {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Projects</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {data.projects.map(proj => (
                                    <div key={proj.id} className="border border-slate-200 rounded-lg p-3">
                                        <div className="font-semibold text-sm">{proj.name}</div>
                                        {proj.link && (
                                            <div className="text-xs text-indigo-600 break-all">{proj.link}</div>
                                        )}
                                        <p className="text-xs text-slate-700 mt-1">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    )
}

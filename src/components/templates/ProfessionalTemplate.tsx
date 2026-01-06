import React from 'react';
import { TemplateProps } from './shared';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from '../Icons';

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-white">
            <header className="bg-slate-900 text-white p-8 pb-12">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">{data.fullName}</h1>
                        <p className="text-blue-200 text-lg font-medium">{data.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 text-sm text-slate-300">
                        {data.email && <div className="flex items-center gap-2"><span>{data.email}</span><MailIcon className="w-3.5 h-3.5" /></div>}
                        {data.phone && <div className="flex items-center gap-2"><span>{data.phone}</span><PhoneIcon className="w-3.5 h-3.5" /></div>}
                        {data.location && <div className="flex items-center gap-2"><span>{data.location}</span><MapPinIcon className="w-3.5 h-3.5" /></div>}
                        {data.linkedin && <div className="flex items-center gap-2"><span>{data.linkedin}</span><LinkedinIcon className="w-3.5 h-3.5" /></div>}
                        {data.website && <div className="flex items-center gap-2"><span>{data.website}</span><GlobeIcon className="w-3.5 h-3.5" /></div>}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 -mt-4 px-6 pb-6 gap-6">
                {/* Main Column */}
                <div className="w-2/3 bg-white shadow-sm p-6 pt-0 rounded-t-lg z-10 flex flex-col gap-8">
                    {data.summary && (
                        <section className="pt-6">
                            <h3 className="text-blue-900 font-bold uppercase tracking-wider mb-3 border-b-2 border-blue-900 pb-1">Profile</h3>
                            <p className="text-slate-700 leading-relaxed text-sm text-justify">{data.summary}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <h3 className="text-blue-900 font-bold uppercase tracking-wider mb-4 border-b-2 border-blue-900 pb-1">Experience</h3>
                            <div className="flex flex-col gap-6">
                                {data.experience.map(exp => (
                                    <div key={exp.id}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-slate-900 text-lg">{exp.role}</h4>
                                            <span className="text-sm font-semibold text-slate-500">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                        </div>
                                        <div className="text-blue-700 font-medium mb-2">{exp.company}</div>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <h3 className="text-blue-900 font-bold uppercase tracking-wider mb-4 border-b-2 border-blue-900 pb-1">Projects</h3>
                            <div className="grid grid-cols-1 gap-5">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <div className="font-bold text-slate-900">{proj.name}</div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="w-1/3 pt-6 flex flex-col gap-8">
                    {data.skills.length > 0 && (
                        <section>
                            <h3 className="text-slate-900 font-bold uppercase tracking-widest text-sm mb-3">Core Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-sm font-medium w-full block border-l-4 border-blue-600">{skill}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education.length > 0 && (
                        <section>
                            <h3 className="text-slate-900 font-bold uppercase tracking-widest text-sm mb-3">Education</h3>
                            <div className="flex flex-col gap-4">
                                {data.education.map((edu) => (
                                    <div key={edu.id} className="bg-slate-50 p-3 rounded border border-slate-100">
                                        <div className="font-bold text-slate-900 text-sm">{edu.school}</div>
                                        <div className="text-xs text-blue-700 font-medium my-0.5">{edu.degree}</div>
                                        <div className="text-xs text-slate-500">{edu.startDate} — {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

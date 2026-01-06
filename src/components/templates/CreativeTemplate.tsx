import React from 'react';
import { TemplateProps } from './shared';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon } from '../Icons';

export const CreativeTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col min-h-[297mm]">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">{data.fullName}</h1>
                <p className="text-emerald-100 text-lg font-medium">{data.title}</p>
            </div>

            <div className="flex flex-1">
                {/* Left Column (Narrow) */}
                <div className="w-1/3 bg-slate-50 p-6 border-r border-slate-100 flex flex-col gap-8">
                    <div className="flex flex-col gap-3 text-sm text-slate-600">
                        {data.email && <div className="flex items-center gap-2 break-all"><MailIcon className="w-4 h-4 text-emerald-600 shrink-0" /> {data.email}</div>}
                        {data.phone && <div className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-emerald-600 shrink-0" /> {data.phone}</div>}
                        {data.location && <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-emerald-600 shrink-0" /> {data.location}</div>}
                        {data.website && <div className="flex items-center gap-2 break-all"><GlobeIcon className="w-4 h-4 text-emerald-600 shrink-0" /> {data.website}</div>}
                    </div>

                    {data.skills.length > 0 && (
                        <div>
                            <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-sm mb-3 border-b-2 border-emerald-200 pb-1 inline-block">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="bg-white border border-slate-200 px-2 py-1 rounded text-xs font-medium text-slate-700">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.education.length > 0 && (
                        <div>
                            <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-sm mb-3 border-b-2 border-emerald-200 pb-1 inline-block">Education</h3>
                            <div className="flex flex-col gap-4">
                                {data.education.map((edu) => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-slate-800 text-sm">{edu.school}</div>
                                        <div className="text-xs text-slate-500">{edu.degree}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{edu.startDate} - {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (Wide) */}
                <div className="w-2/3 p-8 flex flex-col gap-8">
                    {data.summary && (
                        <section>
                            <h3 className="text-emerald-600 font-bold text-xl mb-3">Profile</h3>
                            <p className="text-slate-700 leading-relaxed text-sm">{data.summary}</p>
                        </section>
                    )}

                    {data.experience.length > 0 && (
                        <section>
                            <h3 className="text-emerald-600 font-bold text-xl mb-4">Experience</h3>
                            <div className="flex flex-col gap-6">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="relative pl-4 border-l-2 border-slate-200">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-slate-800 text-lg">{exp.role}</h4>
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                        </div>
                                        <div className="text-slate-500 font-medium text-sm mb-2">{exp.company}</div>
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.projects.length > 0 && (
                        <section>
                            <h3 className="text-emerald-600 font-bold text-xl mb-4">Projects</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <div className="font-bold text-slate-800">{proj.name}</div>
                                        <p className="text-sm text-slate-600">{proj.description}</p>
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

import React from 'react';
import { TemplateProps } from './shared';

export const SidebarTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-row h-full min-h-[29.7cm]">
            {/* Sidebar */}
            <div className="w-1/3 bg-slate-900 text-slate-200 p-8 flex flex-col gap-8">
                <div className="flex flex-col gap-1 mb-4">
                    <h1 className="text-3xl font-bold text-white tracking-wider leading-tight">{data.fullName}</h1>
                    <p className="text-indigo-400 font-medium text-lg">{data.title}</p>
                </div>

                <div className="flex flex-col gap-4 text-sm text-slate-300">
                    {data.email && <div className="break-all"><span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Email</span>{data.email}</div>}
                    {data.phone && <div><span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Phone</span>{data.phone}</div>}
                    {data.location && <div><span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Location</span>{data.location}</div>}
                    {data.website && <div className="break-all"><span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Portfolio</span>{data.website}</div>}
                    {data.linkedin && <div className="break-all"><span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">LinkedIn</span>{data.linkedin}</div>}
                </div>

                {data.skills.length > 0 && (
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-white border-b border-slate-700 pb-2 mb-4">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}

                {data.education.length > 0 && (
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-white border-b border-slate-700 pb-2 mb-4">Education</h2>
                        <div className="flex flex-col gap-4">
                            {data.education.map((edu) => (
                                <div key={edu.id}>
                                    <div className="font-bold text-white text-sm">{edu.school}</div>
                                    <div className="text-xs text-slate-400 mb-1">{edu.degree}</div>
                                    <div className="text-xs text-slate-500">{edu.startDate} — {edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="w-2/3 p-8 bg-white text-slate-900 flex flex-col gap-8">
                {data.summary && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <span className="w-8 h-1 bg-slate-900"></span> Profile
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-sm text-justify">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                            <span className="w-8 h-1 bg-slate-900"></span> Experience
                        </h2>
                        <div className="flex flex-col gap-8 border-l-2 border-slate-100 pl-6 ml-1">
                            {data.experience.map((exp) => (
                                <div key={exp.id} className="relative">
                                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-slate-200 rounded-full border-2 border-white"></div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-slate-900 text-lg">{exp.role}</h3>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-slate-500 mb-3">
                                        <span className="font-semibold text-indigo-600">{exp.company}</span>
                                        <span>{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <span className="w-8 h-1 bg-slate-900"></span> Projects
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {data.projects.map((proj) => (
                                <div key={proj.id} className="bg-slate-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h3 className="font-bold text-slate-900">{proj.name}</h3>
                                        {proj.link && <a href={`https://${proj.link}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">{proj.link}</a>}
                                    </div>
                                    <p className="text-sm text-slate-600">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

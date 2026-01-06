import React from 'react';
import { TemplateProps, ContactItem } from './shared';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from '../Icons';

export const CastTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full bg-[#fafafa] text-slate-900 font-mono p-10 md:p-12 text-sm leading-relaxed">
            <header className="mb-8 border-b border-slate-300 pb-6">
                <h1 className="text-4xl font-bold uppercase tracking-[0.2em]">{data.fullName}</h1>
                <p className="text-lg text-slate-600 mt-2 tracking-wider">{data.title}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-600">
                    {data.email && <ContactItem icon={MailIcon} value={data.email} />}
                    {data.phone && <ContactItem icon={PhoneIcon} value={data.phone} />}
                    {data.location && <ContactItem icon={MapPinIcon} value={data.location} />}
                    {data.website && <ContactItem icon={GlobeIcon} value={data.website} />}
                    {data.linkedin && <ContactItem icon={LinkedinIcon} value={data.linkedin} />}
                </div>
            </header>

            {data.summary && (
                <section className="mb-8">
                    <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-2">INT. PROFILE — DAY</h2>
                    <p className="whitespace-pre-wrap">{data.summary}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">INT. EXPERIENCE — CONTINUOUS</h2>
                    <div className="flex flex-col gap-6">
                        {data.experience.map(exp => (
                            <div key={exp.id} className="grid grid-cols-5 gap-4">
                                <div className="col-span-1 text-xs text-slate-500 whitespace-nowrap">
                                    {exp.startDate}–{exp.isCurrent ? 'Present' : exp.endDate}
                                </div>
                                <div className="col-span-4">
                                    <div className="font-bold uppercase tracking-wide">{exp.role}</div>
                                    <div className="text-slate-600">{exp.company}</div>
                                    <p className="mt-1 whitespace-pre-wrap">{exp.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-2 gap-8">
                {data.skills.length > 0 && (
                    <section>
                        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-2">INT. SKILLS</h2>
                        <ul className="list-disc list-inside space-y-1">
                            {data.skills.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-2">INT. EDUCATION</h2>
                        <div className="flex flex-col gap-3">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="font-bold">{edu.school}</div>
                                    <div className="text-slate-600">{edu.degree}</div>
                                    <div className="text-xs text-slate-500">{edu.startDate}–{edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {data.projects.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-2">INT. PROJECTS</h2>
                    <div className="flex flex-col gap-4">
                        {data.projects.map(proj => (
                            <div key={proj.id}>
                                <div className="font-bold uppercase tracking-wide">
                                    {proj.name}
                                    {proj.link && (
                                        <span className="text-xs font-normal text-slate-500"> ({proj.link})</span>
                                    )}
                                </div>
                                <p className="mt-1">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

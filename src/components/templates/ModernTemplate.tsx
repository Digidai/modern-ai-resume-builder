import React from 'react';
import { TemplateProps, ContactItem } from './shared';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from '../Icons';

export const ModernTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="flex flex-col gap-8">
            <header className="border-b border-slate-200 pb-8 print:pb-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase">{data.fullName}</h1>
                <p className="text-xl text-slate-600 mt-2 font-light tracking-wide">{data.title}</p>
                <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-600 print:mt-4">
                    {data.email && <ContactItem icon={MailIcon} value={data.email} />}
                    {data.phone && <ContactItem icon={PhoneIcon} value={data.phone} />}
                    {data.location && <ContactItem icon={MapPinIcon} value={data.location} />}
                    {data.website && <ContactItem icon={GlobeIcon} value={data.website} />}
                    {data.linkedin && <ContactItem icon={LinkedinIcon} value={data.linkedin} />}
                </div>
            </header>

            {data.summary && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 print:mb-2">Profile</h2>
                    <p className="text-slate-700 leading-relaxed text-sm text-justify">{data.summary}</p>
                </section>
            )}

            {data.experience.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 print:mb-2">Experience</h2>
                    <div className="flex flex-col gap-6 print:gap-4">
                        {data.experience.map((exp) => (
                            <div key={exp.id} className="break-inside-avoid">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-slate-900">{exp.role}</h3>
                                    <span className="text-sm text-slate-500 whitespace-nowrap">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                                </div>
                                <div className="text-slate-600 font-medium mb-2">{exp.company}</div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.skills.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 print:mb-2">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 print:bg-transparent print:border-slate-300">{skill}</span>
                        ))}
                    </div>
                </section>
            )}

            {data.education.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 print:mb-2">Education</h2>
                    <div className="flex flex-col gap-4">
                        {data.education.map((edu) => (
                            <div key={edu.id} className="flex justify-between items-start break-inside-avoid">
                                <div>
                                    <h3 className="font-bold text-slate-900">{edu.school}</h3>
                                    <div className="text-sm text-slate-600">{edu.degree}</div>
                                </div>
                                <span className="text-sm text-slate-500 whitespace-nowrap">{edu.startDate} — {edu.endDate}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

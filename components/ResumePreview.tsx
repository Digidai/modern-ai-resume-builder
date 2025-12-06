import React from 'react';
import { ResumeData } from '../types';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from './Icons';

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
  return (
    <div className="bg-white text-slate-900 w-full h-full min-h-[29.7cm] shadow-xl print:shadow-none p-12 md:p-16 flex flex-col gap-8 print:p-0 print:gap-6">
      
      {/* Header */}
      <header className="border-b border-slate-200 pb-8 print:pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase">{data.fullName}</h1>
        <p className="text-xl text-slate-600 mt-2 font-light tracking-wide">{data.title}</p>
        
        <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-600 print:mt-4">
          {data.email && (
            <div className="flex items-center gap-1.5">
              <MailIcon className="w-4 h-4" />
              <span>{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-1.5">
              <PhoneIcon className="w-4 h-4" />
              <span>{data.phone}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4" />
              <span>{data.location}</span>
            </div>
          )}
          {data.website && (
            <div className="flex items-center gap-1.5">
              <GlobeIcon className="w-4 h-4" />
              <span>{data.website}</span>
            </div>
          )}
           {data.linkedin && (
            <div className="flex items-center gap-1.5">
              <LinkedinIcon className="w-4 h-4" />
              <span>{data.linkedin}</span>
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 print:mb-2">Profile</h2>
          <p className="text-slate-700 leading-relaxed text-sm text-justify">
            {data.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 print:mb-2">Experience</h2>
          <div className="flex flex-col gap-6 print:gap-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-900">{exp.role}</h3>
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-slate-600 font-medium mb-2">{exp.company}</div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 print:mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 print:bg-transparent print:border-slate-300">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
       {data.projects.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 print:mb-2">Projects</h2>
          <div className="flex flex-col gap-4 print:gap-3">
            {data.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-900">{proj.name}</h3>
                  {proj.link && <span className="text-xs text-slate-500">{proj.link}</span>}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 print:mb-2">Education</h2>
          <div className="flex flex-col gap-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{edu.school}</h3>
                  <div className="text-sm text-slate-600">{edu.degree}</div>
                </div>
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  {edu.startDate} — {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResumePreview;
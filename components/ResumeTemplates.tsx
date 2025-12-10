import React from 'react';
import { ResumeData } from '../types';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from './Icons';

interface TemplateProps {
  data: ResumeData;
}

// Helper to render contact info consistently
const ContactItem = ({ icon: Icon, value }: { icon: any, value: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon className="w-3.5 h-3.5" />
    <span>{value}</span>
  </div>
);

// --- 1. MODERN ---
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
              <div key={exp.id}>
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
              <div key={edu.id} className="flex justify-between items-start">
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

// --- 2. MINIMALIST ---
export const MinimalistTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-6 text-center md:text-left">
      <header className="flex flex-col items-center border-b-2 border-black pb-6 mb-2">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-2 tracking-tight">{data.fullName}</h1>
        <p className="text-lg md:text-xl text-slate-600 font-serif italic mb-4">{data.title}</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
          {[data.email, data.phone, data.location, data.website, data.linkedin].filter(Boolean).map((item, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mx-2 text-slate-300">•</span>}
              {item}
            </span>
          ))}
        </div>
      </header>

      {data.summary && (
        <section className="text-center max-w-2xl mx-auto">
          <p className="text-slate-700 leading-relaxed text-sm md:text-base font-serif">{data.summary}</p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="text-center border-y border-slate-100 py-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Core Competencies</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {data.skills.map((skill, index) => (
              <span key={index} className="text-sm text-slate-800 font-medium">{skill}</span>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 mt-4">
        {data.experience.length > 0 && (
          <section>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Experience</h2>
            <div className="flex flex-col gap-8">
              {data.experience.map((exp) => (
                <div key={exp.id} className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-2 md:gap-4">
                  <div className="text-sm text-slate-500 font-medium pt-1">
                    {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{exp.role}</h3>
                    <div className="text-slate-700 font-medium italic mb-2 font-serif">{exp.company}</div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects.length > 0 && (
          <section>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900">{proj.name}</h3>
                    {proj.link && <span className="text-xs text-slate-400">{proj.link}</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Education</h2>
            <div className="flex flex-col gap-4">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">{edu.school}</h3>
                    <div className="text-slate-600 italic font-serif text-sm">{edu.degree}</div>
                  </div>
                  <div className="text-sm text-slate-500">{edu.startDate} — {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// --- 3. SIDEBAR ---
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

// --- 4. EXECUTIVE ---
export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-6 font-serif">
      <header className="text-center pb-6 border-b-4 border-slate-800">
        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-widest mb-2">{data.fullName}</h1>
        <div className="text-sm font-semibold tracking-widest text-slate-500 uppercase mb-4">{data.title}</div>
        <div className="flex justify-center flex-wrap gap-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
          {[data.email, data.phone, data.location, data.website].filter(Boolean).map((val, i) => (
            <span key={i} className={i > 0 ? "border-l-2 border-slate-300 pl-4" : ""}>{val}</span>
          ))}
        </div>
      </header>

      {data.summary && (
        <section>
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Professional Summary</h2>
            <div className="h-px bg-slate-300 w-full"></div>
          </div>
          <p className="text-sm text-slate-800 leading-7 text-justify">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Experience</h2>
            <div className="h-px bg-slate-300 w-full"></div>
          </div>
          <div className="flex flex-col gap-5">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-end mb-1">
                  <h3 className="font-bold text-slate-900 text-base">{exp.company}</h3>
                  <span className="text-sm font-bold text-slate-900">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <div className="text-sm italic text-slate-600 mb-2">{exp.role}</div>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-8">
        {data.education.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Education</h2>
              <div className="h-px bg-slate-300 w-full"></div>
            </div>
            <div className="flex flex-col gap-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="font-bold text-slate-900 text-sm">{edu.school}</div>
                  <div className="text-sm text-slate-700">{edu.degree}</div>
                  <div className="text-xs text-slate-500 italic mt-1">{edu.startDate} – {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.skills.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 min-w-fit">Skills</h2>
              <div className="h-px bg-slate-300 w-full"></div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {data.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-slate-800">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  {skill}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// --- 5. CREATIVE (Split layout with colorful sidebar) ---
export const CreativeTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full">
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

// --- 6. COMPACT (Single column, dense) ---
export const CompactTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <header className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase leading-none">{data.fullName}</h1>
          <p className="text-lg text-slate-600 font-medium mt-1">{data.title}</p>
        </div>
        <div className="text-right text-xs text-slate-500 leading-tight">
          {data.email && <div>{data.email}</div>}
          {data.phone && <div>{data.phone}</div>}
          {data.location && <div>{data.location}</div>}
          {data.website && <div>{data.website}</div>}
          {data.linkedin && <div>{data.linkedin}</div>}
        </div>
      </header>

      {data.summary && (
        <section>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Summary</h3>
          <p className="text-slate-800 leading-snug">{data.summary}</p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-1">
        {data.skills.length > 0 && (
          <section className="mb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Skills</h3>
            <p className="text-slate-800 font-medium text-xs">{data.skills.join(' • ')}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b border-slate-200">Experience</h3>
            <div className="flex flex-col gap-3">
              {data.experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <div className="font-bold text-slate-900">{exp.role} <span className="font-normal text-slate-600">at {exp.company}</span></div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</div>
                  </div>
                  <p className="text-slate-700 mt-0.5 leading-snug text-xs">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-4 mt-2">
          {data.projects.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b border-slate-200">Projects</h3>
              <div className="flex flex-col gap-2">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <div className="font-bold text-slate-900 text-xs">{proj.name}</div>
                    <p className="text-slate-600 leading-tight text-xs">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b border-slate-200">Education</h3>
              <div className="flex flex-col gap-2">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <div className="font-bold text-slate-900 text-xs">{edu.school}</div>
                    <div className="text-slate-600 text-xs">{edu.degree}</div>
                    <div className="text-slate-400 text-[10px]">{edu.startDate} – {edu.endDate}</div>
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

// --- 7. TECH (Monospace, terminal style) ---
export const TechTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-6 font-mono text-sm text-slate-800">
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

// --- 8. PROFESSIONAL (Corporate, clean, 2-column) ---
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

// --- 9. ACADEMIC (Serif, dense, traditional) ---
export const AcademicTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-4 font-serif text-slate-900">
      <header className="text-center border-b border-black pb-4 mb-2">
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-1">{data.fullName}</h1>
        <div className="flex justify-center flex-wrap gap-3 text-sm">
          {[data.location, data.phone, data.email, data.website].filter(Boolean).map((text, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mr-3">•</span>}
              {text}
            </span>
          ))}
        </div>
      </header>

      {data.education.length > 0 && (
        <section>
          <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-3">Education</h2>
          <div className="flex flex-col gap-2">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-base">{edu.school}</div>
                  <div className="italic text-slate-800">{edu.degree}</div>
                </div>
                <div className="text-sm font-medium whitespace-nowrap">{edu.startDate} – {edu.endDate}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.experience.length > 0 && (
        <section>
          <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-3">Professional Experience</h2>
          <div className="flex flex-col gap-5">
            {data.experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div className="font-bold text-lg">{exp.company}</div>
                  <div className="text-sm font-medium">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</div>
                </div>
                <div className="italic text-slate-700 mb-1">{exp.role}</div>
                <p className="text-sm leading-relaxed text-justify">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.projects.length > 0 && (
        <section>
          <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-3">Projects</h2>
          <div className="flex flex-col gap-3">
            {data.projects.map(proj => (
              <div key={proj.id}>
                <div className="font-bold">{proj.name} <span className="font-normal text-sm italic ml-1">{proj.link && `(${proj.link})`}</span></div>
                <p className="text-sm leading-snug">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills.length > 0 && (
        <section>
          <h2 className="font-bold text-lg uppercase border-b border-slate-400 mb-2">Technical Skills</h2>
          <p className="text-sm leading-relaxed">
            {data.skills.join(', ')}
          </p>
        </section>
      )}
    </div>
  );
};

// --- 10. ELEGANT (Cream/Gold, refined, centered header) ---
export const ElegantTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full text-stone-800">
      <div className="flex justify-between items-end border-b-2 border-stone-300 pb-6 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-5xl font-light font-serif tracking-tight text-stone-900">{data.fullName}</h1>
          <p className="text-xl text-stone-500 font-serif italic">{data.title}</p>
        </div>
        <div className="text-right text-sm text-stone-500 font-light flex flex-col gap-1">
          {data.email && <div>{data.email}</div>}
          {data.phone && <div>{data.phone}</div>}
          {data.location && <div>{data.location}</div>}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_2.5fr] gap-10">
        {/* Sidebar */}
        <div className="flex flex-col gap-8 text-right border-r border-stone-200 pr-8">
          {data.skills.length > 0 && (
            <section>
              <h3 className="text-amber-700 font-serif text-lg italic mb-3">Expertise</h3>
              <div className="flex flex-wrap justify-end gap-x-2 gap-y-1">
                {data.skills.map((s, i) => (
                  <span key={i} className="text-sm font-medium text-stone-600">{s}{i < data.skills.length - 1 ? ',' : ''}</span>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h3 className="text-amber-700 font-serif text-lg italic mb-3">Education</h3>
              <div className="flex flex-col gap-4">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <div className="font-bold text-stone-900 text-sm">{edu.school}</div>
                    <div className="text-sm italic text-stone-600">{edu.degree}</div>
                    <div className="text-xs text-stone-400 mt-1">{edu.startDate}</div>
                    <div className="text-xs text-stone-400">{edu.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(data.website || data.linkedin) && (
            <section>
              <h3 className="text-amber-700 font-serif text-lg italic mb-3">Links</h3>
              <div className="flex flex-col gap-1 text-sm text-stone-600">
                {data.website && <div className="break-words">{data.website}</div>}
                {data.linkedin && <div className="break-words">{data.linkedin}</div>}
              </div>
            </section>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-10">
          {data.summary && (
            <section className="bg-stone-50 p-6 rounded-xl border border-stone-100">
              <p className="text-stone-700 leading-relaxed font-serif text-lg italic text-center">"{data.summary}"</p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <h3 className="text-xl font-serif text-stone-900 border-b border-stone-200 pb-2 mb-6">Professional History</h3>
              <div className="flex flex-col gap-8">
                {data.experience.map(exp => (
                  <div key={exp.id} className="group">
                    <div className="flex justify-between items-baseline mb-2">
                      <h4 className="font-bold text-lg text-stone-900 group-hover:text-amber-700 transition-colors">{exp.role}</h4>
                      <span className="text-sm text-stone-400 font-serif italic">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</span>
                    </div>
                    <div className="text-amber-700 font-medium mb-2 text-sm uppercase tracking-wide">{exp.company}</div>
                    <p className="text-stone-600 leading-relaxed text-sm">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h3 className="text-xl font-serif text-stone-900 border-b border-stone-200 pb-2 mb-6">Key Projects</h3>
              <div className="grid grid-cols-1 gap-6">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <div className="font-bold text-stone-900 mb-1">{proj.name}</div>
                    <p className="text-sm text-stone-600">{proj.description}</p>
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

// --- 11. SWISS (International style, bold, grid-based, high contrast) ---
export const SwissTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white font-sans text-slate-900">
      {/* Header Grid */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 mb-12 pt-8">
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
              <h2 className="text-sm font-black uppercase tracking-widest mb-4">Skills</h2>
              <div className="flex flex-col gap-2">
                {data.skills.map((s, i) => (
                  <span key={i} className="text-sm font-bold border-l-4 border-slate-900 pl-2 leading-none py-1">{s}</span>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest mb-4">Education</h2>
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
        <div className="flex flex-col gap-12 pr-8">
          {data.summary && (
            <section>
              <p className="text-lg font-medium leading-relaxed indent-12">{data.summary}</p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b-4 border-slate-900 pb-2">Experience</h2>
              <div className="flex flex-col gap-8">
                {data.experience.map(exp => (
                  <div key={exp.id} className="grid grid-cols-[100px_1fr] gap-6">
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
              <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b-4 border-slate-900 pb-2">Projects</h2>
              <div className="grid grid-cols-2 gap-6">
                {data.projects.map(proj => (
                  <div key={proj.id} className="bg-slate-50 p-4">
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

// --- 12. OPAL (Soft, airy, minimal, light gray accents) ---
export const OpalTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-8 px-8 py-10 font-sans text-slate-700">
      <header className="text-center mb-4">
        <h1 className="text-4xl font-light tracking-wide text-slate-900 mb-2">{data.fullName}</h1>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400 mb-6">{data.title}</p>
        <div className="flex justify-center flex-wrap gap-6 text-xs text-slate-500 font-medium">
          {[data.email, data.phone, data.website, data.location].filter(Boolean).map((t, i) => (
            <span key={i} className="bg-slate-50 px-3 py-1 rounded-full">{t}</span>
          ))}
        </div>
      </header>

      {data.summary && (
        <section className="bg-slate-50/50 p-6 rounded-2xl mx-auto max-w-2xl text-center">
          <p className="text-sm leading-relaxed text-slate-600">{data.summary}</p>
        </section>
      )}

      <div className="grid grid-cols-[1fr_2px_1fr] gap-8">
        <div className="bg-gradient-to-b from-transparent via-slate-100 to-transparent"></div>
      </div>

      {/* Single Column Layout */}
      <div className="flex flex-col gap-10 max-w-3xl mx-auto w-full">

        {data.skills.length > 0 && (
          <section className="text-center">
            <div className="flex flex-wrap justify-center gap-2">
              {data.skills.map((s, i) => (
                <span key={i} className="text-xs border border-slate-200 px-3 py-1 rounded-md text-slate-500">{s}</span>
              ))}
            </div>
          </section>
        )}

        {data.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase text-slate-300 mb-6 text-center tracking-widest">Experience</h2>
            <div className="flex flex-col gap-8">
              {data.experience.map(exp => (
                <div key={exp.id} className="flex gap-4 group">
                  <div className="w-24 pt-1 flex flex-col items-end text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900">{exp.startDate}</span>
                    <span className="text-[10px] text-slate-400">{exp.isCurrent ? 'Present' : exp.endDate}</span>
                  </div>
                  <div className="w-px bg-slate-100 relative group-hover:bg-slate-200 transition-colors">
                    <div className="absolute top-1.5 -left-1 w-2 h-2 rounded-full bg-white border-2 border-slate-200 group-hover:border-slate-400 transition-colors"></div>
                  </div>
                  <div className="pb-8">
                    <h3 className="text-base font-medium text-slate-800">{exp.role}</h3>
                    <div className="text-xs text-slate-500 mb-2">{exp.company}</div>
                    <p className="text-sm text-slate-600 leading-relaxed font-light">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase text-slate-300 mb-6 text-center tracking-widest">Education</h2>
              <div className="flex flex-col gap-4">
                {data.education.map(edu => (
                  <div key={edu.id} className="bg-slate-50 p-4 rounded-xl text-center">
                    <div className="font-medium text-slate-900 text-sm">{edu.school}</div>
                    <div className="text-xs text-slate-500 my-1">{edu.degree}</div>
                    <div className="text-[10px] text-slate-400">{edu.startDate} — {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase text-slate-300 mb-6 text-center tracking-widest">Projects</h2>
              <div className="flex flex-col gap-4">
                {data.projects.map(proj => (
                  <div key={proj.id} className="bg-slate-50 p-4 rounded-xl text-center">
                    <div className="font-medium text-slate-900 text-sm">{proj.name}</div>
                    <p className="text-xs text-slate-500 mt-2 leading-snug">{proj.description}</p>
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

// --- 13. WIREFRAME (Structural, monospace, grid lines, blueprint style) ---
export const WireframeTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white font-mono text-xs text-slate-800 p-8">
      <div className="border-2 border-slate-900 h-full flex flex-col">

        {/* Header Block */}
        <div className="border-b-2 border-slate-900 p-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">{data.fullName}</h1>
            <p className="text-sm border inline-block px-2 py-0.5 border-slate-800">{data.title}</p>
          </div>
          <div className="text-right flex flex-col gap-1 items-end">
            {[data.email, data.phone, data.website, data.location].filter(Boolean).map((t, i) => (
              <div key={i} className="border-b border-slate-300 pb-0.5">{t}</div>
            ))}
          </div>
        </div>

        <div className="flex flex-1">
          {/* Left Sidebar Block */}
          <div className="w-1/3 border-r-2 border-slate-900 flex flex-col">

            {data.skills.length > 0 && (
              <div className="p-4 border-b-2 border-slate-900">
                <h2 className="font-bold underline mb-3 text-sm">SKILLS_LIST</h2>
                <ul className="list-disc list-inside space-y-1 marker:text-slate-500">
                  {data.skills.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.education.length > 0 && (
              <div className="p-4 flex-1">
                <h2 className="font-bold underline mb-3 text-sm">EDUCATION_DATA</h2>
                <div className="flex flex-col gap-4">
                  {data.education.map(edu => (
                    <div key={edu.id} className="border border-slate-400 p-2 relative">
                      <div className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-slate-500">Node</div>
                      <div className="font-bold">{edu.school}</div>
                      <div>{edu.degree}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{edu.startDate} -&gt; {edu.endDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Block */}
          <div className="w-2/3 flex flex-col">
            {data.summary && (
              <div className="p-4 border-b-2 border-slate-900">
                <h2 className="font-bold underline mb-2 text-sm">SUMMARY</h2>
                <p className="leading-relaxed">{data.summary}</p>
              </div>
            )}

            {data.experience.length > 0 && (
              <div className="p-4 flex-1 border-b-2 border-slate-900">
                <h2 className="font-bold underline mb-4 text-sm">EXPERIENCE_LOG</h2>
                <div className="flex flex-col gap-6">
                  {data.experience.map(exp => (
                    <div key={exp.id} className="grid grid-cols-[80px_1fr] gap-4">
                      <div className="text-[10px] border-r border-slate-300 pr-2 h-full">
                        {exp.startDate}<br />
                        |<br />
                        {exp.isCurrent ? 'NOW' : exp.endDate}
                      </div>
                      <div>
                        <div className="font-bold text-sm uppercase">{exp.role}</div>
                        <div className="text-xs mb-2">@ {exp.company}</div>
                        <p className="leading-snug text-slate-600">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.projects.length > 0 && (
              <div className="p-4">
                <h2 className="font-bold underline mb-4 text-sm">PROJECT_INDEX</h2>
                <div className="grid grid-cols-1 gap-3">
                  {data.projects.map(proj => (
                    <div key={proj.id} className="border border-dashed border-slate-400 p-2">
                      <div className="font-bold">{proj.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{proj.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- 14. BERLIN (Strict, Key-line, Grotesk, B&W) ---
export const BerlinTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white text-black p-10 font-sans">
      <header className="pb-8 border-b-4 border-black mb-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 leading-none">{data.fullName}</h1>
        <div className="flex justify-between items-end">
          <p className="text-xl font-bold uppercase tracking-wide">{data.title}</p>
          <div className="text-right text-sm font-medium">
            {[data.email, data.phone, data.location].filter(Boolean).join(' / ')}
            {data.website && <div>{data.website}</div>}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-10">

        {data.summary && (
          <section className="grid grid-cols-[150px_1fr] gap-8">
            <h2 className="text-sm font-bold uppercase tracking-widest pt-1">About</h2>
            <p className="text-lg leading-relaxed font-medium">{data.summary}</p>
          </section>
        )}

        <div className="border-t border-black my-2"></div>

        {data.experience.length > 0 && (
          <section className="grid grid-cols-[150px_1fr] gap-8">
            <h2 className="text-sm font-bold uppercase tracking-widest pt-1">Experience</h2>
            <div className="flex flex-col gap-10">
              {data.experience.map(exp => (
                <div key={exp.id} className="grid grid-cols-[1fr_3fr] gap-6">
                  <div>
                    <div className="font-bold">{exp.startDate} –</div>
                    <div className="font-bold">{exp.isCurrent ? 'Present' : exp.endDate}</div>
                    <div className="text-sm text-slate-500 mt-1">{exp.company}</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 uppercase">{exp.role}</h3>
                    <p className="text-base leading-relaxed text-slate-800">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="border-t border-black my-2"></div>

        <div className="grid grid-cols-2 gap-8">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">Education</h2>
              <div className="flex flex-col gap-4">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <div className="font-bold text-lg">{edu.school}</div>
                    <div className="text-base">{edu.degree}</div>
                    <div className="text-sm text-slate-500">{edu.startDate} – {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">Competencies</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {data.skills.map((s, i) => (
                  <div key={i} className="font-medium text-base relative">
                    <span className="absolute -left-3 top-2 w-1.5 h-1.5 bg-black rounded-full"></span>
                    {s}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {data.projects.length > 0 && (
          <>
            <div className="border-t border-black my-2"></div>
            <section className="grid grid-cols-[150px_1fr] gap-8">
              <h2 className="text-sm font-bold uppercase tracking-widest pt-1">Projects</h2>
              <div className="grid grid-cols-2 gap-8">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <div className="font-bold text-lg mb-1">{proj.name}</div>
                    <p className="text-sm text-slate-600">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

// --- 15. LATERAL (Side-headers, wide layout) ---
export const LateralTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white text-slate-800 font-sans p-10">
      <header className="border-b border-slate-200 pb-8 mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">{data.fullName}</h1>
        <div className="flex justify-between items-end">
          <p className="text-xl text-slate-500 font-medium">{data.title}</p>
          <div className="text-right text-sm">
            {[data.email, data.phone].filter(Boolean).join(' | ')}
            {data.website && <div className="text-slate-400">{data.website}</div>}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-10">

        {data.summary && (
          <section className="grid grid-cols-[150px_1fr] gap-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">About</h2>
            <p className="text-slate-600 leading-relaxed">{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section className="grid grid-cols-[150px_1fr] gap-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">Experience</h2>
            <div className="flex flex-col gap-8">
              {data.experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                    <span className="text-sm text-slate-400">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                  </div>
                  <div className="text-slate-500 font-medium mb-2">{exp.company}</div>
                  <p className="text-slate-600 text-sm leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section className="grid grid-cols-[150px_1fr] gap-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">Education</h2>
            <div className="flex flex-col gap-4">
              {data.education.map(edu => (
                <div key={edu.id}>
                  <div className="font-bold text-slate-900">{edu.school}</div>
                  <div className="text-slate-600 text-sm">{edu.degree}</div>
                  <div className="text-xs text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-[150px_1fr] gap-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-1">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s, i) => (
              <span key={i} className="bg-slate-50 text-slate-600 px-2 py-1 text-sm rounded">{s}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// --- 16. IRON (Inverted headers, high contrast) ---
export const IronTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900 font-sans">
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

// --- 17. GINTO (Geometric, numbered sections, pop style) ---
export const GintoTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900 font-sans p-10">
      <header className="mb-12">
        <h1 className="text-6xl font-extrabold tracking-tighter mb-4"><span className="text-indigo-600">.</span>{data.fullName}</h1>
        <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4">
          <p className="text-2xl font-bold uppercase tracking-widest">{data.title}</p>
          <div className="text-right font-medium text-sm">
            {[data.email, data.phone].filter(Boolean).join(' • ')}
            {data.website && <div>{data.website}</div>}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-10">

        {data.summary && (
          <section className="grid grid-cols-[80px_1fr] gap-6">
            <div className="text-4xl font-black text-indigo-100 leading-none select-none">01</div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-indigo-600">Profile</h2>
              <p className="text-lg font-medium leading-relaxed">{data.summary}</p>
            </div>
          </section>
        )}

        {data.experience.length > 0 && (
          <section className="grid grid-cols-[80px_1fr] gap-6">
            <div className="text-4xl font-black text-indigo-100 leading-none select-none">02</div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-indigo-600">Experience</h2>
              <div className="flex flex-col gap-8">
                {data.experience.map(exp => (
                  <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100 hover:border-indigo-200 transition-colors">
                    <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-600"></span>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-xl font-bold">{exp.role}</h3>
                      <span className="font-mono text-sm text-slate-400 font-medium">{exp.startDate} — {exp.isCurrent ? 'Now' : exp.endDate}</span>
                    </div>
                    <div className="text-base font-bold text-slate-500 mb-2">{exp.company}</div>
                    <p className="text-slate-700 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section className="grid grid-cols-[80px_1fr] gap-6">
            <div className="text-4xl font-black text-indigo-100 leading-none select-none">03</div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-indigo-600">Education</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {data.education.map(edu => (
                  <div key={edu.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="font-bold text-lg">{edu.school}</div>
                    <div className="text-indigo-600 font-medium">{edu.degree}</div>
                    <div className="text-sm text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-10">
          {data.skills.length > 0 && (
            <section className="grid grid-cols-[80px_1fr] gap-6">
              <div className="text-4xl font-black text-indigo-100 leading-none select-none">04</div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-indigo-600">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((s, i) => (
                    <span key={i} className="bg-slate-900 text-white px-3 py-1 text-sm font-bold rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section className="grid grid-cols-[80px_1fr] gap-6">
              <div className="text-4xl font-black text-indigo-100 leading-none select-none">05</div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-indigo-600">Projects</h2>
                <div className="flex flex-col gap-4">
                  {data.projects.map(proj => (
                    <div key={proj.id}>
                      <div className="font-bold">{proj.name}</div>
                      <p className="text-xs text-slate-500">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// --- 18. SYMMETRY (Centered, elegant, balanced) ---
export const SymmetryTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-serif p-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-medium tracking-wide text-slate-900 mb-3">{data.fullName}</h1>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-6">{data.title}</p>
        <div className="flex justify-center gap-6 text-xs text-slate-500 italic font-medium">
          {[data.email, data.phone, data.location].filter(Boolean).map((t, i) => (
            <span key={i} className="relative px-2">
              {i > 0 && <span className="absolute -left-3 top-0 opacity-30">/</span>}
              {t}
            </span>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-10 max-w-3xl mx-auto w-full">

        {data.summary && (
          <section className="text-center">
            <div className="w-10 h-0.5 bg-slate-300 mx-auto mb-4"></div>
            <p className="text-slate-600 leading-loose italic">{data.summary}</p>
          </section>
        )}

        {data.skills.length > 0 && (
          <section className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Competencies</h2>
            <div className="flex justify-center flex-wrap gap-x-6 gap-y-2">
              {data.skills.map((s, i) => (
                <span key={i} className="text-sm font-medium text-slate-700 border-b border-transparent hover:border-slate-300 transition-colors">{s}</span>
              ))}
            </div>
          </section>
        )}

        {data.experience.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px bg-slate-200 flex-1"></div>
              <h2 className="text-lg font-medium italic text-slate-900">Professional Experience</h2>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="flex flex-col gap-10">
              {data.experience.map(exp => (
                <div key={exp.id} className="grid grid-cols-[1fr_3fr] gap-8">
                  <div className="text-right pt-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</div>
                    <div className="text-sm font-medium text-slate-800 mt-1">{exp.company}</div>
                  </div>
                  <div className="border-l border-slate-200 pl-8">
                    <h3 className="text-xl font-medium text-slate-900 mb-2">{exp.role}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed text-justify">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-12">
          {data.education.length > 0 && (
            <section>
              <div className="h-px bg-slate-200 w-full mb-6 relative">
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-slate-50 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">Education</span>
              </div>
              <div className="flex flex-col gap-6 text-center">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <div className="font-medium text-lg text-slate-900">{edu.school}</div>
                    <div className="text-sm italic text-slate-600">{edu.degree}</div>
                    <div className="text-xs text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <div className="h-px bg-slate-200 w-full mb-6 relative">
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-slate-50 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">Projects</span>
              </div>
              <div className="flex flex-col gap-6 text-center">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <div className="font-medium text-lg text-slate-900">{proj.name}</div>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">{proj.description}</p>
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

// --- 19. BRONX (Editorial, bold typography, modern magazine style) ---
export const BronxTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900 font-sans p-12">
      <header className="mb-16">
        <h1 className="text-8xl font-black tracking-tighter leading-[0.8] mb-6 uppercase break-words">{data.fullName}</h1>
        <div className="flex flex-col gap-2 border-t-4 border-black pt-6">
          <div className="flex justify-between items-baseline">
            <p className="text-2xl font-bold uppercase tracking-wide">{data.title}</p>
            <div className="text-right font-bold text-sm">
              {[data.email, data.phone].filter(Boolean).join('  /  ')}
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium text-slate-500">
            <div>{data.location}</div>
            <div>{data.website}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_2fr] gap-16">

        <div className="flex flex-col gap-12">
          {data.summary && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4">About</h2>
              <p className="text-lg font-medium leading-tight">{data.summary}</p>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4">Skills</h2>
              <div className="flex flex-col gap-2">
                {data.skills.map((s, i) => (
                  <span key={i} className="text-xl font-bold leading-none hover:text-indigo-600 transition-colors cursor-default">{s}</span>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4">Education</h2>
              <div className="flex flex-col gap-8">
                {data.education.map(edu => (
                  <div key={edu.id}>
                    <div className="font-bold text-lg leading-tight">{edu.school}</div>
                    <div className="text-sm font-medium text-slate-500 mt-1">{edu.degree}</div>
                    <div className="text-xs font-bold mt-2">{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-16">
          {data.experience.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 border-b-2 border-black pb-2">Experience</h2>
              <div className="flex flex-col gap-12">
                {data.experience.map(exp => (
                  <div key={exp.id} className="group">
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-3xl font-bold leading-none group-hover:text-indigo-600 transition-colors">{exp.role}</h3>
                      <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1">{exp.startDate} - {exp.isCurrent ? 'Now' : exp.endDate}</span>
                    </div>
                    <div className="text-xl font-medium text-slate-500 mb-4">{exp.company}</div>
                    <p className="text-base font-medium leading-relaxed max-w-xl">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 border-b-2 border-black pb-2">Selected Projects</h2>
              <div className="grid grid-cols-1 gap-8">
                {data.projects.map(proj => (
                  <div key={proj.id}>
                    <div className="text-2xl font-bold mb-2">{proj.name}</div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{proj.description}</p>
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

// --- 20. PATH (Timeline, visual connection, journey) ---
export const PathTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white text-slate-800 font-sans p-10">
      <header className="pl-[29px]"> {/* Align with timeline line */}
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">{data.fullName}</h1>
        <p className="text-xl font-medium text-slate-700 mb-6">{data.title}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mb-10">
          {[data.email, data.phone].filter(Boolean).map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></div>
              {t}
            </div>
          ))}
          {data.location && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></div>
              {data.location}
            </div>
          )}
          {data.website && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full"></div>
              {data.website}
            </div>
          )}
        </div>
      </header>

      <div className="flex gap-10 h-full">
        {/* Timeline Column */}
        <div className="flex-1 relative">
          <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-indigo-100"></div>

          <div className="flex flex-col gap-10 pb-10">
            {data.summary && (
              <div className="relative pl-10">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm z-10"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-2">Profile</h2>
                <p className="text-slate-600 leading-relaxed">{data.summary}</p>
              </div>
            )}

            {data.experience.length > 0 && (
              <div className="relative pl-10">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm z-10"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-6">Experience Path</h2>
                <div className="flex flex-col gap-8">
                  {data.experience.map(exp => (
                    <div key={exp.id} className="relative">
                      <div className="absolute -left-[45px] top-1.5 w-2 h-2 rounded-full bg-indigo-200 border-2 border-white"></div>
                      <div className="font-bold text-slate-900 text-lg">{exp.role}</div>
                      <div className="flex justify-between items-baseline mb-2">
                        <div className="text-indigo-600 font-medium">{exp.company}</div>
                        <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{exp.startDate} - {exp.isCurrent ? 'Now' : exp.endDate}</div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.education.length > 0 && (
              <div className="relative pl-10">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm z-10"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-6">Education</h2>
                <div className="flex flex-col gap-6">
                  {data.education.map(edu => (
                    <div key={edu.id} className="relative">
                      <div className="absolute -left-[45px] top-1.5 w-2 h-2 rounded-full bg-indigo-200 border-2 border-white"></div>
                      <div className="font-bold text-slate-900">{edu.school}</div>
                      <div className="text-sm text-slate-600">{edu.degree}</div>
                      <div className="text-xs text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="w-1/3 pt-1">
          <div className="sticky top-10 flex flex-col gap-10">
            {data.skills.length > 0 && (
              <section className="bg-slate-50 p-6 rounded-2xl">
                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((s, i) => (
                    <span key={i} className="bg-white border border-indigo-100 px-3 py-1 rounded-full text-xs font-medium text-indigo-800 shadow-sm">{s}</span>
                  ))}
                </div>
              </section>
            )}

            {data.projects.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-900 mb-4 pl-2">Projects</h2>
                <div className="flex flex-col gap-4">
                  {data.projects.map(proj => (
                    <div key={proj.id} className="border-l-2 border-indigo-100 pl-4 py-1 hover:border-indigo-400 transition-colors">
                      <div className="font-bold text-slate-800">{proj.name}</div>
                      <p className="text-xs text-slate-500 mt-1">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
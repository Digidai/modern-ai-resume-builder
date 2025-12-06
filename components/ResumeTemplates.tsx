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
                         {data.email && <div className="flex items-center gap-2 break-all"><MailIcon className="w-4 h-4 text-emerald-600 shrink-0"/> {data.email}</div>}
                         {data.phone && <div className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-emerald-600 shrink-0"/> {data.phone}</div>}
                         {data.location && <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-emerald-600 shrink-0"/> {data.location}</div>}
                         {data.website && <div className="flex items-center gap-2 break-all"><GlobeIcon className="w-4 h-4 text-emerald-600 shrink-0"/> {data.website}</div>}
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
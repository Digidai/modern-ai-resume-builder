import React, { useState } from 'react';
import { ResumeData, Experience, Education, Project } from '../types';
import { SparklesIcon, PlusIcon, TrashIcon, LoaderIcon } from './Icons';
import { improveText, generateSummary } from '../services/geminiService';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'skills' | 'design'>('basics');
  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleInputChange = (field: keyof ResumeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleImproveText = async (fieldId: string, text: string, context: string) => {
    setLoadingField(fieldId);
    const improved = await improveText(text, context);
    setLoadingField(null);
    return improved;
  };

  // --- Experience Handlers ---
  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: ''
    };
    onChange({ ...data, experience: [newExp, ...data.experience] });
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    const updated = data.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp);
    onChange({ ...data, experience: updated });
  };

  const removeExperience = (id: string) => {
    onChange({ ...data, experience: data.experience.filter(exp => exp.id !== id) });
  };

  // --- Education Handlers ---
  const addEducation = () => {
      const newEdu: Education = {
          id: Date.now().toString(),
          school: '',
          degree: '',
          startDate: '',
          endDate: ''
      };
      onChange({ ...data, education: [...data.education, newEdu]});
  }

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    const updated = data.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu);
    onChange({ ...data, education: updated });
  };

   const removeEducation = (id: string) => {
    onChange({ ...data, education: data.education.filter(edu => edu.id !== id) });
  };

  // --- Skills Handlers ---
  const handleSkillsChange = (val: string) => {
      onChange({...data, skills: val.split(',').map(s => s.trim())});
  }

  // --- Projects Handlers ---
  const addProject = () => {
      const newProj: Project = { id: Date.now().toString(), name: '', link: '', description: '' };
      onChange({ ...data, projects: [...data.projects, newProj] });
  }
  const updateProject = (id: string, field: keyof Project, value: any) => {
      const updated = data.projects.map(p => p.id === id ? { ...p, [field]: value } : p);
      onChange({ ...data, projects: updated });
  }
  const removeProject = (id: string) => {
      onChange({ ...data, projects: data.projects.filter(p => p.id !== id) });
  }

  // --- Template Options ---
  const templates = [
    { id: 'modern', name: 'Modern', color: 'bg-indigo-500' },
    { id: 'minimalist', name: 'Minimalist', color: 'bg-slate-200' },
    { id: 'sidebar', name: 'Sidebar', color: 'bg-slate-800' },
    { id: 'executive', name: 'Executive', color: 'bg-slate-600' },
    { id: 'creative', name: 'Creative', color: 'bg-emerald-600' },
    { id: 'compact', name: 'Compact', color: 'bg-blue-400' },
    { id: 'tech', name: 'Tech', color: 'bg-gray-900' },
  ];


  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto no-scrollbar">
        {(['basics', 'experience', 'skills', 'design'] as const).map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize focus:outline-none transition-colors whitespace-nowrap ${
                    activeTab === tab 
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
            >
                {tab}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        
        {/* DESIGN TAB */}
        {activeTab === 'design' && (
           <div className="space-y-6 animate-in fade-in duration-300">
             <h3 className="text-lg font-bold text-slate-800">Select Template</h3>
             <div className="grid grid-cols-2 gap-4">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleInputChange('templateId', t.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left group hover:border-indigo-300 ${
                       data.templateId === t.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 bg-white'
                    }`}
                  >
                     <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full ${t.color} shadow-sm flex items-center justify-center text-white text-xs font-bold`}>
                           {t.name[0]}
                        </div>
                        <span className={`font-semibold ${data.templateId === t.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {t.name}
                        </span>
                     </div>
                     <div className="w-full h-20 bg-slate-100 rounded-md overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity relative">
                         {/* Mini visual representation */}
                         {t.id === 'sidebar' && <div className="h-full w-1/3 bg-slate-800 absolute left-0"></div>}
                         {t.id === 'minimalist' && <div className="h-1 w-1/2 bg-black mx-auto mt-4"></div>}
                         {t.id === 'executive' && <div className="h-full w-full border-t-4 border-slate-600 mt-2"></div>}
                         {t.id === 'modern' && <div className="h-full w-full p-2"><div className="w-8 h-1 bg-indigo-500 mb-1"></div></div>}
                         {t.id === 'creative' && <div className="h-full w-full bg-white"><div className="h-1/4 bg-emerald-600 w-full"></div><div className="flex h-3/4"><div className="w-1/3 bg-slate-100"></div></div></div>}
                         {t.id === 'compact' && <div className="h-full w-full p-2"><div className="border-b-2 border-black mb-1"></div><div className="space-y-1"><div className="h-1 bg-slate-300 w-full"></div><div className="h-1 bg-slate-300 w-full"></div></div></div>}
                         {t.id === 'tech' && <div className="h-full w-full bg-white p-2 font-mono text-[6px] text-slate-400">{'< />'}</div>}
                     </div>
                     {data.templateId === t.id && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full"></div>
                     )}
                  </button>
                ))}
             </div>
             
             <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                <p><strong>Tip:</strong> Templates change the layout and typography. Your content remains the same.</p>
             </div>
           </div>
        )}

        {/* BASICS TAB */}
        {activeTab === 'basics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={data.fullName} onChange={(v) => handleInputChange('fullName', v)} />
              <Input label="Job Title" value={data.title} onChange={(v) => handleInputChange('title', v)} />
              <Input label="Email" value={data.email} onChange={(v) => handleInputChange('email', v)} />
              <Input label="Phone" value={data.phone} onChange={(v) => handleInputChange('phone', v)} />
              <Input label="Location" value={data.location} onChange={(v) => handleInputChange('location', v)} />
              <Input label="Website" value={data.website} onChange={(v) => handleInputChange('website', v)} />
              <Input label="LinkedIn" value={data.linkedin} onChange={(v) => handleInputChange('linkedin', v)} />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-700">Professional Summary</label>
                    <button 
                        onClick={async () => {
                            setLoadingField('summary');
                            const sum = await generateSummary(data.title, data.skills);
                            handleInputChange('summary', sum);
                            setLoadingField(null);
                        }}
                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                        disabled={loadingField === 'summary'}
                    >
                         {loadingField === 'summary' ? <LoaderIcon className="animate-spin w-3 h-3"/> : <SparklesIcon className="w-3 h-3" />}
                         Generate with AI
                    </button>
                </div>
                <div className="relative">
                    <textarea 
                        className="w-full min-h-[120px] p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
                        value={data.summary}
                        onChange={(e) => handleInputChange('summary', e.target.value)}
                        placeholder="Briefly describe your professional background..."
                    />
                     <button 
                        onClick={async () => {
                             const imp = await handleImproveText('summary-polish', data.summary, 'Professional Summary');
                             handleInputChange('summary', imp);
                        }}
                        disabled={loadingField === 'summary-polish' || !data.summary}
                        className="absolute bottom-2 right-2 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        title="Polish Text"
                     >
                         {loadingField === 'summary-polish' ? <LoaderIcon className="animate-spin w-4 h-4"/> : <SparklesIcon className="w-4 h-4" />}
                     </button>
                </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Education</h3>
                    <button onClick={addEducation} className="text-sm flex items-center gap-1 text-indigo-600 font-medium hover:underline">
                        <PlusIcon className="w-4 h-4" /> Add
                    </button>
                </div>
                <div className="space-y-6">
                    {data.education.map((edu) => (
                         <div key={edu.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                            <button onClick={() => removeEducation(edu.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 gap-3">
                                <Input label="School / University" value={edu.school} onChange={(v) => updateEducation(edu.id, 'school', v)} />
                                <Input label="Degree / Field of Study" value={edu.degree} onChange={(v) => updateEducation(edu.id, 'degree', v)} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Start Date" type="month" value={edu.startDate} onChange={(v) => updateEducation(edu.id, 'startDate', v)} />
                                    <Input label="End Date" type="month" value={edu.endDate} onChange={(v) => updateEducation(edu.id, 'endDate', v)} />
                                </div>
                            </div>
                         </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* EXPERIENCE TAB */}
        {activeTab === 'experience' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Work History</h3>
                    <button onClick={addExperience} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm">
                        <PlusIcon className="w-4 h-4" /> Add Position
                    </button>
                </div>

                <div className="space-y-6">
                    {data.experience.map((exp, idx) => (
                        <div key={exp.id} className="p-5 bg-slate-50 rounded-lg border border-slate-200 relative">
                             <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => removeExperience(exp.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <Input label="Job Title" value={exp.role} onChange={(v) => updateExperience(exp.id, 'role', v)} />
                                <Input label="Company" value={exp.company} onChange={(v) => updateExperience(exp.id, 'company', v)} />
                                <Input label="Start Date" type="month" value={exp.startDate} onChange={(v) => updateExperience(exp.id, 'startDate', v)} />
                                <div className="flex flex-col gap-1">
                                    <Input 
                                        label="End Date" 
                                        type="month" 
                                        value={exp.endDate} 
                                        onChange={(v) => updateExperience(exp.id, 'endDate', v)} 
                                        disabled={exp.isCurrent}
                                    />
                                    <label className="flex items-center gap-2 mt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={exp.isCurrent} 
                                            onChange={(e) => updateExperience(exp.id, 'isCurrent', e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs text-slate-600">I currently work here</span>
                                    </label>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea 
                                    className="w-full min-h-[100px] p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    value={exp.description}
                                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                    placeholder="• Achieved X by doing Y..."
                                />
                                <button 
                                    onClick={async () => {
                                        const improved = await handleImproveText(`exp-${exp.id}`, exp.description, 'Job Description');
                                        updateExperience(exp.id, 'description', improved);
                                    }}
                                    disabled={loadingField === `exp-${exp.id}` || !exp.description}
                                    className="absolute bottom-2 right-2 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                    title="Polish with AI"
                                >
                                    {loadingField === `exp-${exp.id}` ? <LoaderIcon className="animate-spin w-4 h-4"/> : <SparklesIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                     {data.experience.length === 0 && (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                            No experience added yet.
                        </div>
                    )}
                </div>
             </div>
        )}

        {/* SKILLS & PROJECTS TAB */}
        {activeTab === 'skills' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Skills</h3>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Comma separated list</label>
                        <textarea 
                            value={data.skills.join(', ')}
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
                            rows={3}
                            placeholder="Design, Figma, React, TypeScript..."
                        />
                    </div>
                 </div>

                 <div className="border-t border-slate-200 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Projects</h3>
                        <button onClick={addProject} className="text-sm flex items-center gap-1 text-indigo-600 font-medium hover:underline">
                            <PlusIcon className="w-4 h-4" /> Add
                        </button>
                    </div>
                    <div className="space-y-4">
                        {data.projects.map(proj => (
                            <div key={proj.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                                 <button onClick={() => removeProject(proj.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <Input label="Project Name" value={proj.name} onChange={(v) => updateProject(proj.id, 'name', v)} />
                                    <Input label="Link (optional)" value={proj.link} onChange={(v) => updateProject(proj.id, 'link', v)} />
                                </div>
                                <div className="relative">
                                    <textarea 
                                        className="w-full p-2 border border-slate-300 rounded-md text-sm" 
                                        placeholder="Project description..."
                                        rows={2}
                                        value={proj.description}
                                        onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                                    />
                                    <button 
                                        onClick={async () => {
                                            const improved = await handleImproveText(`proj-${proj.id}`, proj.description, 'Project Description');
                                            updateProject(proj.id, 'description', improved);
                                        }}
                                        disabled={loadingField === `proj-${proj.id}` || !proj.description}
                                        className="absolute bottom-2 right-2 p-1 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                    >
                                        {loadingField === `proj-${proj.id}` ? <LoaderIcon className="animate-spin w-3 h-3"/> : <SparklesIcon className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};

// Helper Input Component
const Input = ({ label, value, onChange, type = "text", disabled = false }: { label: string, value: string, onChange: (val: string) => void, type?: string, disabled?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-100 disabled:text-slate-400"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

export default ResumeEditor;
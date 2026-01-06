import { useState, useCallback } from 'react';
import { ResumeData, Experience, Education, Project } from '../types';
import { SparklesIcon, PlusIcon, TrashIcon, LoaderIcon } from './Icons';
import { improveText, generateSummary } from '../services/geminiService';
import { Button } from './Button';
import { ApiKeyModal } from './ApiKeyModal';
import { ScaledResumePreview } from './ScaledResumePreview';
import { TEMPLATES } from '../constants/templates';
import { getEmailError, getPhoneError, getUrlError } from '../utils/validation';
import { useToast } from './Toast';
import { Input } from './Input';
import { LazyResumePreview } from './LazyResumePreview';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onError?: (message: string) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange, onError }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'skills' | 'design'>('basics');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [pendingAiAction, setPendingAiAction] = useState<(() => Promise<void>) | null>(null);
  const { showError: showToastError } = useToast();

  const showError = useCallback((message: string) => {
    if (onError) {
      onError(message);
    } else {
      showToastError(message);
    }
  }, [onError, showToastError]);

  const handleAiAction = useCallback(async (action: (key: string) => Promise<void>) => {
    const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (key) {
      await action(key);
    } else {
      setPendingAiAction(() => async () => {
        const newKey = localStorage.getItem('gemini_api_key');
        if (newKey) await action(newKey);
      });
      setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = useCallback((key: string) => {
    localStorage.setItem('gemini_api_key', key);
    if (pendingAiAction) {
      pendingAiAction();
      setPendingAiAction(null);
    }
  }, [pendingAiAction]);

  const handleAiImprovement = useCallback((
    fieldId: string,
    text: string,
    context: string,
    onUpdate: (val: string) => void
  ) => {
    handleAiAction(async (key) => {
      setLoadingField(fieldId);
      try {
        const improved = await improveText(text, context, key);
        onUpdate(improved);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to improve text';
        showError(message);
      } finally {
        setLoadingField(null);
      }
    });
  }, [handleAiAction, showError]);

  const handleAiGeneration = useCallback((
    fieldId: string,
    generator: (key: string) => Promise<string>,
    onUpdate: (val: string) => void
  ) => {
    handleAiAction(async (key) => {
      setLoadingField(fieldId);
      try {
        const result = await generator(key);
        onUpdate(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate content';
        showError(message);
      } finally {
        setLoadingField(null);
      }
    });
  }, [handleAiAction, showError]);

  const handleInputChange = useCallback(<K extends keyof ResumeData>(
    field: K,
    value: ResumeData[K]
  ) => {
    onChange({ ...data, [field]: value });
  }, [data, onChange]);

  const addExperience = useCallback(() => {
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
  }, [data, onChange]);

  const updateExperience = useCallback(<K extends keyof Experience>(
    id: string,
    field: K,
    value: Experience[K]
  ) => {
    const updated = data.experience.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    onChange({ ...data, experience: updated });
  }, [data, onChange]);

  const removeExperience = useCallback((id: string) => {
    onChange({ ...data, experience: data.experience.filter(exp => exp.id !== id) });
  }, [data, onChange]);

  const addEducation = useCallback(() => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      startDate: '',
      endDate: ''
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  }, [data, onChange]);

  const updateEducation = useCallback(<K extends keyof Education>(
    id: string,
    field: K,
    value: Education[K]
  ) => {
    const updated = data.education.map(edu =>
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    onChange({ ...data, education: updated });
  }, [data, onChange]);

  const removeEducation = useCallback((id: string) => {
    onChange({ ...data, education: data.education.filter(edu => edu.id !== id) });
  }, [data, onChange]);

  const handleSkillsChange = useCallback((val: string) => {
    const cleaned = val.split(',').map(s => s.trim()).filter(Boolean);
    onChange({ ...data, skills: cleaned });
  }, [data, onChange]);

  const addProject = useCallback(() => {
    const newProj: Project = {
      id: Date.now().toString(),
      name: '',
      link: '',
      description: ''
    };
    onChange({ ...data, projects: [...data.projects, newProj] });
  }, [data, onChange]);

  const updateProject = useCallback(<K extends keyof Project>(
    id: string,
    field: K,
    value: Project[K]
  ) => {
    const updated = data.projects.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onChange({ ...data, projects: updated });
  }, [data, onChange]);

  const removeProject = useCallback((id: string) => {
    onChange({ ...data, projects: data.projects.filter(p => p.id !== id) });
  }, [data, onChange]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-x-auto no-scrollbar transition-colors" role="tablist">
        {(['basics', 'experience', 'skills', 'design'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium capitalize focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors whitespace-nowrap ${activeTab === tab
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeTab === 'design' && (
          <div id="panel-design" role="tabpanel" className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Select Template</h3>
            <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Resume templates">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={data.templateId === t.id}
                  onClick={() => handleInputChange('templateId', t.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left group hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${data.templateId === t.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full ${t.color} shadow-sm flex items-center justify-center text-white text-xs font-bold`}>
                      {t.name[0]}
                    </div>
                    <span className={`font-semibold ${data.templateId === t.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {t.name}
                    </span>
                  </div>
                  <div className="w-full h-32 bg-slate-100 rounded-md overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity relative pointer-events-none">
                    <LazyResumePreview data={{ ...data, templateId: t.id }} templateId={t.id} />
                  </div>
                  {data.templateId === t.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200" role="note">
              <p><strong>Tip:</strong> Templates change the layout and typography. Your content remains the same.</p>
            </div>
          </div>
        )}

        {activeTab === 'basics' && (
          <div id="panel-basics" role="tabpanel" className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={data.fullName} onChange={(v) => handleInputChange('fullName', v)} />
              <Input label="Job Title" value={data.title} onChange={(v) => handleInputChange('title', v)} />
              <Input
                label="Email"
                type="email"
                value={data.email}
                onChange={(v) => handleInputChange('email', v)}
                error={getEmailError(data.email)}
              />
              <Input
                label="Phone"
                type="tel"
                value={data.phone}
                onChange={(v) => handleInputChange('phone', v)}
                error={getPhoneError(data.phone)}
              />
              <Input label="Location" value={data.location} onChange={(v) => handleInputChange('location', v)} />
              <Input
                label="Website"
                type="url"
                value={data.website}
                onChange={(v) => handleInputChange('website', v)}
                error={getUrlError(data.website)}
              />
              <Input
                label="LinkedIn"
                type="url"
                value={data.linkedin}
                onChange={(v) => handleInputChange('linkedin', v)}
                error={getUrlError(data.linkedin)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label id="summary-label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Professional Summary</label>
                <Button
                  onClick={() => handleAiGeneration(
                    'summary',
                    (key) => generateSummary(data.title, data.skills, key),
                    (val) => handleInputChange('summary', val)
                  )}
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2"
                  disabled={loadingField === 'summary'}
                  leftIcon={loadingField === 'summary' ? <LoaderIcon className="animate-spin w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                >
                  Generate with AI
                </Button>
              </div>
              <div className="relative">
                <textarea
                  aria-labelledby="summary-label"
                  className="w-full min-h-[120px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed disabled:opacity-50"
                  value={data.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Briefly describe your professional background..."
                  disabled={loadingField === 'summary-polish'}
                />
                {loadingField === 'summary-polish' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-md">
                    <LoaderIcon className="animate-spin w-6 h-6 text-indigo-600" />
                  </div>
                )}
                <Button
                  onClick={() => handleAiImprovement(
                    'summary-polish',
                    data.summary,
                    'Professional Summary',
                    (val) => handleInputChange('summary', val)
                  )}
                  disabled={loadingField === 'summary-polish' || !data.summary}
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-2 h-auto py-1 px-2 border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 bg-white"
                  title="Polish Text"
                  aria-label="Polish summary with AI"
                >
                  {loadingField === 'summary-polish' ? <LoaderIcon className="animate-spin w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Education</h3>
                <Button onClick={addEducation} variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" leftIcon={<PlusIcon className="w-4 h-4" />}>
                  Add
                </Button>
              </div>
              <div className="space-y-6">
                {data.education.map((edu) => (
                  <div key={edu.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 relative group">
                    <Button
                      onClick={() => removeEducation(edu.id)}
                      variant="icon"
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50"
                      size="icon"
                      aria-label={`Remove ${edu.school || 'education'}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
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

        {activeTab === 'experience' && (
          <div id="panel-experience" role="tabpanel" className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Work History</h3>
              <Button onClick={addExperience} variant="primary" size="sm" leftIcon={<PlusIcon className="w-4 h-4" />}>
                Add Position
              </Button>
            </div>

            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      onClick={() => removeExperience(exp.id)}
                      variant="icon"
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      size="icon"
                      aria-label={`Remove ${exp.role || 'position'} at ${exp.company || 'company'}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
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
                        <span className="text-xs text-slate-600 dark:text-slate-400">I currently work here</span>
                      </label>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      className="w-full min-h-[100px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-50"
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      placeholder="• Achieved X by doing Y..."
                      disabled={loadingField === `exp-${exp.id}`}
                    />
                    {loadingField === `exp-${exp.id}` && (
                      <div className="absolute inset-0 top-6 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-md">
                        <LoaderIcon className="animate-spin w-6 h-6 text-indigo-600" />
                      </div>
                    )}
                    <Button
                      onClick={() => handleAiImprovement(
                        `exp-${exp.id}`,
                        exp.description,
                        'Job Description',
                        (val) => updateExperience(exp.id, 'description', val)
                      )}
                      disabled={loadingField === `exp-${exp.id}` || !exp.description}
                      className="absolute bottom-2 right-2 h-auto py-1 px-2 bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600"
                      variant="ghost"
                      size="sm"
                      title="Polish with AI"
                      aria-label="Polish description with AI"
                    >
                      {loadingField === `exp-${exp.id}` ? <LoaderIcon className="animate-spin w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                    </Button>
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

        {activeTab === 'skills' && (
          <div id="panel-skills" role="tabpanel" className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Skills</h3>
              <div className="space-y-2">
                <label id="skills-label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Comma separated list</label>
                <textarea
                  aria-labelledby="skills-label"
                  value={data.skills.join(', ')}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
                  rows={3}
                  placeholder="Design, Figma, React, TypeScript..."
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Projects</h3>
                <Button onClick={addProject} variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" leftIcon={<PlusIcon className="w-4 h-4" />}>
                  Add
                </Button>
              </div>
              <div className="space-y-4">
                {data.projects.map(proj => (
                  <div key={proj.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                    <Button
                      onClick={() => removeProject(proj.id)}
                      variant="icon"
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50"
                      size="icon"
                      aria-label={`Remove ${proj.name || 'project'}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <Input label="Project Name" value={proj.name} onChange={(v) => updateProject(proj.id, 'name', v)} />
                      <Input
                        label="Link (optional)"
                        type="url"
                        value={proj.link}
                        onChange={(v) => updateProject(proj.id, 'link', v)}
                        error={getUrlError(proj.link)}
                      />
                    </div>
                    <div className="relative">
                      <textarea
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md text-sm disabled:opacity-50"
                        placeholder="Project description..."
                        rows={2}
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                        disabled={loadingField === `proj-${proj.id}`}
                      />
                      {loadingField === `proj-${proj.id}` && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-md">
                          <LoaderIcon className="animate-spin w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                      <Button
                        onClick={() => handleAiImprovement(
                          `proj-${proj.id}`,
                          proj.description,
                          'Project Description',
                          (val) => updateProject(proj.id, 'description', val)
                        )}
                        disabled={loadingField === `proj-${proj.id}` || !proj.description}
                        className="absolute bottom-2 right-2 h-auto py-1 px-2 bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600"
                        variant="ghost"
                        size="sm"
                        aria-label="Polish project description with AI"
                      >
                        {loadingField === `proj-${proj.id}` ? <LoaderIcon className="animate-spin w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
      />
    </div>
  );
};




export default ResumeEditor;

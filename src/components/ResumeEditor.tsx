import React, { useState } from 'react';
import { ResumeData, Experience, Education, Project } from '../types';
import { SparklesIcon, PlusIcon, TrashIcon, LoaderIcon } from './Icons';
import { improveText, generateSummary } from '../services/geminiService';
import { Button } from './Button';
import { ApiKeyModal } from './ApiKeyModal';
import { ScaledResumePreview } from './ScaledResumePreview';

interface ResumeEditorProps {
    data: ResumeData;
    onChange: (data: ResumeData) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
    const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'skills' | 'design'>('basics');

    // AI State
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState<string | null>(null); // 'summary', 'exp-{id}'
    const [pendingAiAction, setPendingAiAction] = useState<(() => Promise<void>) | null>(null);

    const handleAiAction = async (action: (key: string) => Promise<void>) => {
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
    };

    const handleSaveApiKey = (key: string) => {
        localStorage.setItem('gemini_api_key', key);
        if (pendingAiAction) {
            pendingAiAction();
            setPendingAiAction(null);
        }
    };

    const handleImproveSummary = () => {
        handleAiAction(async (key) => {
            setAiLoading('summary');
            try {
                // If summary exists, improve it. If not, generate new one from experience.
                let text = "";
                if (data.summary) {
                    text = await improveText(data.summary, "professional summary", key);
                } else {
                    text = await generateSummary(data.title || "Professional", data.skills, key);
                }
                onChange({ ...data, summary: text });
            } catch (error) {
                alert("Failed to generate content. Please check your API key.");
            } finally {
                setAiLoading(null);
            }
        });
    };

    const handleImproveExperience = (id: string, description: string) => {
        handleAiAction(async (key) => {
            setAiLoading(`exp-${id}`);
            try {
                const improved = await improveText(description, "job description", key);
                onChange({
                    ...data,
                    experience: data.experience.map(exp =>
                        exp.id === id ? { ...exp, description: improved } : exp
                    )
                });
            } catch (error) {
                alert("Failed to improve text.");
            } finally {
                setAiLoading(null);
            }
        });
    };
    const handleAiImprovement = (fieldId: string, text: string, context: string, onUpdate: (val: string) => void) => {
        handleAiAction(async (key) => {
            setLoadingField(fieldId);
            try {
                const improved = await improveText(text, context, key);
                onUpdate(improved);
            } catch (error) {
                console.error(error);
                alert("Failed to generate content. Please check your API key.");
            } finally {
                setLoadingField(null);
            }
        });
    };

    const handleAiGeneration = (fieldId: string, generator: (key: string) => Promise<string>, onUpdate: (val: string) => void) => {
        handleAiAction(async (key) => {
            setLoadingField(fieldId);
            try {
                const result = await generator(key);
                onUpdate(result);
            } catch (error) {
                console.error(error);
                alert("Failed to generate content. Please check your API key.");
            } finally {
                setLoadingField(null);
            }
        });
    };

    const [loadingField, setLoadingField] = useState<string | null>(null);

    const handleInputChange = (field: keyof ResumeData, value: any) => {
        onChange({ ...data, [field]: value });
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
        onChange({ ...data, education: [...data.education, newEdu] });
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
        onChange({ ...data, skills: val.split(',').map(s => s.trim()) });
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
        { id: 'professional', name: 'Professional', color: 'bg-blue-800' },
        { id: 'academic', name: 'Academic', color: 'bg-slate-100 border border-slate-400 !text-slate-800' },
        { id: 'elegant', name: 'Elegant', color: 'bg-stone-200' },
        { id: 'swiss', name: 'Swiss', color: 'bg-slate-900 border-2 border-white' },
        { id: 'opal', name: 'Opal', color: 'bg-slate-50' },
        { id: 'wireframe', name: 'Wireframe', color: 'bg-white border border-slate-300' },
        { id: 'berlin', name: 'Berlin', color: 'bg-white border-t-4 border-black' },
        { id: 'lateral', name: 'Lateral', color: 'bg-white' },
        { id: 'iron', name: 'Iron', color: 'bg-black' },
        { id: 'ginto', name: 'Ginto', color: 'bg-white' },
        { id: 'symmetry', name: 'Symmetry', color: 'bg-slate-50' },
        { id: 'bronx', name: 'Bronx', color: 'bg-white' },
        { id: 'path', name: 'Path', color: 'bg-white' },
        { id: 'quartz', name: 'Quartz', color: 'bg-white border border-slate-900' },
        { id: 'silk', name: 'Silk', color: 'bg-stone-50' },
        { id: 'mono', name: 'Mono', color: 'bg-slate-900' },
        { id: 'pop', name: 'Pop', color: 'bg-gradient-to-r from-indigo-100 to-pink-100' },
        { id: 'noir', name: 'Noir', color: 'bg-zinc-900' },
        { id: 'paper', name: 'Paper', color: 'bg-[#fffef8] border border-slate-300' },
        { id: 'cast', name: 'Cast', color: 'bg-[#fafafa] font-mono' },
        { id: 'moda', name: 'Moda', color: 'bg-white' },
    ];


    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-x-auto no-scrollbar transition-colors">
                {(['basics', 'experience', 'skills', 'design'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-medium capitalize focus:outline-none transition-colors whitespace-nowrap ${activeTab === tab
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Select Template</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleInputChange('templateId', t.id)}
                                    className={`relative p-4 rounded-xl border-2 transition-all text-left group hover:border-indigo-300 ${data.templateId === t.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
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
                                        <ScaledResumePreview data={{ ...data, templateId: t.id }} templateId={t.id} />
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
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Personal Details</h3>
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Professional Summary</label>
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
                                    className="w-full min-h-[120px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
                                    value={data.summary}
                                    onChange={(e) => handleInputChange('summary', e.target.value)}
                                    placeholder="Briefly describe your professional background..."
                                />
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
                                        <Button onClick={() => removeEducation(edu.id)} variant="icon" className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50" size="icon">
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

                {/* EXPERIENCE TAB */}
                {activeTab === 'experience' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Work History</h3>
                            <Button onClick={addExperience} variant="primary" size="sm" leftIcon={<PlusIcon className="w-4 h-4" />}>
                                Add Position
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {data.experience.map((exp, idx) => (
                                <div key={exp.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Button onClick={() => removeExperience(exp.id)} variant="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50" size="icon">
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
                                            className="w-full min-h-[100px] p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            value={exp.description}
                                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                            placeholder="• Achieved X by doing Y..."
                                        />
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

                {/* SKILLS & PROJECTS TAB */}
                {activeTab === 'skills' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Skills</h3>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Comma separated list</label>
                                <textarea
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
                                        <Button onClick={() => removeProject(proj.id)} variant="icon" className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50" size="icon">
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <Input label="Project Name" value={proj.name} onChange={(v) => updateProject(proj.id, 'name', v)} />
                                            <Input label="Link (optional)" value={proj.link} onChange={(v) => updateProject(proj.id, 'link', v)} />
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md text-sm"
                                                placeholder="Project description..."
                                                rows={2}
                                                value={proj.description}
                                                onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                                            />
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

// Helper Input Component
const Input = ({ label, value, onChange, type = "text", disabled = false }: { label: string, value: string, onChange: (val: string) => void, type?: string, disabled?: boolean }) => (
    <div className="flex flex-col gap-1">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
        <input
            type={type}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    </div>
);

export default ResumeEditor;

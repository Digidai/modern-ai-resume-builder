import React, { useState, useMemo } from 'react';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';
import ResumePreview from './ResumePreview';
import { Button } from './Button';
import { ArrowLeftIcon, CheckIcon } from './Icons';

interface TemplateOption {
    id: string;
    name: string;
    description: string;
}

const TEMPLATES: TemplateOption[] = [
    { id: 'modern', name: 'Modern', description: 'Clean and balanced design' },
    { id: 'minimalist', name: 'Minimalist', description: 'Simple and effective' },
    { id: 'sidebar', name: 'Sidebar', description: 'Two-column layout with sidebar' },
    { id: 'professional', name: 'Professional', description: 'Corporate and authoritative' },
    { id: 'creative', name: 'Creative', description: 'Bold colors for creatives' },
    { id: 'executive', name: 'Executive', description: 'High-level and sophisticated' },
    { id: 'tech', name: 'Tech', description: 'Monospace, terminal-inspired' },
    { id: 'compact', name: 'Compact', description: 'Dense information density' },
    { id: 'swiss', name: 'Swiss', description: 'Bold typography and grids' },
    { id: 'academic', name: 'Academic', description: 'Traditional academic CV' },
    { id: 'elegant', name: 'Elegant', description: 'Serif fonts and subtle accents' },
    { id: 'opal', name: 'Opal', description: 'Soft and airy' },
    { id: 'wireframe', name: 'Wireframe', description: 'Structural and outlined' },
    { id: 'berlin', name: 'Berlin', description: 'Modern European style' },
    { id: 'lateral', name: 'Lateral', description: 'Unique horizontal layout' }
];

interface TemplateSelectorProps {
    jobTitle: string;
    onBack: () => void;
    onUseTemplate: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ jobTitle, onBack, onUseTemplate }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('modern');

    // Create preview data based on the selected job title
    const previewData: ResumeData = useMemo(() => {
        return {
            ...INITIAL_RESUME_DATA,
            title: jobTitle, // Override title with selected job
            templateId: selectedTemplateId,
            // We could ideally also fetch/generate a summary or skills relevant to this job title here
            // For now, we keep the default content but update the title.
            summary: `Motivated ${jobTitle} with a passion for delivering high-quality results. Proven track record in the industry.`
        };
    }, [jobTitle, selectedTemplateId]);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 font-sans transition-colors duration-300">

            {/* Left Panel: Preview */}
            <div className="w-full md:w-3/5 lg:w-2/3 h-[50vh] md:h-screen flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50">
                <header className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <Button
                        onClick={onBack}
                        variant="icon"
                        className="-ml-2"
                        title="Back to Directory"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            Previewing: {jobTitle}
                        </h2>
                        <p className="text-xs text-slate-500">Template: {TEMPLATES.find(t => t.id === selectedTemplateId)?.name}</p>
                    </div>

                    <div className="ml-auto">
                        <Button
                            onClick={() => onUseTemplate(selectedTemplateId)}
                            variant="primary"
                            leftIcon={<CheckIcon className="w-4 h-4" />}
                        >
                            Use This Template
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex justify-center items-start">
                    <div className="w-full max-w-[210mm] shadow-2xl bg-white origin-top transform scale-75 md:scale-90 lg:scale-100 transition-transform duration-200">
                        <ResumePreview data={previewData} />
                    </div>
                </div>
            </div>

            {/* Right Panel: Template List */}
            <div className="w-full md:w-2/5 lg:w-1/3 h-[50vh] md:h-screen overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Select a Template</h3>

                    <div className="grid grid-cols-1 gap-4">
                        {TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplateId(template.id)}
                                className={`
                            text-left p-4 rounded-xl border-2 transition-all duration-200 group
                            ${selectedTemplateId === template.id
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }
                        `}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${selectedTemplateId === template.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                                        {template.name}
                                    </span>
                                    {selectedTemplateId === template.id && (
                                        <span className="text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-full p-1">
                                            <CheckIcon className="w-3 h-3" />
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm ${selectedTemplateId === template.id ? 'text-indigo-600/80 dark:text-indigo-300/80' : 'text-slate-500'}`}>
                                    {template.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TemplateSelector;

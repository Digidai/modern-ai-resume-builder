import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';
import ResumePreview from './ResumePreview';
import { Button } from './Button';
import { ArrowLeftIcon, CheckIcon } from './Icons';
import { getResumeDataForRole } from '../data/roleExamples';

// Extended template list with colors and visual identifiers (matching ResumeEditor)
const TEMPLATES = [
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

interface TemplateSelectorProps {
    onUseTemplate: (jobTitle: string, templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onUseTemplate }) => {
    const { jobTitle } = useParams<{ jobTitle: string }>();
    const navigate = useNavigate();
    const [selectedTemplateId, setSelectedTemplateId] = useState('modern');

    const decodedJobTitle = useMemo(() => {
        // Decode URI and replace hyphens with spaces for display
        return jobTitle ? decodeURIComponent(jobTitle).replace(/-/g, ' ') : "Professional";
    }, [jobTitle]);

    // SEO: Update Page Title
    useEffect(() => {
        document.title = `Resume Templates for ${decodedJobTitle} - ModernCV`;
    }, [decodedJobTitle]);

    // Create preview data based on the selected job title using the new helper
    const previewData: ResumeData = useMemo(() => {
        const roleData = getResumeDataForRole(decodedJobTitle, INITIAL_RESUME_DATA);
        return {
            ...roleData,
            templateId: selectedTemplateId,
        };
    }, [decodedJobTitle, selectedTemplateId]);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 font-sans transition-colors duration-300">

            {/* Left Panel: Preview */}
            <div className="w-full md:w-3/5 lg:w-2/3 h-[50vh] md:h-screen flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50">
                <header className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <Button
                        onClick={() => navigate('/directory')}
                        variant="icon"
                        className="-ml-2"
                        title="Back to Directory"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            Previewing: {decodedJobTitle}
                        </h2>
                        <p className="text-xs text-slate-500">Template: {TEMPLATES.find(t => t.id === selectedTemplateId)?.name}</p>
                    </div>

                    <div className="ml-auto">
                        <Button
                            onClick={() => onUseTemplate(decodedJobTitle, selectedTemplateId)}
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
            <div className="w-full md:w-2/5 lg:w-1/3 h-[50vh] md:h-screen overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar border-l border-slate-200 dark:border-slate-800">
                <div className="p-6 md:p-8 max-w-xl mx-auto">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select a Template</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Choose a design that fits your style. Content is preserved across templates.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplateId(t.id)}
                                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left group hover:border-indigo-300 hover:shadow-lg w-full aspect-[3/4] flex flex-col
                            ${selectedTemplateId === t.id
                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-600 shadow-md'
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                                    }
                        `}
                            >
                                <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-3 relative">
                                    {/* Mini visual representation */}
                                    <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                        {t.id === 'sidebar' && <div className="h-full w-1/3 bg-slate-800 absolute left-0"></div>}
                                        {t.id === 'minimalist' && <div className="h-1 w-1/2 bg-black mx-auto mt-4"></div>}
                                        {t.id === 'executive' && <div className="h-full w-full border-t-4 border-slate-600 mt-2"></div>}
                                        {t.id === 'modern' && <div className="h-full w-full p-2"><div className="w-8 h-1 bg-indigo-500 mb-1"></div></div>}
                                        {t.id === 'creative' && <div className="h-full w-full bg-white"><div className="h-1/4 bg-emerald-600 w-full"></div><div className="flex h-3/4"><div className="w-1/3 bg-slate-100"></div></div></div>}
                                        {t.id === 'compact' && <div className="h-full w-full p-2"><div className="border-b-2 border-black mb-1"></div><div className="space-y-1"><div className="h-1 bg-slate-300 w-full"></div><div className="h-1 bg-slate-300 w-full"></div></div></div>}
                                        {t.id === 'tech' && <div className="h-full w-full bg-white p-2 font-mono text-[6px] text-slate-400">{'< />'}</div>}
                                        {t.id === 'professional' && <div className="h-full w-full bg-white"><div className="h-1/3 bg-slate-800 w-full"></div><div className="flex h-2/3"><div className="w-2/3 bg-white"></div><div className="w-1/3 bg-slate-50 border-l border-slate-200"></div></div></div>}
                                        {t.id === 'academic' && <div className="h-full w-full bg-white p-2 flex flex-col items-center"><div className="w-3/4 h-1 bg-black mb-1"></div><div className="w-full h-px bg-slate-300 mb-1"></div><div className="space-y-1 w-full"><div className="h-0.5 bg-slate-300 w-full"></div><div className="h-0.5 bg-slate-300 w-full"></div></div></div>}
                                        {t.id === 'elegant' && <div className="h-full w-full bg-stone-50 p-2"><div className="w-full border-b border-stone-300 mb-2"></div><div className="flex gap-2"><div className="w-1/4 h-full border-r border-stone-200"></div><div className="w-3/4"></div></div></div>}
                                        {t.id === 'swiss' && <div className="h-full w-full bg-white p-2 flex gap-1"><div className="w-1/3 bg-slate-900 h-1/2"></div><div className="flex-1 flex flex-col gap-1"><div className="w-full h-1 bg-black"></div><div className="w-3/4 h-1 bg-slate-300"></div></div></div>}
                                        {t.id === 'opal' && <div className="h-full w-full bg-white p-2 flex flex-col items-center gap-1"><div className="w-1/2 h-1 bg-slate-200 rounded-full"></div><div className="w-3/4 h-8 bg-slate-50 rounded-lg"></div></div>}
                                        {t.id === 'wireframe' && <div className="h-full w-full bg-slate-50 p-2 font-mono flex flex-col gap-1"><div className="w-full border border-black h-1/4"></div><div className="flex flex-1 gap-1"><div className="w-1/3 border border-black"></div><div className="w-2/3 border border-black"></div></div></div>}
                                        {t.id === 'berlin' && <div className="h-full w-full bg-white p-2 flex flex-col"><div className="w-full h-1 bg-black mb-2"></div><div className="w-3/4 h-2 bg-black mb-2"></div><div className="w-full border-t border-black pt-1 flex gap-1"><div className="w-full h-0.5 bg-slate-400"></div></div></div>}
                                        {t.id === 'lateral' && <div className="h-full w-full bg-white p-2 flex flex-col gap-1"><div className="w-full border-b border-slate-200 h-1/4 mb-1"></div><div className="flex flex-1"><div className="w-1/4 border-r border-slate-100"></div><div className="w-3/4"></div></div></div>}
                                        {t.id === 'iron' && <div className="h-full w-full bg-white flex flex-col"><div className="w-full h-1/4 bg-black p-1"></div><div className="p-1 flex flex-col gap-1"><div className="w-1/3 h-1 bg-black"></div><div className="w-full h-px bg-slate-200"></div><div className="w-1/3 h-1 bg-black mt-1"></div></div></div>}
                                        {t.id === 'ginto' && <div className="h-full w-full bg-white p-2 flex flex-col gap-1"><div className="w-full h-1/3 mb-1"><div className="w-1/2 h-full border-b-2 border-slate-900"></div></div><div className="flex gap-1 items-start"><div className="text-[8px] font-black text-slate-200">01</div><div className="flex-1 space-y-1"><div className="w-full h-1 bg-slate-200"></div></div></div></div>}
                                        {t.id === 'symmetry' && <div className="h-full w-full bg-slate-50 p-2 flex flex-col items-center"><div className="w-1/2 h-1 bg-slate-800 mb-2"></div><div className="w-full h-px bg-slate-200 mb-2"></div><div className="w-full flex justify-between gap-2 px-1"><div className="w-1/3 text-[4px] text-right">ooo</div><div className="w-2/3 h-6 border-l border-slate-200"></div></div></div>}
                                        {t.id === 'bronx' && <div className="h-full w-full bg-white p-2 flex flex-col"><div className="w-3/4 h-8 bg-black mb-2 text-white text-[8px] font-black leading-none p-1">NAME</div><div className="flex gap-1 h-full"><div className="w-1/3 flex flex-col gap-1"><div className="w-full h-1 bg-black"></div><div className="w-full h-1 bg-black"></div></div><div className="flex-1 flex flex-col gap-2"><div className="w-full h-px bg-black mb-1"></div><div className="w-full h-full bg-slate-50"></div></div></div></div>}
                                        {t.id === 'path' && <div className="h-full w-full bg-white p-2 flex gap-1"><div className="relative w-4 h-full"><div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-indigo-200"></div><div className="absolute left-0.5 top-2 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white"></div></div><div className="flex-1 flex flex-col gap-1 pt-2"><div className="w-full h-1 bg-slate-300"></div><div className="w-3/4 h-1 bg-slate-200"></div><div className="w-full h-10 bg-slate-50 mt-1"></div></div></div>}
                                        {t.id === 'quartz' && <div className="h-full w-full bg-white p-1"><div className="h-full w-full border border-black p-1 flex flex-col"><div className="w-full h-1/4 border-b border-black mb-1"></div><div className="flex flex-1 gap-1"><div className="w-1/3 border-r border-black"></div><div className="flex-1"></div></div></div></div>}
                                        {t.id === 'silk' && <div className="h-full w-full bg-[#fafaf9] p-2 flex flex-col items-center"><div className="font-serif italic text-[6px] text-stone-800 mb-1">Name</div><div className="w-full h-px bg-stone-200 mb-2"></div><div className="w-3/4 flex flex-col gap-1"><div className="w-full h-1 bg-stone-200"></div><div className="w-full h-1 bg-stone-100"></div></div></div>}
                                        {t.id === 'mono' && <div className="h-full w-full bg-slate-900 p-2 flex flex-col"><div className="text-[5px] text-green-400 mb-1">// code</div><div className="w-1/2 h-1 bg-slate-700 mb-1"></div><div className="w-full h-px bg-slate-700 mb-2"></div><div className="flex flex-col gap-1 pl-1 border-l border-slate-700"><div className="w-3/4 h-1 bg-slate-700"></div></div></div>}
                                        {t.id === 'pop' && <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-pink-50 p-2"><div className="w-1/2 h-1 bg-slate-800 rounded-full mb-1"></div><div className="w-1/3 h-2 bg-indigo-500 rounded-full mb-2"></div><div className="w-full h-8 bg-white/50 rounded-xl"></div></div>}
                                        {t.id === 'noir' && <div className="h-full w-full bg-zinc-900 p-2 flex flex-col"><div className="w-2/3 h-1 bg-zinc-700 mb-1"></div><div className="w-1/3 h-0.5 bg-amber-400 mb-2"></div><div className="flex gap-1 h-full"><div className="flex-1 border-l border-zinc-700 pl-1"><div className="w-full h-1 bg-zinc-700"></div></div><div className="w-1/4"></div></div></div>}
                                        {t.id === 'paper' && <div className="h-full w-full bg-[#fffef8] p-2 flex flex-col items-center font-serif"><div className="w-2/3 h-1 bg-black mb-1"></div><div className="w-full border-b border-black mb-2"></div><div className="flex gap-1 w-full"><div className="flex-1"><div className="h-1 bg-slate-300 mb-1"></div><div className="h-1 bg-slate-300"></div></div><div className="w-1/3 border-l border-slate-200 pl-1"><div className="h-1 bg-slate-300"></div></div></div></div>}
                                        {t.id === 'cast' && <div className="h-full w-full bg-[#fafafa] p-2 font-mono flex flex-col items-center"><div className="w-1/2 h-1 bg-slate-800 mb-3 border-b border-slate-300"></div><div className="w-full flex flex-col gap-2"><div className="text-[4px] uppercase mr-auto text-slate-500">INT. Work</div><div className="w-3/4 h-1 bg-slate-300 mx-auto"></div></div></div>}
                                        {t.id === 'moda' && <div className="h-full w-full bg-white p-2 flex flex-col items-center justify-between"><div className="flex flex-col items-center w-full"><div className="w-3/4 h-1 bg-black mb-1"></div><div className="text-[4px] tracking-widest text-slate-400">DESIGN</div></div><div className="text-[4px] tracking-[0.2em] text-center w-full text-slate-300">CONTENT</div></div>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full ${t.color} shadow-sm flex items-center justify-center text-white text-[10px] font-bold`}>
                                            {t.name[0]}
                                        </div>
                                        <span className={`font-semibold text-sm ${selectedTemplateId === t.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {t.name}
                                        </span>
                                    </div>
                                    {selectedTemplateId === t.id && (
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TemplateSelector;

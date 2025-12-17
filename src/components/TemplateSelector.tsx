import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';
import ResumePreview from './ResumePreview';
import { ScaledResumePreview } from './ScaledResumePreview';
import { Button } from './Button';
import { ArrowLeftIcon, CheckIcon } from './Icons';
import { getResumeDataForRole } from '../data/roleExamples';
import jobTitlesData from '../data/jobTitles.json';
import { findJobTitleBySlug, humanizeSlug, slugifyJobTitle } from '../utils/slug';
import { getPersonaFullNameForJobTitle } from '../data/personas';

interface JobTitleCategory {
    name: string;
    titles: string[];
}

const ALL_JOB_TITLES = (jobTitlesData as JobTitleCategory[]).flatMap((category) => category.titles);

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

    const { resolvedJobTitle, canonicalSlug } = useMemo(() => {
        const raw = jobTitle ?? '';
        if (!raw) return { resolvedJobTitle: 'Professional', canonicalSlug: null as string | null };

        const matched = findJobTitleBySlug(raw, ALL_JOB_TITLES);
        if (matched) {
            return { resolvedJobTitle: matched, canonicalSlug: slugifyJobTitle(matched) };
        }

        const humanized = humanizeSlug(raw);
        return { resolvedJobTitle: humanized || 'Professional', canonicalSlug: null as string | null };
    }, [jobTitle]);

    // Canonicalize legacy/odd slugs to a single SEO-friendly URL.
    useEffect(() => {
        if (!canonicalSlug || !jobTitle) return;
        if (jobTitle !== canonicalSlug) {
            navigate(`/resume_tmpl/${canonicalSlug}`, { replace: true });
        }
    }, [canonicalSlug, jobTitle, navigate]);

    // SEO: Update Page Title
    useEffect(() => {
        document.title = `Resume Templates for ${resolvedJobTitle} - ModernCV`;
    }, [resolvedJobTitle]);

    // Create preview data based on the selected job title using the new helper
    const previewData: ResumeData = useMemo(() => {
        const roleData = getResumeDataForRole(resolvedJobTitle, INITIAL_RESUME_DATA);
        return {
            ...roleData,
            fullName: getPersonaFullNameForJobTitle(resolvedJobTitle),
            templateId: selectedTemplateId,
        };
    }, [resolvedJobTitle, selectedTemplateId]);

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
                            Previewing: {resolvedJobTitle}
                        </h2>
                        <p className="text-xs text-slate-500">Template: {TEMPLATES.find(t => t.id === selectedTemplateId)?.name}</p>
                    </div>

                    <div className="ml-auto">
                        <Button
                            onClick={() => onUseTemplate(resolvedJobTitle, selectedTemplateId)}
                            variant="primary"
                            leftIcon={<CheckIcon className="w-4 h-4" />}
                        >
                            Use This Template
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 lg:p-12 flex justify-center items-start">
                    <div className="w-full max-w-[210mm] shadow-2xl bg-white origin-top transition-transform duration-200">
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
                                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left group hover:border-indigo-300 hover:shadow-lg w-full aspect-[210/297] flex flex-col
                            ${selectedTemplateId === t.id
                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-600 shadow-md'
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                                    }
                        `}
                            >
                                <div className="flex-1 w-full bg-slate-50 rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-3 relative group-hover:shadow-md transition-shadow">
                                    <ScaledResumePreview data={previewData} templateId={t.id} />
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

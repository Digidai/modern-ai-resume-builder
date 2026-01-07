import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';
import ResumePreview from './ResumePreview';
import { ScaledResumePreview } from './ScaledResumePreview';
import { Button } from './Button';
import { ArrowLeftIcon, CheckIcon } from './Icons';
import ThemeToggle from './ThemeToggle';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { getResumeDataForRole } from '../data/roleExamples';
import jobTitlesData from '../data/jobTitles.json';
import { findJobTitleBySlug, humanizeSlug, slugifyJobTitle } from '../utils/slug';
import { getPersonaFullNameForJobTitle } from '../data/personas';
import { TEMPLATES } from '../constants/templates';

interface JobTitleCategory {
    name: string;
    titles: string[];
}

const JOB_CATEGORIES = jobTitlesData as JobTitleCategory[];
const ALL_JOB_TITLES = JOB_CATEGORIES.flatMap((category) => category.titles);

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

    const siteUrl = getSiteUrl();
    const orgId = `${siteUrl}/#organization`;
    const websiteId = `${siteUrl}/#website`;
    const canonicalPath = canonicalSlug
        ? `/resume_tmpl/${canonicalSlug}`
        : `/resume_tmpl/${slugifyJobTitle(resolvedJobTitle)}`;
    const pageUrl = `${siteUrl}${canonicalPath}`;
    const ogImagePath = canonicalSlug
        ? `/og/resume_tmpl/${canonicalSlug}.png`
        : '/og/resume_tmpl/default.png';
    const ogImageAlt = `Resume templates for ${resolvedJobTitle}`;
    const ogImageUrl = `${siteUrl}${ogImagePath}`;

    // Canonicalize legacy/odd slugs to a single SEO-friendly URL.
    useEffect(() => {
        if (!canonicalSlug || !jobTitle) return;
        if (jobTitle !== canonicalSlug) {
            navigate(`/resume_tmpl/${canonicalSlug}`, { replace: true });
        }
    }, [canonicalSlug, jobTitle, navigate]);

    // Keyboard navigation for template selection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            try {
                if (!TEMPLATES || TEMPLATES.length === 0) return;

                const currentIndex = TEMPLATES.findIndex(t => t.id === selectedTemplateId);
                if (currentIndex === -1) return;

                if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    setSelectedTemplateId(TEMPLATES[currentIndex - 1].id);
                    e.preventDefault();
                } else if (e.key === 'ArrowRight' && currentIndex < TEMPLATES.length - 1) {
                    setSelectedTemplateId(TEMPLATES[currentIndex + 1].id);
                    e.preventDefault();
                }
            } catch (error) {
                console.error('Error handling keyboard navigation:', error);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTemplateId]);

    useSeo({
        title: `Resume Templates for ${resolvedJobTitle} | ModernCV`,
        description: `Browse ModernCV resume templates for ${resolvedJobTitle}. Choose a layout, tailor content with AI suggestions, and download as PDF.`,
        canonical: canonicalPath,
        robots: SEO_ROBOTS_INDEX,
        ogImage: ogImagePath,
        imageAlt: ogImageAlt,
        ldJson: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Organization',
                    '@id': orgId,
                    name: 'ModernCV',
                    url: `${siteUrl}/`,
                    logo: {
                        '@type': 'ImageObject',
                        url: `${siteUrl}/apple-touch-icon.png`,
                    },
                },
                {
                    '@type': 'WebSite',
                    '@id': websiteId,
                    name: 'ModernCV',
                    url: `${siteUrl}/`,
                    inLanguage: 'en',
                },
                {
                    '@type': 'WebPage',
                    '@id': `${pageUrl}#webpage`,
                    name: `Resume Templates for ${resolvedJobTitle}`,
                    description: `Browse ModernCV resume templates for ${resolvedJobTitle}.`,
                    url: pageUrl,
                    inLanguage: 'en',
                    isPartOf: { '@id': websiteId },
                    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
                    primaryImageOfPage: {
                        '@type': 'ImageObject',
                        url: ogImageUrl,
                    },
                    mainEntity: {
                        '@type': 'ItemList',
                        itemListElement: TEMPLATES.map((template, index) => ({
                            '@type': 'ListItem',
                            position: index + 1,
                            name: template.name,
                            url: `${pageUrl}#template-${template.id}`,
                        })),
                    },
                },
                {
                    '@type': 'BreadcrumbList',
                    '@id': `${pageUrl}#breadcrumb`,
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                        { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory` },
                        { '@type': 'ListItem', position: 3, name: resolvedJobTitle, item: pageUrl },
                    ],
                },
            ],
        },
    });

    // Create preview data based on the selected job title using the new helper
    const previewData: ResumeData = useMemo(() => {
        const roleData = getResumeDataForRole(resolvedJobTitle, INITIAL_RESUME_DATA);
        return {
            ...roleData,
            fullName: getPersonaFullNameForJobTitle(resolvedJobTitle),
            templateId: selectedTemplateId,
        };
    }, [resolvedJobTitle, selectedTemplateId]);

    const relatedTitles = useMemo(() => {
        const normalizedSlug = slugifyJobTitle(resolvedJobTitle);
        const category = JOB_CATEGORIES.find((cat) =>
            cat.titles.some((title) => slugifyJobTitle(title) === normalizedSlug)
        );
        if (!category) return [];
        return category.titles
            .filter((title) => slugifyJobTitle(title) !== normalizedSlug)
            .slice(0, 8);
    }, [resolvedJobTitle]);

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
                        <p className="text-xs text-slate-500">Template: {TEMPLATES.find(t => t.id === selectedTemplateId)?.name || 'Template'}</p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
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
                    <div className="mb-6">
                        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            <Link className="text-indigo-600 hover:underline" to="/">Home</Link>
                            <span className="mx-2">/</span>
                            <Link className="text-indigo-600 hover:underline" to="/directory">Job Directory</Link>
                            <span className="mx-2">/</span>
                            <span className="text-slate-700 dark:text-slate-200">{resolvedJobTitle}</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Resume Templates for {resolvedJobTitle}
                        </h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                            Preview layouts tailored for {resolvedJobTitle}. Pick a template, then customize and export to PDF.
                        </p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a Template</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Choose a design that fits your style. Content is preserved across templates.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.id}
                                id={`template-${t.id}`}
                                onClick={() => setSelectedTemplateId(t.id)}
                                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left group hover:border-indigo-300 hover:shadow-lg w-full aspect-[210/297] flex flex-col
                            ${selectedTemplateId === t.id
                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-600 shadow-md'
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                                    }
                        `}
                            >
                                <div className="flex-1 w-full bg-slate-50 rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-3 relative group-hover:shadow-md transition-shadow p-3 flex justify-center items-start">
                                    <ScaledResumePreview data={previewData} templateId={t.id} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full ${t.color} shadow-sm flex items-center justify-center text-white text-[10px] font-bold`}>
                                            {t.name?.[0] || 'T'}
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

                    {relatedTitles.length > 0 && (
                        <div className="mt-10">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Related roles
                            </h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {relatedTitles.map((title) => (
                                    <Link
                                        key={title}
                                        to={`/resume_tmpl/${slugifyJobTitle(title)}`}
                                        className="px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default TemplateSelector;

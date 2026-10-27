import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ResumeData } from '../types';
import { ScaledResumePreview } from './ScaledResumePreview';
import { LazyResumePreview } from './LazyResumePreview';
import { Button } from './Button';
import { CheckIcon } from './Icons';
import { SiteHeader, SiteFooter } from './SiteHeader';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import jobTitlesData from '../data/jobTitles.json';
import { findJobTitleBySlug, humanizeSlug, slugifyJobTitle } from '../utils/slug';
import { TEMPLATES } from '../constants/templates';
import { buildJobSeoDescription, buildJobSeoKeywords } from '../utils/seo';
import { useResume } from '../contexts/ResumeContext';
import roleGuideData from '../data/roleGuides.json';
import { buildRoleGuide } from '../shared/roleGuide.mjs';
import { RoleGuide } from './RoleGuide';
import NotFoundView from '../views/NotFoundView';
import { RoleExampleArticle } from './RoleExampleArticle';
import { AgentPromptCard } from './AgentPromptCard';
import { buildAgentPrompt } from '../shared/agentPrompt.mjs';
import { loadRoleExample, type RoleExample } from '../data/roleExamples';
import { buildJobPageTitle, describeExample, exampleToResume } from '../shared/roleExample.mjs';
import { getPersonaFullNameForJobTitle } from '../data/personas';
import { BLANK_RESUME_DATA, createId } from '../utils/resumeData';

interface JobTitleCategory {
    name: string;
    titles: string[];
}

const JOB_CATEGORIES = jobTitlesData as JobTitleCategory[];
const ALL_JOB_TITLES = JOB_CATEGORIES.flatMap((category) => category.titles);

interface TemplateSelectorProps {
    onUseTemplate: (jobTitle: string, templateId: string) => void;
}

const JobTemplatePage: React.FC<TemplateSelectorProps> = ({ onUseTemplate }) => {
    const { jobTitle } = useParams<{ jobTitle: string }>();
    const navigate = useNavigate();
    const { resumeData, loadResume } = useResume();
    const [selectedTemplateId, setSelectedTemplateId] = useState(() => resumeData.templateId || 'modern');

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
    const normalizedSlug = slugifyJobTitle(resolvedJobTitle);
    const categoryName = useMemo(() => {
        const category = JOB_CATEGORIES.find((cat) =>
            cat.titles.some((title) => slugifyJobTitle(title) === normalizedSlug)
        );
        return category?.name;
    }, [normalizedSlug]);
    const guide = useMemo(
        () => buildRoleGuide({ title: resolvedJobTitle, category: categoryName, data: roleGuideData, templates: TEMPLATES }),
        [resolvedJobTitle, categoryName]
    );
    const canonicalPath = canonicalSlug
        ? `/resume_tmpl/${canonicalSlug}/`
        : `/resume_tmpl/${slugifyJobTitle(resolvedJobTitle)}/`;
    const pageUrl = `${siteUrl}${canonicalPath}`;
    const ogImagePath = canonicalSlug
        ? `/og/resume_tmpl/${canonicalSlug}.png`
        : '/og/resume_tmpl/default.png';
    const ogImageAlt = `Resume templates for ${resolvedJobTitle}`;
    const ogImageUrl = `${siteUrl}${ogImagePath}`;
    // The role's example resume (lazy-loaded per job family); previews show it instead of the user's own data.
    const [example, setExample] = useState<RoleExample | null>(null);
    useEffect(() => {
        let cancelled = false;
        void loadRoleExample(resolvedJobTitle, categoryName).then((found) => {
            if (!cancelled) setExample(found);
        });
        return () => {
            cancelled = true;
        };
    }, [resolvedJobTitle, categoryName]);
    const personaName = useMemo(() => getPersonaFullNameForJobTitle(resolvedJobTitle), [resolvedJobTitle]);
    const exampleResume = useMemo(
        () => (example ? exampleToResume({ title: resolvedJobTitle, fullName: personaName, example, makeId: createId }) : null),
        [example, resolvedJobTitle, personaName]
    );
    const seoDescription = example
        ? describeExample(resolvedJobTitle, example, TEMPLATES.length)
        : buildJobSeoDescription(resolvedJobTitle, categoryName);
    const seoKeywords = buildJobSeoKeywords(resolvedJobTitle, categoryName);

    // Canonicalize legacy/odd slugs to a single SEO-friendly URL.
    useEffect(() => {
        if (!canonicalSlug || !jobTitle) return;
        if (jobTitle !== canonicalSlug) {
            navigate(`/resume_tmpl/${canonicalSlug}`, { replace: true });
        }
    }, [canonicalSlug, jobTitle, navigate]);

    useEffect(() => {
        if (!resumeData.templateId) return;
        setSelectedTemplateId((current) => (current === resumeData.templateId ? current : resumeData.templateId));
    }, [resumeData.templateId]);

    useSeo({
        title: buildJobPageTitle(resolvedJobTitle),
        description: seoDescription,
        keywords: seoKeywords,
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
                    description: seoDescription,
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
                    '@type': 'Occupation',
                    '@id': `${pageUrl}#occupation`,
                    name: resolvedJobTitle,
                    ...(categoryName ? { occupationalCategory: categoryName } : {}),
                    skills: guide.skills.join(', '),
                },
                {
                    '@type': 'FAQPage',
                    '@id': `${pageUrl}#faq`,
                    mainEntity: guide.faqs.map((faq) => ({
                        '@type': 'Question',
                        name: faq.question,
                        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                    })),
                },
                {
                    '@type': 'BreadcrumbList',
                    '@id': `${pageUrl}#breadcrumb`,
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                        { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory/` },
                        { '@type': 'ListItem', position: 3, name: resolvedJobTitle, item: pageUrl },
                    ],
                },
            ],
        },
    });

    // Previews show the role's example (with the user's style settings); without one, the user's own resume.
    const previewData: ResumeData = useMemo(() => {
        if (exampleResume) return { ...BLANK_RESUME_DATA, ...exampleResume, design: resumeData.design, templateId: selectedTemplateId };
        return {
            ...resumeData,
            title: resolvedJobTitle || resumeData.title,
            templateId: selectedTemplateId,
        };
    }, [exampleResume, resumeData, resolvedJobTitle, selectedTemplateId]);

    const relatedTitles = useMemo(() => {
        if (!categoryName) return [];
        const category = JOB_CATEGORIES.find((cat) => cat.name === categoryName);
        if (!category) return [];
        return category.titles
            .filter((title) => slugifyJobTitle(title) !== normalizedSlug)
            .slice(0, 8);
    }, [categoryName, normalizedSlug]);

    const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId);
    const useSelected = () => onUseTemplate(resolvedJobTitle, selectedTemplateId);
    const startFromExample = () => {
        if (!exampleResume) return;
        loadResume(
            { ...BLANK_RESUME_DATA, ...exampleResume, design: resumeData.design, templateId: selectedTemplateId },
            `Opened the ${resolvedJobTitle} example. Replace the details with your own.`
        );
        navigate('/editor');
    };

    // Roving focus for the template radiogroup (arrow keys move and select).
    const handleTemplateKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = TEMPLATES[(index + delta + TEMPLATES.length) % TEMPLATES.length];
        setSelectedTemplateId(next.id);
        document.getElementById(`template-${next.id}`)?.focus();
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-slate-950">
            <SiteHeader />

            <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px]">
                <div className="lg:col-start-2 lg:row-start-1">
                    <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
                        <Link className="hover:text-slate-900 dark:hover:text-white" to="/">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <Link className="hover:text-slate-900 dark:hover:text-white" to="/directory">Resume examples</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span className="text-slate-700 dark:text-slate-200" aria-current="page">{resolvedJobTitle}</span>
                    </nav>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        {resolvedJobTitle} resume example &amp; templates
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {example
                            ? `A realistic ${resolvedJobTitle} resume shown in all ${TEMPLATES.length} designs. Pick a design, then start from the example or use it with your own resume.`
                            : `See your resume as a ${resolvedJobTitle} in every design. Pick one, edit the content, and download a PDF.`}{' '}
                        {example && <a href="#example" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Read the example ↓</a>}
                        {example && <span aria-hidden="true"> · </span>}
                        <a href="#guide" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Writing guide ↓</a>
                    </p>

                    <div className="mx-auto mt-6 w-full max-w-sm overflow-hidden rounded-md shadow-lg ring-1 ring-slate-900/5 lg:hidden">
                        <ScaledResumePreview data={previewData} />
                    </div>

                    <div className="mt-6 hidden flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 pl-4 lg:flex dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Template: <span className="font-semibold text-slate-900 dark:text-white">{selectedTemplate?.name}</span>
                        </p>
                        {exampleResume ? (
                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1" onClick={useSelected}>Use with my resume</Button>
                                <Button className="flex-1" onClick={startFromExample} leftIcon={<CheckIcon className="h-4 w-4" />}>Start from example</Button>
                            </div>
                        ) : (
                            <Button onClick={useSelected} leftIcon={<CheckIcon className="h-4 w-4" />}>Use this template</Button>
                        )}
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-3" role="radiogroup" aria-label="Resume templates">
                        {TEMPLATES.map((t, index) => {
                            const selected = selectedTemplateId === t.id;
                            return (
                                <div key={t.id} className="group relative text-left">
                                    <div
                                        className={`relative overflow-hidden rounded-md bg-white shadow-sm ring-1 transition group-hover:shadow-md group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-indigo-500 ${
                                            selected ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : 'ring-slate-200 dark:ring-slate-700'
                                        }`}
                                    >
                                        <LazyResumePreview data={previewData} templateId={t.id} />
                                        {selected && (
                                            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                                                <CheckIcon className="h-3 w-3" />
                                            </span>
                                        )}
                                    </div>
                                    <span className={`mt-1.5 block truncate text-center text-xs ${selected ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`} title={t.description}>
                                        {t.name}
                                        {t.atsFriendly && <span className="ml-1 font-semibold text-emerald-700 dark:text-emerald-400">· ATS</span>}
                                    </span>
                                  {/* Overlay control: previews contain links, which must not nest inside a button. */}
                                  <button
                                    type="button"
                                    id={`template-${t.id}`}
                                    role="radio"
                                    aria-checked={selected}
                                    tabIndex={selected ? 0 : -1}
                                    onClick={() => setSelectedTemplateId(t.id)}
                                    onKeyDown={(event) => handleTemplateKeyDown(event, index)}
                                    aria-label={`${t.name}: ${t.description}`}
                                    className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-none"
                                  />
                                </div>
                            );
                        })}
                    </div>

                    {relatedTitles.length > 0 && (
                        <div className="mt-10">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Related roles</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {relatedTitles.map((title) => (
                                    <Link
                                        key={title}
                                        to={`/resume_tmpl/${slugifyJobTitle(title)}`}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-300"
                                    >
                                        {title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden lg:col-start-1 lg:row-start-1 lg:block">
                    <div className="mx-auto w-full max-w-[210mm] shadow-xl ring-1 ring-slate-900/5 lg:sticky lg:top-24">
                        <ScaledResumePreview data={previewData} mode="page" />
                    </div>
                </div>
            </main>

            {example && exampleResume && (
                <RoleExampleArticle title={resolvedJobTitle} fullName={personaName} example={example} onStart={startFromExample} />
            )}

            <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6">
                <AgentPromptCard
                    subject={`your ${resolvedJobTitle} resume`}
                    prompt={buildAgentPrompt({ siteUrl, jobTitle: resolvedJobTitle, template: selectedTemplate ?? null })}
                />
            </div>

            <RoleGuide
                title={resolvedJobTitle}
                guide={guide}
                onPickTemplate={(id) => {
                    setSelectedTemplateId(id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            />

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
                {exampleResume ? (
                    <div className="mx-auto flex max-w-xl items-center gap-2">
                        <Button variant="secondary" className="flex-1" onClick={useSelected} aria-label={`Use ${selectedTemplate?.name} with my resume`}>My resume</Button>
                        <Button className="flex-[1.4]" onClick={startFromExample} leftIcon={<CheckIcon className="h-4 w-4" />} aria-label={`Start from the example in ${selectedTemplate?.name}`}>
                            Use example
                        </Button>
                    </div>
                ) : (
                    <div className="mx-auto flex max-w-xl items-center gap-3">
                        <p className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-400">
                            Template: <span className="font-semibold text-slate-900 dark:text-white">{selectedTemplate?.name}</span>
                        </p>
                        <Button onClick={useSelected} leftIcon={<CheckIcon className="h-4 w-4" />}>Use template</Button>
                    </div>
                )}
            </div>
            {/* Room for the fixed mobile "Use template" bar so it never covers the footer. */}
            <div className="pb-20 lg:pb-0">
                <SiteFooter />
            </div>
        </div>
    );
};

/** Unknown job slugs get the not-found view (the Worker also answers them with a 404 status). */
const TemplateSelector: React.FC<TemplateSelectorProps> = (props) => {
    const { jobTitle = '' } = useParams<{ jobTitle: string }>();
    if (!findJobTitleBySlug(jobTitle, ALL_JOB_TITLES)) return <NotFoundView />;
    return <JobTemplatePage key={jobTitle} {...props} />;
};

export default TemplateSelector;

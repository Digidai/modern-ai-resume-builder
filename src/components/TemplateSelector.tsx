import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ResumeData } from '../types';
import { ScaledResumePreview } from './ScaledResumePreview';
import { LazyResumePreview } from './LazyResumePreview';
import { Button } from './Button';
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
    const [showAllTemplates, setShowAllTemplates] = useState(false);

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
    // The example always fits on one A4 page: `example.fit` gives the text size each template needs (default 1),
    // capped by the user's own size setting.
    const exampleScale = useCallback(
        (templateId: string) => Math.min(resumeData.design.scale || 1, example?.fit?.[templateId] ?? 1),
        [resumeData.design.scale, example]
    );
    const previewData: ResumeData = useMemo(() => {
        if (exampleResume)
            return {
                ...BLANK_RESUME_DATA,
                ...exampleResume,
                design: { ...resumeData.design, scale: exampleScale(selectedTemplateId) },
                templateId: selectedTemplateId,
            };
        return {
            ...resumeData,
            title: resolvedJobTitle || resumeData.title,
            templateId: selectedTemplateId,
        };
    }, [exampleResume, resumeData, resolvedJobTitle, selectedTemplateId, exampleScale]);
    // Each picker thumbnail gets the scale of its own template.
    const thumbnailData = useMemo(() => {
        if (!exampleResume) return null;
        return Object.fromEntries(
            TEMPLATES.map((t) => [t.id, { ...previewData, design: { ...previewData.design, scale: exampleScale(t.id) }, templateId: t.id }])
        ) as Record<string, ResumeData>;
    }, [exampleResume, previewData, exampleScale]);

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
            {
                ...BLANK_RESUME_DATA,
                ...exampleResume,
                design: { ...resumeData.design, scale: exampleScale(selectedTemplateId) },
                templateId: selectedTemplateId,
            },
            `Opened the ${resolvedJobTitle} example. Replace the details with your own.`
        );
        navigate('/editor');
    };

    // The picker shows 8 templates until expanded; the selected one is always included.
    const visibleTemplates = useMemo(() => {
        if (showAllTemplates) return TEMPLATES;
        const first = TEMPLATES.slice(0, 8);
        const selected = TEMPLATES.find((t) => t.id === selectedTemplateId);
        return selected && !first.includes(selected) ? [...first, selected] : first;
    }, [showAllTemplates, selectedTemplateId]);

    // Roving focus for the template radiogroup (arrow keys move and select among the visible templates).
    const handleTemplateKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = visibleTemplates[(index + delta + visibleTemplates.length) % visibleTemplates.length];
        setSelectedTemplateId(next.id);
        document.getElementById(`template-${next.id}`)?.focus();
    };

    const textLink = 'focus-ring font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent';

    return (
        <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
            <SiteHeader />

            <main className="mx-auto grid w-full max-w-7xl flex-1 gap-10 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-14">
                <div className="lg:col-start-2 lg:row-start-1">
                    <nav aria-label="Breadcrumb" className="text-sm text-muted">
                        <Link className="focus-ring hover:text-ink" to="/">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <Link className="focus-ring hover:text-ink" to="/directory">Resume examples</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span className="text-ink" aria-current="page">{resolvedJobTitle}</span>
                    </nav>
                    {categoryName && <p className="kicker mt-6 text-muted">{categoryName}</p>}
                    <h1 className="mt-2 font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink sm:text-[40px] sm:leading-[46px]">
                        {resolvedJobTitle} resume example &amp; templates
                    </h1>
                    <p className="mt-3 text-[15px] leading-6 text-muted">
                        {example
                            ? `A realistic ${resolvedJobTitle} resume shown in all ${TEMPLATES.length} designs. Pick a design, then start from the example or use it with your own resume.`
                            : `See your resume as a ${resolvedJobTitle} in every design. Pick one, edit the content, and download a PDF.`}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
                        {example && <a href="#example" className={textLink}>Read the example</a>}
                        <a href="#guide" className={textLink}>Writing guide</a>
                    </p>

                    <div className="mx-auto mt-6 w-full max-w-sm bg-white shadow-sheet lg:hidden">
                        <ScaledResumePreview data={previewData} />
                    </div>

                    <div className="mt-6 hidden flex-col gap-3 border-y border-rule py-4 lg:flex">
                        <p className="text-sm text-muted">
                            Template: <span className="font-semibold text-ink">{selectedTemplate?.name}</span>
                        </p>
                        {exampleResume ? (
                            <div className="flex gap-2">
                                <Button className="flex-1" onClick={startFromExample}>Start from example</Button>
                                <Button variant="secondary" className="flex-1" onClick={useSelected}>Use my resume</Button>
                            </div>
                        ) : (
                            <Button onClick={useSelected}>Use this template</Button>
                        )}
                    </div>

                    <div className="mt-6 flex items-baseline justify-between">
                        <h2 className="kicker text-muted">Choose a design</h2>
                        <span className="kicker text-muted">{TEMPLATES.length} templates</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-3" role="radiogroup" aria-label="Resume templates">
                        {visibleTemplates.map((t, index) => {
                            const selected = selectedTemplateId === t.id;
                            return (
                                <div key={t.id} className="group relative text-left">
                                    <div
                                        className={`relative overflow-hidden rounded-md bg-white outline-offset-2 transition-shadow group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-accent ${
                                            selected ? 'outline-2 outline-accent' : 'shadow-card ring-1 ring-rule group-hover:shadow-raised'
                                        }`}
                                    >
                                        <LazyResumePreview data={thumbnailData?.[t.id] ?? previewData} templateId={t.id} />
                                    </div>
                                    <span className={`mt-1.5 flex items-baseline justify-between gap-1 text-xs ${selected ? 'font-semibold text-ink' : 'text-muted'}`} title={t.description}>
                                        <span className="truncate">{t.name}</span>
                                        {t.atsFriendly && <span className="tag shrink-0">ATS</span>}
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
                                        className="absolute inset-0 cursor-pointer focus-visible:outline-none"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAllTemplates((v) => !v)}
                        aria-expanded={showAllTemplates}
                        className={`${textLink} mt-4 text-sm`}
                    >
                        {showAllTemplates ? 'Show fewer' : `Show all ${TEMPLATES.length}`}
                    </button>

                    {relatedTitles.length > 0 && (
                        <div className="mt-10 border-t border-rule pt-4">
                            <h2 className="kicker text-muted">Related roles</h2>
                            <ul className="mt-2 columns-2 gap-6 text-sm">
                                {relatedTitles.map((title) => (
                                    <li key={title} className="break-inside-avoid py-1">
                                        <Link to={`/resume_tmpl/${slugifyJobTitle(title)}`} className="focus-ring text-ink hover:text-accent hover:underline hover:underline-offset-4">
                                            {title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="hidden lg:col-start-1 lg:row-start-1 lg:block">
                    <div className="mx-auto w-full max-w-[210mm] bg-white shadow-sheet lg:sticky lg:top-24">
                        <ScaledResumePreview data={previewData} mode="page" />
                    </div>
                </div>
            </main>

            {example && exampleResume && (
                <RoleExampleArticle title={resolvedJobTitle} fullName={personaName} example={example} onStart={startFromExample} />
            )}

            <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6">
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

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper/95 px-3 pb-3 pt-2 backdrop-blur-sm lg:hidden">
                <div className="mx-auto max-w-xl">
                    <p className="mb-2 truncate text-xs text-muted">
                        Template: <span className="font-semibold text-ink">{selectedTemplate?.name}</span>
                    </p>
                    {exampleResume ? (
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" className="flex-1" onClick={useSelected} aria-label={`Use ${selectedTemplate?.name} with my resume`}>Use my resume</Button>
                            <Button className="flex-1" onClick={startFromExample} aria-label={`Start from the example in ${selectedTemplate?.name}`}>
                                Start from example
                            </Button>
                        </div>
                    ) : (
                        <Button className="w-full" onClick={useSelected}>Use this template</Button>
                    )}
                </div>
            </div>
            {/* Room for the fixed mobile "Use template" bar so it never covers the footer. */}
            <div className="pb-28 lg:pb-0">
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

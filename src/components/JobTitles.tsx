import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { SearchIcon, XIcon } from './Icons';
import { Button } from './Button';
import { SiteHeader, SiteFooter } from './SiteHeader';
import { useResume } from '../contexts/ResumeContext';
import jobTitlesData from '../data/jobTitles.json';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { slugifyJobTitle } from '../utils/slug';
import { debounce } from '../utils/debounce';
import { buildDirectorySeoKeywords } from '../utils/seo';

interface JobTitleCategory {
    name: string;
    titles: string[];
}

const JOB_CATEGORIES = jobTitlesData as JobTitleCategory[];

interface CategoryCardProps {
    category: JobTitleCategory;
    isSearching: boolean;
    isExpanded: boolean;
    onToggleCategory: (name: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSearching, isExpanded, onToggleCategory }) => {
    const visibleTitles = isSearching || isExpanded ? category.titles : category.titles.slice(0, 10);
    const hasMore = !isSearching && category.titles.length > visibleTitles.length;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3 font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                {category.name}
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {category.titles.length}
                </span>
            </h2>
            <ul className="-mx-2">
                {visibleTitles.map((title) => (
                    <li key={title}>
                        <Link
                            to={`/resume_tmpl/${slugifyJobTitle(title)}`}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
                        >
                            {title}
                        </Link>
                    </li>
                ))}
            </ul>
            {!isSearching && category.titles.length > 10 && (
                <button
                    type="button"
                    className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                    onClick={() => onToggleCategory(category.name)}
                    aria-expanded={!hasMore}
                >
                    {hasMore ? `Show all ${category.titles.length}` : 'Show fewer'}
                </button>
            )}
        </section>
    );
};

const JobTitles: React.FC = () => {
    const navigate = useNavigate();
    const { setResumeData } = useResume();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const siteUrl = getSiteUrl();
    const orgId = `${siteUrl}/#organization`;
    const websiteId = `${siteUrl}/#website`;

    const allTitles = useMemo(
        () => JOB_CATEGORIES.flatMap((category) => category.titles),
        []
    );

    const directoryOgImage = '/og/directory.png';
    const directoryOgImageUrl = `${siteUrl}${directoryOgImage}`;

    useSeo({
        title: 'Browse Resume Templates by Job Title | ModernCV Directory',
        description: 'Explore resume templates by job title. Pick your role, preview designs, and build a professional resume with AI assistance.',
        keywords: buildDirectorySeoKeywords(),
        canonical: '/directory/',
        robots: SEO_ROBOTS_INDEX,
        ogImage: directoryOgImage,
        imageAlt: 'ModernCV job title resume template directory preview',
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
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: `${siteUrl}/directory/?q={search_term_string}`,
                        'query-input': 'required name=search_term_string',
                    },
                },
                {
                    '@type': 'CollectionPage',
                    '@id': `${siteUrl}/directory/#collection`,
                    name: 'Job Title Resume Template Directory',
                    description: 'Browse ModernCV resume templates by job title and role.',
                    url: `${siteUrl}/directory/`,
                    inLanguage: 'en',
                    isPartOf: { '@id': websiteId },
                    primaryImageOfPage: {
                        '@type': 'ImageObject',
                        url: directoryOgImageUrl,
                    },
                    mainEntity: {
                        '@type': 'ItemList',
                        itemListElement: allTitles.map((title, index) => ({
                            '@type': 'ListItem',
                            position: index + 1,
                            name: title,
                            url: `${siteUrl}/resume_tmpl/${slugifyJobTitle(title)}`,
                        })),
                    },
                },
                {
                    '@type': 'BreadcrumbList',
                    '@id': `${siteUrl}/directory/#breadcrumb`,
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                        { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory/` },
                    ],
                },
            ],
        },
    });

    const searchQuery = searchParams.get('q') ?? '';

    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);


    const filteredCategories = useMemo(() => {
        if (!search.trim()) return JOB_CATEGORIES;

        const lowerSearch = search.toLowerCase();

        return JOB_CATEGORIES.map(category => {
            // Check if category name matches
            if (category.name.toLowerCase().includes(lowerSearch)) {
                return category;
            }
            // Or filter titles
            const filteredTitles = category.titles.filter(title =>
                title.toLowerCase().includes(lowerSearch)
            );

            if (filteredTitles.length > 0) {
                return {
                    ...category,
                    titles: filteredTitles
                };
            }
            return null;
        }).filter(Boolean) as JobTitleCategory[];
    }, [search]);

    const isSearching = search.trim().length > 0;

    const stats = useMemo(() => {
        const totalCategories = JOB_CATEGORIES.length;
        const totalTitles = JOB_CATEGORIES.reduce((sum, c) => sum + c.titles.length, 0);

        const filteredTitleCount = filteredCategories.reduce((sum, c) => sum + c.titles.length, 0);
        return { totalCategories, totalTitles, filteredTitleCount };
    }, [filteredCategories]);

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));
    };

    const clearSearch = () => {
        setSearch('');
        debouncedSetSearchParams.cancel();
        setSearchParams({}, { replace: true });
    };

    const debouncedSetSearchParams = useMemo(() => {
        return debounce((query: string) => {
            if (query.trim()) {
                setSearchParams({ q: query }, { replace: true });
            } else {
                setSearchParams({}, { replace: true });
            }
        }, 300);
    }, [setSearchParams]);

    useEffect(() => {
        return () => {
            debouncedSetSearchParams.cancel();
        };
    }, [debouncedSetSearchParams]);

    const useCustomTitle = () => {
        setResumeData((prev) => ({ ...prev, title: search.trim() }));
        navigate('/editor');
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-slate-950">
            <SiteHeader />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-8 sm:px-6">
                <nav className="text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
                    <Link className="hover:text-slate-900 dark:hover:text-white" to="/">Home</Link>
                    <span className="mx-2" aria-hidden="true">/</span>
                    <span className="text-slate-700 dark:text-slate-200" aria-current="page">Resume examples</span>
                </nav>

                <div className="mx-auto mb-12 mt-8 max-w-2xl text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        Resume examples by job title
                    </h1>
                    <p className="mt-3 text-slate-600 dark:text-slate-400">
                        Pick your role to see it in every template, then make it yours.
                    </p>
                    <div className="relative mt-8">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="search"
                            className="block h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white [&::-webkit-search-cancel-button]:hidden"
                            placeholder="Search roles, e.g. Product Manager"
                            value={search}
                            aria-label="Search job titles"
                            onChange={(e) => {
                                const next = e.target.value;
                                setSearch(next);
                                debouncedSetSearchParams(next);
                            }}
                        />
                        {isSearching && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                aria-label="Clear search"
                            >
                                <XIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400" aria-live="polite" aria-atomic="true">
                        {isSearching
                            ? `${stats.filteredTitleCount} ${stats.filteredTitleCount === 1 ? 'role' : 'roles'} in ${filteredCategories.length} ${filteredCategories.length === 1 ? 'category' : 'categories'}`
                            : `${stats.totalTitles} roles across ${stats.totalCategories} categories`}
                    </p>
                </div>

                {filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCategories.map((category) => (
                            <CategoryCard
                                key={category.name}
                                category={category}
                                isSearching={isSearching}
                                isExpanded={!!expandedCategories[category.name]}
                                onToggleCategory={toggleCategory}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-800">
                        <p className="font-medium text-slate-900 dark:text-white">No examples for “{search.trim()}” yet</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You can still build a resume with that title.</p>
                        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                            <Button onClick={useCustomTitle}>Use “{search.trim()}” as my title</Button>
                            <Button variant="ghost" onClick={clearSearch}>Clear search</Button>
                        </div>
                    </div>
                )}
            </main>
            <SiteFooter />
        </div>
    );
};

export default JobTitles;

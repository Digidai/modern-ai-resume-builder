import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, SearchIcon } from './Icons';
import { Button } from './Button';
import ThemeToggle from './ThemeToggle';
import jobTitlesData from '../data/jobTitles.json';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { slugifyJobTitle } from '../utils/slug';

interface JobTitleCategory {
    name: string;
    titles: string[];
}

const JOB_CATEGORIES = jobTitlesData as JobTitleCategory[];

interface JobTitlesProps {
    onBack: () => void;
}

const JobTitles: React.FC<JobTitlesProps> = ({ onBack }) => {
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

    useSeo({
        title: 'Browse Resume Templates by Job Title | ModernCV Directory',
        description: 'Explore resume templates by job title. Pick your role, preview designs, and build a professional resume with AI assistance.',
        canonical: '/directory',
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
                        target: `${siteUrl}/directory?q={search_term_string}`,
                        'query-input': 'required name=search_term_string',
                    },
                },
                {
                    '@type': 'CollectionPage',
                    '@id': `${siteUrl}/directory#collection`,
                    name: 'Job Title Resume Template Directory',
                    description: 'Browse ModernCV resume templates by job title and role.',
                    url: `${siteUrl}/directory`,
                    inLanguage: 'en',
                    isPartOf: { '@id': websiteId },
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
                    '@id': `${siteUrl}/directory#breadcrumb`,
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                        { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory` },
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 md:px-12 sticky top-0 z-10 transition-colors">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={onBack}
                            variant="icon"
                            className="-ml-2"
                            title="Back to Home"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Job Title Directory
                        </h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12">
                <nav className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    <Link className="text-indigo-600 hover:underline" to="/">Home</Link>
                    <span className="mx-2">/</span>
                    <span className="text-slate-700 dark:text-slate-200">Job Directory</span>
                </nav>
                {/* Search Section */}
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Find Your Professional Role
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Select a job title to preview related resume templates.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {isSearching
                            ? `Found ${stats.filteredTitleCount} roles in ${filteredCategories.length} categories`
                            : `${stats.totalTitles} roles across ${stats.totalCategories} categories`}
                    </p>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
                            placeholder="Search for a job title (e.g., 'Product Manager')..."
                            value={search}
                            onChange={(e) => {
                                const next = e.target.value;
                                setSearch(next);
                                if (next.trim()) {
                                    setSearchParams({ q: next }, { replace: true });
                                } else {
                                    setSearchParams({}, { replace: true });
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                            (() => {
                                const isExpanded = !!expandedCategories[category.name];
                                const visibleTitles = isSearching || isExpanded ? category.titles : category.titles.slice(0, 10);
                                const hasMore = !isSearching && category.titles.length > visibleTitles.length;

                                return (
                            <div key={category.name} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    {category.name}
                                    <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        {category.titles.length}
                                    </span>
                                </h3>
                                <ul className="space-y-1">
                                    {visibleTitles.map((title) => (
                                        <li key={title}>
                                            <Link
                                                to={`/resume_tmpl/${slugifyJobTitle(title)}`}
                                                className="block w-full text-left px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                            >
                                                {title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                {!isSearching && category.titles.length > 10 && (
                                    <div className="mt-4">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-center text-indigo-600"
                                            onClick={() => toggleCategory(category.name)}
                                        >
                                            {hasMore ? `Show all ${category.titles.length}` : 'Show less'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                                );
                            })()
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-slate-500 dark:text-slate-400 text-lg">No job titles found matching "{search}"</p>
                            <Button
                                variant="ghost"
                                className="mt-4 text-indigo-600"
                                onClick={() => setSearch("")}
                            >
                                Clear Search
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default JobTitles;

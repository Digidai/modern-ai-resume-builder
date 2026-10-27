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
        <section className="mb-10 break-inside-avoid border-t border-ink pt-3">
            <h2 className="flex items-baseline justify-between gap-3 font-display text-xl font-semibold tracking-display text-ink">
                {category.name}
                <span className="kicker shrink-0 font-normal text-muted">{category.titles.length}</span>
            </h2>
            <ul className="mt-2">
                {visibleTitles.map((title) => (
                    <li key={title} className="border-b border-rule last:border-b-0">
                        <Link
                            to={`/resume_tmpl/${slugifyJobTitle(title)}`}
                            className="focus-ring block py-1.5 text-[15px] leading-6 text-ink transition-colors hover:text-accent hover:underline hover:underline-offset-4"
                        >
                            {title}
                        </Link>
                    </li>
                ))}
            </ul>
            {!isSearching && category.titles.length > 10 && (
                <button
                    type="button"
                    className="focus-ring mt-2 text-sm font-medium text-accent underline underline-offset-4 hover:decoration-2"
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
        const lowerSearch = search.trim().replace(/\s+/g, ' ').toLowerCase();
        if (!lowerSearch) return JOB_CATEGORIES;
        // Whole-word matches rank first ("rn" finds "Registered Nurse (RN)" before "Intern").
        const wordStart = new RegExp(`(^|[^a-z0-9])${lowerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
        const rank = (title: string) => (title.toLowerCase() === lowerSearch ? 0 : wordStart.test(title) ? 1 : 2);

        return JOB_CATEGORIES.map(category => {
            // Check if category name matches
            if (category.name.toLowerCase().includes(lowerSearch)) {
                return category;
            }
            // Or filter titles
            const matches = category.titles.filter(title => title.toLowerCase().includes(lowerSearch));
            const filteredTitles = matches.some(title => rank(title) < 2) ? matches.filter(title => rank(title) < 2) : matches;

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
        <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
            <SiteHeader />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-8 sm:px-6">
                <nav className="text-sm text-muted" aria-label="Breadcrumb">
                    <Link className="focus-ring hover:text-ink" to="/">Home</Link>
                    <span className="mx-2" aria-hidden="true">/</span>
                    <span className="text-ink" aria-current="page">Resume examples</span>
                </nav>

                <div className="mb-12 mt-8 grid gap-8 border-b border-rule pb-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
                    <div>
                        <h1 className="font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink lg:text-[56px] lg:leading-[60px]">
                            Resume examples by job title
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-[26px] text-muted">
                            Each role has a complete example resume and a short writing guide. Open one to see it in every template, then make it yours.
                        </p>
                    </div>
                    <div>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                                <SearchIcon className="h-5 w-5 text-muted" />
                            </div>
                            <input
                                type="search"
                                className="block h-12 w-full rounded-none border-0 border-b-2 border-ink bg-transparent pl-8 pr-10 text-lg text-ink placeholder:text-muted focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
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
                                    className="focus-ring absolute inset-y-0 right-0 flex items-center px-1 text-muted hover:text-ink"
                                    aria-label="Clear search"
                                >
                                    <XIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <p className="kicker mt-3 text-muted" aria-live="polite" aria-atomic="true">
                            {isSearching
                                ? `${stats.filteredTitleCount} ${stats.filteredTitleCount === 1 ? 'role' : 'roles'} in ${filteredCategories.length} ${filteredCategories.length === 1 ? 'category' : 'categories'}`
                                : `${stats.totalTitles} roles across ${stats.totalCategories} categories`}
                        </p>
                    </div>
                </div>

                {filteredCategories.length > 0 ? (
                    <div className="gap-10 sm:columns-2 lg:columns-3">
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
                    <div className="max-w-xl border-y border-rule py-10">
                        <p className="font-display text-2xl font-semibold tracking-display text-ink">No examples for “{search.trim()}” yet</p>
                        <p className="mt-2 text-muted">You can still build a resume with that title.</p>
                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
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

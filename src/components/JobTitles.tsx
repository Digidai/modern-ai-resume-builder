import React, { useState, useMemo } from 'react';
import { ArrowLeftIcon, SearchIcon } from './Icons';
import { Button } from './Button';

interface JobTitleCategory {
    name: string;
    titles: string[];
}

const JOB_CATEGORIES: JobTitleCategory[] = [
    {
        name: "Engineering",
        titles: [
            "Software Engineer",
            "Frontend Developer",
            "Backend Developer",
            "Full Stack Developer",
            "DevOps Engineer",
            "Site Reliability Engineer (SRE)",
            "Data Engineer",
            "Mobile Developer (iOS/Android)",
            "Game Developer",
            "Embedded Systems Engineer",
            "QA Engineer",
            "Security Engineer",
            "Machine Learning Engineer",
            "Cloud Architect",
            "Engineering Manager",
            "CTO"
        ]
    },
    {
        name: "Design & Product",
        titles: [
            "Product Designer",
            "UX Researcher",
            "UI Designer",
            "Graphic Designer",
            "Motion Designer",
            "Product Manager",
            "Product Owner",
            "Creative Director",
            "Art Director",
            "Head of Product",
            "Chief Product Officer (CPO)"
        ]
    },
    {
        name: "Data & Analytics",
        titles: [
            "Data Scientist",
            "Data Analyst",
            "Business Analyst",
            "BI Developer",
            "Analytics Engineer",
            "Director of Data"
        ]
    },
    {
        name: "Marketing & Growth",
        titles: [
            "Marketing Manager",
            "Content Strategist",
            "SEO Specialist",
            "Social Media Manager",
            "Growth Hacker",
            "Product Marketing Manager",
            "Brand Manager",
            "Email Marketing Specialist",
            "CMO"
        ]
    },
    {
        name: "Sales & Support",
        titles: [
            "Sales Representative",
            "Account Executive",
            "Customer Success Manager",
            "Sales Manager",
            "Business Development Manager",
            "Solution Engineer",
            "Support Specialist",
            "Head of Sales"
        ]
    },
    {
        name: "HR & Operations",
        titles: [
            "HR Manager",
            "Recruiter",
            "Talent Acquisition Specialist",
            "People Operations Manager",
            "Office Manager",
            "Operations Manager",
            "COO"
        ]
    },
    {
        name: "Finance & Legal",
        titles: [
            "Financial Analyst",
            "Accountant",
            "Controller",
            "CFO",
            "Legal Counsel",
            "Paralegal"
        ]
    }
];

interface JobTitlesProps {
    onBack: () => void;
}

const JobTitles: React.FC<JobTitlesProps> = ({ onBack }) => {
    const [search, setSearch] = useState("");

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
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12">
                {/* Search Section */}
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Find Your Professional Role
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Explore our comprehensive directory of standard job titles across various industries.
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
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                            <div key={category.name} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    {category.name}
                                    <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        {category.titles.length}
                                    </span>
                                </h3>
                                <ul className="space-y-2">
                                    {category.titles.map((title) => (
                                        <li key={title} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-default select-all">
                                            {title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
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

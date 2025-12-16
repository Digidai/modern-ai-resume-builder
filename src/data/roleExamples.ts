import { ResumeData } from '../types';

export const ROLE_EXAMPLES: Record<string, Partial<ResumeData>> = {
    "Software Engineer": {
        summary: "Dedicated Software Engineer with 5+ years of experience in full-stack development. Proficient in React, Node.js, and cloud architectures. Passionate about building scalable applications and optimizing user experiences.",
        experience: [
            {
                id: "exp1",
                company: "Tech Solutions Inc.",
                role: "Senior Software Engineer",
                startDate: "2021-01",
                endDate: "Present",
                isCurrent: true,
                description: "Led a team of 5 engineers to rebuild the core B2B platform using Microservices. Improved system latency by 40% and reduced deployment time by 60% via CI/CD pipelines."
            },
            {
                id: "exp2",
                company: "Creative Apps",
                role: "Frontend Developer",
                startDate: "2018-06",
                endDate: "2020-12",
                isCurrent: false,
                description: "Developed responsive web applications using React and TypeScript. Collaborated with UX designers to implement pixel-perfect interfaces used by 100k+ daily users."
            }
        ],
        skills: ["React", "TypeScript", "Node.js", "AWS", "Docker", "GraphQL", "System Design"]
    },
    "Product Manager": {
        summary: "Strategic Product Manager with a track record of launching successful SaaS products. Expert in agile methodologies, user research, and data-driven decision making. Skilled at bridging the gap between engineering, design, and business goals.",
        experience: [
            {
                id: "exp1",
                company: "Innovate Corp",
                role: "Product Manager",
                startDate: "2020-03",
                endDate: "Present",
                isCurrent: true,
                description: "Defined product roadmap and go-to-market strategy for a new AI analytics tool. Achieved $2M ARR within the first year. Conducted 50+ user interviews to refine features."
            },
            {
                id: "exp2",
                company: "StartUp Inc",
                role: "Associate PM",
                startDate: "2018-05",
                endDate: "2020-02",
                isCurrent: false,
                description: "Managed the backlog for the mobile app team. Increased daily active users by 25% through A/B testing onboarding flows."
            }
        ],
        skills: ["Product Strategy", "Agile", "User Research", "SQL", "Roadmapping", "JIRA", "Data Analysis"]
    },
    "Data Scientist": {
        summary: "Analytical Data Scientist specializing in machine learning and predictive modeling. Experienced in Python, SQL, and big data technologies. Proven ability to translate complex data into actionable business insights.",
        experience: [
            {
                id: "exp1",
                company: "DataDriven Co.",
                role: "Senior Data Scientist",
                startDate: "2021-06",
                endDate: "Present",
                isCurrent: true,
                description: "Developed churn prediction models improving customer retention by 15%. Deployed NLP pipelines for automated customer support analysis."
            },
            {
                id: "exp2",
                company: "FinTech Solutions",
                role: "Data Analyst",
                startDate: "2019-01",
                endDate: "2021-05",
                isCurrent: false,
                description: "Created automated dashboards using Tableau to track KPIs. Performed statistical analysis to support marketing campaign optimization."
            }
        ],
        skills: ["Python", "Machine Learning", "SQL", "TensorFlow", "Pandas", "Tableau", "Statistics"]
    },
    "Marketing Manager": {
        summary: "Creative Marketing Manager with expertise in digital strategy, content marketing, and brand growth. Successfully led multi-channel campaigns increasing lead generation by 150%.",
        experience: [
            {
                id: "exp1",
                company: "Global Brands",
                role: "Marketing Manager",
                startDate: "2020-08",
                endDate: "Present",
                isCurrent: true,
                description: "Oversaw a $500k annual marketing budget. Managed a team of 4 to execute SEO, social media, and email campaigns reaching 1M+ audience."
            }
        ],
        skills: ["Digital Marketing", "SEO", "Content Strategy", "Google Analytics", "Social Media", "Copywriting"]
    },
    "Sales Representative": {
        summary: "Results-driven Sales Representative with a history of exceeding quotas. Skilled in relationship building, negotiation, and CRM management. Passionate about solving client problems.",
        experience: [
            {
                id: "exp1",
                company: "Cloud Services",
                role: "Account Executive",
                startDate: "2019-04",
                endDate: "Present",
                isCurrent: true,
                description: "Closed $1.5M in new business revenue annually. Maintained a 95% client renewal rate through proactive account management."
            }
        ],
        skills: ["Salesforce", "Cold Calling", "Negotiation", "Account Management", "Presentation", "B2B Sales"]
    }
};

export const getResumeDataForRole = (role: string, defaultData: ResumeData): ResumeData => {
    // Normalize role to find a match (e.g., "Senior Software Engineer" -> tries to find "Software Engineer" or exact match)
    const exactMatch = ROLE_EXAMPLES[role];
    if (exactMatch) {
        return { ...defaultData, ...exactMatch, title: role };
    }

    // Fallback: Try to find a partial match in keys
    const partialKey = Object.keys(ROLE_EXAMPLES).find(key => role.includes(key) || key.includes(role));
    if (partialKey) {
        return { ...defaultData, ...ROLE_EXAMPLES[partialKey], title: role };
    }

    // Default fallback if no match found
    return {
        ...defaultData,
        title: role,
        summary: `Motivated ${role} with a passion for excellence. Proven track record of success in the industry. Ready to contribute skills and experience to a dynamic team.`,
    };
};

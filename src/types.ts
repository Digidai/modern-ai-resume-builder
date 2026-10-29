export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

/** An extra profile or link (GitHub, portfolio, X, Google Scholar…). An empty label means "detect from the URL". */
export interface ResumeLink {
  id: string;
  label: string;
  url: string;
}

/** A paper, article, book or poster. `authors` is free text; the resume owner's name is set in bold. */
export interface Publication {
  id: string;
  authors: string;
  title: string;
  /** Journal, conference, publisher or "Preprint". */
  venue: string;
  /** "2025", "2025-06" or "In press". */
  year: string;
  /** DOI or URL, optional. */
  link: string;
}

/** A grant, fellowship, scholarship, prize or honour. */
export interface Award {
  id: string;
  title: string;
  /** Funder or awarding body, e.g. "National Science Foundation". */
  issuer: string;
  /** "2025" or "2023–2026". */
  year: string;
  /** Optional amount, role or note, e.g. "$450,000, co-PI" or "Top 1% of submissions". */
  detail: string;
}

/** An invited talk, conference presentation, seminar or poster. */
export interface Talk {
  id: string;
  title: string;
  /** Conference, seminar series or host, e.g. "NeurIPS 2025, invited talk". */
  event: string;
  location: string;
  year: string;
}

/** A course taught or a teaching assistant role. */
export interface Teaching {
  id: string;
  /** Course code and name, e.g. "CS 229: Machine Learning". */
  course: string;
  /** "Instructor", "Teaching Assistant", "Guest lecturer". */
  role: string;
  institution: string;
  /** "2024" or "Fall 2023, Spring 2024". */
  year: string;
}

export interface Project {
  id: string;
  name: string;
  link: string;
  description: string;
}

/** Presentation settings layered on top of a template. Empty/default values mean "use the template's own". */
export interface ResumeDesign {
  /** Hex accent colour, or '' for the template default. */
  accent: string;
  /** Font preset id (see constants/design.ts), or 'template'. */
  font: string;
  /** Uniform text/layout scale, 0.85–1.15 (1 = template default). */
  scale: number;
}

export const DEFAULT_DESIGN: ResumeDesign = { accent: '', font: 'template', scale: 1 };

export interface ResumeData {
  templateId: string;
  design: ResumeDesign;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  /** Additional profiles and links shown with the contact details. */
  links: ResumeLink[];
  /** Optional headshot as a JPEG/PNG/WebP data URL; only photo templates show it. */
  photo?: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  /** Optional; shown by templates with `publications: true` in the catalog. */
  publications?: Publication[];
  /** Grants and awards; shown by the same templates as publications. */
  awards?: Award[];
  /** Talks and presentations; shown by the same templates as publications. */
  talks?: Talk[];
  /** Courses taught and TA roles; shown by the same templates as publications. */
  teaching?: Teaching[];
}

export const INITIAL_RESUME_DATA: ResumeData = {
  templateId: 'modern',
  design: DEFAULT_DESIGN,
  fullName: "Alex Sterling",
  title: "Senior Product Designer",
  email: "alex.sterling@example.com",
  phone: "+1 (555) 012-3456",
  location: "San Francisco, CA",
  website: "www.alexsterling.design",
  linkedin: "linkedin.com/in/alexsterling",
  links: [{ id: 'link1', label: '', url: 'dribbble.com/alexsterling' }],
  summary: "Creative and detail-oriented Product Designer with over 6 years of experience in building user-centric digital products. Proven track record of improving user engagement and streamlining workflows. Adept at bridging the gap between engineering and design to deliver seamless web applications.",
  experience: [
    {
      id: '1',
      company: "TechNova Solutions",
      role: "Senior Product Designer",
      startDate: "2021-03",
      endDate: "",
      isCurrent: true,
      description: "- Led the company-wide design system, cutting UI development time by 30%\n- Shipped 4 major SaaS releases with product and engineering partners\n- Mentored 3 designers and set up a weekly design critique"
    },
    {
      id: '2',
      company: "Creative Pulse Agency",
      role: "UI/UX Designer",
      startDate: "2018-06",
      endDate: "2021-02",
      isCurrent: false,
      description: "- Designed responsive web and mobile apps for fintech and healthcare clients\n- Ran usability tests with 60+ participants to validate high-fidelity prototypes"
    }
  ],
  education: [
    {
      id: '1',
      school: "California College of the Arts",
      degree: "BFA in Interaction Design",
      startDate: "2014-09",
      endDate: "2018-05"
    }
  ],
  skills: ["Figma", "React", "TypeScript", "Prototyping", "User Research", "Design Systems", "Tailwind CSS"],
  projects: [
    {
      id: '1',
      name: "EcoTrack App",
      link: "github.com/alex/ecotrack",
      description: "Mobile app that helps people track their carbon footprint with weekly challenges; 12k downloads."
    },
    {
      id: '2',
      name: "Open Design Tokens",
      link: "github.com/alex/design-tokens",
      description: "Open-source toolkit that syncs Figma variables to CSS and Tailwind themes."
    }
  ]
};
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
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
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
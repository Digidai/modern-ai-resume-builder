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

export interface ResumeData {
  templateId: string;
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
      description: "Leading the design system initiative, reducing development time by 30%. Collaborating with cross-functional teams to launch major feature updates for the SaaS platform."
    },
    {
      id: '2',
      company: "Creative Pulse Agency",
      role: "UI/UX Designer",
      startDate: "2018-06",
      endDate: "2021-02",
      isCurrent: false,
      description: "Designed responsive websites and mobile apps for diverse clients in fintech and healthcare. Conducted user research and usability testing to iterate on high-fidelity prototypes."
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
      description: "A mobile application helping users track their carbon footprint with gamified challenges."
    }
  ]
};
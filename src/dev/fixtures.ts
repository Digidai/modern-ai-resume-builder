import { DEFAULT_DESIGN, INITIAL_RESUME_DATA, ResumeData } from '../types';

/** Resume data sets used by the dev-only template gallery (`/dev/templates`). */
export const FIXTURES: Record<'default' | 'long' | 'sparse', ResumeData> = {
  default: INITIAL_RESUME_DATA,

  // Stress test: long name and title, many entries, long bullets, long links, 20 skills.
  long: {
    ...INITIAL_RESUME_DATA,
    fullName: 'Maximiliana Alexandra Wójcik-Fernández',
    title: 'Principal Staff Software Engineer, Distributed Systems & Developer Platform',
    email: 'maximiliana.wojcik-fernandez@verylongcompanyname-example.com',
    location: 'São Paulo, Brazil (Remote, open to relocation)',
    website: 'https://www.maximiliana-wojcik-fernandez-portfolio.dev/',
    linkedin: 'https://www.linkedin.com/in/maximiliana-wojcik-fernandez-engineer/',
    summary:
      'Principal engineer with 14 years of experience designing distributed systems that serve hundreds of millions of requests per day. Led platform teams through two hyper-growth phases, migrating monoliths to event-driven services without downtime. Known for pragmatic architecture, strong written communication, and growing senior engineers into technical leaders across time zones.',
    experience: [
      {
        id: 'l1',
        company: 'Globex Payments International Holdings',
        role: 'Principal Staff Software Engineer, Developer Platform',
        startDate: '2020-02',
        endDate: '',
        isCurrent: true,
        description:
          '- Architected a multi-region event bus processing 2.4B events/day with 99.995% availability across 6 regions\n- Cut median CI time from 41 to 9 minutes by introducing remote build caching and test sharding for 900 engineers\n- Led the incident review program; reduced repeat incidents by 63% year over year\n- Mentored 11 senior engineers, 4 of whom were promoted to staff level',
      },
      {
        id: 'l2',
        company: 'Initech',
        role: 'Senior Software Engineer',
        startDate: '2016-05',
        endDate: '2020-01',
        isCurrent: false,
        description:
          'Owned the billing platform end to end.\n- Rebuilt invoicing on Kafka and Postgres, eliminating nightly batch failures\n- Introduced contract testing between 30 services, catching 200+ breaking changes before release',
      },
      {
        id: 'l3',
        company: 'Hooli',
        role: 'Software Engineer',
        startDate: '2013-09',
        endDate: '2016-04',
        isCurrent: false,
        description: '- Built the first version of the internal feature-flag service, now used by every product team\n- Improved search indexing throughput by 4x',
      },
      {
        id: 'l4',
        company: 'Vandelay Industries',
        role: 'Software Engineering Intern',
        startDate: '2012-06',
        endDate: '2012-09',
        isCurrent: false,
        description: 'Prototyped an import/export tracking dashboard used by the logistics team for two years.',
      },
    ],
    education: [
      {
        id: 'le1',
        school: 'Universidade de São Paulo',
        degree: 'M.Sc. in Computer Science, Distributed Systems',
        startDate: '2011-02',
        endDate: '2013-07',
      },
      {
        id: 'le2',
        school: 'Universidade Estadual de Campinas',
        degree: 'B.Sc. in Computer Engineering',
        startDate: '2006-02',
        endDate: '2010-12',
      },
    ],
    skills: [
      'Go', 'Rust', 'TypeScript', 'Kafka', 'PostgreSQL', 'Kubernetes', 'Terraform', 'gRPC', 'AWS', 'GCP',
      'Distributed Systems', 'System Design', 'Observability', 'SRE', 'CI/CD', 'Bazel', 'Redis', 'Mentoring',
      'Technical Writing', 'Incident Management',
    ],
    projects: [
      {
        id: 'lp1',
        name: 'flagd-lite',
        link: 'https://github.com/maximiliana/flagd-lite-feature-flag-evaluation-engine',
        description: '- Open-source feature-flag evaluation engine, 3.2k GitHub stars\n- Used in production by 40+ companies',
      },
      {
        id: 'lp2',
        name: 'Distributed Tracing Workshop',
        link: '',
        description: 'Hands-on workshop taught at 5 conferences, including KubeCon and QCon.',
      },
    ],
  },

  // Sparse: a first-time user who filled in only the basics.
  sparse: {
    templateId: 'modern',
    design: DEFAULT_DESIGN,
    fullName: 'Jordan Lee',
    title: 'Barista',
    email: 'jordan.lee@example.com',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    summary: '',
    experience: [
      {
        id: 's1',
        company: 'Blue Bottle Coffee',
        role: 'Barista',
        startDate: '2023-04',
        endDate: '',
        isCurrent: true,
        description: '',
      },
    ],
    education: [],
    skills: [],
    projects: [],
  },
};

export type FixtureName = keyof typeof FIXTURES;

import { DEFAULT_DESIGN, INITIAL_RESUME_DATA, ResumeData, type Publication } from '../types';

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
    links: [
      { id: 'lk1', label: '', url: 'https://github.com/maximiliana-wojcik-fernandez' },
      { id: 'lk2', label: '', url: 'x.com/maxwojcikdev' },
      { id: 'lk3', label: '', url: 'scholar.google.com/citations?user=AbCdEf123' },
      { id: 'lk4', label: 'Conference talks', url: 'speakerdeck.com/maximiliana' },
    ],
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
    links: [],
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

/** A neutral 3:4 head-and-shoulders silhouette for previewing photo templates (`&photo=1`). */
export const SAMPLE_PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7e9ee"/><stop offset="1" stop-color="#c9ced8"/></linearGradient></defs><rect width="300" height="400" fill="url(#b)"/><path d="M28 400c6-78 52-116 122-116s116 38 122 116z" fill="#2d3a52"/><path d="M128 270h44v34l-22 22-22-22z" fill="#e9c8ae"/><path d="M118 288l32 52 32-52 18 8-50 104-50-104z" fill="#f4f5f7"/><ellipse cx="150" cy="190" rx="56" ry="68" fill="#efcfb5"/><path d="M92 182c-4-58 30-86 60-86s64 22 58 86c-6-30-24-46-58-48-34 2-52 18-60 48z" fill="#3b2f2a"/></svg>',
)}`;

/** Sample publications for previewing publication templates (`&pubs=1`); the owner is Alex Sterling. */
export const SAMPLE_PUBLICATIONS: Publication[] = [
  { id: 'p1', authors: 'Sterling, A., Chen, J., Okafor, N.', title: 'Measuring onboarding friction in B2B software', venue: 'Proceedings of CHI', year: '2025', link: 'doi.org/10.1145/3706598.3713001' },
  { id: 'p2', authors: 'Okafor, N., A. Sterling', title: 'Design tokens as a shared language between design and engineering', venue: 'Interactions', year: '2023', link: '' },
  { id: 'p3', authors: 'Alex Sterling', title: 'Small multiples for product dashboards', venue: 'Preprint', year: '2022', link: 'arxiv.org/abs/2204.01234' },
];

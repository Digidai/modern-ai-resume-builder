import { DEFAULT_DESIGN, INITIAL_RESUME_DATA, ResumeData, type Award, type Publication, type Talk, type Teaching } from '../types';

/** Resume data sets used by the dev-only template gallery (`/dev/templates`). */
export const FIXTURES: Record<'default' | 'long' | 'sparse' | 'zh' | 'ja' | 'ko', ResumeData> = {
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

  // A Chinese resume with English tool names: headings and dates switch to Chinese automatically.
  zh: {
    ...INITIAL_RESUME_DATA,
    fullName: '王思远',
    title: '高级产品设计师',
    email: 'siyuan.wang@example.com',
    phone: '138 0013 8000',
    location: '上海',
    website: 'siyuan.design',
    linkedin: '',
    links: [{ id: 'zl1', label: '', url: 'github.com/siyuanwang' }],
    summary: '6 年 B 端 SaaS 产品设计经验，擅长设计系统与复杂业务流程梳理，能与研发紧密协作，把用户研究结论落到可交付的界面方案中。',
    experience: [
      {
        id: 'z1',
        company: '星云科技',
        role: '高级产品设计师',
        startDate: '2021-03',
        endDate: '',
        isCurrent: true,
        description: '- 主导公司级 Design System 建设，组件复用率提升至 85%，前端开发周期缩短 30%\n- 与产品、研发协作交付 4 个 SaaS 大版本，客户续约率提升 12%\n- 带教 3 名设计师，建立每周设计评审机制',
      },
      {
        id: 'z2',
        company: '脉动创意',
        role: 'UI/UX 设计师',
        startDate: '2018-06',
        endDate: '2021-02',
        isCurrent: false,
        description: '- 为金融与医疗客户设计响应式 Web 和移动应用\n- 组织 60 余场可用性测试，验证高保真原型',
      },
    ],
    education: [{ id: 'ze1', school: '同济大学', degree: '工业设计 学士', startDate: '2014-09', endDate: '2018-06' }],
    projects: [{ id: 'zp1', name: '企业级数据看板', link: 'siyuan.design/dashboard', description: '- 重构 40 余张报表的信息架构，用户平均查询时间减少 45%' }],
    skills: ['设计工具: Figma, Sketch, Principle', '研究方法: 用户访谈, 可用性测试, A/B 测试', '前端: HTML, CSS, React 基础'],
  },

  // Japanese (職務経歴書 style) and Korean resumes: headings and dates follow them automatically.
  ja: {
    ...INITIAL_RESUME_DATA,
    fullName: '佐藤 健',
    title: 'シニアプロダクトデザイナー',
    email: 'ken.sato@example.com',
    phone: '090-1234-5678',
    location: '東京都渋谷区',
    website: 'kensato.design',
    linkedin: '',
    links: [{ id: 'jl1', label: '', url: 'github.com/kensato' }],
    summary: 'B2B SaaS のプロダクトデザインに 6 年間従事。デザインシステムの構築と業務フローの整理を得意とし、エンジニアと密に連携してユーザー調査の結果を画面に落とし込みます。',
    experience: [
      {
        id: 'j1',
        company: '株式会社ネビュラテック',
        role: 'シニアプロダクトデザイナー',
        startDate: '2021-03',
        endDate: '',
        isCurrent: true,
        description: '- 全社のデザインシステムを主導し、フロントエンドの開発期間を 30% 短縮\n- プロダクト・開発チームと協力し SaaS の大型リリースを 4 回実施\n- デザイナー 3 名の育成と週次デザインレビューの立ち上げ',
      },
      {
        id: 'j2',
        company: '株式会社パルスクリエイティブ',
        role: 'UI/UX デザイナー',
        startDate: '2018-04',
        endDate: '2021-02',
        isCurrent: false,
        description: '- 金融・医療業界のクライアント向けにレスポンシブな Web・モバイルアプリを設計\n- 60 件以上のユーザビリティテストを実施し、プロトタイプを検証',
      },
    ],
    education: [{ id: 'je1', school: '千葉大学', degree: '工学部 デザイン学科 学士', startDate: '2014-04', endDate: '2018-03' }],
    projects: [{ id: 'jp1', name: '業務ダッシュボードの刷新', link: 'kensato.design/dashboard', description: '- 40 以上のレポートの情報設計を見直し、検索時間を平均 45% 削減' }],
    skills: ['デザインツール: Figma, Sketch', 'リサーチ: ユーザーインタビュー, ユーザビリティテスト', '資格: TOEIC 860 点'],
  },
  ko: {
    ...INITIAL_RESUME_DATA,
    fullName: '김지훈',
    title: '시니어 프로덕트 디자이너',
    email: 'jihoon.kim@example.com',
    phone: '010-1234-5678',
    location: '서울 강남구',
    website: 'jihoon.design',
    linkedin: '',
    links: [{ id: 'kl1', label: '', url: 'github.com/jihoonkim' }],
    summary: 'B2B SaaS 프로덕트 디자인 6년 경력. 디자인 시스템 구축과 복잡한 업무 흐름 정리에 강점이 있으며, 개발자와 긴밀히 협업해 사용자 리서치 결과를 화면으로 구현합니다.',
    experience: [
      {
        id: 'k1',
        company: '네뷸라테크',
        role: '시니어 프로덕트 디자이너',
        startDate: '2021-03',
        endDate: '',
        isCurrent: true,
        description: '- 전사 디자인 시스템 구축을 주도해 프론트엔드 개발 기간 30% 단축\n- 제품·개발팀과 협업해 SaaS 메이저 릴리스 4회 출시\n- 디자이너 3명 멘토링 및 주간 디자인 리뷰 도입',
      },
      {
        id: 'k2',
        company: '펄스 크리에이티브',
        role: 'UI/UX 디자이너',
        startDate: '2018-07',
        endDate: '2021-02',
        isCurrent: false,
        description: '- 금융·의료 고객사의 반응형 웹 및 모바일 앱 설계\n- 60회 이상의 사용성 테스트로 고해상도 프로토타입 검증',
      },
    ],
    education: [{ id: 'ke1', school: '홍익대학교', degree: '산업디자인 학사', startDate: '2014-03', endDate: '2018-02' }],
    projects: [{ id: 'kp1', name: '업무 대시보드 개편', link: 'jihoon.design/dashboard', description: '- 40여 개 리포트의 정보 구조를 재설계해 평균 조회 시간 45% 단축' }],
    skills: ['디자인 도구: Figma, Sketch', '리서치: 사용자 인터뷰, 사용성 테스트', '자격증: 컴퓨터그래픽스운용기능사'],
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

/** Sample grants and awards, shown with `&pubs=1`. */
export const SAMPLE_AWARDS: Award[] = [
  { id: 'a1', title: 'Research Grant in Human-Computer Interaction', issuer: 'National Science Foundation', year: '2024–2027', detail: '$450,000, co-PI' },
  { id: 'a2', title: 'Best Paper Honorable Mention', issuer: 'ACM CHI', year: '2025', detail: 'Top 5% of submissions' },
];

/** Sample talks, shown with `&pubs=1`. */
export const SAMPLE_TALKS: Talk[] = [
  { id: 't1', title: 'Measuring onboarding friction', event: 'CHI 2025, paper presentation', location: 'Yokohama, Japan', year: '2025' },
  { id: 't2', title: 'Design tokens as a shared language', event: 'Design Systems Seminar, Carnegie Mellon University', location: 'Pittsburgh, PA', year: '2024' },
];

/** Sample teaching, shown with `&pubs=1`. */
export const SAMPLE_TEACHING: Teaching[] = [
  { id: 'c1', course: 'HCI 440: Interaction Design Studio', role: 'Instructor', institution: 'Carnegie Mellon University', year: 'Fall 2024' },
  { id: 'c2', course: 'HCI 205: Research Methods', role: 'Teaching Assistant', institution: 'Carnegie Mellon University', year: '2022–2023' },
];

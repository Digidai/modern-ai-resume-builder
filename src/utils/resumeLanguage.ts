import type { ResumeData, ResumeLanguage } from '../types';

export type { ResumeLanguage };

/** Template headings and words in Chinese, Japanese and Korean, keyed by the English text templates print. */
const WORDS: Record<string, [zh: string, ja: string, ko: string]> = {
  Summary: ['个人简介', '職務要約', '자기소개'],
  Profile: ['个人简介', 'プロフィール', '프로필'],
  'Professional Summary': ['个人简介', '職務要約', '자기소개'],
  'About me': ['关于我', '自己紹介', '자기소개'],
  'About Me': ['关于我', '自己紹介', '자기소개'],
  'Career Objective': ['求职意向', '希望職種', '희망 직무'],
  'Target role': ['求职意向', '希望職種', '희망 직무'],
  'Research interests': ['研究方向', '研究分野', '연구 분야'],
  'Research Interests': ['研究方向', '研究分野', '연구 분야'],
  Experience: ['工作经历', '職務経歴', '경력'],
  'Work Experience': ['工作经历', '職務経歴', '경력'],
  'Work experience': ['工作经历', '職務経歴', '경력'],
  'Work history': ['工作经历', '職務経歴', '경력'],
  'Professional Experience': ['工作经历', '職務経歴', '경력'],
  Education: ['教育背景', '学歴', '학력'],
  Skills: ['专业技能', 'スキル', '보유 기술'],
  'Technical Skills': ['专业技能', 'テクニカルスキル', '보유 기술'],
  'Core Competencies': ['核心能力', 'コアスキル', '핵심 역량'],
  'Skills and Interests': ['技能与兴趣', 'スキル・関心', '기술 및 관심 분야'],
  'Skills & Interests': ['技能与兴趣', 'スキル・関心', '기술 및 관심 분야'],
  'Skills and licences': ['技能与证书', 'スキル・資格', '기술 및 자격증'],
  'Credentials & Skills': ['资质与技能', '資格・スキル', '자격 및 기술'],
  Other: ['其他', 'その他', '기타'],
  Projects: ['项目经历', 'プロジェクト', '프로젝트'],
  'Projects and Transactions': ['项目与交易', 'プロジェクト・案件', '프로젝트 및 거래'],
  Publications: ['论文发表', '論文・著書', '논문 및 저서'],
  Talks: ['学术报告', '講演', '발표'],
  Teaching: ['教学经历', '教育歴', '강의 경력'],
  'Grants and awards': ['基金与奖项', '研究費・受賞', '연구비 및 수상'],
  'Grants and Awards': ['基金与奖项', '研究費・受賞', '연구비 및 수상'],
  'Honors and Awards': ['荣誉奖项', '受賞歴', '수상 경력'],
  Contact: ['联系方式', '連絡先', '연락처'],
  Links: ['链接', 'リンク', '링크'],
  Email: ['邮箱', 'メール', '이메일'],
  Phone: ['电话', '電話', '전화'],
  Location: ['所在地', '所在地', '거주지'],
  Website: ['个人网站', 'Webサイト', '웹사이트'],
  Portfolio: ['作品集', 'ポートフォリオ', '포트폴리오'],
  Name: ['姓名', '氏名', '성명'],
  Position: ['职位', '職種', '직무'],
  Period: ['时间', '期間', '기간'],
  Company: ['公司', '会社名', '회사'],
  School: ['学校', '学校名', '학교'],
  Degree: ['学位', '学位', '학위'],
  Present: ['至今', '現在', '현재'],
  present: ['至今', '現在', '현재'],
  'Résumé': ['个人简历', '履歴書', '이력서'],
  Resume: ['简历', '履歴書', '이력서'],
};
const COLUMN = { zh: 0, ja: 1, ko: 2 } as const;

const HAN = /[\u3400-\u4dbf\u4e00-\u9fff]/g;
const KANA = /[\u3040-\u30ff]/g;
const HANGUL = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/g;
const LATIN = /[A-Za-z]/g;
const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;

const detected = new WeakMap<ResumeData, ResumeLanguage>();

/**
 * The language a resume's content is in. A CJK character carries about as much as three Latin
 * letters, so a Chinese, Japanese or Korean resume full of English tool names still counts as CJK,
 * and an English one with a CJK name doesn't (the name isn't counted). Korean is written in Hangul,
 * Japanese mixes kana into its kanji (particles, katakana loanwords), and Chinese uses neither.
 */
export const detectResumeLanguage = (data: ResumeData): ResumeLanguage => {
  const cached = detected.get(data);
  if (cached) return cached;
  const text = [
    data.title,
    data.summary,
    ...data.experience.flatMap((job) => [job.role, job.company, job.description]),
    ...data.education.flatMap((edu) => [edu.school, edu.degree]),
    ...data.projects.flatMap((project) => [project.name, project.description]),
    ...data.skills,
  ].join(' ');
  const han = count(text, HAN);
  const kana = count(text, KANA);
  const hangul = count(text, HANGUL);
  const cjk = han + kana + hangul;
  let language: ResumeLanguage = 'en';
  if (cjk >= 4 && cjk * 3 >= count(text, LATIN)) {
    if (hangul >= 2 && hangul * 5 >= cjk) language = 'ko';
    else if (kana >= 2 && kana * 10 >= cjk) language = 'ja';
    else language = 'zh';
  }
  detected.set(data, language);
  return language;
};

/** The language a resume prints its headings and dates in: its `design.language`, or else its content's. */
export const resumeLanguage = (data: ResumeData): ResumeLanguage => data.design?.language || detectResumeLanguage(data);

/** A template heading or word in a language ("Experience" → "工作经历", "職務経歴", "경력"); text without a translation is kept. */
export const translate = (language: ResumeLanguage, text: string): string => (language === 'en' ? text : WORDS[text]?.[COLUMN[language]] ?? text);

/** A template heading or word in the resume's language. */
export const tr = (data: ResumeData, text: string): string => translate(resumeLanguage(data), text);

/** The BCP 47 tag for the resume's root, so browsers pick Japanese or Korean glyphs for shared Han characters. */
export const LANGUAGE_TAGS: Record<ResumeLanguage, string> = { en: 'en', zh: 'zh-CN', ja: 'ja', ko: 'ko' };

/** Which CJK fonts a document needs: the resume's language, or for an English resume the script its CJK text (a name, say) is in. */
export const cjkFontLanguage = (data: ResumeData): Exclude<ResumeLanguage, 'en'> => {
  const language = resumeLanguage(data);
  if (language !== 'en') return language;
  const text = JSON.stringify(data);
  return /[\uac00-\ud7af]/.test(text) ? 'ko' : /[\u3040-\u30ff]/.test(text) ? 'ja' : 'zh';
};

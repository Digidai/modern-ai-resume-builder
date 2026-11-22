import type { ResumeData, ResumeLanguage } from '../types';

export type { ResumeLanguage };

/** Template headings and words in Chinese, keyed by the English text templates print. */
const ZH: Record<string, string> = {
  Summary: '个人简介',
  Profile: '个人简介',
  'Professional Summary': '个人简介',
  'About me': '关于我',
  'About Me': '关于我',
  'Career Objective': '求职意向',
  'Target role': '求职意向',
  'Research interests': '研究方向',
  'Research Interests': '研究方向',
  Experience: '工作经历',
  'Work Experience': '工作经历',
  'Work experience': '工作经历',
  'Work history': '工作经历',
  'Professional Experience': '工作经历',
  Education: '教育背景',
  Skills: '专业技能',
  'Technical Skills': '专业技能',
  'Core Competencies': '核心能力',
  'Skills and Interests': '技能与兴趣',
  'Skills & Interests': '技能与兴趣',
  'Skills and licences': '技能与证书',
  'Credentials & Skills': '资质与技能',
  Other: '其他',
  Projects: '项目经历',
  'Projects and Transactions': '项目与交易',
  Publications: '论文发表',
  Talks: '学术报告',
  Teaching: '教学经历',
  'Grants and awards': '基金与奖项',
  'Grants and Awards': '基金与奖项',
  'Honors and Awards': '荣誉奖项',
  Contact: '联系方式',
  Links: '链接',
  Email: '邮箱',
  Phone: '电话',
  Location: '所在地',
  Website: '个人网站',
  Portfolio: '作品集',
  Name: '姓名',
  Position: '职位',
  Period: '时间',
  Company: '公司',
  School: '学校',
  Degree: '学位',
  Present: '至今',
  'Résumé': '个人简历',
  present: '至今',
};

const HAN = /[\u3400-\u4dbf\u4e00-\u9fff]/g;
const LATIN = /[A-Za-z]/g;
const KANA_HANGUL = /[\u3040-\u30ff\uac00-\ud7af]/g;
const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;

const detected = new WeakMap<ResumeData, ResumeLanguage>();

/**
 * The language a resume's content is in: Chinese when most of it is. A Chinese character carries about
 * as much as three Latin letters, so a Chinese resume full of English tool names still counts as
 * Chinese, and an English one with a Chinese name doesn't (the name isn't counted). Japanese and Korean
 * resumes stay English: their headings aren't translated yet.
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
  const language: ResumeLanguage = han >= 4 && han * 3 >= count(text, LATIN) && count(text, KANA_HANGUL) * 10 < han ? 'zh' : 'en';
  detected.set(data, language);
  return language;
};

/** The language a resume prints its headings and dates in: its `design.language`, or else its content's. */
export const resumeLanguage = (data: ResumeData): ResumeLanguage => data.design?.language || detectResumeLanguage(data);

/** A template heading or word in the resume's language ("Experience" → "工作经历"); text without a translation is kept. */
export const tr = (data: ResumeData, text: string): string => (resumeLanguage(data) === 'zh' ? ZH[text] ?? text : text);

import React from 'react';
import { ResumeData } from '../../types';
import {
    MailIcon,
    PhoneIcon,
    MapPinIcon,
    GlobeIcon,
    LinkedinIcon,
    LinkIcon,
    GithubIcon,
    GitlabIcon,
    XBrandIcon,
    DribbbleIcon,
    BehanceIcon,
    InstagramIcon,
    YoutubeIcon,
    FacebookIcon,
    FigmaIcon,
    BookIcon,
    PenIcon,
    CodeIcon,
    AtSignIcon,
} from '../Icons';

export interface TemplateProps {
    data: ResumeData;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2021-03" → "Mar 2021", "2021" → "2021"; anything else is shown as typed. */
export const formatDate = (value: string): string => {
    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(trimmed);
    if (!match) return trimmed;
    const month = MONTHS[Number(match[2]) - 1];
    return month ? `${month} ${match[1]}` : match[1];
};

/** "Mar 2021 – Present"; collapses gracefully when either end is missing. */
export const formatDateRange = (start: string, end: string, isCurrent = false): string => {
    const from = formatDate(start);
    const to = isCurrent ? 'Present' : formatDate(end);
    if (from && to) return `${from} – ${to}`;
    return from || to;
};

/** Strips the protocol so links read cleanly on paper ("https://x.dev/" → "x.dev"). */
export const displayUrl = (value: string): string =>
    value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, 'www.').replace(/\/$/, '');

/** Turns a typed URL ("github.com/x") into a link target. */
export const toHref = (value: string): string =>
    /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;

type IconComponent = React.ComponentType<{ className?: string }>;

/** Known profile sites: label and icon are detected from the link's host when the user leaves the label empty. */
const NETWORKS: ReadonlyArray<{ label: string; icon: IconComponent; host: RegExp }> = [
    { label: 'GitHub', icon: GithubIcon, host: /(^|\.)github\.(com|io)$/ },
    { label: 'GitLab', icon: GitlabIcon, host: /(^|\.)gitlab\.com$/ },
    { label: 'LinkedIn', icon: LinkedinIcon, host: /(^|\.)linkedin\.com$/ },
    { label: 'X', icon: XBrandIcon, host: /(^|\.)(x|twitter)\.com$/ },
    { label: 'Bluesky', icon: AtSignIcon, host: /(^|\.)bsky\.app$/ },
    { label: 'Threads', icon: AtSignIcon, host: /(^|\.)threads\.(net|com)$/ },
    { label: 'Dribbble', icon: DribbbleIcon, host: /(^|\.)dribbble\.com$/ },
    { label: 'Behance', icon: BehanceIcon, host: /(^|\.)behance\.net$/ },
    { label: 'Figma', icon: FigmaIcon, host: /(^|\.)figma\.com$/ },
    { label: 'Instagram', icon: InstagramIcon, host: /(^|\.)instagram\.com$/ },
    { label: 'YouTube', icon: YoutubeIcon, host: /(^|\.)(youtube\.com|youtu\.be)$/ },
    { label: 'TikTok', icon: AtSignIcon, host: /(^|\.)tiktok\.com$/ },
    { label: 'Facebook', icon: FacebookIcon, host: /(^|\.)facebook\.com$/ },
    { label: 'Medium', icon: PenIcon, host: /(^|\.)medium\.com$/ },
    { label: 'Substack', icon: PenIcon, host: /(^|\.)substack\.com$/ },
    { label: 'Stack Overflow', icon: CodeIcon, host: /(^|\.)stackoverflow\.com$/ },
    { label: 'LeetCode', icon: CodeIcon, host: /(^|\.)leetcode\.(com|cn)$/ },
    { label: 'Kaggle', icon: CodeIcon, host: /(^|\.)kaggle\.com$/ },
    { label: 'Hugging Face', icon: CodeIcon, host: /(^|\.)huggingface\.co$/ },
    { label: 'CodePen', icon: CodeIcon, host: /(^|\.)codepen\.io$/ },
    { label: 'Google Scholar', icon: BookIcon, host: /^scholar\.google\./ },
    { label: 'ORCID', icon: BookIcon, host: /(^|\.)orcid\.org$/ },
    { label: 'ResearchGate', icon: BookIcon, host: /(^|\.)researchgate\.net$/ },
];

const hostOf = (url: string): string => {
    try {
        return new URL(toHref(url)).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
        return '';
    }
};

/** Label and icon for a profile link: the user's label if given, else the detected site, else "Link". */
export const describeLink = (link: { label: string; url: string }): { label: string; icon: IconComponent } => {
    const host = hostOf(link.url);
    const network = NETWORKS.find((n) => n.host.test(host));
    return { label: link.label.trim() || network?.label || 'Link', icon: network?.icon ?? LinkIcon };
};

export interface ContactEntry {
    /** Unique per entry; use it as the React key (there can be several `link` entries). */
    id: string;
    key: 'email' | 'phone' | 'location' | 'website' | 'linkedin' | 'link';
    /** Human label: "Email", "Phone", "Website", "LinkedIn", or the link's label ("GitHub", "Portfolio"…). */
    label: string;
    icon: IconComponent;
    value: string;
    href?: string;
}

/** Non-empty contact fields and profile links in display order, with links where it makes sense. */
export const getContactEntries = (data: ResumeData): ContactEntry[] => {
    const entries: ContactEntry[] = [];
    const email = data.email.trim();
    const phone = data.phone.trim();
    if (email) entries.push({ id: 'email', key: 'email', label: 'Email', icon: MailIcon, value: email, href: `mailto:${email}` });
    if (phone) entries.push({ id: 'phone', key: 'phone', label: 'Phone', icon: PhoneIcon, value: phone, href: `tel:${phone.replace(/[^\d+]/g, '')}` });
    if (data.location.trim()) entries.push({ id: 'location', key: 'location', label: 'Location', icon: MapPinIcon, value: data.location.trim() });
    if (data.website.trim()) entries.push({ id: 'website', key: 'website', label: 'Website', icon: GlobeIcon, value: displayUrl(data.website), href: toHref(data.website) });
    if (data.linkedin.trim()) entries.push({ id: 'linkedin', key: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, value: displayUrl(data.linkedin), href: toHref(data.linkedin) });
    (data.links ?? []).forEach((link, index) => {
        if (!link.url.trim()) return;
        const { label, icon } = describeLink(link);
        entries.push({ id: `link-${link.id || index}`, key: 'link', label, icon, value: displayUrl(link.url), href: toHref(link.url) });
    });
    return entries;
};

/** A contact value that is a real link when it has an href; inherits color from its parent. */
export const ContactLink: React.FC<{ entry: ContactEntry; className?: string }> = ({ entry, className = '' }) =>
    entry.href ? (
        <a href={entry.href} target="_blank" rel="noopener noreferrer" className={`hover:underline underline-offset-2 ${className}`}>
            {entry.value}
        </a>
    ) : (
        <span className={className}>{entry.value}</span>
    );

/** Icon + value pair; color comes from the parent so it works on light and dark templates. */
export const ContactItem: React.FC<{ entry: ContactEntry; iconClassName?: string; className?: string }> = ({
    entry,
    iconClassName = 'w-3.5 h-3.5 opacity-70',
    className = '',
}) => {
    const Icon = entry.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
            <Icon className={`shrink-0 ${iconClassName}`} />
            <ContactLink entry={entry} className="wrap-anywhere" />
        </span>
    );
};

const BULLET_PATTERN = /^\s*(?:[-*•·▪–]|\d+[.)])\s+/;

/**
 * Renders free text from the editor: lines starting with "-", "•", "*" or "1." become a
 * bullet list, other lines become paragraphs. Use for experience and project descriptions.
 */
export const RichText: React.FC<{
    text: string;
    className?: string;
    listClassName?: string;
    itemClassName?: string;
}> = ({ text, className = '', listClassName = 'list-disc pl-4 space-y-1 marker:text-current/60', itemClassName = '' }) => {
    const lines = text.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim());
    if (lines.length === 0) return null;

    const blocks: Array<{ type: 'p'; text: string } | { type: 'ul'; items: string[] }> = [];
    for (const line of lines) {
        if (BULLET_PATTERN.test(line)) {
            const item = line.replace(BULLET_PATTERN, '');
            const last = blocks[blocks.length - 1];
            if (last && last.type === 'ul') last.items.push(item);
            else blocks.push({ type: 'ul', items: [item] });
        } else {
            blocks.push({ type: 'p', text: line.trim() });
        }
    }

    return (
        <div className={`space-y-1.5 ${className}`}>
            {blocks.map((block, index) =>
                block.type === 'p' ? (
                    <p key={index}>{block.text}</p>
                ) : (
                    <ul key={index} className={listClassName}>
                        {block.items.map((item, itemIndex) => (
                            <li key={itemIndex} className={itemClassName}>{item}</li>
                        ))}
                    </ul>
                )
            )}
        </div>
    );
};

export interface SkillGroup {
    /** Empty for skills that weren't written as "Category: items". */
    category: string;
    items: string[];
}

/**
 * Skills written as "Languages: Go, Rust" are grouped under their category (Jake's/Harvard
 * style); plain skills are collected into one uncategorised group, in order.
 */
export const groupSkills = (skills: string[]): SkillGroup[] => {
    const groups: SkillGroup[] = [];
    const plain: string[] = [];
    for (const raw of skills) {
        const match = /^([^:]{1,40}):\s*(.+)$/.exec(raw.trim());
        if (match) {
            groups.push({ category: match[1].trim(), items: match[2].split(/\s*[,;·•]\s*/).filter(Boolean) });
        } else if (raw.trim()) {
            plain.push(raw.trim());
        }
    }
    return plain.length ? [...groups, { category: '', items: plain }] : groups;
};

import { validateUrl } from '../../utils/validation';
import React from 'react';
import { ResumeData, type Award, type Publication, type Talk, type Teaching } from '../../types';
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
    if (data.website.trim() && validateUrl(data.website)) entries.push({ id: 'website', key: 'website', label: 'Website', icon: GlobeIcon, value: displayUrl(data.website), href: toHref(data.website) });
    if (data.linkedin.trim() && validateUrl(data.linkedin)) entries.push({ id: 'linkedin', key: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, value: displayUrl(data.linkedin), href: toHref(data.linkedin) });
    (data.links ?? []).forEach((link, index) => {
        if (!link.url.trim() || !validateUrl(link.url)) return;
        const { label, icon } = describeLink(link);
        entries.push({ id: `link-${link.id || index}`, key: 'link', label, icon, value: displayUrl(link.url), href: toHref(link.url) });
    });
    return entries;
};

/**
 * Adds line-break opportunities to an email address or URL where typesetters break them: after
 * "@" and before "." or "/". Narrow columns then wrap a long address at a natural point instead
 * of mid-word; short values are unaffected, and <wbr> adds no characters to copied or parsed text.
 */
const breakable = (value: string): React.ReactNode =>
    /\s/.test(value) ? value : value.split(/(?<=@)|(?=[./])/).flatMap((part, i) => (i ? [<wbr key={i} />, part] : [part]));

/** Smallest font size, relative to the column's, that `fit` shrinks a contact to; below it the contact wraps. */
const FIT_MIN = 0.7;

/**
 * Keeps one line of text on one line in a narrow column: when it is wider than the column, its font
 * shrinks just enough to fit. Text that would need less than FIT_MIN keeps its size and wraps at its
 * break points. The size is an inline style, so PDF snapshots and the server renderer keep it.
 */
const FitLine: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    React.useLayoutEffect(() => {
        const el = ref.current;
        const parent = el?.parentElement;
        if (!el || !parent) return;
        // Chrome still breaks at <wbr> under `white-space: nowrap`, so one-line mode hides them too.
        const setOneLine = (on: boolean) => {
            el.style.whiteSpace = on ? 'nowrap' : '';
            el.querySelectorAll('wbr').forEach((wbr) => {
                wbr.style.display = on ? 'none' : '';
            });
        };
        const fit = () => {
            el.style.fontSize = '';
            setOneLine(false);
            // Wrapping, the span is as wide as the column allows; on one line, its scroll width is the text's.
            const available = el.clientWidth;
            setOneLine(true);
            const natural = el.scrollWidth;
            if (!available || natural <= available) return setOneLine(false);
            let scale = Math.floor((available / natural) * 100) / 100;
            el.style.fontSize = `${scale}em`;
            while (scale >= FIT_MIN && el.scrollWidth > available) el.style.fontSize = `${(scale -= 0.01)}em`;
            if (scale < FIT_MIN) {
                el.style.fontSize = '';
                setOneLine(false);
            }
        };
        fit();
        let active = true;
        void document.fonts?.ready.then(() => active && fit());
        const observer = new ResizeObserver(() => fit());
        observer.observe(parent);
        return () => {
            active = false;
            observer.disconnect();
        };
    }, [children]);
    return (
        <span ref={ref} className="block min-w-0 max-w-full">
            {children}
        </span>
    );
};

/**
 * A contact value that is a real link when it has an href; inherits color from its parent.
 * `fit` shrinks a value too long for a narrow column (sidebars) so it stays on one line.
 */
export const ContactLink: React.FC<{ entry: ContactEntry; className?: string; fit?: boolean }> = ({ entry, className = '', fit = false }) => {
    const link = entry.href ? (
        <a href={entry.href} target="_blank" rel="noopener noreferrer" className={`hover:underline underline-offset-2 ${className}`}>
            {breakable(entry.value)}
        </a>
    ) : (
        <span className={className}>{breakable(entry.value)}</span>
    );
    return fit ? <FitLine>{link}</FitLine> : link;
};

/** Icon + value pair; color comes from the parent so it works on light and dark templates. */
export const ContactItem: React.FC<{ entry: ContactEntry; iconClassName?: string; className?: string; fit?: boolean }> = ({
    entry,
    iconClassName = 'w-3.5 h-3.5 opacity-70',
    className = '',
    fit = false,
}) => {
    const Icon = entry.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
            <Icon className={`shrink-0 ${iconClassName}`} />
            <ContactLink entry={entry} className="wrap-anywhere" fit={fit} />
        </span>
    );
};

export const BULLET_PATTERN = /^\s*(?:[-*•·▪–]|\d+[.)])\s+/;

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
            groups.push({ category: match[1].trim(), items: match[2].split(/\s*[,;·•]\s*(?![^()]*\))/).filter(Boolean) });
        } else if (raw.trim()) {
            plain.push(raw.trim());
        }
    }
    return plain.length ? [...groups, { category: '', items: plain }] : groups;
};

/** "Alex Sterling" → "AS"; one word gives one letter. */
export const initialsOf = (name: string): string => {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const first = Array.from(words[0])[0] ?? '';
    const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? '' : '';
    return (first + last).toUpperCase();
};

/**
 * The resume's photo, cropped to fill the box `className` sizes; without a photo it shows the
 * initials on `fallbackClassName` so the layout keeps its shape. Renders nothing when there is
 * neither a photo nor a name.
 */
export const Portrait: React.FC<{ data: ResumeData; className: string; fallbackClassName: string }> = ({ data, className, fallbackClassName }) => {
    const initials = initialsOf(data.fullName);
    if (data.photo) {
        return <img src={data.photo} alt={data.fullName.trim() ? `Photo of ${data.fullName.trim()}` : 'Photo'} className={`block shrink-0 object-cover ${className}`} />;
    }
    if (!initials) return null;
    return (
        <div aria-hidden="true" className={`flex shrink-0 items-center justify-center ${className} ${fallbackClassName}`}>
            {initials}
        </div>
    );
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Spellings of the owner's name as it appears in author lists: "Pat Lee", "P. Lee", "Lee, P.",
 * "Lee P", "P Lee". Matching is case-insensitive; returns null when there is no surname.
 */
export const ownerNamePattern = (fullName: string): RegExp | null => {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) return words.length ? new RegExp(`(\\b${escapeRegExp(words[0])}\\b)`, 'gi') : null;
    const first = words[0];
    const last = escapeRegExp(words[words.length - 1]);
    const initial = escapeRegExp(Array.from(first)[0] ?? '');
    const forms = [
        escapeRegExp(words.join(' ')),
        `${escapeRegExp(first)}\\s+${last}`,
        `${initial}\\.?(?:\\s*[A-Z]\\.?)*\\s+${last}`,
        `${last},?\\s+${initial}\\.?(?:\\s*[A-Z]\\.?)*`,
    ];
    return new RegExp(`(${forms.join('|')})`, 'gi');
};

/** Author list with the resume owner's name in bold. */
export const Authors: React.FC<{ authors: string; owner: string }> = ({ authors, owner }) => {
    const pattern = ownerNamePattern(owner);
    if (!pattern) return <>{authors}</>;
    const parts = authors.split(pattern);
    return (
        <>
            {parts.map((part, index) =>
                index % 2 === 1 ? (
                    <strong key={index} className="font-bold">
                        {part}
                    </strong>
                ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                )
            )}
        </>
    );
};

/** Adds a full stop unless the text already ends in punctuation. */
const sentence = (text: string) => (/[.?!]$/.test(text) ? text : `${text}.`);

/**
 * One reference in a conventional citation style:
 * Lee, P., Chen, J. (2025). Title of the paper. *Venue*. doi.org/…
 * Colours and sizes come from the parent; `linkClassName` styles the DOI/URL.
 */
export const Citation: React.FC<{ pub: Publication; owner: string; linkClassName?: string; titleClassName?: string }> = ({
    pub,
    owner,
    linkClassName = 'wrap-anywhere hover:underline underline-offset-2',
    titleClassName = '',
}) => {
    const authors = pub.authors.trim().replace(/[,;\s]+$/, '');
    const title = pub.title.trim();
    const venue = pub.venue.trim();
    const year = pub.year.trim();
    const link = pub.link.trim();
    return (
        <>
            {authors && <Authors authors={authors} owner={owner} />}
            {authors && year && ` (${year})`}
            {authors && (year || !authors.endsWith('.') ? '. ' : ' ')}
            {title && <span className={titleClassName}>{sentence(title)}</span>}
            {venue && (
                <>
                    {' '}
                    <em>{venue}</em>
                    {!authors && year ? `, ${year}` : ''}.
                </>
            )}
            {!authors && !venue && year && ` ${year}.`}
            {link && validateUrl(link) && (
                <>
                    {' '}
                    <a href={toHref(link)} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                        {displayUrl(link)}
                    </a>
                </>
            )}
        </>
    );
};

/**
 * One grant or award: **Title**, Issuer, detail, year. Ends with a full stop, like citations and talks. Pass `showYear={false}` when the template
 * prints the year in a gutter. Colours and sizes come from the parent.
 */
export const AwardLine: React.FC<{ award: Award; showYear?: boolean; titleClassName?: string }> = ({ award, showYear = true, titleClassName = 'font-semibold' }) => {
    const title = award.title.trim();
    const rest = [award.issuer, award.detail, showYear ? award.year : ''].map((part) => part.trim()).filter(Boolean).join(', ');
    return (
        <>
            {title && <span className={titleClassName}>{title}</span>}
            {title && rest && ', '}
            {rest}
            {(title || rest) && !/[.?!]$/.test(rest || title) && '.'}
        </>
    );
};

/** One talk: “Title.” *Event*, Location, year. Pass `showYear={false}` when the year sits in a gutter. */
export const TalkLine: React.FC<{ talk: Talk; showYear?: boolean }> = ({ talk, showYear = true }) => {
    const title = talk.title.trim().replace(/[.]$/, '');
    const event = talk.event.trim();
    const rest = [talk.location, showYear ? talk.year : ''].map((part) => part.trim()).filter(Boolean).join(', ');
    return (
        <>
            {title && `\u201c${/[?!]$/.test(title) ? title : `${title}.`}\u201d`}
            {title && (event || rest) && ' '}
            {event && <em>{event}</em>}
            {event && rest && ', '}
            {rest}
            {(event || rest) && !/[.?!]$/.test(rest || event) && '.'}
        </>
    );
};

/** One teaching entry: **Course**, Role, Institution, year. Pass `showYear={false}` when the year sits in a gutter. */
export const TeachingLine: React.FC<{ entry: Teaching; showYear?: boolean; titleClassName?: string }> = ({ entry, showYear = true, titleClassName = 'font-semibold' }) => {
    const course = entry.course.trim();
    const rest = [entry.role, entry.institution, showYear ? entry.year : ''].map((part) => part.trim()).filter(Boolean).join(', ');
    return (
        <>
            {course && <span className={titleClassName}>{course}</span>}
            {course && rest && ', '}
            {rest}
            {(course || rest) && !/[.?!]$/.test(rest || course) && '.'}
        </>
    );
};

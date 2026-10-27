import React from 'react';
import { ResumeData } from '../../types';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from '../Icons';

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

export interface ContactEntry {
    key: 'email' | 'phone' | 'location' | 'website' | 'linkedin';
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    href?: string;
}

/** Non-empty contact fields in display order, with links where it makes sense. */
export const getContactEntries = (data: ResumeData): ContactEntry[] => {
    const entries: ContactEntry[] = [];
    if (data.email.trim()) entries.push({ key: 'email', icon: MailIcon, value: data.email.trim(), href: `mailto:${data.email.trim()}` });
    if (data.phone.trim()) entries.push({ key: 'phone', icon: PhoneIcon, value: data.phone.trim(), href: `tel:${data.phone.replace(/[^\d+]/g, '')}` });
    if (data.location.trim()) entries.push({ key: 'location', icon: MapPinIcon, value: data.location.trim() });
    if (data.website.trim()) entries.push({ key: 'website', icon: GlobeIcon, value: displayUrl(data.website), href: toHref(data.website) });
    if (data.linkedin.trim()) entries.push({ key: 'linkedin', icon: LinkedinIcon, value: displayUrl(data.linkedin), href: toHref(data.linkedin) });
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

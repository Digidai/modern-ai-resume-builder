import { useCallback, useState, type Dispatch, type KeyboardEvent, type ReactNode, type SetStateAction } from 'react';
import { ResumeData, ResumeDesign, Experience, Education, Project, DEFAULT_DESIGN, type Award, type Publication, type ResumeLink, type Talk, type Teaching } from '../types';
import {
  PlusIcon,
  TrashIcon,
  LoaderIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XIcon,
} from './Icons';
import { Button } from './Button';
import { TEMPLATES } from '../constants/templates';
import { getEmailError, getPhoneError, getUrlError } from '../utils/validation';
import { useToast } from './Toast';
import { PublicationImport } from './PublicationImport';
import { Input, Textarea, fieldClass } from './Input';
import { LazyResumePreview } from './LazyResumePreview';
import { DesignControls } from './DesignControls';
import { PhotoField } from './PhotoField';
import { useAiActions } from '../hooks/useAiActions';
import { createId } from '../utils/resumeData';
import { formatDateRange, describeLink } from './templates/shared';

const MAX_LINKS = 8;

const PUBLICATION_TEMPLATE_NAMES = TEMPLATES.filter((t) => t.publications).map((t) => t.name).join(', ');
const newPublication = (): Publication => ({ id: createId(), authors: '', title: '', venue: '', year: '', link: '' });
const newAward = (): Award => ({ id: createId(), title: '', issuer: '', year: '', detail: '' });
const newTalk = (): Talk => ({ id: createId(), title: '', event: '', location: '', year: '' });
const newTeaching = (): Teaching => ({ id: createId(), course: '', role: '', institution: '', year: '' });

/**
 * Extra profiles (GitHub, portfolio, X, Google Scholar…). The label is optional: templates detect
 * well-known sites from the URL, and the placeholder shows what will be used.
 */
const LinksEditor = ({ links, onChange }: { links: ResumeLink[]; onChange: (links: ResumeLink[]) => void }) => {
  const update = (id: string, patch: Partial<ResumeLink>) => onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink" id="links-heading">
          Other links
        </span>
        {links.length < MAX_LINKS && (
          <button
            type="button"
            onClick={() => onChange([...links, { id: createId(), label: '', url: '' }])}
            className="focus-ring inline-flex h-7 items-center gap-1 rounded-md px-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add link
          </button>
        )}
      </div>
      <p className="text-xs text-muted">
        {links.length === 0
          ? 'GitHub, portfolio, X, Dribbble, Behance, Google Scholar or any page you want recruiters to see.'
          : 'The label is optional and only shown by templates that print labelled contacts. The icon comes from the URL.'}
      </p>
      {links.length > 0 && (
        <ul className="flex flex-col gap-2" aria-labelledby="links-heading">
          {links.map((link, index) => {
            const detected = describeLink({ label: '', url: link.url }).label;
            const error = getUrlError(link.url);
            const name = link.label.trim() || (link.url.trim() ? detected : `Link ${index + 1}`);
            return (
              <li key={link.id} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <input
                    value={link.label}
                    onChange={(e) => update(link.id, { label: e.target.value })}
                    placeholder={link.url.trim() ? detected : 'Label'}
                    aria-label={`${name} label (optional)`}
                    className={`${fieldClass()} !w-24 shrink-0 sm:!w-36`}
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => update(link.id, { url: e.target.value })}
                    placeholder="github.com/yourname"
                    aria-label={`${name} URL`}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `link-error-${link.id}` : undefined}
                    autoFocus={!link.url && index === links.length - 1 && !link.label}
                    className={`${fieldClass(error)} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => onChange(links.filter((l) => l.id !== link.id))}
                    aria-label={`Remove ${name}`}
                    className="mt-1 shrink-0 rounded-lg p-1.5 text-muted hover:bg-tint hover:text-danger focus-ring"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {error && (
                  <p id={`link-error-${link.id}`} className="text-xs text-danger">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

interface ResumeEditorProps {
  data: ResumeData;
  onChange: Dispatch<SetStateAction<ResumeData>>;
}

const EDITOR_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'design', label: 'Template' },
] as const;
type ResumeEditorTab = (typeof EDITOR_TABS)[number]['id'];

type ListKey = 'experience' | 'education' | 'projects' | 'publications' | 'awards' | 'talks' | 'teaching';
type ListItem<K extends ListKey> = NonNullable<ResumeData[K]>[number];

/* ---------- small building blocks ---------- */

const Section = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ children, onAdd, addLabel }: { children: ReactNode; onAdd: () => void; addLabel: string }) => (
  <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-rule px-4 py-8 text-center text-sm text-muted">
    <p>{children}</p>
    <Button variant="secondary" size="sm" onClick={onAdd} leftIcon={<PlusIcon className="h-4 w-4" />}>
      {addLabel}
    </Button>
  </div>
);

interface ItemCardProps {
  title: string;
  subtitle?: string;
  placeholderTitle: string;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: ReactNode;
}

/** Collapsible card for one experience / education / project entry. */
const ItemCard = ({
  title,
  subtitle,
  placeholderTitle,
  isOpen,
  onToggle,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: ItemCardProps) => {
  const label = title.trim() || placeholderTitle;
  return (
    <div className="rounded-lg border border-rule bg-surface transition-colors">
      <div className="flex items-center gap-1 py-1.5 pl-1.5 pr-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-tint focus-ring"
        >
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? '' : '-rotate-90'}`}
          />
          <span className="min-w-0">
            <span
              className={`line-clamp-2 text-sm font-medium sm:line-clamp-1 ${
                title.trim() ? 'text-ink' : 'text-muted'
              }`}
            >
              {label}
            </span>
            {subtitle && <span className="block truncate text-xs text-muted">{subtitle}</span>}
          </span>
        </button>
        <div className="flex shrink-0 items-center">
          {onMoveUp && (
            <Button variant="icon" size="icon" className="h-8 w-8" onClick={onMoveUp} aria-label={`Move ${label} up`} title="Move up">
              <ArrowUpIcon className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button variant="icon" size="icon" className="h-8 w-8" onClick={onMoveDown} aria-label={`Move ${label} down`} title="Move down">
              <ArrowDownIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="danger-ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            title="Remove"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isOpen && <div className="space-y-4 border-t border-rule p-4">{children}</div>}
    </div>
  );
};

const AiButton = ({
  onClick,
  loading,
  disabled,
  children,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    aria-label={label}
    title={label}
    className="focus-ring inline-flex h-7 items-center gap-1 rounded-md px-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:pointer-events-none disabled:opacity-40"
  >
    {loading && <LoaderIcon className="h-3.5 w-3.5 animate-spin" />}
    {children}
  </button>
);

/**
 * Tag input: Enter or comma adds a skill, Backspace on an empty field removes the last one.
 * A "Category: a, b" entry stays one grouped skill (templates render it as a group).
 */
const SkillsInput = ({ skills, onChange }: { skills: string[]; onChange: (skills: string[]) => void }) => {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const incoming = raw
      .split('\n')
      .flatMap((line) => (line.includes(':') ? [line] : line.split(',')))
      .map((s) => s.trim())
      .filter(Boolean);
    if (!incoming.length) return;
    const seen = new Set(skills.map((s) => s.toLowerCase()));
    const next = [...skills];
    for (const skill of incoming) {
      if (!seen.has(skill.toLowerCase())) {
        seen.add(skill.toLowerCase());
        next.push(skill);
      }
    }
    onChange(next);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || (event.key === ',' && !draft.includes(':'))) {
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && !draft && skills.length) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-rule bg-surface p-1.5 transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="inline-flex items-center gap-1 rounded-lg bg-tint py-1 pl-2.5 pr-1 text-sm text-ink"
          >
            {skill}
            <button
              type="button"
              onClick={() => onChange(skills.filter((_, i) => i !== index))}
              className="rounded p-0.5 text-muted hover:bg-tint hover:text-ink focus-ring"
              aria-label={`Remove ${skill}`}
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          id="skills-input"
          value={draft}
          onChange={(e) => {
            const value = e.target.value;
            // Pasting "a, b, c" adds all three at once (unless it is a "Category: a, b" group).
            if (value.includes(',') && !value.includes(':')) add(value);
            else setDraft(value);
          }}
          onPaste={(e) => {
            // Single-line inputs drop newlines, so split pasted multi-line lists ourselves.
            const text = e.clipboardData.getData('text');
            if (text.includes('\n')) {
              e.preventDefault();
              add(`${draft}${text}`);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={skills.length ? 'Add another…' : 'e.g. Figma, React, User research'}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm text-ink placeholder:text-muted focus:outline-none"
          aria-label="Add a skill"
          aria-describedby="skills-hint"
        />
      </div>
      <p id="skills-hint" className="text-xs text-muted">
        Press Enter or comma to add. Group related skills as “Languages: Go, Python”. Put your strongest first.
      </p>
    </div>
  );
};

/* ---------- editor ---------- */

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<ResumeEditorTab>('profile');
  // Entries are collapsed by default except new ones. Keys are `${list}:${id}` (ids can repeat across lists).
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const { showError, showToast } = useToast();
  const { isLoadingField, improveField, generateField, generateSummaryField } = useAiActions({ onError: showError });

  const toggleOpen = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // All updates are functional so late async results (AI) never overwrite newer edits.
  const publications = data.publications ?? [];
  const awards = data.awards ?? [];
  const talks = data.talks ?? [];
  const teaching = data.teaching ?? [];

  const setField = useCallback(
    <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => onChange((prev) => ({ ...prev, [field]: value })),
    [onChange]
  );

  const updateDesign = useCallback(
    (patch: Partial<ResumeDesign>) =>
      onChange((prev) => ({ ...prev, design: { ...(prev.design ?? DEFAULT_DESIGN), ...patch } })),
    [onChange]
  );

  const updateItem = useCallback(
    <K extends ListKey>(key: K, id: string, patch: Partial<ListItem<K>>) =>
      onChange((prev) => ({
        ...prev,
        [key]: ((prev[key] ?? []) as ListItem<K>[]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
      })),
    [onChange]
  );

  const addItem = useCallback(
    <K extends ListKey>(key: K, item: ListItem<K>, position: 'start' | 'end') => {
      onChange((prev) => {
        const list = (prev[key] ?? []) as ListItem<K>[];
        return { ...prev, [key]: position === 'start' ? [item, ...list] : [...list, item] };
      });
      setOpenIds((prev) => new Set(prev).add(`${key}:${item.id}`));
    },
    [onChange]
  );

  const removeItem = useCallback(
    <K extends ListKey>(key: K, id: string, label: string) => {
      let removed: { item: ListItem<K>; index: number } | null = null;
      onChange((prev) => {
        const list = (prev[key] ?? []) as ListItem<K>[];
        const index = list.findIndex((item) => item.id === id);
        if (index === -1) return prev;
        removed = { item: list[index], index };
        return { ...prev, [key]: list.filter((item) => item.id !== id) };
      });
      showToast(`Removed ${label}.`, 'info', {
        action: {
          label: 'Undo',
          onClick: () =>
            onChange((prev) => {
              if (!removed) return prev;
              const list = [...((prev[key] ?? []) as ListItem<K>[])];
              list.splice(Math.min(removed.index, list.length), 0, removed.item);
              return { ...prev, [key]: list };
            }),
        },
      });
    },
    [onChange, showToast]
  );

  const moveItem = useCallback(
    (key: ListKey, index: number, delta: -1 | 1) =>
      onChange((prev) => {
        const list = [...(prev[key] ?? [])] as ListItem<ListKey>[];
        const target = index + delta;
        if (target < 0 || target >= list.length) return prev;
        [list[index], list[target]] = [list[target], list[index]];
        return { ...prev, [key]: list };
      }),
    [onChange]
  );

  /** Runs an AI rewrite and offers to restore the original text. */
  const applyAi = useCallback(
    (original: string, apply: (value: string) => void) => (value: string) => {
      apply(value);
      if (original.trim()) {
        showToast('Updated with AI. Review it before exporting.', 'success', {
          action: { label: 'Undo', onClick: () => apply(original) },
        });
      }
    },
    [showToast]
  );

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = EDITOR_TABS.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index + 1) % EDITOR_TABS.length
      : event.key === 'ArrowLeft' ? (index - 1 + EDITOR_TABS.length) % EDITOR_TABS.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    if (next === -1) return;
    event.preventDefault();
    setActiveTab(EDITOR_TABS[next].id);
    document.getElementById(`tab-${EDITOR_TABS[next].id}`)?.focus();
  };

  const polishButton = (fieldId: string, text: string, context: string, apply: (value: string) => void) => (
    <AiButton
      onClick={() => improveField({ fieldId, text, context, onUpdate: applyAi(text, apply) })}
      loading={isLoadingField(fieldId)}
      disabled={!text.trim()}
      label={`Improve ${context.toLowerCase()} with AI`}
    >
      Improve
    </AiButton>
  );

  const descriptionHint = 'One achievement per line. Start with a verb and add a number where you can.';

  return (
    <div className="flex h-full flex-col">
      <div
        className="sticky top-0 z-10 flex shrink-0 gap-1 border-b border-rule bg-paper/95 px-3 pt-2 backdrop-blur-sm"
        role="tablist"
        aria-label="Resume sections"
      >
        {EDITOR_TABS.map((tab, index) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 whitespace-nowrap px-2 py-2.5 text-sm font-medium transition-colors focus-ring ${
                selected
                  ? 'text-ink'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
              {selected && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-10 px-4 py-6 sm:px-6" id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'profile' && (
          <>
            <Section title="Personal details" description="How recruiters will reach you.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Full name" value={data.fullName} onChange={(v) => setField('fullName', v)} placeholder="Alex Sterling" autoComplete="name" />
                <Input label="Job title" value={data.title} onChange={(v) => setField('title', v)} placeholder="Senior Product Designer" autoComplete="organization-title" />
                <Input
                  label="Email"
                  type="email"
                  value={data.email}
                  onChange={(v) => setField('email', v)}
                  error={getEmailError(data.email)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={data.phone}
                  onChange={(v) => setField('phone', v)}
                  error={getPhoneError(data.phone)}
                  placeholder="+1 555 012 3456"
                  autoComplete="tel"
                />
                <Input label="Location" value={data.location} onChange={(v) => setField('location', v)} placeholder="City, Country" autoComplete="address-level2" />
                <Input
                  label="Website"
                  type="url"
                  value={data.website}
                  onChange={(v) => setField('website', v)}
                  error={getUrlError(data.website)}
                  placeholder="yourname.com"
                  autoComplete="url"
                />
                <Input
                  label="LinkedIn"
                  type="url"
                  value={data.linkedin}
                  onChange={(v) => setField('linkedin', v)}
                  error={getUrlError(data.linkedin)}
                  placeholder="linkedin.com/in/yourname"
                  className="sm:col-span-2"
                />
                <LinksEditor links={data.links ?? []} onChange={(links) => setField('links', links)} />
                <PhotoField photo={data.photo ?? ''} templateId={data.templateId} onChange={(photo) => setField('photo', photo)} />
              </div>
            </Section>

            <Section title="Summary" description="Two or three sentences on who you are and what you're great at.">
              <Textarea
                label="Professional summary"
                value={data.summary}
                onChange={(v) => setField('summary', v)}
                placeholder="Product designer with 6 years of experience turning complex workflows into simple tools…"
                minRows={4}
                disabled={isLoadingField('summary') || isLoadingField('summary-polish')}
                hint={
                  data.title.trim()
                    ? 'AI can draft one from your job title and skills.'
                    : 'Add a job title (and skills) so AI can draft one for you.'
                }
                actions={
                  <div className="flex items-center gap-0.5">
                    <AiButton
                      onClick={() =>
                        generateField({
                          fieldId: 'summary',
                          generator: () => generateSummaryField(data.title, data.skills || []),
                          onUpdate: applyAi(data.summary, (v) => setField('summary', v)),
                        })
                      }
                      loading={isLoadingField('summary')}
                      disabled={!data.title.trim()}
                      label="Write a summary with AI"
                    >
                      Write
                    </AiButton>
                    {polishButton('summary-polish', data.summary, 'Professional Summary', (v) => setField('summary', v))}
                  </div>
                }
              />
            </Section>
          </>
        )}

        {activeTab === 'experience' && (
          <>
            <Section
              title="Work experience"
              description="Most recent first."
              action={
                data.experience.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    onClick={() =>
                      addItem('experience', { id: createId(), company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '' } satisfies Experience, 'start')
                    }
                  >
                    Add
                  </Button>
                )
              }
            >
              {data.experience.length === 0 ? (
                <EmptyState
                  addLabel="Add a position"
                  onAdd={() =>
                    addItem('experience', { id: createId(), company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '' }, 'start')
                  }
                >
                  No positions yet. Internships and freelance work count too.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {data.experience.map((exp, index) => (
                    <ItemCard
                      key={exp.id}
                      title={[exp.role, exp.company].filter((s) => s.trim()).join(' · ')}
                      subtitle={formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                      placeholderTitle="New position"
                      isOpen={openIds.has(`experience:${exp.id}`)}
                      onToggle={() => toggleOpen(`experience:${exp.id}`)}
                      onRemove={() => removeItem('experience', exp.id, exp.role || 'position')}
                      onMoveUp={index > 0 ? () => moveItem('experience', index, -1) : undefined}
                      onMoveDown={index < data.experience.length - 1 ? () => moveItem('experience', index, 1) : undefined}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input label="Job title" value={exp.role} onChange={(v) => updateItem('experience', exp.id, { role: v })} placeholder="Product Designer" />
                        <Input label="Company" value={exp.company} onChange={(v) => updateItem('experience', exp.id, { company: v })} placeholder="Acme Inc." />
                        <Input label="Start" type="month" value={exp.startDate} onChange={(v) => updateItem('experience', exp.id, { startDate: v })} placeholder="YYYY-MM" />
                        <div className="space-y-2">
                          <Input
                            label="End"
                            type={exp.isCurrent ? 'text' : 'month'}
                            value={exp.isCurrent ? 'Present' : exp.endDate}
                            onChange={(v) => updateItem('experience', exp.id, { endDate: v })}
                            disabled={exp.isCurrent}
                            placeholder="YYYY-MM"
                          />
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                            <input
                              type="checkbox"
                              checked={exp.isCurrent}
                              onChange={(e) => updateItem('experience', exp.id, { isCurrent: e.target.checked })}
                              className="h-4 w-4 rounded border-rule text-accent accent-[var(--site-ink)] focus:ring-accent"
                            />
                            I currently work here
                          </label>
                        </div>
                      </div>
                      <Textarea
                        label="What you did"
                        value={exp.description}
                        onChange={(v) => updateItem('experience', exp.id, { description: v })}
                        placeholder={'- Led the redesign of onboarding, lifting activation by 18%\n- Built a design system used by 4 product teams'}
                        hint={descriptionHint}
                        minRows={4}
                        disabled={isLoadingField(`exp-${exp.id}`)}
                        actions={polishButton(`exp-${exp.id}`, exp.description, 'Job Description', (v) =>
                          updateItem('experience', exp.id, { description: v })
                        )}
                      />
                    </ItemCard>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Education"
              action={
                data.education.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    onClick={() => addItem('education', { id: createId(), school: '', degree: '', startDate: '', endDate: '' } satisfies Education, 'end')}
                  >
                    Add
                  </Button>
                )
              }
            >
              {data.education.length === 0 ? (
                <EmptyState
                  addLabel="Add education"
                  onAdd={() => addItem('education', { id: createId(), school: '', degree: '', startDate: '', endDate: '' }, 'end')}
                >
                  Degrees, bootcamps and certifications.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {data.education.map((edu, index) => (
                    <ItemCard
                      key={edu.id}
                      title={edu.school}
                      subtitle={[edu.degree, formatDateRange(edu.startDate, edu.endDate)].filter(Boolean).join(' · ')}
                      placeholderTitle="New education"
                      isOpen={openIds.has(`education:${edu.id}`)}
                      onToggle={() => toggleOpen(`education:${edu.id}`)}
                      onRemove={() => removeItem('education', edu.id, edu.school || 'education')}
                      onMoveUp={index > 0 ? () => moveItem('education', index, -1) : undefined}
                      onMoveDown={index < data.education.length - 1 ? () => moveItem('education', index, 1) : undefined}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input label="School" value={edu.school} onChange={(v) => updateItem('education', edu.id, { school: v })} placeholder="University of Washington" className="sm:col-span-2" />
                        <Input label="Degree / field" value={edu.degree} onChange={(v) => updateItem('education', edu.id, { degree: v })} placeholder="BSc Computer Science" className="sm:col-span-2" />
                        <Input label="Start" type="month" value={edu.startDate} onChange={(v) => updateItem('education', edu.id, { startDate: v })} placeholder="YYYY-MM" />
                        <Input label="End" type="month" value={edu.endDate} onChange={(v) => updateItem('education', edu.id, { endDate: v })} placeholder="YYYY-MM" hint="Expected date is fine." />
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}

        {activeTab === 'skills' && (
          <>
            <Section title="Skills" description="Tools, methods and languages you'd want to be asked about.">
              <SkillsInput skills={data.skills} onChange={(skills) => setField('skills', skills)} />
            </Section>

            <Section
              title="Projects"
              description="Side projects, open source or case studies."
              action={
                data.projects.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    onClick={() => addItem('projects', { id: createId(), name: '', link: '', description: '' } satisfies Project, 'end')}
                  >
                    Add
                  </Button>
                )
              }
            >
              {data.projects.length === 0 ? (
                <EmptyState addLabel="Add a project" onAdd={() => addItem('projects', { id: createId(), name: '', link: '', description: '' }, 'end')}>
                  Optional, but great for showing real work.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {data.projects.map((proj, index) => (
                    <ItemCard
                      key={proj.id}
                      title={proj.name}
                      subtitle={proj.link}
                      placeholderTitle="New project"
                      isOpen={openIds.has(`projects:${proj.id}`)}
                      onToggle={() => toggleOpen(`projects:${proj.id}`)}
                      onRemove={() => removeItem('projects', proj.id, proj.name || 'project')}
                      onMoveUp={index > 0 ? () => moveItem('projects', index, -1) : undefined}
                      onMoveDown={index < data.projects.length - 1 ? () => moveItem('projects', index, 1) : undefined}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input label="Name" value={proj.name} onChange={(v) => updateItem('projects', proj.id, { name: v })} placeholder="Open-source design tokens" />
                        <Input
                          label="Link"
                          type="url"
                          value={proj.link}
                          onChange={(v) => updateItem('projects', proj.id, { link: v })}
                          error={getUrlError(proj.link)}
                          placeholder="github.com/you/project"
                          hint="Optional"
                        />
                      </div>
                      <Textarea
                        label="Description"
                        value={proj.description}
                        onChange={(v) => updateItem('projects', proj.id, { description: v })}
                        placeholder="What it is, your role, and the result."
                        minRows={3}
                        disabled={isLoadingField(`proj-${proj.id}`)}
                        actions={polishButton(`proj-${proj.id}`, proj.description, 'Project Description', (v) =>
                          updateItem('projects', proj.id, { description: v })
                        )}
                      />
                    </ItemCard>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Publications"
              description={`Papers, articles and posters, for academic and research CVs. Shown by ${PUBLICATION_TEMPLATE_NAMES}.`}
              action={
                publications.length > 0 && (
                  <Button variant="secondary" size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => addItem('publications', newPublication(), 'end')}>
                    Add
                  </Button>
                )
              }
            >
              <PublicationImport
                existing={publications}
                onImport={(added) => {
                  onChange((prev) => ({ ...prev, publications: [...(prev.publications ?? []), ...added] }));
                  showToast(`Added ${added.length} ${added.length === 1 ? 'publication' : 'publications'}.`, 'success');
                }}
              />
              {publications.length === 0 ? (
                <EmptyState addLabel="Add a publication" onAdd={() => addItem('publications', newPublication(), 'end')}>
                  Optional. Your name is set in bold in the author list.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {publications.map((pub, index) => (
                    <ItemCard
                      key={pub.id}
                      title={pub.title}
                      subtitle={[pub.venue, pub.year].filter(Boolean).join(' · ')}
                      placeholderTitle="New publication"
                      isOpen={openIds.has(`publications:${pub.id}`)}
                      onToggle={() => toggleOpen(`publications:${pub.id}`)}
                      onRemove={() => removeItem('publications', pub.id, pub.title || 'publication')}
                      onMoveUp={index > 0 ? () => moveItem('publications', index, -1) : undefined}
                      onMoveDown={index < publications.length - 1 ? () => moveItem('publications', index, 1) : undefined}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                        <Input label="Title" value={pub.title} onChange={(v) => updateItem('publications', pub.id, { title: v })} placeholder="Sparse attention for long documents" className="sm:col-span-2" />
                        <Input
                          label="Authors"
                          value={pub.authors}
                          onChange={(v) => updateItem('publications', pub.id, { authors: v })}
                          placeholder="Lee, P., Chen, J., Okafor, A."
                          hint="In publication order; your name is bolded automatically."
                          className="sm:col-span-2"
                        />
                        <Input label="Journal, conference or publisher" value={pub.venue} onChange={(v) => updateItem('publications', pub.id, { venue: v })} placeholder="NeurIPS" />
                        <Input label="Year" value={pub.year} onChange={(v) => updateItem('publications', pub.id, { year: v })} placeholder="2025" />
                        <Input
                          label="DOI or link"
                          type="url"
                          value={pub.link}
                          onChange={(v) => updateItem('publications', pub.id, { link: v })}
                          error={getUrlError(pub.link)}
                          placeholder="doi.org/10.1000/xyz123"
                          hint="Optional"
                          className="sm:col-span-2"
                        />
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Grants and awards"
              description={`Grants, fellowships, scholarships and prizes. Shown by ${PUBLICATION_TEMPLATE_NAMES}.`}
              action={
                awards.length > 0 && (
                  <Button variant="secondary" size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => addItem('awards', newAward(), 'end')}>
                    Add
                  </Button>
                )
              }
            >
              {awards.length === 0 ? (
                <EmptyState addLabel="Add a grant or award" onAdd={() => addItem('awards', newAward(), 'end')}>
                  Optional. Most recent first.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {awards.map((award, index) => (
                    <ItemCard
                      key={award.id}
                      title={award.title}
                      subtitle={[award.issuer, award.year].filter(Boolean).join(' · ')}
                      placeholderTitle="New grant or award"
                      isOpen={openIds.has(`awards:${award.id}`)}
                      onToggle={() => toggleOpen(`awards:${award.id}`)}
                      onRemove={() => removeItem('awards', award.id, award.title || 'award')}
                      onMoveUp={index > 0 ? () => moveItem('awards', index, -1) : undefined}
                      onMoveDown={index < awards.length - 1 ? () => moveItem('awards', index, 1) : undefined}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                        <Input label="Title" value={award.title} onChange={(v) => updateItem('awards', award.id, { title: v })} placeholder="Graduate Research Fellowship" className="sm:col-span-2" />
                        <Input label="Funder or awarding body" value={award.issuer} onChange={(v) => updateItem('awards', award.id, { issuer: v })} placeholder="National Science Foundation" />
                        <Input label="Year" value={award.year} onChange={(v) => updateItem('awards', award.id, { year: v })} placeholder="2023–2026" />
                        <Input
                          label="Amount or note"
                          value={award.detail}
                          onChange={(v) => updateItem('awards', award.id, { detail: v })}
                          placeholder="$138,000, 3 years"
                          hint="Optional: amount, your role (PI, co-PI) or selectivity."
                          className="sm:col-span-2"
                        />
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Talks"
              description={`Invited talks, conference presentations, seminars and posters. Shown by ${PUBLICATION_TEMPLATE_NAMES}.`}
              action={
                talks.length > 0 && (
                  <Button variant="secondary" size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => addItem('talks', newTalk(), 'end')}>
                    Add
                  </Button>
                )
              }
            >
              {talks.length === 0 ? (
                <EmptyState addLabel="Add a talk" onAdd={() => addItem('talks', newTalk(), 'end')}>
                  Optional. Most recent first.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {talks.map((talk, index) => (
                    <ItemCard
                      key={talk.id}
                      title={talk.title}
                      subtitle={[talk.event, talk.year].filter(Boolean).join(' · ')}
                      placeholderTitle="New talk"
                      isOpen={openIds.has(`talks:${talk.id}`)}
                      onToggle={() => toggleOpen(`talks:${talk.id}`)}
                      onRemove={() => removeItem('talks', talk.id, talk.title || 'talk')}
                      onMoveUp={index > 0 ? () => moveItem('talks', index, -1) : undefined}
                      onMoveDown={index < talks.length - 1 ? () => moveItem('talks', index, 1) : undefined}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                        <Input label="Title" value={talk.title} onChange={(v) => updateItem('talks', talk.id, { title: v })} placeholder="Sparse attention at scale" className="sm:col-span-2" />
                        <Input
                          label="Event or host"
                          value={talk.event}
                          onChange={(v) => updateItem('talks', talk.id, { event: v })}
                          placeholder="NeurIPS, invited talk"
                          className="sm:col-span-2"
                        />
                        <Input label="Location" value={talk.location} onChange={(v) => updateItem('talks', talk.id, { location: v })} placeholder="Vancouver, Canada" hint="Optional" />
                        <Input label="Year" value={talk.year} onChange={(v) => updateItem('talks', talk.id, { year: v })} placeholder="2025" />
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Teaching"
              description={`Courses taught, TA roles and guest lectures. Shown by ${PUBLICATION_TEMPLATE_NAMES}.`}
              action={
                teaching.length > 0 && (
                  <Button variant="secondary" size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => addItem('teaching', newTeaching(), 'end')}>
                    Add
                  </Button>
                )
              }
            >
              {teaching.length === 0 ? (
                <EmptyState addLabel="Add a course" onAdd={() => addItem('teaching', newTeaching(), 'end')}>
                  Optional. Most recent first.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {teaching.map((entry, index) => (
                    <ItemCard
                      key={entry.id}
                      title={entry.course}
                      subtitle={[entry.role, entry.year].filter(Boolean).join(' · ')}
                      placeholderTitle="New course"
                      isOpen={openIds.has(`teaching:${entry.id}`)}
                      onToggle={() => toggleOpen(`teaching:${entry.id}`)}
                      onRemove={() => removeItem('teaching', entry.id, entry.course || 'course')}
                      onMoveUp={index > 0 ? () => moveItem('teaching', index, -1) : undefined}
                      onMoveDown={index < teaching.length - 1 ? () => moveItem('teaching', index, 1) : undefined}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                        <Input label="Course" value={entry.course} onChange={(v) => updateItem('teaching', entry.id, { course: v })} placeholder="CS 229: Machine Learning" className="sm:col-span-2" />
                        <Input label="Role" value={entry.role} onChange={(v) => updateItem('teaching', entry.id, { role: v })} placeholder="Teaching Assistant" />
                        <Input label="Year" value={entry.year} onChange={(v) => updateItem('teaching', entry.id, { year: v })} placeholder="Fall 2024" />
                        <Input label="Institution" value={entry.institution} onChange={(v) => updateItem('teaching', entry.id, { institution: v })} placeholder="Stanford University" hint="Optional" className="sm:col-span-2" />
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}

        {activeTab === 'design' && (
          <>
          <Section title="Style" description="Accent colour, font and size apply to every template.">
            <DesignControls design={data.design ?? DEFAULT_DESIGN} onChange={updateDesign} />
          </Section>
          <Section title="Template" description="Switch any time — your content stays the same. ATS-marked templates are single-column and parse cleanly in applicant tracking systems.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Resume templates">
              {TEMPLATES.map((t) => {
                const selected = data.templateId === t.id;
                return (
                  <div key={t.id} className="group relative text-left">
                    <div
                      className={`relative overflow-hidden rounded-md bg-white outline-offset-2 transition-shadow group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-accent ${
                        selected ? 'outline-2 outline-accent' : 'shadow-card ring-1 ring-rule group-hover:shadow-raised'
                      }`}
                    >
                      <LazyResumePreview data={data} templateId={t.id} />
                    </div>
                    <span className="mt-2 flex items-baseline justify-between gap-2">
                      <span className={`text-sm ${selected ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>{t.name}</span>
                      {t.atsFriendly && <span className="tag">ATS</span>}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">{t.description}</span>
                    {/* Overlay control: previews contain links, which must not nest inside a button. */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setField('templateId', t.id)}
                      aria-label={`${t.name}: ${t.description}`}
                      className="absolute inset-0 cursor-pointer focus-visible:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </Section>
          </>
        )}

      </div>
    </div>
  );
};

export default ResumeEditor;

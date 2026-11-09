import React, { useEffect, useRef, useState } from 'react';
import { useResume } from '../contexts/ResumeContext';
import { getTemplateById } from '../constants/templates';
import type { ResumeEntry } from '../utils/resumeLibrary';
import { CheckIcon, ChevronDownIcon, CopyIcon, FilesIcon, PenIcon, PlusIcon, TrashIcon } from './Icons';

const relativeTime = (ms: number): string => {
  const minutes = Math.round((Date.now() - ms) / 60000);
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (minutes < 1) return 'just now';
  if (minutes < 60) return format.format(-minutes, 'minute');
  if (minutes < 60 * 24) return format.format(-Math.round(minutes / 60), 'hour');
  return format.format(-Math.round(minutes / (60 * 24)), 'day');
};

const iconButton =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink focus-ring';

/**
 * Header control to switch between, add, rename and delete the resumes saved in this browser.
 * The editor owns `open`, because on phones the resume name line under the header opens it too;
 * clicks on an element marked `data-resume-menu-toggle` don't count as clicks outside.
 */
export const ResumeSwitcher: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange: setOpen }) => {
  const { library, resumeData, resumeName, switchResume, createResume, renameResume, deleteResume } = useResume();
  const [renaming, setRenaming] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      const outside = !rootRef.current?.contains(event.target as Node) && !(event.target as Element).closest?.('[data-resume-menu-toggle]');
      if (event instanceof KeyboardEvent ? event.key === 'Escape' && !renaming : outside) {
        setOpen(false);
        setRenaming(null);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open, renaming, setOpen]);

  if (!library) return null;
  const active = library.entries.find((e) => e.id === library.activeId)!;
  const count = library.entries.length;

  const run = (action: () => void) => {
    setOpen(false);
    setRenaming(null);
    action();
  };

  const row = (entry: ResumeEntry) => {
    const isActive = entry.id === library.activeId;
    const name = resumeName(entry);
    const template = getTemplateById(isActive ? resumeData.templateId : entry.templateId)?.name;
    const meta = [template, isActive ? 'Editing now' : `Edited ${relativeTime(entry.updatedAt)}`].filter(Boolean).join(' · ');

    if (renaming === entry.id) {
      return (
        <li key={entry.id} className="px-1 py-1">
          <input
            autoFocus
            defaultValue={entry.name || name}
            aria-label="Resume name"
            maxLength={80}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                renameResume(entry.id, event.currentTarget.value);
                setRenaming(null);
              } else if (event.key === 'Escape') {
                event.stopPropagation();
                setRenaming(null);
              }
            }}
            onBlur={(event) => {
              renameResume(entry.id, event.currentTarget.value);
              setRenaming(null);
            }}
            className="w-full rounded-lg border border-accent bg-surface px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </li>
      );
    }

    return (
      <li key={entry.id} className="group flex items-center gap-1 rounded-lg pr-1 hover:bg-tint">
        <button
          type="button"
          aria-current={isActive ? 'true' : undefined}
          onClick={() => run(() => switchResume(entry.id))}
          className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg px-2.5 py-2 text-left focus-ring"
        >
          <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-ink' : 'invisible'}`} />
          <span className="min-w-0">
            <span className={`block truncate text-sm text-ink ${isActive ? 'font-semibold' : 'font-medium'}`}>{name}</span>
            <span className="block truncate text-xs text-muted">{meta}</span>
          </span>
        </button>
        <button type="button" className={iconButton} aria-label={`Rename ${name}`} title="Rename" onClick={() => setRenaming(entry.id)}>
          <PenIcon className="h-4 w-4" />
        </button>
        {!isActive && (
          <button type="button" className={iconButton} aria-label={`Delete ${name}`} title="Delete" onClick={() => deleteResume(entry.id)}>
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </li>
    );
  };

  const footerButton = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink hover:bg-tint focus-ring';

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Resume: ${resumeName(active)}. Switch or add a resume`}
        className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-tint focus-ring"
      >
        <FilesIcon className="h-4 w-4 shrink-0 text-muted" />
        <span className="hidden max-w-[14rem] truncate sm:inline">{resumeName(active)}</span>
        {count > 1 && <span className="hidden rounded-md bg-tint px-1.5 text-xs tabular-nums text-muted sm:inline">{count}</span>}
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Your resumes"
          className="animate-enter absolute left-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-rule bg-surface p-1 shadow-sheet max-sm:-left-10"
        >
          <p className="kicker px-2.5 pb-1 pt-2 text-muted">Resumes in this browser</p>
          <ul className="max-h-80 overflow-y-auto">{library.entries.map(row)}</ul>
          <div className="mt-1 border-t border-rule pt-1">
            <button type="button" className={footerButton} onClick={() => run(() => createResume('blank'))}>
              <PlusIcon className="h-4 w-4 text-muted" />
              New blank resume
            </button>
            <button type="button" className={footerButton} onClick={() => run(() => createResume('duplicate'))}>
              <CopyIcon className="h-4 w-4 text-muted" />
              Duplicate this resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

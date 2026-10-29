import { useId, useRef, useState } from 'react';
import { TEMPLATES, getTemplateById } from '../constants/templates';
import { TrashIcon } from './Icons';
import { Button } from './Button';

/** Stored size of the photo: a 3:4 portrait, sharp at the largest slot (about 40 × 53 mm) in print. */
const PHOTO_WIDTH = 420;
const PHOTO_HEIGHT = 560;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const PHOTO_TEMPLATE_NAMES = TEMPLATES.filter((template) => template.photo).map((template) => template.name);

/** Centre-crops an image file to 3:4 and re-encodes it as a JPEG data URL (roughly 30–90 KB). */
const toPortraitDataUrl = async (file: File): Promise<string> => {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const { naturalWidth: w, naturalHeight: h } = image;
    const target = PHOTO_WIDTH / PHOTO_HEIGHT;
    const cropW = w / h > target ? h * target : w;
    const cropH = w / h > target ? h : w / target;
    // Faces sit in the upper part of most portraits, so a tall crop keeps the top third.
    const top = h > cropH ? (h - cropH) / 3 : 0;
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_WIDTH;
    canvas.height = PHOTO_HEIGHT;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, (w - cropW) / 2, top, cropW, cropH, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
    return canvas.toDataURL('image/jpeg', 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Upload, replace or remove the resume photo. The image never leaves the browser. */
export const PhotoField = ({ photo, templateId, onChange }: { photo: string; templateId: string; onChange: (photo: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [error, setError] = useState('');
  const shown = Boolean(getTemplateById(templateId)?.photo);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) return setError('Choose an image file (JPEG, PNG or WebP).');
    if (file.size > MAX_UPLOAD_BYTES) return setError('That image is larger than 15 MB.');
    try {
      onChange(await toPortraitDataUrl(file));
    } catch {
      setError("That image couldn't be read. Try a JPEG or PNG.");
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium text-ink">Photo</span>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-15 shrink-0 items-center justify-center overflow-hidden rounded-md border border-rule bg-tint text-muted">
          {photo ? (
            <img src={photo} alt="Your photo" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="9" r="3.5" />
              <path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} aria-describedby={hintId}>
              {photo ? 'Replace photo' : 'Add photo'}
            </Button>
            {photo && (
              <Button variant="danger-ghost" size="sm" aria-label="Remove photo" onClick={() => onChange('')} leftIcon={<TrashIcon className="h-4 w-4" />}>
                Remove
              </Button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>
          <p id={hintId} className={`mt-1.5 text-xs ${error ? 'text-danger' : 'text-muted'}`} role={error ? 'alert' : undefined}>
            {error ||
              (shown
                ? 'Optional. Shown by this template; leave it out for ATS portals and US or UK applications.'
                : `Optional. Only photo templates show it: ${PHOTO_TEMPLATE_NAMES.join(', ')}.`)}
          </p>
        </div>
      </div>
    </div>
  );
};

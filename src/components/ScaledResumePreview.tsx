import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResumeData } from '../types';
import ResumePreview from './ResumePreview';

/** A4 width at 96 dpi; the paper is always laid out at this width and then scaled. */
const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;

interface ScaledResumePreviewProps {
  data: ResumeData;
  /** Overrides data.templateId (used by template pickers). */
  templateId?: string;
  /**
   * `page`: full document at natural height (main preview; exported to PDF when `exportable`).
   * `thumbnail`: first page only, clipped to the A4 aspect ratio, not interactive.
   */
  mode?: 'page' | 'thumbnail';
  /** Marks this preview as the one PDF export captures (DOM id `resume-preview-container`). */
  exportable?: boolean;
  /** Upper bound for the scale factor in page mode (1 = true size). */
  maxScale?: number;
  className?: string;
}

/**
 * Renders the resume at true A4 width and scales it to fit its container, so the layout is
 * identical on phones, in thumbnails, and in the exported PDF.
 */
export const ScaledResumePreview: React.FC<ScaledResumePreviewProps> = ({
  data,
  templateId,
  mode = 'thumbnail',
  exportable = false,
  maxScale = 1,
  className = '',
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [outerWidth, setOuterWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const width = outer.clientWidth;
      setOuterWidth(width);
      if (width > 0) setScale(Math.min(mode === 'page' ? maxScale : Infinity, width / A4_WIDTH_PX));
      setContentHeight(inner.offsetHeight || A4_HEIGHT_PX);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [mode, maxScale]);

  const resolvedData = templateId ? { ...data, templateId } : data;
  const isThumbnail = mode === 'thumbnail';
  const height = isThumbnail ? A4_HEIGHT_PX * scale : contentHeight * scale;

  return (
    <div
      ref={outerRef}
      className={`relative w-full ${isThumbnail ? 'overflow-hidden select-none pointer-events-none' : ''} ${className}`}
      style={{ height: scale ? height : undefined, aspectRatio: scale ? undefined : '210 / 297' }}
      aria-hidden={isThumbnail || undefined}
      inert={isThumbnail || undefined}
    >
      <div
        ref={innerRef}
        className="absolute top-0 origin-top-left"
        style={{
          width: A4_WIDTH_PX,
          transform: `scale(${scale || 0.0001})`,
          // Centered when capped by maxScale and narrower than the container.
          left: Math.max(0, (outerWidth - A4_WIDTH_PX * scale) / 2),
          visibility: scale ? 'visible' : 'hidden',
        }}
      >
        <ResumePreview
          data={resolvedData}
          id={exportable ? 'resume-preview-container' : ''}
          showPageBreaks={!isThumbnail}
        />
      </div>
    </div>
  );
};

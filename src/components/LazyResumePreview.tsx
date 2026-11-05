import React, { memo } from 'react';
import { ResumeData } from '../types';
import { ScaledResumePreview } from './ScaledResumePreview';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazyResumePreviewProps {
  data: ResumeData;
  templateId: string;
  /** Render straight away (above the fold), so prerendered pages include this thumbnail. */
  eager?: boolean;
}

/** Template thumbnail that only renders once scrolled into view. */
const LazyResumePreviewComponent: React.FC<LazyResumePreviewProps> = ({ data, templateId, eager = false }) => {
  const [ref, isVisible] = useIntersectionObserver({
    rootMargin: '200px',
    freezeOnceVisible: true,
    initialVisible: eager,
  });

  return (
    <div ref={ref} className="w-full bg-white">
      {isVisible ? (
        <ScaledResumePreview data={data} templateId={templateId} />
      ) : (
        <div className="w-full aspect-[210/297] bg-tint animate-pulse" />
      )}
    </div>
  );
};

export const LazyResumePreview = memo(LazyResumePreviewComponent);

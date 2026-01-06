import React, { memo } from 'react';
import { ResumeData } from '../types';
import { ScaledResumePreview } from './ScaledResumePreview';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { LoaderIcon } from './Icons';

interface LazyResumePreviewProps {
    data: ResumeData;
    templateId: string;
}

const LazyResumePreviewComponent: React.FC<LazyResumePreviewProps> = ({ data, templateId }) => {
    const [ref, isVisible] = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true, // Once loaded, keep it loaded
    });

    return (
        <div ref={ref} className="w-full h-full relative">
            {isVisible ? (
                <ScaledResumePreview data={data} templateId={templateId} />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                    <LoaderIcon className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
            )}
        </div>
    );
};

export const LazyResumePreview = memo(LazyResumePreviewComponent);

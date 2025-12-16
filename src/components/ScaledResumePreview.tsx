import React from 'react';
import { ResumeData } from '../types';
import { ResumeTemplateRenderer } from './ResumeTemplateRenderer';

interface ScaledResumePreviewProps {
    data: ResumeData;
    templateId: string;
}

export const ScaledResumePreview: React.FC<ScaledResumePreviewProps> = ({ data, templateId }) => {
    // A4 ratio is 210mm / 297mm ~= 0.707
    // We use a container that enforces this aspect ratio

    return (
        <div className="w-full h-full relative overflow-hidden bg-white select-none pointer-events-none">
            {/* 
        Scaling Container:
        The content inside is fixed at 210mm width (A4 width).
        We use CSS container query units or simple percentage based scaling if possible.
        Actually, the easiest way to scale arbitrary content to a container is using `transform: scale()`.
        
        Since we don't know the exact pixel size of the parent at runtime complexity-free,
        we can use a trick: 
        1. Fix the child size to standard A4 (roughly 794px width at 96dpi, or just use 210mm).
        2. Use `cqw` (Container Query Width) if supported, or just absolute positioning with scale.
        
        Better approach for robust "thumbnailing":
        Render content at a fixed large width (e.g. 800px) and scale it down to fit 100% of parent width.
      */}
            <div
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    transform: 'scale(var(--scale-factor, 0.25))', // Failover
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
                // Using a ref to calculate scale would be best, but for a pure CSS approach in a grid:
                // We can't easily know the parent width in pure CSS for `transform`.
                // However, if we assume the parent container has `container-type: size`, we might use CQ units, but `transform` doesn't support them directly in all browsers perfectly yet for this specific use case.

                // Let's use a simpler approach: 
                // We will make the content flexible. Most templates use percentage or flex widths, so they might largely work if we just constrain the width to 100% of parent.
                // BUT, font sizes will be huge.

                // Correct approach:
                // Use a wrapper that is 210mm wide.
                // Put it in a container.
                // Style tag to set zoom/scale based on container width? No.

                // Let's try the container query style approach which acts as a "ViewBox".
                // Actually, for a list of thumbnails, a simple CSS scale trick is:
                className="origin-top-left absolute inset-0 w-[210mm] h-[297mm]"
            // We need JavaScript to calculate scale if we want it to be perfectly responsive to ANY parent size.
            // OR we can rely on the fact that `TemplateSelector` grid columns have a roughly known width? No, they are responsive.

            // Let's use a ResizeObserver wrapper.
            >
                <ResumeTemplateRenderer data={data} templateId={templateId} />
            </div>
            <AutoScaler />
        </div>
    );
};

// Helper to auto-scale the sibling
const AutoScaler: React.FC = () => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!ref.current) return;
        const parent = ref.current.parentElement;
        if (!parent) return;

        const content = parent.firstElementChild as HTMLElement; // The 210mm div
        if (!content) return;

        const updateScale = () => {
            const parentWidth = parent.clientWidth;
            // 210mm in pixels is approx 793.7px (96 DPI)
            // Let's assume the content is rendered at this "natural" logical width.
            // Actually, we set w-[210mm] which is constant.
            const baseWidth = content.offsetWidth;
            if (baseWidth === 0) return;

            const scale = parentWidth / baseWidth;
            content.style.transform = `scale(${scale})`;
        };

        const ro = new ResizeObserver(updateScale);
        ro.observe(parent);

        // Initial
        updateScale();

        return () => ro.disconnect();
    }, []);

    return <div ref={ref} className="hidden" />;
};

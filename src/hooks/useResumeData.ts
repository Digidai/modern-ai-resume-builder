import { useState, useEffect } from 'react';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';

export const useResumeData = () => {
    const [resumeData, setResumeData] = useState<ResumeData>(() => {
        try {
            const saved = localStorage.getItem('resumeData');
            if (saved) {
                return { ...INITIAL_RESUME_DATA, ...JSON.parse(saved) }; // Merge to ensure new fields are present
            }
        } catch (e) {
            console.error("Failed to load resume data", e);
        }
        return INITIAL_RESUME_DATA;
    });

    // Auto-save to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('resumeData', JSON.stringify(resumeData));
        } catch (e) {
            console.error("Failed to save resume data", e);
        }
    }, [resumeData]);

    const resetData = () => {
        if (confirm("Are you sure you want to reset all data to defaults? This cannot be undone.")) {
            setResumeData(INITIAL_RESUME_DATA);
            localStorage.removeItem('resumeData');
        }
    };

    return {
        resumeData,
        setResumeData,
        resetData
    };
};

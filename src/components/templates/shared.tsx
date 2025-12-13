import React from 'react';
import { ResumeData } from '../../types';
import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, LinkedinIcon } from '../Icons';

export interface TemplateProps {
    data: ResumeData;
}

// Helper to render contact info consistently
export const ContactItem = ({ icon: Icon, value }: { icon: any, value: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Icon className="w-4 h-4" />
            <span>{value}</span>
        </div>
    );
};

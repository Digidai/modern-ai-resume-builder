import React from 'react';
import { StyleSheet, Font, Svg, Path, Rect, Circle, Polyline, Line } from '@react-pdf/renderer';
import { ResumeData } from '../types';

// Register Roboto Font for a more modern look
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf' }, // Regular
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5fBBc4.ttf', fontWeight: 'light' }, // 300
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.ttf', fontWeight: 'medium' }, // 500
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf', fontWeight: 'bold' }, // 700
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzI.ttf', fontStyle: 'italic' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TzBhc4.ttf', fontWeight: 'bold', fontStyle: 'italic' }
  ]
});

export type PdfTemplateProps = {
  data: ResumeData;
};

// Exact Tailwind Colors
export const COLORS = {
  black: '#000000',
  white: '#ffffff',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  indigo600: '#4f46e5',
  indigo500: '#6366f1',
  indigo400: '#818cf8',
};

// Tailwind Scale Mappings (px -> pt conversion: 1px = 0.75pt)
export const SPACING = {
  '0.5': 1.5, // 2px
  '1': 3,     // 4px
  '1.5': 4.5, // 6px
  '2': 6,     // 8px
  '3': 9,     // 12px
  '4': 12,    // 16px
  '5': 15,    // 20px
  '6': 18,    // 24px
  '8': 24,    // 32px
  '10': 30,   // 40px
  '12': 36,   // 48px
  '16': 48,   // 64px
};

export const FONT_SIZE = {
  'xs': 9,      // 12px
  'sm': 10.5,   // 14px
  'base': 12,   // 16px
  'lg': 13.5,   // 18px
  'xl': 15,     // 20px
  '2xl': 18,    // 24px
  '3xl': 22.5,  // 30px
  '4xl': 27,    // 36px
  '5xl': 36,    // 48px
};

// Common Styles
export const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    fontSize: FONT_SIZE.base,
    paddingTop: 40,    // Standard A4 margin
    paddingBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
});

// --- Icons ---
type IconProps = {
    size?: number;
    color?: string;
    style?: any;
};

export const MailIconPdf = ({ size = 12, color = COLORS.slate500, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
     <Rect width="20" height="16" x="2" y="4" rx="2" stroke={color} strokeWidth={2} fill="none" />
     <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
);

export const PhoneIconPdf = ({ size = 12, color = COLORS.slate500, style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

export const MapPinIconPdf = ({ size = 12, color = COLORS.slate500, style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke={color} strokeWidth={2} fill="none" />
        <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

export const GlobeIconPdf = ({ size = 12, color = COLORS.slate500, style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M2 12h20" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

export const LinkedinIconPdf = ({ size = 12, color = COLORS.slate500, style }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke={color} strokeWidth={2} fill="none" />
        <Rect width="4" height="12" x="2" y="9" stroke={color} strokeWidth={2} fill="none" />
        <Circle cx="4" cy="4" r="2" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

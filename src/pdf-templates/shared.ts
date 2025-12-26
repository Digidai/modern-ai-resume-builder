import { StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '../types';

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
// This ensures visual size parity with the web rendering.
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
    fontFamily: 'Helvetica',
    fontSize: FONT_SIZE.base,
    paddingTop: 40,    // Standard A4 margin
    paddingBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
});
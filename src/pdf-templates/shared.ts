import { StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '../types';

export type PdfTemplateProps = {
  data: ResumeData;
};

// Common Colors matching Tailwind config
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

export const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 40,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
  // Text Utilities
  textBold: {
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
  },
  textItalic: {
    fontFamily: 'Helvetica-Oblique',
    fontStyle: 'italic',
  },
  textUpper: {
    textTransform: 'uppercase',
  },
  
  // Flex Utilities
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  col: {
    flexDirection: 'column',
  },
});

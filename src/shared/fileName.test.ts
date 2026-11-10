import { describe, expect, it } from 'vitest';
import { resumeFileName } from './fileName';

describe('resumeFileName', () => {
  it('names the file after the person, keeping capitals and any script', () => {
    expect(resumeFileName('  Pat   Lee ', 'pdf')).toBe('Pat_Lee_Resume.pdf');
    expect(resumeFileName('José García-López', 'docx')).toBe('José_García-López_Resume.docx');
    expect(resumeFileName('李明', 'pdf')).toBe('李明_Resume.pdf');
    expect(resumeFileName('प्रिया शर्मा', 'pdf')).toBe('प्रिया_शर्मा_Resume.pdf');
  });

  it('drops characters that break file names and falls back to "Resume"', () => {
    expect(resumeFileName('Pat "PL" Lee/Smith: CV?', 'tex')).toBe('Pat_PL_LeeSmith_CV_Resume.tex');
    expect(resumeFileName('   ', 'pdf')).toBe('Resume.pdf');
  });
});

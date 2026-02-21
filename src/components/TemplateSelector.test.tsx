import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TemplateSelector from './TemplateSelector';
import { INITIAL_RESUME_DATA } from '../types';
import { ResumeProvider } from '../contexts/ResumeContext';
import { ToastProvider } from './Toast';
import { ThemeProvider } from '../contexts/ThemeContext';

vi.mock('./ResumePreview', () => ({
  default: ({ data }: { data: { fullName: string } }) => <div>{data.fullName}</div>,
}));

vi.mock('./ScaledResumePreview', () => ({
  ScaledResumePreview: ({ data }: { data: { fullName: string } }) => <div>{data.fullName}</div>,
}));

const renderTemplateSelector = () => {
  const onUseTemplate = vi.fn();

  render(
    <MemoryRouter
      initialEntries={['/resume_tmpl/software-engineer']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeProvider>
        <ToastProvider>
          <ResumeProvider>
            <Routes>
              <Route
                path="/resume_tmpl/:jobTitle"
                element={<TemplateSelector onUseTemplate={onUseTemplate} />}
              />
            </Routes>
          </ResumeProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

  return { onUseTemplate };
};

describe('TemplateSelector', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses current resume template and user data as preview baseline', async () => {
    const seeded = {
      ...INITIAL_RESUME_DATA,
      templateId: 'sidebar',
      fullName: 'Pat User',
      title: 'Staff Designer',
    };

    localStorage.setItem('resumeData', JSON.stringify(seeded));

    renderTemplateSelector();

    expect(await screen.findByText(/Template: Sidebar/i)).toBeInTheDocument();
    const previewNameMatches = await screen.findAllByText('Pat User');
    expect(previewNameMatches.length).toBeGreaterThan(0);
  });
});

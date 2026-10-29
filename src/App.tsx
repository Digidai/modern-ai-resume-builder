import { Routes, Route, useLocation, useNavigate, useNavigationType } from 'react-router';
import { ResumeProvider, useResume } from './contexts/ResumeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { HomeView, EditorView, JobTitles, TemplateSelector, TemplatesView, TemplateDetailView, NotFoundView, RenderView, AgentsView } from './routes';
import { lazy, Suspense, useEffect } from 'react';

// Dev-only template gallery; `import.meta.env.DEV` is false in production builds, so it is tree-shaken.
const DevTemplateGallery = import.meta.env.DEV ? lazy(() => import('./dev/TemplateGallery')) : null;
const DevFitCheck = import.meta.env.DEV ? lazy(() => import('./dev/FitCheck')) : null;

/** New pages start at the top; `#hash` links scroll to their target once it has rendered. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    // Back/forward keeps the browser's own scroll restoration.
    if (navigationType === 'POP' && !hash) return;
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    let frame = 0;
    let tries = 0;
    const scrollToHash = () => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) target.scrollIntoView();
      else if (tries++ < 60) frame = requestAnimationFrame(scrollToHash);
    };
    scrollToHash();
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, navigationType]);
  return null;
}

function AppRoutes() {
  const navigate = useNavigate();
  const { setResumeData } = useResume();

  const handleUseTemplate = (jobTitle: string, templateId: string) => {
    setResumeData(prev => ({
      ...prev,
      // Keep the user's own title; only fill it in when it's empty.
      title: prev.title.trim() ? prev.title : jobTitle,
      templateId: templateId
    }));
    navigate('/editor');
  };

  return (
    <>
    <ScrollManager />
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/directory" element={<JobTitles />} />
      <Route path="/resume_tmpl/:jobTitle" element={<TemplateSelector onUseTemplate={handleUseTemplate} />} />
      <Route path="/templates" element={<TemplatesView />} />
      <Route path="/templates/:templateId" element={<TemplateDetailView />} />
      <Route path="/editor" element={<EditorView />} />
      <Route path="/agents" element={<AgentsView />} />
      <Route path="/render" element={<RenderView />} />
      {DevTemplateGallery && (
        <Route path="/dev/templates" element={<DevTemplateGallery />} />
      )}
      {DevFitCheck && (
        <Route path="/dev/fit" element={<DevFitCheck />} />
      )}
      <Route path="*" element={<NotFoundView />} />
    </Routes>
    </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ResumeProvider>
          <AppRoutes />
        </ResumeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

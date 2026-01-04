import { Routes, Route, useNavigate } from 'react-router-dom';
import { ResumeProvider, useResume } from './contexts/ResumeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { HomeView, EditorView } from './views';
import JobTitles from './components/JobTitles';
import TemplateSelector from './components/TemplateSelector';

function AppRoutes() {
  const navigate = useNavigate();
  const { setResumeData } = useResume();

  const handleUseTemplate = (jobTitle: string, templateId: string) => {
    setResumeData(prev => ({
      ...prev,
      title: jobTitle,
      templateId: templateId
    }));
    navigate('/editor');
  };

  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/directory" element={<JobTitles onBack={() => navigate('/')} />} />
      <Route path="/resume_tmpl/:jobTitle" element={<TemplateSelector onUseTemplate={handleUseTemplate} />} />
      <Route path="/editor" element={<EditorView />} />
    </Routes>
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

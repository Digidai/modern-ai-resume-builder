import React, { useState } from 'react';
import { ResumeData, INITIAL_RESUME_DATA } from './types';
import ResumePreview from './components/ResumePreview';
import ResumeEditor from './components/ResumeEditor';
import { DownloadIcon, EditIcon, CheckIcon, ArrowLeftIcon, SaveIcon } from './components/Icons';
import { Button } from './components/Button';
import ThemeToggle from './components/ThemeToggle';

function App() {
  // Initialize state from localStorage or default
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

  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewModeMobile, setIsPreviewModeMobile] = useState(false);

  // Auto-save to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('resumeData', JSON.stringify(resumeData));
    } catch (e) {
      console.error("Failed to save resume data", e);
    }
  }, [resumeData]);

  // Robust PDF generation triggers the browser print dialog
  const handleDownloadPdf = () => {
    // Dynamically set title for the file name
    const originalTitle = document.title;
    document.title = `${resumeData.fullName.trim() || 'Resume'} - ModernCV`;
    window.print();
    // Restore title (optional, browser handling varies on when this executes)
    setTimeout(() => { document.title = originalTitle; }, 500);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data to defaults? This cannot be undone.")) {
      setResumeData(INITIAL_RESUME_DATA);
      localStorage.removeItem('resumeData');
    }
  };

  // Allow users to save their data to a JSON file
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${(resumeData.fullName || 'resume').replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- View: Editor Mode ---
  if (isEditing) {
    return (
      <div className="h-screen flex flex-col md:flex-row bg-slate-100 font-sans print:bg-white overflow-hidden">
        {/* Sidebar / Editor */}
        <aside className={`
          fixed inset-0 z-20 md:static md:w-[450px] lg:w-[500px] flex-shrink-0 bg-slate-100 flex flex-col h-full border-r border-slate-200
          transition-transform duration-300 ease-in-out
          ${isPreviewModeMobile ? 'translate-y-full md:translate-y-0' : 'translate-y-0'}
          print:hidden
        `}>
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="flex-shrink-0 flex justify-between items-center p-4 bg-slate-100 z-10">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="icon"
                  className="-ml-2"
                  title="Back to Preview"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Edit Resume
                </h1>
              </div>

              <div className="flex gap-2 items-center">
                <Button
                  onClick={handleExportJson}
                  variant="icon"
                  title="Save Data (JSON)"
                >
                  <SaveIcon className="w-5 h-5" />
                </Button>
                <div className="md:hidden">
                  <Button
                    onClick={() => setIsPreviewModeMobile(true)}
                    variant="primary"
                    size="sm"
                  >
                    Preview
                  </Button>
                </div>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="success"
                  size="sm"
                  className="hidden md:flex"
                  leftIcon={<CheckIcon className="w-4 h-4" />}
                >
                  Done
                </Button>
              </div>
            </header>

            {/* Editor Content - independent scroll */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              <ResumeEditor data={resumeData} onChange={setResumeData} />
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 p-4 bg-slate-100 border-t border-slate-200 z-10 flex flex-col gap-2">
              <Button
                onClick={handleDownloadPdf}
                variant="secondary"
                className="w-full bg-slate-800 text-white hover:bg-slate-900 border-none"
                leftIcon={<DownloadIcon className="w-4 h-4" />}
              >
                Download PDF
              </Button>
              <div className="flex justify-center">
                <Button onClick={handleResetData} variant="danger-ghost" size="sm">
                  Reset All Data
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Preview Area */}
        <main className={`
          flex-1 h-full bg-slate-200/50 overflow-y-auto custom-scrollbar relative
          transition-all duration-300
          ${isPreviewModeMobile ? 'z-30 inset-0 fixed' : ''}
        `}>
          {isPreviewModeMobile && (
            <div className="fixed top-4 right-4 z-50 md:hidden">
              <Button onClick={() => setIsPreviewModeMobile(false)} variant="secondary" size="sm">Close Preview</Button>
            </div>
          )}

          <div className="min-h-full p-4 md:p-8 lg:p-12 flex justify-center items-start">
            <div className="w-full max-w-[210mm] shadow-2xl print:shadow-none bg-white origin-top transition-transform duration-200">
              <ResumePreview data={resumeData} />
            </div>
          </div>

          {/* Floating Actions for Desktop */}
          <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
            <Button
              onClick={handleDownloadPdf}
              variant="primary"
              className="rounded-full shadow-xl p-4 h-auto"
              title="Download PDF"
            >
              <DownloadIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Preview Toggle */}
          <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-transform ${isPreviewModeMobile ? 'translate-y-0' : 'translate-y-20'}`}>
            <Button
              onClick={() => setIsPreviewModeMobile(false)}
              className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl h-auto"
            >
              Continue Editing
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // --- View: Home / Formal Preview ---
  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 font-sans print:bg-white flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 md:px-12 print:hidden sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-serif italic text-lg">M</span>
            Modern<span className="text-indigo-600 dark:text-indigo-400">CV</span>
          </h1>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button
              onClick={handleDownloadPdf}
              variant="ghost"
              className="hidden md:flex"
              leftIcon={<DownloadIcon className="w-4 h-4" />}
            >
              Download PDF
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
              variant="primary"
              leftIcon={<EditIcon className="w-4 h-4" />}
            >
              Edit Resume
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 print:p-0">
        <div className="max-w-[21cm] mx-auto shadow-2xl print:shadow-none transition-transform duration-500 ease-out animate-in fade-in slide-in-from-bottom-4">
          <ResumePreview data={resumeData} />
        </div>

        <div className="h-24 print:hidden"></div> {/* Spacer for mobile fab */}
      </main>

      {/* Mobile Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 md:hidden print:hidden flex gap-3">
        <Button
          onClick={handleDownloadPdf}
          variant="secondary"
          className="rounded-full shadow-xl"
          leftIcon={<DownloadIcon className="w-5 h-5" />}
        >
        </Button>
        <Button
          onClick={() => setIsEditing(true)}
          variant="primary"
          className="rounded-full shadow-xl"
          leftIcon={<EditIcon className="w-4 h-4" />}
        >
          Edit Resume
        </Button>
      </div>

    </div>
  );
}

export default App;
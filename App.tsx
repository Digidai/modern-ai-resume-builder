import React, { useState } from 'react';
import { ResumeData, INITIAL_RESUME_DATA } from './types';
import ResumePreview from './components/ResumePreview';
import ResumeEditor from './components/ResumeEditor';
import { DownloadIcon, EditIcon, CheckIcon, ArrowLeftIcon, SaveIcon } from './components/Icons';

function App() {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewModeMobile, setIsPreviewModeMobile] = useState(false);

  // Robust PDF generation triggers the browser print dialog
  const handleDownloadPdf = () => {
    // Dynamically set title for the file name
    const originalTitle = document.title;
    document.title = `${resumeData.fullName.trim() || 'Resume'} - ModernCV`;
    window.print();
    // Restore title (optional, browser handling varies on when this executes)
    setTimeout(() => { document.title = originalTitle; }, 500);
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
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 font-sans print:bg-white">
        {/* Sidebar / Editor */}
        <aside className={`
          fixed inset-0 z-20 md:static md:w-[450px] lg:w-[500px] flex-shrink-0 p-4 bg-slate-100
          transition-transform duration-300 ease-in-out
          ${isPreviewModeMobile ? 'translate-y-full md:translate-y-0' : 'translate-y-0'}
          print:hidden
        `}>
          <div className="h-full flex flex-col gap-4">
            <header className="flex justify-between items-center px-2">
              <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Back to Preview"
                 >
                    <ArrowLeftIcon className="w-5 h-5" />
                 </button>
                 <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   Edit Resume
                 </h1>
              </div>
              
              <div className="flex gap-2 items-center">
                 <button 
                    onClick={handleExportJson}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Save Data (JSON)"
                 >
                    <SaveIcon className="w-5 h-5" />
                 </button>
                 <div className="md:hidden">
                    <button 
                      onClick={() => setIsPreviewModeMobile(true)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-sm"
                    >
                      Preview
                    </button>
                </div>
                 <button 
                    onClick={() => setIsEditing(false)}
                    className="hidden md:flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
                  >
                    <CheckIcon className="w-4 h-4" /> Done
                  </button>
              </div>
            </header>

            <ResumeEditor data={resumeData} onChange={setResumeData} />
            
            <div className="flex flex-col gap-2 mt-auto">
               <button 
                  onClick={handleDownloadPdf}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-lg font-medium shadow-sm hover:bg-slate-900 transition-colors"
               >
                  <DownloadIcon className="w-4 h-4" /> Download PDF
               </button>
            </div>
          </div>
        </aside>

        {/* Main Content / Preview */}
        <main className="flex-1 relative overflow-y-auto h-screen custom-scrollbar print:h-auto print:overflow-visible bg-slate-200 md:bg-slate-100 p-4 md:p-8 print:p-0">
          <div className="max-w-[21cm] mx-auto print:my-0 print:mx-0 print:w-full">
             <ResumePreview data={resumeData} />
          </div>

          {/* Floating Actions for Desktop */}
          <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
              <button 
                  onClick={handleDownloadPdf}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-105 flex items-center gap-2 font-medium"
                  title="Download PDF"
              >
                  <DownloadIcon className="w-5 h-5" />
              </button>
          </div>

           {/* Mobile Preview Toggle */}
          <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-transform ${isPreviewModeMobile ? 'translate-y-0' : 'translate-y-20'}`}>
              <button 
                  onClick={() => setIsPreviewModeMobile(false)}
                  className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl font-medium"
              >
                  Continue Editing
              </button>
          </div>
        </main>
      </div>
    );
  }

  // --- View: Home / Formal Preview ---
  return (
    <div className="min-h-screen bg-slate-200 font-sans print:bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 print:hidden sticky top-0 z-10">
         <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-serif italic text-lg">M</span>
              Modern<span className="text-indigo-600">CV</span>
            </h1>
            <div className="flex gap-3">
               <button 
                onClick={handleDownloadPdf}
                className="hidden md:flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <DownloadIcon className="w-4 h-4" /> Download PDF
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <EditIcon className="w-4 h-4" /> Edit Resume
              </button>
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
           <button 
              onClick={handleDownloadPdf}
              className="bg-white text-slate-800 px-4 py-3 rounded-full shadow-xl border border-slate-200 font-medium flex items-center gap-2"
          >
              <DownloadIcon className="w-5 h-5" />
          </button>
          <button 
              onClick={() => setIsEditing(true)}
              className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2"
          >
              <EditIcon className="w-4 h-4" /> Edit Resume
          </button>
      </div>

    </div>
  );
}

export default App;
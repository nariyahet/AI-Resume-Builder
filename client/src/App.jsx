import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import Navbar from './components/Navbar';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import ATSScoreModal from './components/ATSScoreModal';
import AuthModal from './components/AuthModal';
import AiKeyModal from './components/AiKeyModal';
import { sampleResume, emptyResume } from './data/sampleResume';
import axiosClient from './api/axiosClient';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();
  
  // Load saved resume from localStorage or default to sample
  const [resume, setResume] = useState(() => {
    const saved = localStorage.getItem('ai_resume_current_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return sampleResume;
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAiKeyModal, setShowAiKeyModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Auto-save draft in localStorage
  useEffect(() => {
    localStorage.setItem('ai_resume_current_draft', JSON.stringify(resume));
  }, [resume]);

  // Load sample data
  const handleLoadSample = () => {
    if (window.confirm('Load demo profile? This will populate the editor with a complete developer resume.')) {
      setResume(sampleResume);
    }
  };

  // Reset to empty
  const handleReset = () => {
    if (window.confirm('Clear all resume fields?')) {
      setResume(emptyResume);
    }
  };

  // Save to MySQL backend
  const handleSaveToBackend = async () => {
    setSaveStatus('Saving to Database...');
    try {
      const res = await axiosClient.post('/resumes', resume);
      if (res.data?.success) {
        setSaveStatus('✅ Saved in MySQL!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('⚠️ Saved locally (MySQL check pending)');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.warn('Backend save notice:', err.message);
      setSaveStatus('✅ Saved locally in browser storage');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // 1-Click High-Quality PDF Export
  const handleDownloadPDF = async () => {
    const element = document.getElementById('resume-print-area');
    if (!element) return;

    setIsDownloading(true);

    try {
      // Configuration for crisp A4 PDF
      const opt = {
        margin: 0,
        filename: `${(resume.personal_info?.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('html2pdf error, using print fallback:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="app-root">
      {/* Navbar Header */}
      <Navbar
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        onOpenATS={() => setShowAtsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAiKey={() => setShowAiKeyModal(true)}
        onDownloadPDF={handleDownloadPDF}
        isDownloading={isDownloading}
        atsScore={resume.ats_score}
      />

      {/* Save indicator banner */}
      {saveStatus && (
        <div style={{
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          textAlign: 'center',
          padding: '0.35rem',
          fontSize: '0.785rem',
          color: '#38bdf8'
        }}>
          {saveStatus}
        </div>
      )}

      {/* Split-Screen Workspace */}
      <main className="workspace-container">
        {/* Left Side: Form Editor & AI Magic */}
        <ResumeForm 
          resume={resume} 
          setResume={setResume} 
        />

        {/* Right Side: Live A4 Resume Preview */}
        <ResumePreview 
          resume={resume} 
          setResume={setResume} 
        />
      </main>

      {/* Modals */}
      <ATSScoreModal 
        isOpen={showAtsModal} 
        onClose={() => setShowAtsModal(false)} 
        resume={resume} 
        setResume={setResume}
      />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      <AiKeyModal 
        isOpen={showAiKeyModal} 
        onClose={() => setShowAiKeyModal(false)} 
      />
    </div>
  );
}

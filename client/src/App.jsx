import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import Navbar from './components/Navbar';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import ATSScoreModal from './components/ATSScoreModal';
import AuthModal from './components/AuthModal';
import AiKeyModal from './components/AiKeyModal';
import Dashboard from './components/Dashboard';
import JDMatcherModal from './components/JDMatcherModal';
import CoverLetterModal from './components/CoverLetterModal';
import InterviewPrepModal from './components/InterviewPrepModal';
import ResumeParserModal from './components/ResumeParserModal';
import ShareModal from './components/ShareModal';
import PricingModal from './components/PricingModal';
import { sampleResume, emptyResume } from './data/sampleResume';
import axiosClient from './api/axiosClient';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();
  
  // View mode: 'editor' or 'dashboard'
  const [currentView, setCurrentView] = useState('editor');

  // Resume state
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

  // UI Modal States
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAiKeyModal, setShowAiKeyModal] = useState(false);
  const [showJDMatcher, setShowJDMatcher] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [showParser, setShowParser] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareResumeId, setShareResumeId] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Check URL params for public web resume view (?view=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    if (viewId) {
      async function loadPublicResume() {
        try {
          const res = await axiosClient.get(`/resumes/public/${viewId}`);
          if (res.data?.success && res.data.resume) {
            setResume(res.data.resume);
          }
        } catch (err) {
          console.warn('Public view load failed, using local resume.');
        }
      }
      loadPublicResume();
    }
  }, []);

  // Auto-save draft in localStorage
  useEffect(() => {
    localStorage.setItem('ai_resume_current_draft', JSON.stringify(resume));
  }, [resume]);

  // Load sample data
  const handleLoadSample = () => {
    if (window.confirm('Load demo profile? This will populate the editor with a complete developer resume.')) {
      setResume(sampleResume);
      setCurrentView('editor');
    }
  };

  // Reset to empty
  const handleCreateNew = () => {
    setResume(emptyResume);
    setCurrentView('editor');
  };

  // Select resume from Dashboard
  const handleSelectResume = (selected) => {
    setResume(selected);
    setCurrentView('editor');
  };

  // Open share modal
  const handleOpenShare = (resumeId) => {
    setShareResumeId(resumeId || resume.id);
    setShowShare(true);
  };

  // Successful parse from old resume file
  const handleParsedSuccess = (parsedData) => {
    setResume(prev => ({
      ...prev,
      ...parsedData,
      template_id: prev.template_id,
      theme_color: prev.theme_color
    }));
    setSaveStatus('🎉 Resume parsed and imported successfully!');
    setTimeout(() => setSaveStatus(''), 4000);
    setCurrentView('editor');
  };

  // 1-Click High-Quality PDF Export
  const handleDownloadPDF = async () => {
    const element = document.getElementById('resume-print-area');
    if (!element) return;

    setIsDownloading(true);

    try {
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
        currentView={currentView}
        onToggleView={(view) => setCurrentView(view)}
        onLoadSample={handleLoadSample}
        onOpenATS={() => setShowAtsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAiKey={() => setShowAiKeyModal(true)}
        onOpenJDMatcher={() => setShowJDMatcher(true)}
        onOpenCoverLetter={() => setShowCoverLetter(true)}
        onOpenInterviewPrep={() => setShowInterviewPrep(true)}
        onOpenParser={() => setShowParser(true)}
        onOpenPricing={() => setShowPricing(true)}
        onDownloadPDF={handleDownloadPDF}
        isDownloading={isDownloading}
        atsScore={resume.ats_score}
      />

      {/* Save indicator banner */}
      {saveStatus && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.15)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
          textAlign: 'center',
          padding: '0.45rem',
          fontSize: '0.825rem',
          fontWeight: 600,
          color: '#38bdf8'
        }}>
          {saveStatus}
        </div>
      )}

      {/* VIEW 1: MY RESUMES DASHBOARD */}
      {currentView === 'dashboard' ? (
        <Dashboard
          onSelectResume={handleSelectResume}
          onCreateNew={handleCreateNew}
          onBackToEditor={() => setCurrentView('editor')}
          onOpenShare={handleOpenShare}
        />
      ) : (
        /* VIEW 2: SPLIT-SCREEN WORKSPACE */
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
      )}

      {/* MODALS */}
      <ATSScoreModal 
        isOpen={showAtsModal} 
        onClose={() => setShowAtsModal(false)} 
        resume={resume} 
        setResume={setResume}
      />

      <JDMatcherModal
        isOpen={showJDMatcher}
        onClose={() => setShowJDMatcher(false)}
        resume={resume}
        setResume={setResume}
      />

      <CoverLetterModal
        isOpen={showCoverLetter}
        onClose={() => setShowCoverLetter(false)}
        resume={resume}
      />

      <InterviewPrepModal
        isOpen={showInterviewPrep}
        onClose={() => setShowInterviewPrep(false)}
        resume={resume}
      />

      <ResumeParserModal
        isOpen={showParser}
        onClose={() => setShowParser(false)}
        onParsedSuccess={handleParsedSuccess}
      />

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        resumeId={shareResumeId || resume.id}
        resumeTitle={resume.title}
      />

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
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

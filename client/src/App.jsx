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
import CoverLetterManagerModal from './components/CoverLetterManagerModal';
import InterviewPrepModal from './components/InterviewPrepModal';
import InterviewPracticeModal from './components/InterviewPracticeModal';
import ResumeParserModal from './components/ResumeParserModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import JobTrackerModal from './components/JobTrackerModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import ShareModal from './components/ShareModal';
import PricingModal from './components/PricingModal';
import { sampleResume, emptyResume } from './data/sampleResume';
import axiosClient from './api/axiosClient';
import { useAuth } from './context/AuthContext';
import { exportResumeToDocx } from './utils/docxExport';
import { Edit3, Eye } from 'lucide-react';

export default function App() {
  const { user } = useAuth();
  
  // View mode: 'editor' or 'dashboard'
  const [currentView, setCurrentView] = useState('editor');

  // Mobile mode tab: 'editor' or 'preview'
  const [mobileTab, setMobileTab] = useState('editor');

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
  const [showCoverLetterManager, setShowCoverLetterManager] = useState(false);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [showInterviewPractice, setShowInterviewPractice] = useState(false);
  const [showParser, setShowParser] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAdminMetrics, setShowAdminMetrics] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // ☀️ / 🌙 Theme Mode ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ai_resume_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ai_resume_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

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
  const handleOpenShare = () => {
    setShowShare(true);
  };

  // Successful parse from old binary PDF/DOCX file
  const handleParsedSuccess = (parsedData) => {
    // 🔴 Save version history snapshot before replacing
    const snapshot = {
      id: `v-pre-import-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: 'Pre-Import Original Version',
      data: { ...resume }
    };

    setResume(prev => ({
      ...prev,
      ...parsedData,
      template_id: prev.template_id,
      theme_color: prev.theme_color,
      version_history: [snapshot, ...(prev.version_history || [])]
    }));
    setSaveStatus('🎉 Real Document parsed and imported successfully!');
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

  // Real Editable Word (.docx) Export
  const handleDownloadDocx = async () => {
    try {
      setIsDownloading(true);
      await exportResumeToDocx(resume);
      setSaveStatus('✓ Word (.docx) resume downloaded successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Docx export error:', err);
      alert('Failed to generate Word document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Clean Plain Text (.txt) Export
  const handleDownloadTxt = () => {
    const { personal_info = {}, target_role = '', summary = '', experience = [], skills = [], education = [], projects = [] } = resume;
    let content = `${personal_info.fullName || 'RESUME'}\n`;
    content += `${target_role || ''}\n`;
    content += `${personal_info.email || ''} | ${personal_info.phone || ''} | ${personal_info.location || ''}\n\n`;

    if (summary) {
      content += `PROFESSIONAL SUMMARY\n${summary}\n\n`;
    }
    if (experience && experience.length > 0) {
      content += `WORK EXPERIENCE\n`;
      experience.forEach(exp => {
        content += `${exp.role || ''} - ${exp.company || ''} (${exp.startDate || ''} - ${exp.endDate || ''})\n`;
        content += `${exp.description || ''}\n\n`;
      });
    }
    if (skills && skills.length > 0) {
      content += `SKILLS\n${skills.join(', ')}\n\n`;
    }
    if (education && education.length > 0) {
      content += `EDUCATION\n`;
      education.forEach(edu => {
        content += `${edu.degree || ''} - ${edu.institution || ''} (${edu.year || ''})\n`;
      });
      content += '\n';
    }
    if (projects && projects.length > 0) {
      content += `PROJECTS\n`;
      projects.forEach(p => {
        content += `${p.name || ''}: ${p.description || ''}\n`;
      });
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(personal_info.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaveStatus('✓ Plain text (.txt) resume downloaded!');
    setTimeout(() => setSaveStatus(''), 3000);
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
        onOpenCoverLetterManager={() => setShowCoverLetterManager(true)}
        onOpenInterviewPrep={() => setShowInterviewPrep(true)}
        onOpenInterviewPractice={() => setShowInterviewPractice(true)}
        onOpenParser={() => setShowParser(true)}
        onOpenPricing={() => setShowPricing(true)}
        onOpenTracker={() => setShowTracker(true)}
        onOpenVersionHistory={() => setShowVersionHistory(true)}
        onOpenAccountSettings={() => setShowAccountSettings(true)}
        onOpenAdminMetrics={() => setShowAdminMetrics(true)}
        onDownloadPDF={handleDownloadPDF}
        onDownloadDocx={handleDownloadDocx}
        onDownloadTxt={handleDownloadTxt}
        isDownloading={isDownloading}
        atsScore={resume.ats_score}
        theme={theme}
        onToggleTheme={toggleTheme}
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
        <div className="workspace-wrapper">
          {/* Mobile Screen Switcher (only displayed on <= 900px screens) */}
          <div className="mobile-view-bar">
            <button 
              type="button"
              className={`mobile-tab-btn ${mobileTab === 'editor' ? 'active' : ''}`}
              onClick={() => setMobileTab('editor')}
            >
              <Edit3 size={15} />
              <span>1. Edit Form</span>
            </button>
            <button 
              type="button"
              className={`mobile-tab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
              onClick={() => setMobileTab('preview')}
            >
              <Eye size={15} />
              <span>2. View Resume {resume.ats_score ? `(${resume.ats_score}% ATS)` : ''}</span>
            </button>
          </div>

          <main className={`workspace-container mobile-tab-${mobileTab}`}>
            {/* Left Side: Form Editor & AI Magic */}
            <div className="workspace-pane pane-editor">
              <ResumeForm 
                resume={resume} 
                setResume={setResume} 
                onSwitchToPreview={() => setMobileTab('preview')}
              />
            </div>

            {/* Right Side: Live A4 Resume Preview */}
            <div className="workspace-pane pane-preview">
              <ResumePreview 
                resume={resume} 
                setResume={setResume} 
              />
            </div>
          </main>
        </div>
      )}

      {/* 🔴 P1 ADVANCED ATS MODAL */}
      <ATSScoreModal 
        isOpen={showAtsModal} 
        onClose={() => setShowAtsModal(false)} 
        resume={resume} 
        setResume={setResume}
      />

      {/* 🔴 P1 SAFE JD MATCHER & AUTO-TAILOR */}
      <JDMatcherModal
        isOpen={showJDMatcher}
        onClose={() => setShowJDMatcher(false)}
        resume={resume}
        setResume={setResume}
      />

      {/* 🔴 P1 VERSION HISTORY & RESTORE */}
      <VersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        resume={resume}
        setResume={setResume}
      />

      {/* 🔴 P1 REAL PDF/DOCX BINARY PARSER */}
      <ResumeParserModal
        isOpen={showParser}
        onClose={() => setShowParser(false)}
        onParsedSuccess={handleParsedSuccess}
      />

      {/* 🟠 P2 JOB APPLICATION TRACKER */}
      <JobTrackerModal
        isOpen={showTracker}
        onClose={() => setShowTracker(false)}
      />

      {/* 🟠 P2 INTERVIEW PRACTICE MODE */}
      <InterviewPracticeModal
        isOpen={showInterviewPractice}
        onClose={() => setShowInterviewPractice(false)}
        resume={resume}
      />

      {/* 🟠 P2 COVER LETTER GENERATOR & LIBRARY */}
      <CoverLetterModal
        isOpen={showCoverLetter}
        onClose={() => setShowCoverLetter(false)}
        resume={resume}
      />

      <CoverLetterManagerModal
        isOpen={showCoverLetterManager}
        onClose={() => setShowCoverLetterManager(false)}
        onOpenGenerator={() => setShowCoverLetter(true)}
      />

      {/* 🟠 P2 RESUME ANALYTICS & PUBLIC LINK CONTROLS */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        resume={resume}
        setResume={setResume}
      />

      {/* 🟡 P3 REAL FREE/PRO & RAZORPAY + STRIPE */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onUpgradedSuccess={() => {
          setSaveStatus('🎉 Pro Plan Activated! All limits removed.');
          setTimeout(() => setSaveStatus(''), 4000);
        }}
      />

      {/* 🟡 P3 ACCOUNT SETTINGS & BILLING HISTORY */}
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />

      {/* 🟡 P3 ADMIN DASHBOARD */}
      <AdminDashboardModal
        isOpen={showAdminMetrics}
        onClose={() => setShowAdminMetrics(false)}
      />

      <InterviewPrepModal
        isOpen={showInterviewPrep}
        onClose={() => setShowInterviewPrep(false)}
        resume={resume}
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

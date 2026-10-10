import React, { useState, useEffect, useRef } from 'react';
import { exportResumeToPdf } from './utils/pdfExport';
import PublicResumeView from './components/PublicResumeView';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
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
import { getCanonicalPersistedResumePayload } from './utils/resumeCanonical';
import { Edit3, Eye } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();

  const isPublicShare = typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('view'));

  // Public share resume states
  const [publicResume, setPublicResume] = useState(null);
  const [publicLoading, setPublicLoading] = useState(() => isPublicShare);
  const [publicError, setPublicError] = useState('');

  // View mode: 'editor' or 'dashboard' (root URL defaults to dashboard unless public share link)
  const [currentView, setCurrentView] = useState(() => (isPublicShare ? 'editor' : 'dashboard'));

  // Mobile mode tab: 'editor' or 'preview'
  const [mobileTab, setMobileTab] = useState('editor');

  // Resume state
  const [resume, setResume] = useState(() => {
    const saved = localStorage.getItem('ai_resume_current_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lastSavedPayloadRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const deletedResumeIdsRef = useRef(new Set());
  const prevUserRef = useRef(user);
  const hasInitializedAuthRef = useRef(false);

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

  // Synchronize initial root view with auth state after loading, and handle login/logout transitions
  useEffect(() => {
    if (loading) return;

    // Initial mount synchronization once auth verification completes
    if (!hasInitializedAuthRef.current) {
      hasInitializedAuthRef.current = true;
      if (!isPublicShare) {
        if (!user) {
          setCurrentView('dashboard');
          setShowAuthModal(true);
        } else {
          setCurrentView('dashboard');
          setShowAuthModal(false);
        }
      }
      prevUserRef.current = user;
      return;
    }

    // Dynamic state transition: Logged out -> Logged in (successful login)
    if (!prevUserRef.current && user) {
      if (!isPublicShare) {
        setCurrentView('dashboard');
      }
      setShowAuthModal(false);
    }

    // Dynamic state transition: Logged in -> Logged out (logout)
    if (prevUserRef.current && !user) {
      setResume({ ...emptyResume, id: null });
      localStorage.removeItem('ai_resume_current_draft');
      setSaveStatus('');
      lastSavedPayloadRef.current = null;
      deletedResumeIdsRef.current.clear();
      setCurrentView('dashboard');
      setShowAuthModal(true);
    }

    prevUserRef.current = user;
  }, [loading, user, isPublicShare]);

  // If user is authenticated and resume has an ID, make server data authoritative
  useEffect(() => {
    if (user && resume.id) {
      if (deletedResumeIdsRef.current.has(resume.id)) {
        return;
      }
      axiosClient.get(`/resumes/${resume.id}`)
        .then(res => {
          if (res.data?.success && res.data.resume) {
            setResume(res.data.resume);
            lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(res.data.resume);
          }
        })
        .catch(err => {
          if (err.response?.status === 404) {
            console.warn('Active resume was deleted on server. Resetting to clean draft.');
            deletedResumeIdsRef.current.add(resume.id);
            const cleanResume = { ...emptyResume, id: null, title: 'My Resume' };
            setResume(cleanResume);
            localStorage.removeItem('ai_resume_current_draft');
            lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(cleanResume);
            setSaveStatus('');
          } else {
            console.warn('Authoritative resume fetch failed, preserving active draft:', err.message);
          }
        });
    }
  }, [user, resume.id]);

  // Check URL params for public web resume view (?view=ID)
  useEffect(() => {
    if (!isPublicShare) return;
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    if (viewId) {
      let isMounted = true;
      setPublicLoading(true);
      setPublicError('');
      axiosClient.get(`/resumes/public/${viewId}`)
        .then(res => {
          if (!isMounted) return;
          if (res.data?.success && res.data.resume) {
            setPublicResume(res.data.resume);
          } else {
            setPublicError(res.data?.message || 'Resume not found or is set to private.');
          }
        })
        .catch(err => {
          if (!isMounted) return;
          setPublicError(err.response?.data?.message || 'Resume not found or is set to private.');
        })
        .finally(() => {
          if (isMounted) setPublicLoading(false);
        });

      return () => { isMounted = false; };
    }
  }, [isPublicShare]);

  // Cancel any pending autosave debounce when leaving the editor
  useEffect(() => {
    if (currentView !== 'editor') {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    }
  }, [currentView]);

  // Always auto-save draft in localStorage as client recovery fallback (disabled for public links)
  useEffect(() => {
    if (isPublicShare) return;
    localStorage.setItem('ai_resume_current_draft', JSON.stringify(resume));
  }, [resume, isPublicShare]);

  // Real Debounced Cloud Autosave for authenticated users
  useEffect(() => {
    if (!user || currentView !== 'editor') {
      return;
    }

    if (!resume || typeof resume !== 'object' || !resume.title) {
      return;
    }

    if (resume.id && deletedResumeIdsRef.current.has(resume.id)) {
      return;
    }

    const payload = getCanonicalPersistedResumePayload(resume);

    // Initial mount / user session load synchronization: do not trigger autosave
    if (lastSavedPayloadRef.current === null) {
      lastSavedPayloadRef.current = payload;
      return;
    }

    if (payload === lastSavedPayloadRef.current) {
      return;
    }

    // Meaningful state while awaiting debounce
    setSaveStatus('Saving...');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      // Re-verify conditions right before sending request
      if (
        !user ||
        currentView !== 'editor' ||
        (resume.id && deletedResumeIdsRef.current.has(resume.id))
      ) {
        setSaveStatus(prev => prev === 'Saving...' ? '' : prev);
        return;
      }

      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const payloadResume = { ...resume };

      try {
        const res = await axiosClient.post('/resumes', payloadResume);

        // Check race condition: was this resume deleted while request was in-flight?
        if (
          (payloadResume.id && deletedResumeIdsRef.current.has(payloadResume.id)) ||
          (res.data?.resumeId && deletedResumeIdsRef.current.has(res.data.resumeId))
        ) {
          if (res.data?.resumeId && res.data.resumeId !== payloadResume.id) {
            try {
              await axiosClient.delete(`/resumes/${res.data.resumeId}`);
            } catch {
              // Ignore cleanup error
            }
          }
          setSaveStatus(prev => prev === 'Saving...' ? '' : prev);
          return;
        }

        if (res.data?.success) {
          const newId = res.data.resumeId || payloadResume.id;
          const updatedResume = { ...payloadResume, id: newId };
          lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(updatedResume);

          // Keep database ID for subsequent updates (avoids duplicates)
          if (!payloadResume.id && newId) {
            setResume(prev => {
              if (prev.id && deletedResumeIdsRef.current.has(prev.id)) {
                return prev;
              }
              return { ...prev, id: newId };
            });
          }

          setSaveStatus('Saved');
          setTimeout(() => {
            setSaveStatus(prev => prev === 'Saved' ? '' : prev);
          }, 2500);
        } else {
          setSaveStatus('Save failed');
        }
      } catch (err) {
        if (payloadResume.id && deletedResumeIdsRef.current.has(payloadResume.id)) {
          setSaveStatus(prev => prev === 'Saving...' ? '' : prev);
          return;
        }
        console.error('Autosave error:', err);
        setSaveStatus('Save failed');
      } finally {
        isSavingRef.current = false;
      }
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [resume, user, currentView]);

  // Handle resume deletion event from Dashboard
  const handleResumeDeleted = (deletedId) => {
    deletedResumeIdsRef.current.add(deletedId);

    // Cancel any pending autosave debounce
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    // Reset save status to neutral idle state
    setSaveStatus('');

    // If currently active resume was the deleted one, reset to clean state
    if (resume?.id === deletedId || deletedId === 'local-draft') {
      const cleanResume = { ...emptyResume, id: null, title: 'My Resume' };
      setResume(cleanResume);
      localStorage.removeItem('ai_resume_current_draft');
      lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(cleanResume);
    }
  };

  // Load sample data
  const handleLoadSample = () => {
    if (window.confirm('Load demo profile? This will populate the editor with a complete developer resume.')) {
      const demoResume = { ...sampleResume, id: null };
      setResume(demoResume);
      lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(demoResume);
      setCurrentView('editor');
      setSaveStatus('');
    }
  };

  // Reset to empty for genuinely new resume (avoids overwriting existing)
  const handleCreateNew = () => {
    const cleanResume = { ...emptyResume, id: null, title: 'My Resume' };
    setResume(cleanResume);
    lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(cleanResume);
    setCurrentView('editor');
    setSaveStatus('');
  };

  // Select resume from Dashboard
  const handleSelectResume = (selected) => {
    setResume(selected);
    lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(selected);
    setCurrentView('editor');
    setSaveStatus('');
  };

  // Open share modal
  const handleOpenShare = (resumeToShare) => {
    if (resumeToShare && typeof resumeToShare === 'object' && resumeToShare.id) {
      setResume(resumeToShare);
      lastSavedPayloadRef.current = getCanonicalPersistedResumePayload(resumeToShare);
    }
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

    setResume(prev => {
      // Build safe personal_info for fresh import:
      // Genuine extracted contact fields are set; missing fields fallback to existing/empty;
      // CRITICAL: Profile links (linkedin, github, website) must come ONLY from the newly parsed document
      // and NOT inherit stale demo links from the previous template/demo resume.
      const incomingPersonal = (parsedData.personal_info && typeof parsedData.personal_info === 'object')
        ? parsedData.personal_info
        : {};

      const cleanField = (val) => (typeof val === 'string' ? val.trim() : '');

      const mergedPersonalInfo = {
        fullName: cleanField(incomingPersonal.fullName) || cleanField(prev.personal_info?.fullName),
        email: cleanField(incomingPersonal.email) || cleanField(prev.personal_info?.email),
        phone: cleanField(incomingPersonal.phone) || cleanField(prev.personal_info?.phone),
        location: cleanField(incomingPersonal.location) || cleanField(prev.personal_info?.location),
        linkedin: cleanField(incomingPersonal.linkedin),
        github: cleanField(incomingPersonal.github),
        website: cleanField(incomingPersonal.website),
        profile_photo: prev.personal_info?.profile_photo || '',
        photo_shape: prev.personal_info?.photo_shape || 'circle'
      };

      return {
        ...prev,
        title: (parsedData.title && parsedData.title !== 'Imported Resume' && parsedData.title !== 'Extracted Resume')
          ? parsedData.title
          : (prev.title || 'My Resume'),
        target_role: (parsedData.target_role && parsedData.target_role.trim() && parsedData.target_role !== 'Professional')
          ? parsedData.target_role.trim()
          : (prev.target_role || ''),
        personal_info: mergedPersonalInfo,
        summary: (parsedData.summary && parsedData.summary.trim())
          ? parsedData.summary.trim()
          : (prev.summary || ''),
        skills: (Array.isArray(parsedData.skills) && parsedData.skills.length > 0)
          ? parsedData.skills
          : (prev.skills || []),
        experience: (Array.isArray(parsedData.experience) && parsedData.experience.length > 0)
          ? parsedData.experience
          : (prev.experience || []),
        education: (Array.isArray(parsedData.education) && parsedData.education.length > 0)
          ? parsedData.education
          : (prev.education || []),
        projects: (Array.isArray(parsedData.projects) && parsedData.projects.length > 0)
          ? parsedData.projects
          : (prev.projects || []),
        certifications: (Array.isArray(parsedData.certifications) && parsedData.certifications.length > 0)
          ? parsedData.certifications
          : (prev.certifications || []),
        // Strictly preserve custom sections and styling choices
        custom_sections: prev.custom_sections || [],
        template_id: prev.template_id,
        theme_color: prev.theme_color,
        page_style: prev.page_style,
        ats_score: prev.ats_score,
        ats_feedback: prev.ats_feedback,
        version_history: [snapshot, ...(prev.version_history || [])]
      };
    });

    setSaveStatus('🎉 Document parsed and imported successfully!');
    setTimeout(() => setSaveStatus(''), 4000);
    setCurrentView('editor');
  };

  // 1-Click High-Quality PDF Export (Guaranteed zero blank 2nd page)
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await exportResumeToPdf(resume, 'resume-print-area');
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
    const { personal_info = {}, target_role = '', summary = '', experience = [], skills = [], education = [], projects = [], certifications = [] } = resume;
    let content = `${personal_info.fullName || 'RESUME'}\n`;
    content += `${target_role || ''}\n`;
    const contactLine = [
      personal_info.email,
      personal_info.phone,
      personal_info.location,
      personal_info.website,
      personal_info.linkedin,
      personal_info.github
    ].filter(Boolean).join(' | ');
    content += `${contactLine}\n\n`;

    if (summary) {
      content += `PROFESSIONAL SUMMARY\n${summary}\n\n`;
    }
    if (experience && experience.length > 0) {
      content += `WORK EXPERIENCE\n`;
      experience.forEach(exp => {
        const expDates = exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate || '');
        const loc = exp.location ? ` (${exp.location})` : '';
        content += `${exp.role || ''} - ${exp.company || ''}${loc}${expDates ? ` (${expDates})` : ''}\n`;
        content += `${exp.description || ''}\n\n`;
      });
    }
    if (skills && skills.length > 0) {
      content += `SKILLS\n${skills.join(', ')}\n\n`;
    }
    if (education && education.length > 0) {
      content += `EDUCATION\n`;
      education.forEach(edu => {
        content += `${edu.degree || ''} - ${edu.institution || ''} (${edu.year || ''})${edu.score ? ` [${edu.score}]` : ''}\n`;
      });
      content += '\n';
    }
    if (projects && projects.length > 0) {
      content += `PROJECTS\n`;
      projects.forEach(p => {
        content += `${p.name || ''}${p.link ? ` (${p.link})` : ''}: ${p.description || ''}\n`;
      });
      content += '\n';
    }
    if (certifications && certifications.length > 0) {
      content += `CERTIFICATIONS\n`;
      certifications.forEach(c => {
        content += `${c.name || ''}${c.issuer ? ` - ${c.issuer}` : ''}${c.year ? ` (${c.year})` : ''}\n`;
      });
      content += '\n';
    }
    if (resume.custom_sections && resume.custom_sections.length > 0) {
      resume.custom_sections.forEach(sec => {
        const title = sec.title || sec.heading;
        if (title && sec.content) {
          content += `${title.toUpperCase()}\n${sec.content}\n\n`;
        }
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

  const handleToggleView = (view) => {
    if (view === 'dashboard' || view === 'my-resumes') {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      setSaveStatus(prev => prev === 'Saving...' ? '' : prev);
    }
    setCurrentView(view);
  };

  if (loading && !isPublicShare) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main, #0b0f19)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: 'var(--primary, #3b82f6)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isPublicShare) {
    return (
      <PublicResumeView
        resume={publicResume}
        loading={publicLoading}
        error={publicError}
        onNavigateHome={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* 1. Left SaaS Sidebar (252px desktop, off-canvas mobile drawer) */}
      <Sidebar
        currentView={currentView}
        onToggleView={handleToggleView}
        atsScore={resume.ats_score}
        onOpenTracker={() => setShowTracker(true)}
        onOpenVersionHistory={() => setShowVersionHistory(true)}
        onOpenATS={() => setShowAtsModal(true)}
        onOpenJDMatcher={() => setShowJDMatcher(true)}
        onOpenCoverLetter={() => setShowCoverLetter(true)}
        onOpenInterviewPrep={() => setShowInterviewPrep(true)}
        onOpenPricing={() => setShowPricing(true)}
        onOpenShare={handleOpenShare}
        onLoadSample={handleLoadSample}
        onOpenAiKey={() => setShowAiKeyModal(true)}
        onOpenAccountSettings={() => setShowAccountSettings(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenResumeParser={() => setShowParser(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Main Viewport (Sticky Topbar + Content) */}
      <div className="main-viewport">
        <Topbar
          currentView={currentView}
          resumeTitle={resume.title}
          targetRole={resume.target_role}
          saveStatus={saveStatus}
          atsScore={resume.ats_score}
          onOpenATS={() => setShowAtsModal(true)}
          onOpenShare={handleOpenShare}
          onOpenPricing={() => setShowPricing(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onDownloadPDF={handleDownloadPDF}
          onDownloadDocx={handleDownloadDocx}
          onDownloadTxt={handleDownloadTxt}
          isDownloading={isDownloading}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
        />

        {/* VIEW 1: MY RESUMES DASHBOARD */}
        {currentView === 'dashboard' || currentView === 'my-resumes' ? (
          <Dashboard
            viewMode={currentView}
            onSelectResume={handleSelectResume}
            onCreateNew={handleCreateNew}
            onBackToEditor={() => setCurrentView('editor')}
            onOpenShare={handleOpenShare}
            onDeleteResume={handleResumeDeleted}
            onOpenATS={() => setShowAtsModal(true)}
            onOpenTracker={() => setShowTracker(true)}
            onOpenJDMatcher={() => setShowJDMatcher(true)}
            onOpenCoverLetter={() => setShowCoverLetter(true)}
            onOpenInterviewPrep={() => setShowInterviewPrep(true)}
            onOpenParser={() => setShowParser(true)}
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
                  onOpenShare={() => setShowShare(true)}
                />
              </div>
            </main>
          </div>
        )}
      </div>

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

      {/* 🟡 100% FREE PRODUCT MODAL */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onOpenShare={() => {
          setShowPricing(false);
          setShowShare(true);
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

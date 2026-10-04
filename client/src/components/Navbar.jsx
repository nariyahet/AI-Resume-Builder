import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  User, 
  Key, 
  BarChart3, 
  FileText,
  Target,
  Mail,
  MessageSquare,
  UploadCloud,
  Crown,
  LayoutDashboard,
  ChevronDown,
  Briefcase,
  History,
  Award,
  Settings,
  ShieldCheck,
  FolderOpen,
  Sun,
  Moon,
  FileSpreadsheet,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  currentView,
  onToggleView,
  onLoadSample, 
  onOpenATS, 
  onOpenAuth, 
  onOpenAiKey,
  onOpenJDMatcher,
  onOpenCoverLetter,
  onOpenCoverLetterManager,
  onOpenInterviewPrep,
  onOpenInterviewPractice,
  onOpenParser,
  onOpenPricing,
  onOpenTracker,
  onOpenVersionHistory,
  onOpenAccountSettings,
  onOpenAdminMetrics,
  onDownloadPDF,
  onDownloadDocx,
  onDownloadTxt,
  isDownloading,
  atsScore,
  theme,
  onToggleTheme
}) {
  const { user, logout } = useAuth();
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [aiDropdownPos, setAiDropdownPos] = useState({ top: 0, left: 0 });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const closeMobileMenu = () => setShowMobileMenu(false);

  // Toggle AI Suite dropdown and calculate position dynamically
  const handleToggleAiDropdown = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setAiDropdownPos({
      top: rect.bottom + 6,
      left: Math.max(10, Math.min(rect.left, window.innerWidth - 245))
    });
    setShowAiDropdown(prev => !prev);
  };

  return (
    <header className="navbar">
      {/* ============================================================== */}
      {/* 1. FULL DESKTOP NAVIGATION (Visible on > 1080px screens)        */}
      {/* ============================================================== */}
      <div className="navbar-desktop-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-group" style={{ cursor: 'pointer' }} onClick={() => { onToggleView('editor'); closeMobileMenu(); }}>
            <div className="logo-badge">
              <Sparkles size={18} />
            </div>
            <span className="logo-text">AI Resume <span style={{ color: 'var(--accent-cyan)' }}>Studio</span></span>
          </div>

          {/* Desktop View Switchers */}
          <div className="desktop-nav-group">
            <button 
              className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => onToggleView(currentView === 'dashboard' ? 'editor' : 'dashboard')}
              title="Switch between Editor and My Resumes Dashboard"
            >
              <LayoutDashboard size={14} />
              <span>{currentView === 'dashboard' ? 'Editor' : 'My Resumes'}</span>
            </button>

            <button 
              className="btn btn-outline btn-sm"
              onClick={onOpenTracker}
              title="Job Application Pipeline Tracker"
            >
              <Briefcase size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span>Job Tracker</span>
            </button>

            <button 
              className="btn btn-outline btn-sm"
              onClick={onOpenVersionHistory}
              title="Resume Revision History & Restore"
            >
              <History size={14} style={{ color: '#a855f7' }} />
              <span>Versions</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Actions */}
        <div className="nav-actions desktop-nav-actions">
          {/* AI Tools Dropdown Menu */}
          <button 
            className="btn btn-ai btn-sm"
            onClick={handleToggleAiDropdown}
          >
            <Sparkles size={14} />
            <span>AI Suite</span>
            <ChevronDown size={13} />
          </button>

          {/* Advanced ATS Score Checker */}
          <button 
            className="btn btn-outline btn-sm"
            onClick={onOpenATS}
            title="Check 4-Dimension ATS Compatibility Score"
          >
            <BarChart3 size={14} style={{ color: '#10b981' }} />
            <span>ATS Check {atsScore ? `(${atsScore}%)` : ''}</span>
          </button>

          {/* Sample Data Quick Button */}
          <button 
            className="btn btn-outline btn-sm" 
            onClick={onLoadSample}
            title="Load rich demo profile"
          >
            <FileText size={14} />
            <span>Demo Data</span>
          </button>

          {/* Pro Plan Modal */}
          <button 
            className="btn btn-outline btn-sm"
            onClick={onOpenPricing}
            style={{ borderColor: '#eab308', color: '#fef08a' }}
            title="Razorpay / Stripe Subscriptions"
          >
            <Crown size={14} style={{ color: '#fbbf24' }} />
            <span>Pro Tier</span>
          </button>

          {/* Theme Toggle Button */}
          <button 
            className="btn btn-outline btn-sm"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {theme === 'light' ? (
              <Moon size={14} style={{ color: '#6366f1' }} />
            ) : (
              <Sun size={14} style={{ color: '#fbbf24' }} />
            )}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Unified Download Dropdown Menu */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
              disabled={isDownloading}
              id="btn-download-menu"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} />
              <span>{isDownloading ? 'Exporting...' : 'Download'}</span>
              <ChevronDown size={13} />
            </button>

            {showDownloadDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 1099 }} onClick={() => setShowDownloadDropdown(false)} />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '205px',
                  zIndex: 1100,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.4rem'
                }}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem', width: '100%' }}
                    onClick={() => { setShowDownloadDropdown(false); onDownloadPDF(); }}
                  >
                    <Download size={14} style={{ color: '#ef4444' }} />
                    <span>PDF Document (.pdf)</span>
                  </button>

                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem', width: '100%' }}
                    onClick={() => { setShowDownloadDropdown(false); onDownloadDocx(); }}
                  >
                    <FileSpreadsheet size={14} style={{ color: '#38bdf8' }} />
                    <span>Word Document (.docx)</span>
                  </button>

                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem', width: '100%' }}
                    onClick={() => { setShowDownloadDropdown(false); onDownloadTxt(); }}
                  >
                    <FileText size={14} style={{ color: '#10b981' }} />
                    <span>Plain Text (.txt)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Auth / Settings Dropdown */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <User size={13} />
                <strong style={{ color: 'var(--text-main)' }}>{user.name.split(' ')[0]}</strong>
                <ChevronDown size={12} />
              </button>

              {showUserDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 1099 }} onClick={() => setShowUserDropdown(false)} />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '190px',
                    zIndex: 1100,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.4rem'
                  }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ justifyContent: 'flex-start', border: 'none', padding: '0.45rem 0.65rem' }}
                      onClick={() => { setShowUserDropdown(false); onOpenAccountSettings(); }}
                    >
                      <Settings size={13} />
                      <span>Account & Quotas</span>
                    </button>

                    {(!user.role || user.role === 'admin' || user.isAdmin) && (
                      <button 
                        className="btn btn-outline btn-sm" 
                        style={{ justifyContent: 'flex-start', border: 'none', padding: '0.45rem 0.65rem' }}
                        onClick={() => { setShowUserDropdown(false); onOpenAdminMetrics(); }}
                      >
                        <ShieldCheck size={13} style={{ color: '#a855f7' }} />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ justifyContent: 'flex-start', border: 'none', padding: '0.45rem 0.65rem' }}
                      onClick={() => { setShowUserDropdown(false); onOpenAiKey(); }}
                    >
                      <Key size={13} style={{ color: '#f59e0b' }} />
                      <span>Gemini API Key</span>
                    </button>

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.2rem 0' }} />

                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ justifyContent: 'flex-start', border: 'none', padding: '0.45rem 0.65rem', color: '#ef4444' }}
                      onClick={() => { setShowUserDropdown(false); logout(); }}
                    >
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={onOpenAuth}>
              <User size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. RESPONSIVE 2-LEVEL COMPACT / TABLET / MOBILE NAVIGATION      */}
      {/* ============================================================== */}
      <div className="navbar-compact-container">
        {/* ROW 1: Logo + Theme + Export + Hamburger */}
        <div className="navbar-compact-row1">
          <div className="logo-group" style={{ cursor: 'pointer' }} onClick={() => { onToggleView('editor'); closeMobileMenu(); }}>
            <div className="logo-badge">
              <Sparkles size={18} />
            </div>
            <span className="logo-text">AI Resume <span style={{ color: 'var(--accent-cyan)' }}>Studio</span></span>
          </div>

          <div className="compact-row1-actions">
            {/* Theme Toggle */}
            <button 
              className="btn btn-outline btn-sm compact-icon-btn"
              onClick={onToggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={15} style={{ color: '#6366f1' }} /> : <Sun size={15} style={{ color: '#fbbf24' }} />}
            </button>

            {/* Compact Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-primary btn-sm compact-download-btn"
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                disabled={isDownloading}
                aria-label="Download Resume"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.65rem' }}
              >
                <Download size={13} />
                <span>{isDownloading ? '...' : 'Export'}</span>
                <ChevronDown size={11} />
              </button>

              {showDownloadDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 1099 }} onClick={() => setShowDownloadDropdown(false)} />
                  <div className="compact-download-menu">
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem', width: '100%' }}
                      onClick={() => { setShowDownloadDropdown(false); onDownloadPDF(); }}
                    >
                      <Download size={13} style={{ color: '#ef4444' }} />
                      <span>PDF (.pdf)</span>
                    </button>

                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem', width: '100%' }}
                      onClick={() => { setShowDownloadDropdown(false); onDownloadDocx(); }}
                    >
                      <FileSpreadsheet size={13} style={{ color: '#38bdf8' }} />
                      <span>Word (.docx)</span>
                    </button>

                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem', width: '100%' }}
                      onClick={() => { setShowDownloadDropdown(false); onDownloadTxt(); }}
                    >
                      <FileText size={13} style={{ color: '#10b981' }} />
                      <span>Text (.txt)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hamburger Menu Toggle Button */}
            <button 
              className="btn btn-outline btn-sm mobile-hamburger-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Open Navigation Menu"
              style={{ padding: '0.4rem 0.55rem' }}
            >
              {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ROW 2: Horizontally scrollable feature navigation bar for Tablet / Half-Screen (~600px - 1080px) */}
        <div className="navbar-feature-strip">
          {/* 1. My Resumes / Editor */}
          <button 
            className={`btn btn-sm strip-btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onToggleView(currentView === 'dashboard' ? 'editor' : 'dashboard')}
            title="Switch between Editor and My Resumes Dashboard"
          >
            <LayoutDashboard size={14} />
            <span>{currentView === 'dashboard' ? 'Editor' : 'My Resumes'}</span>
          </button>

          {/* 2. Job Tracker */}
          <button 
            className="btn btn-outline btn-sm strip-btn"
            onClick={onOpenTracker}
            title="Job Application Pipeline Tracker"
          >
            <Briefcase size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Job Tracker</span>
          </button>

          {/* 3. Versions */}
          <button 
            className="btn btn-outline btn-sm strip-btn"
            onClick={onOpenVersionHistory}
            title="Resume Revision History & Restore"
          >
            <History size={14} style={{ color: '#a855f7' }} />
            <span>Versions</span>
          </button>

          {/* 4. AI Suite Dropdown Button */}
          <button 
            className="btn btn-ai btn-sm strip-btn"
            onClick={handleToggleAiDropdown}
            title="AI Resume Suite Tools"
          >
            <Sparkles size={14} />
            <span>AI Suite</span>
            <ChevronDown size={12} />
          </button>

          {/* 5. ATS Check */}
          <button 
            className="btn btn-outline btn-sm strip-btn"
            onClick={onOpenATS}
            title="Check 4-Dimension ATS Compatibility Score"
          >
            <BarChart3 size={14} style={{ color: '#10b981' }} />
            <span>ATS Check {atsScore ? `(${atsScore}%)` : ''}</span>
          </button>

          {/* 6. Demo Data */}
          <button 
            className="btn btn-outline btn-sm strip-btn"
            onClick={onLoadSample}
            title="Load rich demo profile"
          >
            <FileText size={14} />
            <span>Demo Data</span>
          </button>

          {/* 7. Pro Tier */}
          <button 
            className="btn btn-outline btn-sm strip-btn"
            onClick={onOpenPricing}
            style={{ borderColor: '#eab308', color: '#fef08a' }}
            title="Pro Tier Subscriptions"
          >
            <Crown size={14} style={{ color: '#fbbf24' }} />
            <span>Pro Tier</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. GLOBAL AI SUITE DROPDOWN (Positioned relative to button)    */}
      {/* ============================================================== */}
      {showAiDropdown && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 1198 }} 
            onClick={() => setShowAiDropdown(false)} 
          />
          <div style={{
            position: 'fixed',
            top: aiDropdownPos.top,
            left: aiDropdownPos.left,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: '230px',
            zIndex: 1199,
            display: 'flex',
            flexDirection: 'column',
            padding: '0.4rem'
          }}>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem' }}
              onClick={() => { setShowAiDropdown(false); onOpenJDMatcher(); }}
            >
              <Target size={14} style={{ color: '#38bdf8' }} />
              <span>🎯 Safe JD Auto-Tailor</span>
            </button>

            <button 
              className="btn btn-outline btn-sm" 
              style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem' }}
              onClick={() => { setShowAiDropdown(false); onOpenCoverLetter(); }}
            >
              <Mail size={14} style={{ color: '#a855f7' }} />
              <span>✉️ AI Cover Letter</span>
            </button>

            <button 
              className="btn btn-outline btn-sm" 
              style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem' }}
              onClick={() => { setShowAiDropdown(false); onOpenCoverLetterManager(); }}
            >
              <FolderOpen size={14} style={{ color: '#c084fc' }} />
              <span>📂 Cover Letter Library</span>
            </button>

            <button 
              className="btn btn-outline btn-sm" 
              style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem' }}
              onClick={() => { setShowAiDropdown(false); onOpenInterviewPractice(); }}
            >
              <Award size={14} style={{ color: '#fbbf24' }} />
              <span>🎤 Interview Practice Mode</span>
            </button>

            <button 
              className="btn btn-outline btn-sm" 
              style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem' }}
              onClick={() => { setShowAiDropdown(false); onOpenInterviewPrep(); }}
            >
              <MessageSquare size={14} style={{ color: '#10b981' }} />
              <span>📋 Recruiter Q&A Prep</span>
            </button>

            <button 
              className="btn btn-outline btn-sm" 
              style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem' }}
              onClick={() => { setShowAiDropdown(false); onOpenParser(); }}
            >
              <UploadCloud size={14} style={{ color: '#fbbf24' }} />
              <span>📄 Real PDF/DOCX Parser</span>
            </button>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 4. HAMBURGER MOBILE & TABLET DRAWER OVERLAY                    */}
      {/* ============================================================== */}
      {showMobileMenu && (
        <div className="mobile-menu-drawer-backdrop" onClick={closeMobileMenu}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="logo-group">
                <div className="logo-badge">
                  <Sparkles size={16} />
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>AI Resume Studio</span>
              </div>
              <button className="delete-btn" onClick={closeMobileMenu} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-body">
              {/* 1. Workspace Section */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-section-title">Workspace</span>
                <button 
                  className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onToggleView(currentView === 'dashboard' ? 'editor' : 'dashboard'); closeMobileMenu(); }}
                >
                  <LayoutDashboard size={15} />
                  <span>{currentView === 'dashboard' ? 'Resume Editor' : 'My Resumes'}</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenTracker(); closeMobileMenu(); }}
                >
                  <Briefcase size={15} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Job Tracker</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenVersionHistory(); closeMobileMenu(); }}
                >
                  <History size={15} style={{ color: '#a855f7' }} />
                  <span>Versions & Restore</span>
                </button>
              </div>

              {/* 2. AI Tools Section */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-section-title">AI Tools</span>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenJDMatcher(); closeMobileMenu(); }}
                >
                  <Target size={15} style={{ color: '#38bdf8' }} />
                  <span>JD Matcher (Auto-Tailor)</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenCoverLetter(); closeMobileMenu(); }}
                >
                  <Mail size={15} style={{ color: '#a855f7' }} />
                  <span>Cover Letter Generator</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenCoverLetterManager(); closeMobileMenu(); }}
                >
                  <FolderOpen size={15} style={{ color: '#c084fc' }} />
                  <span>Cover Letter Library</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenInterviewPrep(); closeMobileMenu(); }}
                >
                  <MessageSquare size={15} style={{ color: '#10b981' }} />
                  <span>Interview Prep (STAR Q&A)</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenInterviewPractice(); closeMobileMenu(); }}
                >
                  <Award size={15} style={{ color: '#fbbf24' }} />
                  <span>Interview Practice Mode</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenParser(); closeMobileMenu(); }}
                >
                  <UploadCloud size={15} style={{ color: '#38bdf8' }} />
                  <span>Resume Parser (PDF / Word)</span>
                </button>
              </div>

              {/* 3. Resume Tools Section */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-section-title">Resume Tools</span>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onOpenATS(); closeMobileMenu(); }}
                >
                  <BarChart3 size={15} style={{ color: '#10b981' }} />
                  <span>ATS Check {atsScore ? `(${atsScore}%)` : ''}</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onLoadSample(); closeMobileMenu(); }}
                >
                  <FileText size={15} />
                  <span>Demo Data</span>
                </button>
              </div>

              {/* 4. Plan Section */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-section-title">Plan</span>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', borderColor: '#eab308', color: '#fef08a' }}
                  onClick={() => { onOpenPricing(); closeMobileMenu(); }}
                >
                  <Crown size={15} style={{ color: '#fbbf24' }} />
                  <span>Pro Tier (Upgrade)</span>
                </button>
              </div>

              {/* 5. Download & Theme Section */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-section-title">Download & Display</span>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onToggleTheme(); closeMobileMenu(); }}
                >
                  {theme === 'light' ? <Moon size={15} style={{ color: '#6366f1' }} /> : <Sun size={15} style={{ color: '#fbbf24' }} />}
                  <span>{theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onDownloadPDF(); closeMobileMenu(); }}
                  disabled={isDownloading}
                >
                  <Download size={15} style={{ color: '#ef4444' }} />
                  <span>Download PDF (.pdf)</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onDownloadDocx(); closeMobileMenu(); }}
                  disabled={isDownloading}
                >
                  <FileSpreadsheet size={15} style={{ color: '#38bdf8' }} />
                  <span>Download Word (.docx)</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onDownloadTxt(); closeMobileMenu(); }}
                  disabled={isDownloading}
                >
                  <FileText size={15} style={{ color: '#10b981' }} />
                  <span>Download Plain Text (.txt)</span>
                </button>
              </div>

              {/* 6. Account Section */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-section-title">Account</span>
                {user ? (
                  <>
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => { onOpenAccountSettings(); closeMobileMenu(); }}
                    >
                      <Settings size={15} />
                      <span>Account Settings ({user.name})</span>
                    </button>
                    {(!user.role || user.role === 'admin' || user.isAdmin) && (
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                        onClick={() => { onOpenAdminMetrics(); closeMobileMenu(); }}
                      >
                        <ShieldCheck size={15} style={{ color: '#a855f7' }} />
                        <span>Admin Dashboard</span>
                      </button>
                    )}
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => { onOpenAiKey(); closeMobileMenu(); }}
                    >
                      <Key size={15} style={{ color: '#f59e0b' }} />
                      <span>Gemini API Key</span>
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}
                      onClick={() => { logout(); closeMobileMenu(); }}
                    >
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { onOpenAuth(); closeMobileMenu(); }}
                  >
                    <User size={15} />
                    <span>Sign In / Create Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

import React, { useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Briefcase,
  History,
  Wand2,
  Mail,
  MessageSquare,
  BarChart3,
  Target,
  Share2,
  Key,
  Settings,
  User,
  LogOut,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  currentView,
  onToggleView,
  atsScore,
  onOpenTracker,
  onOpenVersionHistory,
  onOpenATS,
  onOpenJDMatcher,
  onOpenCoverLetter,
  onOpenInterviewPrep,
  onOpenPricing,
  onOpenShare,
  onLoadSample,
  onOpenAiKey,
  onOpenAccountSettings,
  onOpenAuth,
  onOpenResumeParser,
  isOpen,
  onClose
}) {
  const { user, logout } = useAuth();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavClick = (callback) => {
    if (callback) callback();
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="side-brand">
          <div className="side-brand-mark">
            <Sparkles size={18} />
          </div>
          <div className="side-brand-text">
            <b>AI Resume Studio</b>
            <small>All Features Free</small>
          </div>
          {/* Mobile Close Button */}
          <button
            className="side-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section: MAIN */}
        <div className="side-section">
          <span className="side-label">Main</span>
          <nav className="side-nav">
            <button
              type="button"
              className={`side-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick(() => onToggleView('dashboard'))}
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`side-nav-item ${currentView === 'my-resumes' ? 'active' : ''}`}
              onClick={() => handleNavClick(() => onToggleView('my-resumes'))}
            >
              <FileSpreadsheet size={17} style={{ color: 'var(--primary)' }} />
              <span>My Resumes</span>
            </button>

            <button
              type="button"
              className={`side-nav-item ${currentView === 'editor' ? 'active' : ''}`}
              onClick={() => handleNavClick(() => onToggleView('editor'))}
            >
              <FileText size={17} />
              <span>Resume Editor</span>
            </button>

            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenTracker)}
            >
              <Briefcase size={17} style={{ color: 'var(--accent-cyan)' }} />
              <span>Job Tracker</span>
            </button>

            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenVersionHistory)}
            >
              <History size={17} style={{ color: 'var(--ai-purple)' }} />
              <span>Versions</span>
            </button>
          </nav>
        </div>

        {/* Section: AI TOOLS */}
        <div className="side-section">
          <span className="side-label">AI Tools</span>
          <nav className="side-nav">
            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenJDMatcher)}
            >
              <Wand2 size={17} style={{ color: 'var(--primary)' }} />
              <span>AI Auto-Tailor</span>
            </button>

            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenCoverLetter)}
            >
              <Mail size={17} style={{ color: '#a855f7' }} />
              <span>Cover Letter</span>
            </button>

            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenInterviewPrep)}
            >
              <MessageSquare size={17} style={{ color: 'var(--green)' }} />
              <span>Interview Prep</span>
            </button>

            {onOpenResumeParser && (
              <button
                type="button"
                className="side-nav-item"
                onClick={() => handleNavClick(onOpenResumeParser)}
              >
                <FileText size={17} style={{ color: 'var(--accent-cyan)' }} />
                <span>Resume Parser</span>
              </button>
            )}
          </nav>
        </div>

        {/* Section: OPTIMIZATION */}
        <div className="side-section">
          <span className="side-label">Optimization</span>
          <nav className="side-nav">
            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenATS)}
            >
              <BarChart3 size={17} style={{ color: 'var(--green)' }} />
              <span>ATS Check</span>
              {atsScore ? (
                <span className="side-count">{atsScore}%</span>
              ) : null}
            </button>

            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenJDMatcher)}
            >
              <Target size={17} style={{ color: 'var(--accent-cyan)' }} />
              <span>JD Matcher</span>
            </button>
          </nav>
        </div>

        {/* Section: UTILITY */}
        <div className="side-section">
          <span className="side-label">Utility</span>
          <nav className="side-nav">
            {onOpenShare && (
              <button
                type="button"
                className="side-nav-item"
                onClick={() => handleNavClick(onOpenShare)}
              >
                <Share2 size={17} style={{ color: 'var(--sky)' }} />
                <span>Share Resume</span>
              </button>
            )}

            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onLoadSample)}
            >
              <FileSpreadsheet size={17} />
              <span>Demo Data</span>
            </button>

            <button
              type="button"
              className="side-nav-item"
              onClick={() => handleNavClick(onOpenAiKey)}
            >
              <Key size={17} style={{ color: 'var(--amber)' }} />
              <span>Gemini API Key</span>
            </button>

            {user && (
              <button
                type="button"
                className="side-nav-item"
                onClick={() => handleNavClick(onOpenAccountSettings)}
              >
                <Settings size={17} />
                <span>Settings</span>
              </button>
            )}
          </nav>
        </div>

        {/* All Features Free Pledge Card */}
        <div className="side-upgrade" onClick={() => handleNavClick(onOpenPricing)}>
          <div className="side-upgrade-ic">
            <Sparkles size={16} />
          </div>
          <b>All Features Free</b>
          <p>Unlimited AI tailoring, ATS audits, PDF/Word exports. 100% free forever.</p>
          <button type="button" className="side-upgrade-btn">
            Free Product Pledge
          </button>
        </div>

        {/* Bottom User Profile Chip */}
        <div className="side-profile">
          {user ? (
            <>
              <div
                className="side-avatar"
                onClick={() => handleNavClick(onOpenAccountSettings)}
                title="Account Settings"
              >
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div
                className="side-profile-info"
                onClick={() => handleNavClick(onOpenAccountSettings)}
              >
                <b>{user.name}</b>
                <small>{user.email}</small>
              </div>
              <button
                type="button"
                className="side-logout-btn"
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="side-login-btn"
              onClick={() => handleNavClick(onOpenAuth)}
            >
              <User size={16} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

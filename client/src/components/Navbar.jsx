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
  FileSpreadsheet
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
  const { user, logout, geminiKey } = useAuth();
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="logo-group" style={{ cursor: 'pointer' }} onClick={() => onToggleView('editor')}>
          <div className="logo-badge">
            <Sparkles size={18} />
          </div>
          <span>AI Resume <span style={{ color: '#38bdf8' }}>Studio</span></span>
        </div>

        {/* View Switcher: Editor vs Dashboard */}
        <button 
          className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onToggleView(currentView === 'dashboard' ? 'editor' : 'dashboard')}
          title="Switch between Editor and My Resumes Dashboard"
        >
          <LayoutDashboard size={14} />
          <span>{currentView === 'dashboard' ? 'Editor' : 'My Resumes'}</span>
        </button>

        {/* 🟠 Job Application Tracker Button */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenTracker}
          title="Job Application Pipeline Tracker"
        >
          <Briefcase size={14} style={{ color: '#38bdf8' }} />
          <span>Job Tracker</span>
        </button>

        {/* 🔴 Version History Button */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenVersionHistory}
          title="Resume Revision History & Restore"
        >
          <History size={14} style={{ color: '#a855f7' }} />
          <span>Versions</span>
        </button>
      </div>

      <div className="nav-actions">
        {/* AI Tools Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-ai btn-sm"
            onClick={() => setShowAiDropdown(!showAiDropdown)}
            onBlur={() => setTimeout(() => setShowAiDropdown(false), 250)}
          >
            <Sparkles size={14} />
            <span>AI Suite</span>
            <ChevronDown size={13} />
          </button>

          {showAiDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '230px',
              zIndex: 60,
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
          )}
        </div>

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

        {/* ☀️/🌙 Theme Toggle Button */}
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
            onBlur={() => setTimeout(() => setShowDownloadDropdown(false), 250)}
            disabled={isDownloading}
            id="btn-download-menu"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>{isDownloading ? 'Exporting...' : 'Download'}</span>
            <ChevronDown size={13} />
          </button>

          {showDownloadDropdown && (
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
              zIndex: 60,
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
          )}
        </div>

        {/* Auth / Settings Dropdown */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              onBlur={() => setTimeout(() => setShowUserDropdown(false), 250)}
            >
              <User size={13} />
              <strong style={{ color: 'var(--text-main)' }}>{user.name.split(' ')[0]}</strong>
              <ChevronDown size={12} />
            </button>

            {showUserDropdown && (
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
                zIndex: 60,
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

                <button 
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', border: 'none', padding: '0.45rem 0.65rem' }}
                  onClick={() => { setShowUserDropdown(false); onOpenAdminMetrics(); }}
                >
                  <ShieldCheck size={13} style={{ color: '#a855f7' }} />
                  <span>Admin Dashboard</span>
                </button>

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
                  onClick={logout}
                >
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-outline btn-sm" onClick={onOpenAuth}>
            <User size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}

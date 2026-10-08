import React, { useState } from 'react';
import {
  Menu,
  Download,
  Share2,
  BarChart3,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  User,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({
  currentView,
  resumeTitle,
  targetRole,
  saveStatus,
  atsScore,
  onOpenATS,
  onOpenShare,
  onOpenPricing,
  theme,
  onToggleTheme,
  onDownloadPDF,
  onDownloadDocx,
  onDownloadTxt,
  isDownloading,
  onToggleSidebar,
  onOpenAuth,
  onOpenAccountSettings
}) {
  const { user } = useAuth();
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  return (
    <header className="app-topbar">
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        className="topbar-mobile-menu"
        onClick={onToggleSidebar}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Page Title & Context */}
      <div className="topbar-title-group">
        <h1>{currentView === 'dashboard' ? 'Dashboard' : 'Resume Editor'}</h1>
        <small>
          {currentView === 'dashboard'
            ? 'Career command center & resume library'
            : (resumeTitle || 'Untitled Resume') + (targetRole ? ` • ${targetRole}` : '')}
        </small>
      </div>

      {/* Autosave Pill Status (Editor View) */}
      {currentView === 'editor' && saveStatus && (
        <div
          className={`topbar-save-pill ${saveStatus === 'Saving...' ? 'saving' : saveStatus === 'Save failed' ? 'failed' : 'saved'}`}
          aria-live="polite"
          aria-label={`Autosave status: ${saveStatus}`}
        >
          {saveStatus === 'Saving...' ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : saveStatus === 'Save failed' ? (
            <>
              <AlertCircle size={12} />
              <span>Save failed</span>
            </>
          ) : (
            <>
              <Check size={12} />
              <span>Saved</span>
            </>
          )}
        </div>
      )}

      {/* Right Topbar Actions */}
      <div className="topbar-actions">
        {/* ATS Score Button */}
        <button
          type="button"
          className="tb-action-btn tb-ats-btn"
          onClick={onOpenATS}
          title="Check ATS Compatibility Score"
          aria-label={`Check ATS compatibility${atsScore ? `: ${atsScore}%` : ''}`}
        >
          <BarChart3 size={15} style={{ color: 'var(--green)' }} />
          <span>ATS Check {atsScore ? `(${atsScore}%)` : ''}</span>
        </button>

        {/* Share Button */}
        {onOpenShare && (
          <button
            type="button"
            className="tb-action-btn tb-share-btn"
            onClick={onOpenShare}
            title="Share public web link & QR code"
            aria-label="Share resume"
          >
            <Share2 size={15} style={{ color: 'var(--sky)' }} />
            <span>Share</span>
          </button>
        )}

        {/* All Features Free Badge */}
        <button
          type="button"
          className="tb-action-btn tb-free-badge"
          onClick={onOpenPricing}
          title="AI Resume Studio is 100% Free Forever"
          aria-label="View the all-features-free pledge"
        >
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>All Features Free</span>
        </button>

        {/* Export / Download Dropdown Menu */}
        <div className="tb-export-wrap" style={{ position: 'relative' }}>
          <button
            type="button"
            className="tb-download-btn"
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={isDownloading}
            title="Export resume in PDF, Word, or Text"
            aria-label={isDownloading ? 'Exporting resume' : 'Export resume'}
          >
            <Download size={15} />
            <span>{isDownloading ? 'Exporting...' : 'Export'}</span>
            <ChevronDown size={13} />
          </button>

          {showDownloadMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 1099 }}
                onClick={() => setShowDownloadMenu(false)}
              />
              <div className="tb-download-dropdown">
                <button
                  type="button"
                  className="tb-dropdown-item"
                  onClick={() => { setShowDownloadMenu(false); onDownloadPDF(); }}
                >
                  <Download size={15} style={{ color: '#ef4444' }} />
                  <div>
                    <b>PDF Document (.pdf)</b>
                    <small>High quality ATS-friendly vector</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="tb-dropdown-item"
                  onClick={() => { setShowDownloadMenu(false); onDownloadDocx(); }}
                >
                  <FileSpreadsheet size={15} style={{ color: '#38bdf8' }} />
                  <div>
                    <b>Word Document (.docx)</b>
                    <small>Editable Microsoft Word format</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="tb-dropdown-item"
                  onClick={() => { setShowDownloadMenu(false); onDownloadTxt(); }}
                >
                  <FileText size={15} style={{ color: '#10b981' }} />
                  <div>
                    <b>Plain Text (.txt)</b>
                    <small>Raw ASCII format for quick pasting</small>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Topbar Utility: Theme Toggle + Profile / Sign In */}
      <div className="topbar-utility">
        {/* Theme Toggle */}
        <button
          type="button"
          className="tb-icon-btn"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon size={16} style={{ color: '#6366f1' }} />
          ) : (
            <Sun size={16} style={{ color: '#fbbf24' }} />
          )}
        </button>

        {/* User Account Button */}
        {user ? (
          <button
            type="button"
            className="tb-user-btn"
            onClick={onOpenAccountSettings}
            title="Account Settings"
          >
            <div className="tb-user-avatar">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="tb-user-name">{user.name?.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            type="button"
            className="tb-action-btn tb-signin-btn"
            onClick={onOpenAuth}
            aria-label="Sign in or register"
          >
            <User size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}

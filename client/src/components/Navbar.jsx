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
  ChevronDown
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
  onOpenInterviewPrep,
  onOpenParser,
  onOpenPricing,
  onDownloadPDF,
  isDownloading,
  atsScore
}) {
  const { user, logout, geminiKey } = useAuth();
  const [showAiDropdown, setShowAiDropdown] = useState(false);

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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
          title="Switch between Resume Editor and My Resumes Dashboard"
        >
          <LayoutDashboard size={14} />
          <span>{currentView === 'dashboard' ? 'Back to Editor' : 'My Resumes'}</span>
        </button>
      </div>

      <div className="nav-actions">
        {/* AI Tools Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-ai btn-sm"
            onClick={() => setShowAiDropdown(!showAiDropdown)}
            onBlur={() => setTimeout(() => setShowAiDropdown(false), 200)}
          >
            <Sparkles size={14} />
            <span>AI Power Tools</span>
            <ChevronDown size={13} />
          </button>

          {showAiDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '6px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              minWidth: '220px',
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
                <span>🎯 Match with Job (JD)</span>
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
                onClick={() => { setShowAiDropdown(false); onOpenInterviewPrep(); }}
              >
                <MessageSquare size={14} style={{ color: '#10b981' }} />
                <span>🎤 AI Interview Prep</span>
              </button>

              <button 
                className="btn btn-outline btn-sm" 
                style={{ justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.75rem' }}
                onClick={() => { setShowAiDropdown(false); onOpenParser(); }}
              >
                <UploadCloud size={14} style={{ color: '#fbbf24' }} />
                <span>📄 Import Old Resume</span>
              </button>
            </div>
          )}
        </div>

        {/* ATS Score Checker */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenATS}
          title="Check ATS Compatibility Score"
        >
          <BarChart3 size={14} style={{ color: '#10b981' }} />
          <span>ATS Check {atsScore ? `(${atsScore}%)` : ''}</span>
        </button>

        {/* Sample Data Quick Button */}
        <button 
          className="btn btn-outline btn-sm" 
          onClick={onLoadSample}
          title="Load rich demo data to test all features"
        >
          <FileText size={14} />
          <span>Demo Data</span>
        </button>

        {/* Pro Plan Modal */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenPricing}
          style={{ borderColor: '#eab308', color: '#fef08a' }}
          title="View Pro AI Plans & Pricing"
        >
          <Crown size={14} style={{ color: '#fbbf24' }} />
          <span>Pro Suite</span>
        </button>

        {/* AI Key config button */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenAiKey}
          title="Configure Google Gemini API Key"
        >
          <Key size={14} style={{ color: geminiKey ? '#10b981' : '#f59e0b' }} />
          <span>{geminiKey ? 'Gemini Active' : 'AI Key'}</span>
        </button>

        {/* PDF Download Button */}
        <button 
          className="btn btn-primary"
          onClick={onDownloadPDF}
          disabled={isDownloading}
          id="btn-download-pdf"
        >
          <Download size={16} />
          <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
        </button>

        {/* Auth status / Login */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              Hi, <strong style={{ color: '#fff' }}>{user.name}</strong>
            </span>
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Logout
            </button>
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

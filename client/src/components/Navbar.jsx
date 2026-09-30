import React from 'react';
import { 
  Sparkles, 
  Download, 
  User, 
  Key, 
  BarChart3, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  onLoadSample, 
  onReset, 
  onOpenATS, 
  onOpenAuth, 
  onOpenAiKey,
  onDownloadPDF,
  isDownloading,
  atsScore
}) {
  const { user, logout, geminiKey } = useAuth();

  return (
    <header className="navbar">
      <div className="logo-group">
        <div className="logo-badge">
          <Sparkles size={18} />
        </div>
        <span>AI Resume <span style={{ color: '#38bdf8' }}>Studio</span></span>
      </div>

      <div className="nav-actions">
        {/* Sample Data Quick Button */}
        <button 
          className="btn btn-outline btn-sm" 
          onClick={onLoadSample}
          title="Load rich demo data to test all features"
        >
          <FileText size={14} />
          <span>Demo Data</span>
        </button>

        {/* ATS Score Checker */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenATS}
          title="Check ATS Compatibility Score"
        >
          <BarChart3 size={14} style={{ color: '#10b981' }} />
          <span>ATS Check {atsScore ? `(${atsScore}%)` : ''}</span>
        </button>

        {/* AI Key config button */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenAiKey}
          title="Configure Google Gemini API Key"
        >
          <Key size={14} style={{ color: geminiKey ? '#10b981' : '#f59e0b' }} />
          <span>{geminiKey ? 'Gemini Active' : 'AI Settings'}</span>
        </button>

        {/* PDF Download Button */}
        <button 
          className="btn btn-primary"
          onClick={onDownloadPDF}
          disabled={isDownloading}
          id="btn-download-pdf"
        >
          <Download size={16} />
          <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
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

import React, { useState } from 'react';
import {
  X,
  Mail,
  Sparkles,
  Copy,
  Download,
  Loader2,
  Check,
  BookmarkCheck
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function CoverLetterModal({ isOpen, onClose, resume }) {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState(resume?.target_role || '');
  const [hiringManager, setHiringManager] = useState('');
  const [tone, setTone] = useState('Professional & Confident');
  const [coverLetter, setCoverLetter] = useState('');
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedToLib, setSavedToLib] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setCopied(false);
    setSavedToLib(false);
    try {
      const res = await axiosClient.post('/ai/generate-cover-letter', {
        companyName,
        jobRole: jobRole || resume?.target_role,
        hiringManager,
        resume,
        tone
      });
      if (res.data?.success && res.data.coverLetter) {
        setCoverLetter(res.data.coverLetter);
        setIsAiPowered(!!res.data.aiPowered);
      }
    } catch (err) {
      alert('Failed to generate cover letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToLibrary = async () => {
    if (!coverLetter) return;
    try {
      await axiosClient.post('/cover-letters', {
        company_name: companyName || 'General Application',
        job_role: jobRole || resume?.target_role || 'Candidate',
        letter_content: coverLetter,
        tone
      });
      setSavedToLib(true);
      setTimeout(() => setSavedToLib(false), 2500);
    } catch (e) {
      alert('Failed to save to Cover Letter Library.');
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([coverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${(companyName || 'Job').replace(/\s+/g, '_')}_Cover_Letter.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="modal-title">AI Cover Letter Studio</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Generate a tailored cover letter structured strictly on your genuine resume credentials. Edit, customize, and save to your personal library.
        </p>

        {/* Inputs */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Target Company Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Google, TCS, Startup Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target Job Role</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Senior Full Stack Engineer"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Hiring Manager / Team (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Engineering Hiring Team"
              value={hiringManager}
              onChange={(e) => setHiringManager(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tone & Style</label>
            <select
              className="form-select"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="Professional & Confident">Professional & Confident</option>
              <option value="Enthusiastic & Energetic">Enthusiastic & Energetic</option>
              <option value="Executive & Authoritative">Executive & Authoritative</option>
              <option value="Concise & Impactful">Concise & Direct</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-ai"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating Tailored Cover Letter...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate Cover Letter with AI</span>
            </>
          )}
        </button>

        {coverLetter && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Generated Letter (Editable):
                </span>
                <span className="ats-score-badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                  {isAiPowered ? '✨ Gemini AI' : '📋 Rule-based'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleSaveToLibrary}
                  disabled={savedToLib}
                >
                  {savedToLib ? <><Check size={13} style={{ color: '#10b981' }} /> Saved!</> : <><BookmarkCheck size={13} /> Save to Library</>}
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleCopy}>
                  {copied ? <><Check size={13} style={{ color: '#10b981' }} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleDownloadTxt}>
                  <Download size={13} /> Download .txt
                </button>
              </div>
            </div>

            <textarea
              className="form-textarea"
              rows={12}
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', lineHeight: 1.6 }}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

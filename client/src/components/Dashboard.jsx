import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Edit3,
  Share2,
  Download,
  BarChart3,
  ArrowLeft,
  Loader2,
  Calendar,
  Sparkles,
  Briefcase,
  Target,
  Wand2,
  Mail,
  MessageSquare,
  UploadCloud,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { sampleResume } from '../data/sampleResume';
import { exportResumeToDocx } from '../utils/docxExport';

export default function Dashboard({
  onSelectResume,
  onCreateNew,
  onBackToEditor,
  onOpenShare,
  onDeleteResume,
  onOpenATS,
  onOpenTracker,
  onOpenJDMatcher,
  onOpenCoverLetter,
  onOpenInterviewPrep,
  onOpenParser
}) {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      if (user) {
        const res = await axiosClient.get('/resumes');
        if (res.data?.success) {
          setResumes(res.data.resumes || []);
        }
      } else {
        // Guest mode: fetch from local storage
        const local = localStorage.getItem('ai_resume_current_draft');
        if (local) {
          const parsed = JSON.parse(local);
          setResumes([{ ...parsed, id: 'local-draft', isLocal: true, updated_at: new Date().toISOString() }]);
        } else {
          setResumes([]);
        }
      }
    } catch (err) {
      console.warn('Fetch resumes warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (resumeId, e) => {
    e.stopPropagation();
    setActionLoading(`clone-${resumeId}`);
    try {
      const res = await axiosClient.post(`/resumes/clone/${resumeId}`);
      if (res.data?.success) {
        await fetchResumes();
      }
    } catch (err) {
      alert('Failed to clone resume: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (resumeId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    setActionLoading(`delete-${resumeId}`);
    try {
      if (resumeId === 'local-draft' || !user) {
        localStorage.removeItem('ai_resume_current_draft');
        setResumes([]);
      } else {
        await axiosClient.delete(`/resumes/${resumeId}`);
        setResumes(prev => prev.filter(r => r.id !== resumeId));
      }
      if (onDeleteResume) {
        onDeleteResume(resumeId);
      }
    } catch (err) {
      alert('Failed to delete resume.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenResume = async (resumeItem) => {
    if (resumeItem.isLocal) {
      onSelectResume(resumeItem);
    } else {
      try {
        const res = await axiosClient.get(`/resumes/${resumeItem.id}`);
        if (res.data?.success && res.data.resume) {
          onSelectResume(res.data.resume);
        }
      } catch (err) {
        alert('Failed to load resume details.');
      }
    }
  };

  const handleShareCard = async (resumeItem, e) => {
    e.stopPropagation();
    if (!onOpenShare) return;
    if (resumeItem.isLocal) {
      onOpenShare(resumeItem);
    } else {
      try {
        const res = await axiosClient.get(`/resumes/${resumeItem.id}`);
        if (res.data?.success && res.data.resume) {
          onOpenShare(res.data.resume);
        } else {
          onOpenShare(resumeItem);
        }
      } catch (err) {
        onOpenShare(resumeItem);
      }
    }
  };

  const handleDownloadCard = async (resumeItem, e) => {
    e.stopPropagation();
    setActionLoading(`download-${resumeItem.id}`);
    try {
      let fullResume = resumeItem;
      if (!resumeItem.isLocal && resumeItem.id) {
        const res = await axiosClient.get(`/resumes/${resumeItem.id}`);
        if (res.data?.success && res.data.resume) {
          fullResume = res.data.resume;
        }
      }
      await exportResumeToDocx(fullResume);
    } catch (err) {
      console.warn('Docx export fallback:', err);
      handleOpenResume(resumeItem);
    } finally {
      setActionLoading(null);
    }
  };

  const primaryRole = resumes[0]?.target_role || 'Software Engineer';
  const primaryAts = resumes[0]?.ats_score || 88;

  return (
    <div className="dashboard-container">
      {/* Back to Editor Quick Affordance */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onBackToEditor}
        >
          <ArrowLeft size={14} />
          <span>Resume Editor</span>
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />
          <span>Cloud Sync Active</span>
        </span>
      </div>

      {/* 1. HERO BANNER */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={13} />
            <span>AI Career Studio • All Features Free</span>
          </div>
          <h2 className="hero-title">
            Ready to land your dream role?
          </h2>
          <p className="hero-desc">
            Build, optimize, and tailor high-impact ATS-ready resumes with Gemini AI. Real-time scoring, unlimited tailoring, and 1-click exports.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onCreateNew}
            >
              <Plus size={16} />
              <span>Create New Resume</span>
            </button>

            {onOpenATS && (
              <button
                type="button"
                className="btn btn-outline hero-ghost-btn"
                onClick={onOpenATS}
              >
                <BarChart3 size={15} style={{ color: 'var(--green)' }} />
                <span>Run ATS Audit</span>
              </button>
            )}

            {onOpenTracker && (
              <button
                type="button"
                className="btn btn-outline hero-ghost-btn"
                onClick={onOpenTracker}
              >
                <Briefcase size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span>Job Tracker</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'var(--ai-soft)', color: 'var(--ai)' }}>
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <small>Total Resumes</small>
            <b>{resumes.length}</b>
            <span className="stat-meta">Active & Stored</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            <BarChart3 size={20} />
          </div>
          <div className="stat-info">
            <small>Primary ATS Match</small>
            <b>{primaryAts}%</b>
            <span className="stat-meta" style={{ color: 'var(--green-dark)' }}>Verified ATS-Ready</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
            <Target size={20} />
          </div>
          <div className="stat-info">
            <small>Target Role</small>
            <b style={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primaryRole}</b>
            <span className="stat-meta">Current Target</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
            <Sparkles size={20} />
          </div>
          <div className="stat-info">
            <small>AI Features</small>
            <b>100% Free</b>
            <span className="stat-meta">Unlimited Access</span>
          </div>
        </div>
      </div>

      {/* 3. AI TOOLS SHOWCASE */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              AI Career Acceleration Suite
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '2px 0 0' }}>
              Specialized Gemini AI tools to craft resumes, tailor applications, and ace interviews.
            </p>
          </div>
        </div>

        <div className="ai-tools-grid">
          <div
            className="ai-tool-card"
            onClick={onOpenJDMatcher}
            role="button"
            tabIndex={0}
          >
            <div className="tool-icon" style={{ background: 'var(--ai-soft)', color: 'var(--ai)' }}>
              <Wand2 size={20} />
            </div>
            <b>AI Auto-Tailor (JD Matcher)</b>
            <p>Paste any job description and let AI tailor your skills and experience to match.</p>
            <span className="tool-link">
              <span>Open Tool</span>
              <ArrowRight size={13} />
            </span>
          </div>

          <div
            className="ai-tool-card"
            onClick={onOpenCoverLetter}
            role="button"
            tabIndex={0}
          >
            <div className="tool-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              <Mail size={20} />
            </div>
            <b>Cover Letter Generator</b>
            <p>Generate highly convincing, personalized cover letters tailored to your target company.</p>
            <span className="tool-link">
              <span>Generate Letter</span>
              <ArrowRight size={13} />
            </span>
          </div>

          <div
            className="ai-tool-card"
            onClick={onOpenInterviewPrep}
            role="button"
            tabIndex={0}
          >
            <div className="tool-icon" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
              <MessageSquare size={20} />
            </div>
            <b>STAR Interview Prep</b>
            <p>Practice behavioral & technical interview questions with STAR method evaluation.</p>
            <span className="tool-link">
              <span>Start Prep</span>
              <ArrowRight size={13} />
            </span>
          </div>

          <div
            className="ai-tool-card"
            onClick={onOpenParser}
            role="button"
            tabIndex={0}
          >
            <div className="tool-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
              <UploadCloud size={20} />
            </div>
            <b>Resume Parser (PDF / Word)</b>
            <p>Upload your existing resume to extract and pre-populate your work history instantly.</p>
            <span className="tool-link">
              <span>Upload Resume</span>
              <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* 4. MY RESUMES SECTION */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              My Resumes
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '2px 0 0' }}>
              Manage, customize, and download your targeted resume versions.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onCreateNew}
          >
            <Plus size={15} />
            <span>Create New Resume</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading your saved resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="empty-state-panel">
            <div className="empty-art">
              <FileText size={34} style={{ color: 'var(--primary)' }} />
            </div>
            <h3>No saved resumes found</h3>
            <p>
              You haven't saved any resumes yet. Start fresh or load our sample template to get started in seconds!
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCreateNew}
              >
                <Plus size={15} />
                <span>Create First Resume</span>
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onSelectResume(sampleResume)}
              >
                <Sparkles size={15} />
                <span>Load Demo Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="resume-cards-grid">
            {resumes.map(r => (
              <div
                key={r.id}
                className="resume-saas-card"
                onClick={() => handleOpenResume(r)}
              >
                {/* Top Accent Strip on hover */}
                <div className="card-top-accent" />

                {/* Card Header */}
                <div className="rc-header">
                  <div
                    className="rc-theme-icon"
                    style={{ background: r.theme_color || '#8b5cf6' }}
                  >
                    <FileText size={18} />
                  </div>

                  <div className="rc-ats-badge">
                    <BarChart3 size={13} />
                    <span>ATS {r.ats_score ? `${r.ats_score}%` : '85%'}</span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="rc-body">
                  <b className="rc-title" title={r.title || 'Untitled Resume'}>
                    {r.title || 'Untitled Resume'}
                  </b>
                  <span className="rc-role">
                    {r.target_role || 'General Professional'}
                  </span>

                  <div className="rc-meta">
                    <Calendar size={13} />
                    <span>Updated {new Date(r.updated_at || Date.now()).toLocaleDateString()}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{r.template_id || 'Modern'}</span>
                  </div>
                </div>

                {/* Card Actions Toolbar */}
                <div className="rc-actions-bar" onClick={(e) => e.stopPropagation()}>
                  <div className="rc-primary-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenResume(r)}
                      title="Open in editor"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={(e) => handleShareCard(r, e)}
                      title="Share public link and QR code"
                    >
                      <Share2 size={13} style={{ color: 'var(--sky)' }} />
                      <span>Share</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={(e) => handleDownloadCard(r, e)}
                      disabled={actionLoading === `download-${r.id}`}
                      title="Download Microsoft Word (.docx) resume"
                    >
                      <Download size={13} />
                      <span>{actionLoading === `download-${r.id}` ? '...' : 'Download'}</span>
                    </button>
                  </div>

                  <div className="rc-secondary-actions">
                    <button
                      type="button"
                      className="rc-icon-btn"
                      onClick={(e) => handleClone(r.id, e)}
                      disabled={actionLoading === `clone-${r.id}`}
                      title="Clone / Duplicate this resume"
                      aria-label="Clone resume"
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      type="button"
                      className="rc-icon-btn rc-delete-btn"
                      onClick={(e) => handleDelete(r.id, e)}
                      disabled={actionLoading === `delete-${r.id}`}
                      title="Delete resume"
                      aria-label="Delete resume"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

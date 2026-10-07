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
  Sparkles
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { emptyResume, sampleResume } from '../data/sampleResume';
import { exportResumeToDocx } from '../utils/docxExport';

export default function Dashboard({
  onSelectResume,
  onCreateNew,
  onBackToEditor,
  onOpenShare,
  onDeleteResume
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={onBackToEditor}
            style={{ marginBottom: '0.75rem' }}
          >
            <ArrowLeft size={14} /> Back to Editor
          </button>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            My Resumes Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage, duplicate, and tailor all your professional resumes for different job applications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Create New Resume
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your saved resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <FileText size={28} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            No saved resumes found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            You haven't saved any resumes yet. Start fresh or use our 1-click sample template to get hired faster!
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onCreateNew}>
              <Plus size={15} /> Create First Resume
            </button>
            <button className="btn btn-outline" onClick={() => onSelectResume(sampleResume)}>
              <Sparkles size={15} /> Load Demo Template
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: '1.5rem'
        }}>
          {resumes.map(r => (
            <div
              key={r.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
                border: '1px solid var(--border-color)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              onClick={() => handleOpenResume(r)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: r.theme_color || '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}>
                    <FileText size={18} />
                  </div>

                  <span className="ats-score-badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
                    <BarChart3 size={12} /> ATS {r.ats_score ? `${r.ats_score}%` : '85%'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {r.title || 'Untitled Resume'}
                </h3>
                <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  {r.target_role || 'General Professional'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  <Calendar size={13} />
                  <span>Updated {new Date(r.updated_at || Date.now()).toLocaleDateString()}</span>
                  <span>•</span>
                  <span style={{ textTransform: 'capitalize' }}>{r.template_id || 'Modern'} Template</span>
                </div>
              </div>

              {/* Action Buttons: [ Edit ], [ Share ], [ Download ] */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleOpenResume(r); }}
                    title="Open in editor"
                  >
                    <Edit3 size={13} /> Edit
                  </button>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => handleShareCard(r, e)}
                    title="Share public link and QR code"
                  >
                    <Share2 size={13} /> Share
                  </button>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => handleDownloadCard(r, e)}
                    disabled={actionLoading === `download-${r.id}`}
                    title="Download Microsoft Word (.docx) resume"
                  >
                    <Download size={13} /> {actionLoading === `download-${r.id}` ? '...' : 'Download'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => handleClone(r.id, e)}
                    disabled={actionLoading === `clone-${r.id}`}
                    title="Clone / Duplicate this resume"
                    aria-label="Clone resume"
                  >
                    <Copy size={13} />
                  </button>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => handleDelete(r.id, e)}
                    disabled={actionLoading === `delete-${r.id}`}
                    style={{ color: '#ef4444' }}
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
  );
}

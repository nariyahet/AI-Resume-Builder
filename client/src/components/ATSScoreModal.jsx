import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Layers,
  Check,
  FileText,
  RotateCcw,
  Info
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ATSScoreModal({ isOpen, onClose, resume, setResume }) {
  const [loading, setLoading] = useState(false);
  const [atsData, setAtsData] = useState(null);
  const [addedKeywords, setAddedKeywords] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [showJdInput, setShowJdInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      calculateScore();
    }
  }, [isOpen]);

  const calculateScore = async (customJd = jobDescription) => {
    setLoading(true);
    setAddedKeywords([]);
    try {
      const res = await axiosClient.post('/ai/calculate-ats', {
        targetRole: resume?.target_role || '',
        resume,
        jobDescription: customJd || ''
      });
      if (res.data?.success) {
        setAtsData(res.data);
      }
    } catch (err) {
      console.error('ATS calc error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = (keyword) => {
    if (!resume?.skills?.includes(keyword)) {
      setResume(prev => ({
        ...prev,
        skills: [...(prev.skills || []), keyword]
      }));
      setAddedKeywords(prev => [...prev, keyword]);
    }
  };

  if (!isOpen) return null;

  const totalScore = typeof atsData?.score === 'number' ? atsData.score : null;
  const dimensions = atsData?.dimensions || {};

  const dimensionList = [
    {
      label: '1. Skills & Competencies Alignment',
      value: typeof dimensions.skillsAlignment === 'number' ? dimensions.skillsAlignment : null,
      color: '#38bdf8'
    },
    {
      label: '2. Keyword Alignment & Density',
      value: typeof dimensions.keywordAlignment === 'number' ? dimensions.keywordAlignment : null,
      color: '#a855f7'
    },
    {
      label: '3. Experience Depth & Relevance',
      value: typeof dimensions.experienceRelevance === 'number' ? dimensions.experienceRelevance : null,
      color: '#f59e0b'
    },
    {
      label: '4. Resume Readability & Structure',
      value: typeof dimensions.resumeReadability === 'number' ? dimensions.resumeReadability : null,
      color: '#10b981'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: '#10b981' }} />
            <h3 className="modal-title">ATS Optimization Score & Compatibility Analysis</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle / JD Accordion */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} style={{ color: 'var(--primary)' }} />
              <span>
                {jobDescription.trim() ? 'Mode B: Job-Specific ATS Optimization' : 'Mode A: General Resume ATS Optimization'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              onClick={() => setShowJdInput(prev => !prev)}
            >
              {showJdInput ? 'Hide Job Description' : (jobDescription.trim() ? 'Edit Target JD' : '+ Add Job Description')}
            </button>
          </div>

          {showJdInput && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Paste the target Job Description here for job-specific keyword & skills analysis..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                {jobDescription && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setJobDescription('');
                      calculateScore('');
                    }}
                    disabled={loading}
                  >
                    Clear (Switch to General Mode)
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => calculateScore(jobDescription)}
                  disabled={loading}
                >
                  <RotateCcw size={13} />
                  <span>Re-run Analysis</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>Analyzing Resume Compatibility...</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Evaluating Skills Alignment, Keyword Density, Experience Relevance, and Machine Readability
            </p>
          </div>
        ) : atsData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Overall Score Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '1.15rem 1.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  ATS Optimization Score
                </span>
                <h2 className="ats-total-score-val" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, color: '#10b981' }}>
                  {totalScore !== null ? totalScore : 'Not available'}
                  {totalScore !== null && <span className="ats-total-score-max" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/100</span>}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="ats-score-badge" style={{ fontSize: '0.85rem' }}>
                  {atsData.verdict || 'Optimization Estimate'}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {atsData.aiPowered ? '✨ AI-powered ATS analysis' : '📋 Rule-based ATS analysis'}
                </div>
              </div>
            </div>

            {/* 4-DIMENSION ATS BREAKDOWN BARS */}
            <div className="ats-breakdown-card" style={{ borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <h4 className="ats-breakdown-heading" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={15} style={{ color: '#38bdf8' }} /> Dimension Breakdown Analysis:
              </h4>

              {dimensionList.map((dim, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span className="ats-dimension-label">{dim.label}</span>
                    <strong style={{ color: dim.color }}>
                      {dim.value !== null ? `${dim.value}%` : 'Not available'}
                    </strong>
                  </div>
                  <div className="ats-progress-track" style={{ height: '6px', borderRadius: '999px', overflow: 'hidden', background: 'var(--border-color)' }}>
                    <div
                      style={{
                        width: dim.value !== null ? `${Math.min(100, Math.max(0, dim.value))}%` : '0%',
                        height: '100%',
                        background: dim.color,
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* MISSING KEYWORD SUGGESTIONS (Safe 1-Click Inject) */}
            {Array.isArray(atsData.missingKeywords) && atsData.missingKeywords.length > 0 && (
              <div>
                <h4 className="ats-missing-heading" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} /> Missing Keywords
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Add a missing keyword only if it accurately reflects your genuine experience or skills.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {atsData.missingKeywords.map((kw, i) => {
                    const isAdded = addedKeywords.includes(kw) || resume?.skills?.includes(kw);
                    return (
                      <button
                        key={i}
                        className={`btn btn-outline btn-sm ats-keyword-btn ${isAdded ? 'added' : ''}`}
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleAddKeyword(kw)}
                        disabled={isAdded}
                      >
                        {isAdded ? <><Check size={12} /> Added</> : `+ ${kw}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths */}
            {Array.isArray(atsData.strengths) && atsData.strengths.length > 0 && (
              <div>
                <h4 className="ats-strengths-heading" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={15} /> Identified Strengths
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: 0, padding: 0 }}>
                  {atsData.strengths.map((str, i) => (
                    <li key={i} className="ats-strength-item" style={{ fontSize: '0.8rem', paddingLeft: '1.2rem', position: 'relative' }}>
                      <span className="ats-strength-check" style={{ position: 'absolute', left: 0 }}>✔</span> {str}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Optimization Suggestions */}
            {Array.isArray(atsData.suggestions) && atsData.suggestions.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                  <Info size={15} style={{ color: 'var(--primary)' }} /> Optimization Suggestions
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: 0, padding: 0 }}>
                  {atsData.suggestions.map((sug, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>•</span> {sug}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Professional Disclaimer */}
            <div style={{
              background: 'rgba(100, 116, 139, 0.08)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                ATS scores are optimization estimates. Different employers may use different ATS systems and screening rules, so no score guarantees an interview or job.
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onClose}
            >
              Done & Return to Editor
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

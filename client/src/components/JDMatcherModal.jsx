import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Check,
  Info
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function JDMatcherModal({ isOpen, onClose, resume, setResume }) {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [appliedSummary, setAppliedSummary] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    setAppliedSummary(false);
    try {
      const res = await axiosClient.post('/ai/match-jd', {
        jobDescription,
        resume
      });
      if (res.data?.success) {
        setMatchResult(res.data);
      }
    } catch (err) {
      alert('Error analyzing job description. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = (kw) => {
    if (!resume?.skills?.includes(kw)) {
      setResume(prev => ({
        ...prev,
        skills: [...(prev.skills || []), kw]
      }));
    }
  };

  const handleApplyTailoredSummary = () => {
    if (matchResult?.tailoredSummary) {
      setResume(prev => ({
        ...prev,
        summary: matchResult.tailoredSummary
      }));
      setAppliedSummary(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="modal-title">Job Description (JD) Matcher & Tailor</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Paste target job responsibilities to compare keyword alignment and receive evidence-based tailoring suggestions without fabricating qualifications.
        </p>

        {/* Input Area */}
        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label">Job Description (JD)</label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Paste target job responsibilities, required skills, and qualification text here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <button
          className="btn btn-ai"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={handleAnalyze}
          disabled={loading || !jobDescription.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing Match & Keywords...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Analyze & Match with Resume</span>
            </>
          )}
        </button>

        {/* Results View */}
        {matchResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            {/* Score Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <span style={{ fontSize: '0.775rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  JD Alignment Score
                </span>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1 }}>
                  {matchResult.matchScore}%
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="ats-score-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                  {matchResult.verdict || 'Alignment Estimated'}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {matchResult.aiPowered ? '✨ AI-evaluated' : '📋 Rule-based match'}
                </div>
              </div>
            </div>

            {/* Matched Keywords */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} /> Matched Keywords Found in Your Resume:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {matchResult.matchingKeywords?.length > 0 ? (
                  matchResult.matchingKeywords.map((kw, i) => (
                    <span key={i} className="skill-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      ✔ {kw}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No direct keyword overlaps detected yet.</span>
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            {matchResult.missingKeywords?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} /> Missing from Resume (Add only if you genuinely have this skill):
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Add a missing keyword only if it accurately reflects your genuine experience or skills.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {matchResult.missingKeywords.map((kw, i) => {
                    const isAdded = resume?.skills?.includes(kw);
                    return (
                      <button
                        key={i}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', borderColor: 'var(--border-color)' }}
                        onClick={() => handleAddKeyword(kw)}
                        disabled={isAdded}
                        title="Add to skills if genuine"
                      >
                        {isAdded ? <><Check size={12} /> Added</> : `+ ${kw}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tailored Summary */}
            {matchResult.tailoredSummary && (
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={14} /> Tailored Professional Summary:
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleApplyTailoredSummary}
                    disabled={appliedSummary}
                  >
                    {appliedSummary ? <><Check size={13} /> Applied!</> : 'Apply to Resume'}
                  </button>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                  {matchResult.tailoredSummary}
                </p>
              </div>
            )}

            {/* Disclaimer */}
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
                Match scores are estimated keyword overlaps. Never add skills, achievements, or credentials that you do not genuinely possess.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

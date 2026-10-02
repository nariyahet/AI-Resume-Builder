import React, { useState } from 'react';
import { 
  X, 
  Target, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Check
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
    if (!resume.skills?.includes(kw)) {
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Job Description (JD) Matcher & Auto-Tailor</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
          Paste the Job Description from LinkedIn, Naukri, or Indeed. Our AI will compute your ATS compatibility and tailor your resume to match this specific job!
        </p>

        {/* Input Area */}
        <div className="form-group">
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
              background: matchResult.matchScore >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${matchResult.matchScore >= 80 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <span style={{ fontSize: '0.775rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                  JD Alignment Score
                </span>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: matchResult.matchScore >= 80 ? '#34d399' : '#fbbf24', lineHeight: 1.1 }}>
                  {matchResult.matchScore}%
                </h2>
              </div>
              <span className="ats-score-badge" style={{ 
                background: matchResult.matchScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: matchResult.matchScore >= 80 ? '#34d399' : '#fbbf24'
              }}>
                {matchResult.verdict || 'Match Calculated'}
              </span>
            </div>

            {/* Matched Keywords */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} /> Matched Keywords Found in Your Resume:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {matchResult.matchingKeywords?.map((kw, i) => (
                  <span key={i} className="skill-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0' }}>
                    ✔ {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            {matchResult.missingKeywords?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} /> Missing Keywords in Your Resume (Click to Add to Skills):
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {matchResult.missingKeywords.map((kw, i) => (
                    <button 
                      key={i}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', borderColor: '#f59e0b', color: '#fef08a' }}
                      onClick={() => handleAddKeyword(kw)}
                      title="Add to skills"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tailored Summary */}
            {matchResult.tailoredSummary && (
              <div style={{ background: '#111827', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                    ✨ AI-Tailored Summary for this Specific Job:
                  </span>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleApplyTailoredSummary}
                    disabled={appliedSummary}
                  >
                    {appliedSummary ? <><Check size={13} /> Applied!</> : 'Apply to Resume'}
                  </button>
                </div>
                <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {matchResult.tailoredSummary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

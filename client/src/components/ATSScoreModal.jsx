import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ATSScoreModal({ isOpen, onClose, resume, setResume }) {
  const [loading, setLoading] = useState(false);
  const [atsData, setAtsData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      calculateScore();
    }
  }, [isOpen]);

  const calculateScore = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post('/ai/calculate-ats', {
        targetRole: resume.target_role,
        resume
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
    if (!resume.skills?.includes(keyword)) {
      setResume(prev => ({
        ...prev,
        skills: [...(prev.skills || []), keyword]
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: '#10b981' }} />
            <h3 className="modal-title">ATS Compatibility Analysis</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
            <p style={{ color: '#f1f5f9', fontWeight: 600 }}>Analyzing ATS Keywords & Structure...</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Checking alignment against "{resume.target_role || 'Target Role'}"</p>
          </div>
        ) : atsData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Score Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                  ATS Match Score
                </span>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399', lineHeight: 1.1 }}>
                  {atsData.score}<span style={{ fontSize: '1.25rem', color: '#6ee7b7' }}>/100</span>
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="ats-score-badge">
                  {atsData.verdict || 'Good Alignment'}
                </span>
              </div>
            </div>

            {/* Strengths */}
            {atsData.strengths && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={15} /> Key Profile Strengths
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {atsData.strengths.map((str, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: '#cbd5e1', paddingLeft: '1.2rem', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>✔</span> {str}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Keywords to Add */}
            {atsData.missingKeywords && atsData.missingKeywords.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} /> Recommended Keywords (Click to Add to Skills)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {atsData.missingKeywords.map((kw, i) => (
                    <button
                      key={i}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', borderColor: '#f59e0b', color: '#fef08a' }}
                      onClick={() => handleAddKeyword(kw)}
                      title="Add to resume skills"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {atsData.suggestions && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Actionable Improvement Suggestions
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {atsData.suggestions.map((sug, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: '#cbd5e1', paddingLeft: '1.2rem', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#60a5fa' }}>•</span> {sug}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

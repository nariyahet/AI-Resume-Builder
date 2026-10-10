import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function InterviewPrepModal({ isOpen, onClose, resume }) {
  const [questions, setQuestions] = useState([]);
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  // Cumulative session history to guarantee zero repetition across multiple regenerations
  const seenQuestionsRef = useRef(new Set());

  // Initialize or synchronize seen questions when questions exist
  useEffect(() => {
    if (Array.isArray(questions) && questions.length > 0) {
      questions.forEach(q => {
        if (q && q.question) seenQuestionsRef.current.add(q.question.trim());
      });
    }
  }, [questions]);

  // Reset session history when opening for a different resume or target role
  const sessionKey = `${resume?.id || resume?.title || 'draft'}::${resume?.target_role || ''}`;
  const lastSessionKeyRef = useRef(sessionKey);
  useEffect(() => {
    if (sessionKey !== lastSessionKeyRef.current) {
      lastSessionKeyRef.current = sessionKey;
      seenQuestionsRef.current.clear();
      setQuestions([]);
    }
  }, [sessionKey]);

  if (!isOpen) return null;

  const handleGenerate = async (isRegenerate = false) => {
    setLoading(true);
    try {
      const prevList = isRegenerate ? Array.from(seenQuestionsRef.current) : [];
      const payload = {
        targetRole: resume?.target_role,
        resume,
        regenerate: Boolean(isRegenerate),
        previousQuestions: prevList
      };
      const res = await axiosClient.post('/ai/interview-prep', payload);
      if (res.data?.success && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
        setIsAiPowered(!!res.data.aiPowered);
        setExpandedIndex(0);
        // Track the newly returned questions in cumulative session history
        res.data.questions.forEach(q => {
          if (q && q.question) seenQuestionsRef.current.add(q.question.trim());
        });
      }
    } catch (err) {
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="modal-title">Interview Prep & Model Answers</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Curated technical & behavioral interview questions tailored to your genuine experience for the <strong>"{resume?.target_role || 'Target Role'}"</strong> position.
        </p>

        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Lightbulb size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              Analyze your resume's genuine tech stack, projects, and experience bullets to generate authentic questions recruiters ask.
            </p>
            <button
              className="btn btn-ai"
              style={{ justifyContent: 'center', margin: '0 auto' }}
              onClick={() => handleGenerate(false)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyzing Resume & Generating Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Interview Questions</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {questions.length} Targeted Questions:
                </span>
                <span className="ats-score-badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                  {isAiPowered ? '✨ Gemini AI Prep' : '📋 Rule-based Interview Prep'}
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleGenerate(true)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Regenerate</span>
                  </>
                )}
              </button>
            </div>

            {questions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  style={{
                    padding: '0.9rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '0.5rem',
                    background: expandedIndex === idx ? 'rgba(99, 102, 241, 0.06)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: q.type === 'Technical' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: q.type === 'Technical' ? '#38bdf8' : '#a855f7',
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      {q.type}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-word', flex: 1, minWidth: '160px' }}>
                      {idx + 1}. {q.question}
                    </span>
                  </div>
                  {expandedIndex === idx ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </div>

                {expandedIndex === idx && (
                  <div style={{ padding: '1rem 1.1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} /> Recommended Model Answer (STAR Method):
                      </span>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5, marginTop: '0.35rem' }}>
                        {q.idealAnswer}
                      </p>
                    </div>

                    {q.proTip && (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '0.6rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.4rem'
                      }}>
                        <Lightbulb size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
                        <span><strong>Recruiter Pro-Tip:</strong> {q.proTip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
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
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post('/ai/interview-prep', {
        targetRole: resume?.target_role,
        resume
      });
      if (res.data?.success && Array.isArray(res.data.questions)) {
        setQuestions(res.data.questions);
        setExpandedIndex(0);
      }
    } catch (err) {
      alert('Failed to generate interview questions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} style={{ color: '#10b981' }} />
            <h3 className="modal-title">AI Interview Prep & Model Answers</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
          Get 5 tailored technical & behavioral interview questions likely to be asked for the <strong>"{resume?.target_role || 'Target Role'}"</strong> position, with ideal STAR answers.
        </p>

        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Lightbulb size={24} style={{ color: '#34d399' }} />
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.25rem' }}>
              Click below to let AI analyze your resume's tech stack, experience bullets, and generate questions top recruiters will ask you.
            </p>
            <button 
              className="btn btn-ai"
              style={{ justifyContent: 'center', margin: '0 auto' }}
              onClick={handleGenerate}
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
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                {questions.length} Targeted Questions Generated:
              </span>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={handleGenerate}
                disabled={loading}
              >
                <Sparkles size={12} /> Regenerate
              </button>
            </div>

            {questions.map((q, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: '#111827', 
                  border: '1px solid #334155', 
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
                    background: expandedIndex === idx ? 'rgba(51, 65, 85, 0.4)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      padding: '0.15rem 0.45rem', 
                      borderRadius: '4px',
                      background: q.type === 'Technical' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      color: q.type === 'Technical' ? '#60a5fa' : '#c084fc',
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      {q.type}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', wordBreak: 'break-word', flex: 1, minWidth: '160px' }}>
                      {idx + 1}. {q.question}
                    </span>
                  </div>
                  {expandedIndex === idx ? <ChevronUp size={16} style={{ color: '#94a3b8', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />}
                </div>

                {expandedIndex === idx && (
                  <div style={{ padding: '1rem 1.1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} /> Recommended Model Answer (STAR Method):
                      </span>
                      <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5, marginTop: '0.35rem' }}>
                        {q.idealAnswer}
                      </p>
                    </div>

                    {q.proTip && (
                      <div style={{ 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        border: '1px solid rgba(245, 158, 11, 0.25)', 
                        padding: '0.6rem 0.85rem', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        color: '#fde68a',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.4rem'
                      }}>
                        <Lightbulb size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
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

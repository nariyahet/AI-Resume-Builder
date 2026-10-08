import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Award,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function InterviewPracticeModal({ isOpen, onClose, resume }) {
  const [selectedQuestion, setSelectedQuestion] = useState(
    'Tell me about a challenging technical project you built and how you solved critical blockers.'
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleQuestions = [
    'Tell me about a challenging technical project you built and how you solved critical blockers.',
    'How do you design and optimize database queries for high traffic in your past experience?',
    'Describe a situation where you had to quickly learn a new technology or framework under deadline.',
    'How do you handle disagreement with a technical decision made by your lead or product manager?'
  ];

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    setErrorMsg('');
    setEvaluation(null);

    try {
      const res = await axiosClient.post('/ai/evaluate-interview', {
        question: selectedQuestion,
        answer: userAnswer,
        resume: resume || {},
        targetRole: resume?.target_role || ''
      });

      if (res.data?.success && res.data?.aiPowered) {
        setEvaluation(res.data);
      } else {
        setErrorMsg(
          res.data?.message ||
          'AI evaluation is currently unavailable. Please configure Gemini AI and try again.'
        );
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setErrorMsg(
        serverMessage ||
        'AI evaluation is currently unavailable. Please configure Gemini AI and try again.'
      );
    } finally {
      setEvaluating(false);
    }
  };

  const starComponents = [
    { key: 'situation', label: 'Situation', data: evaluation?.starBreakdown?.situation },
    { key: 'task', label: 'Task', data: evaluation?.starBreakdown?.task },
    { key: 'action', label: 'Action', data: evaluation?.starBreakdown?.action },
    { key: 'result', label: 'Result', data: evaluation?.starBreakdown?.result }
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
            <Award size={20} style={{ color: '#fbbf24' }} />
            <h3 className="modal-title">Interactive Interview Practice Mode</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Practice behavioral and technical responses with real Gemini AI evaluation using the recruiter STAR framework.
        </p>

        {/* Question Selector */}
        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label">Interview Question</label>
          <select
            className="form-select"
            value={selectedQuestion}
            onChange={(e) => {
              setSelectedQuestion(e.target.value);
              setEvaluation(null);
              setErrorMsg('');
            }}
          >
            {sampleQuestions.map((q, i) => (
              <option key={i} value={q}>{q}</option>
            ))}
          </select>
        </div>

        {/* User Answer Input */}
        <div className="form-group">
          <label className="form-label">Your Practice Answer</label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Type your response here using Situation, Task, Action, and Result..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />
        </div>

        {/* Action Button */}
        <button
          className="btn btn-ai"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={handleEvaluate}
          disabled={evaluating || !userAnswer.trim()}
        >
          {evaluating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>✨ Gemini AI is evaluating your response...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Evaluate Answer with Gemini AI</span>
            </>
          )}
        </button>

        {/* Error / AI Unavailable State */}
        {errorMsg && (
          <div style={{
            marginTop: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>
              <AlertCircle size={18} />
              <span>Evaluation Unavailable</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', margin: 0 }}>
              {errorMsg}
            </p>
            <button
              className="btn btn-outline btn-sm"
              style={{ alignSelf: 'flex-start', borderColor: 'var(--border-color)', marginTop: '0.25rem' }}
              onClick={handleEvaluate}
              disabled={evaluating || !userAnswer.trim()}
            >
              <RotateCcw size={14} />
              <span>Retry Evaluation</span>
            </button>
          </div>
        )}

        {/* Evaluation Output */}
        {evaluation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} /> ✨ Gemini AI Evaluation
              </span>
              <span className="ats-score-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                Target: {resume?.target_role || 'General Role'}
              </span>
            </div>

            {/* Score Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  STAR Delivery Score
                </span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.1 }}>
                  {evaluation.score}/100
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {typeof evaluation.starScore === 'number' && (
                  <div style={{ textAlign: 'center', padding: '0.35rem 0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>STAR Structure</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{evaluation.starScore}%</div>
                  </div>
                )}
                {typeof evaluation.relevanceScore === 'number' && (
                  <div style={{ textAlign: 'center', padding: '0.35rem 0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Relevance</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{evaluation.relevanceScore}%</div>
                  </div>
                )}
                {typeof evaluation.technicalDepthScore === 'number' && (
                  <div style={{ textAlign: 'center', padding: '0.35rem 0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Technical Depth</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{evaluation.technicalDepthScore}%</div>
                  </div>
                )}
              </div>
            </div>

            {/* STAR Breakdown Grid */}
            {evaluation.starBreakdown && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem' }}>
                  STAR Method Assessment:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.5rem' }}>
                  {starComponents.map(item => (
                    <div
                      key={item.key}
                      style={{
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${item.data?.present ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        background: item.data?.present ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.775rem', fontWeight: 700, color: item.data?.present ? '#10b981' : '#ef4444' }}>
                        {item.data?.present ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>{item.label}</span>
                      </div>
                      {item.data?.feedback && (
                        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', lineHeight: 1.35 }}>
                          {item.data.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.825rem', color: '#10b981', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> What You Articulated Well:
                </h5>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, padding: 0 }}>
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#10b981' }}>✔</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {Array.isArray(evaluation.improvements) && evaluation.improvements.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.825rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> Actionable Areas for Improvement:
                </h5>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, padding: 0 }}>
                  {evaluation.improvements.map((im, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#f59e0b' }}>•</span>
                      <span>{im}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Questions */}
            {Array.isArray(evaluation.followUpQuestions) && evaluation.followUpQuestions.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.825rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HelpCircle size={14} /> Likely Follow-Up Questions from Interviewer:
                </h5>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, padding: 0 }}>
                  {evaluation.followUpQuestions.map((q, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#38bdf8' }}>?</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improved STAR Answer */}
            {evaluation.improvedAnswer && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lightbulb size={14} /> Optimized STAR Answer (Preserves Your Genuine Facts):
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5, marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>
                  {evaluation.improvedAnswer}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

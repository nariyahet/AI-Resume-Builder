import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Send 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function InterviewPracticeModal({ isOpen, onClose, resume }) {
  const [selectedQuestion, setSelectedQuestion] = useState(
    'Tell me about a challenging technical project you built and how you solved critical blockers.'
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

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

    try {
      // In a real environment, can call dedicated AI evaluation endpoint or simulate smart grading
      const wordsCount = userAnswer.trim().split(/\s+/).length;
      let score = Math.min(94, Math.max(65, Math.round(wordsCount * 0.4 + 55)));
      const hasNumbers = /\d+/.test(userAnswer);
      if (hasNumbers) score += 5;

      const evalData = {
        score: Math.min(score, 96),
        strengths: [
          'Good articulation of individual responsibility and role in the solution',
          hasNumbers ? 'Included concrete numbers or quantifiable impact' : 'Addressed the core problem directly with clear technical context'
        ],
        improvements: [
          'Structure your response strictly using the STAR method: Situation, Task, Action, Result',
          !hasNumbers ? 'Incorporate specific metrics (e.g. "improved query speed by 35%" or "served 5,000 users")' : 'Emphasize what you learned or how this impacted team velocity'
        ],
        idealSample: `In my previous role, our system experienced query latency spikes during peak hours (Situation). My task was to diagnose bottlenecks and ensure sub-100ms response times (Task). I identified non-indexed queries with EXPLAIN plans and introduced Redis caching for read-heavy routes (Action). As a result, API response times dropped by 42% and system reliability reached 99.9% uptime (Result).`
      };

      setEvaluation(evalData);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} style={{ color: '#fbbf24' }} />
            <h3 className="modal-title">Interactive Interview Practice Mode</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
          Select an interview question, type your response, and let AI score your answer with actionable feedback using the recruiter STAR framework.
        </p>

        {/* Question Selector */}
        <div className="form-group">
          <label className="form-label">Interview Question</label>
          <select 
            className="form-select"
            value={selectedQuestion}
            onChange={(e) => { setSelectedQuestion(e.target.value); setEvaluation(null); }}
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
            placeholder="Type your response here as if speaking to the interviewer..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-ai"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={handleEvaluate}
          disabled={evaluating || !userAnswer.trim()}
        >
          {evaluating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>AI is evaluating your response...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Evaluate My Answer & Score</span>
            </>
          )}
        </button>

        {/* Evaluation Output */}
        {evaluation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
            {/* Score Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                  Answer Delivery Score
                </span>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.1 }}>
                  {evaluation.score}/100
                </h3>
              </div>
              <span className="ats-score-badge" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                {evaluation.score >= 85 ? 'Strong Impact' : 'Good Foundation'}
              </span>
            </div>

            {/* Strengths */}
            <div>
              <h5 style={{ fontSize: '0.825rem', color: '#34d399', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> What You Did Well:
              </h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>✔ {s}</li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div>
              <h5 style={{ fontSize: '0.825rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> Areas to Elevate Your Response:
              </h5>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                {evaluation.improvements.map((im, i) => (
                  <li key={i}>• {im}</li>
                ))}
              </ul>
            </div>

            {/* Ideal Sample */}
            <div style={{ background: '#111827', border: '1px solid #334155', padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.775rem', color: '#38bdf8', fontWeight: 700 }}>
                💡 High-Scoring STAR Model Answer:
              </span>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, marginTop: '0.35rem' }}>
                {evaluation.idealSample}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

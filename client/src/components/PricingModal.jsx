import React from 'react';
import {
  X,
  Sparkles,
  Check,
  Share2,
  ShieldCheck,
  FileText,
  Bot,
  BarChart3,
  Download,
  Briefcase,
  Mail,
  Award,
  Globe2
} from 'lucide-react';

export default function PricingModal({ isOpen, onClose, onOpenShare }) {
  if (!isOpen) return null;

  const freeFeatures = [
    {
      icon: <Bot size={18} style={{ color: 'var(--primary)' }} />,
      title: 'Unlimited AI Generation',
      desc: 'Powered by Gemini AI for professional summaries, experience bullets & auto-tailoring.'
    },
    {
      icon: <BarChart3 size={18} style={{ color: '#10b981' }} />,
      title: '4-Dimension ATS Scanner',
      desc: 'Real-time ATS scoring, keyword match density audit & 1-click skill injection.'
    },
    {
      icon: <Download size={18} style={{ color: '#38bdf8' }} />,
      title: 'PDF, DOCX & TXT Exports',
      desc: 'High-quality vector PDF, editable Microsoft Word (.docx), and plain text formats.'
    },
    {
      icon: <Briefcase size={18} style={{ color: '#f59e0b' }} />,
      title: 'Job Application Pipeline',
      desc: 'Full-featured Job Tracker with interview stages, salary metrics & status badges.'
    },
    {
      icon: <Mail size={18} style={{ color: '#a855f7' }} />,
      title: 'AI Cover Letter Studio',
      desc: 'Generate tailored cover letters and manage them in your personal library.'
    },
    {
      icon: <Award size={18} style={{ color: '#ec4899' }} />,
      title: 'STAR Interview Simulator',
      desc: 'Behavioral and technical Q&A preparation with STAR framework feedback.'
    },
    {
      icon: <Globe2 size={18} style={{ color: '#06b6d4' }} />,
      title: 'Public Web Resume & QR Code',
      desc: 'Host your live responsive resume online and share via instant QR code.'
    },
    {
      icon: <FileText size={18} style={{ color: '#10b981' }} />,
      title: 'Cloud Auto-Save & History',
      desc: 'Multi-resume management, version history snapshots, and automatic persistence.'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.25rem' }}>
                ✨ All Features Are 100% Free
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                No subscriptions • No credit cards • No paywalls
              </p>
            </div>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Free Banner Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Free Product Pledge
            </span>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.1rem' }}>
              Free for Job Seekers Everywhere
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Every AI feature, template, ATS audit, and export format is unlocked with zero restrictions.
            </p>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#059669',
            padding: '0.4rem 0.85rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 800
          }}>
            ₹0 / Forever Free
          </div>
        </div>

        {/* 8 Feature Highlights */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.65rem' }}>
            What’s Included in Your Free Account:
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '0.75rem'
          }}>
            {freeFeatures.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {feat.icon}
                </div>
                <div>
                  <h5 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                    {feat.title}
                  </h5>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth & Action Bar */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
              🎁 AI Resume Studio is free.
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Help a friend or colleague create their dream resume.
            </div>
          </div>
          {onOpenShare && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { onClose(); onOpenShare(); }}
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600 }}
            >
              <Share2 size={14} />
              <span>Share With Friends</span>
            </button>
          )}
        </div>

        {/* Bottom Close Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1.25rem' }}
            onClick={onClose}
          >
            <Check size={16} />
            <span>Start Building for Free</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <ShieldCheck size={14} style={{ color: '#10b981' }} />
          <span>No credit card required • 100% Free • Open to everyone</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';

export default function PricingModal({ isOpen, onClose }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgraded, setUpgraded] = useState(false);

  if (!isOpen) return null;

  const handleSimulateUpgrade = () => {
    setUpgraded(true);
    setTimeout(() => {
      alert('🎉 Welcome to AI Resume Studio Pro! All Pro AI features unlocked.');
      setUpgraded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={22} style={{ color: '#fbbf24' }} />
            <h3 className="modal-title">Upgrade to AI Resume Studio Pro</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
          Accelerate your job search and stand out to Fortune 500 recruiters with cutting-edge AI features.
        </p>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          
          {/* Free Tier */}
          <div style={{ 
            background: '#111827', 
            border: '1px solid #334155', 
            borderRadius: 'var(--radius-lg)', 
            padding: '1.75rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Starter Tier
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0' }}>
                ₹0 <span style={{ fontSize: '0.875rem', color: '#64748b' }}>/ forever</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Ideal for students and job seekers creating their first resume.
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> 1 Active Resume Draft
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> High-Quality A4 PDF Export
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> Basic ATS Score Checker
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> Modern Tech Template
                </li>
              </ul>
            </div>

            <button 
              className="btn btn-outline" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
              onClick={onClose}
            >
              Current Active Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)', 
            border: '2px solid #7c3aed', 
            borderRadius: 'var(--radius-lg)', 
            padding: '1.75rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              textTransform: 'uppercase'
            }}>
              Most Popular
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase' }}>
                Pro AI Suite
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0' }}>
                ₹499 <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>/ month</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1.25rem' }}>
                Everything you need to apply to 10x more jobs and get 3x more interview callbacks.
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem', color: '#f1f5f9' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#38bdf8' }} /> <strong>Unlimited Resumes in Cloud</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#38bdf8' }} /> <strong>Job Description (JD) Auto-Tailor</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#38bdf8' }} /> <strong>1-Click AI Cover Letter Generator</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#38bdf8' }} /> <strong>AI Interview Question Simulator</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#38bdf8' }} /> <strong>All ATS Templates</strong> (Harvard, Minimal, Modern)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#38bdf8' }} /> <strong>Shareable Web Link & QR Code</strong>
                </li>
              </ul>
            </div>

            <button 
              className="btn btn-ai" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.75rem' }}
              onClick={handleSimulateUpgrade}
              disabled={upgraded}
            >
              {upgraded ? 'Activating Pro Plan...' : 'Unlock Pro Access Now'}
            </button>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', color: '#64748b', fontSize: '0.75rem' }}>
          <ShieldCheck size={15} style={{ color: '#10b981' }} />
          <span>7-Day Money-Back Guarantee • Cancel Anytime • Encrypted Payments</span>
        </div>
      </div>
    </div>
  );
}

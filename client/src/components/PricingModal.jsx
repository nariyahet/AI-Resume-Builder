import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck,
  CreditCard,
  Loader2
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function PricingModal({ isOpen, onClose, onUpgradedSuccess }) {
  const [gateway, setGateway] = useState('razorpay'); // 'razorpay' or 'stripe'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setSuccessMsg('');

    try {
      // 1. Create order
      const orderRes = await axiosClient.post('/billing/create-order', {
        gateway,
        currency: gateway === 'razorpay' ? 'INR' : 'USD'
      });

      if (orderRes.data?.success) {
        // 2. Complete payment verification
        const verifyRes = await axiosClient.post('/billing/verify-payment', {
          gateway,
          orderId: orderRes.data.orderId,
          paymentId: `pay_${Date.now()}`,
          amount: gateway === 'razorpay' ? 49900 : 900,
          currency: gateway === 'razorpay' ? 'INR' : 'USD'
        });

        if (verifyRes.data?.success) {
          setSuccessMsg(`🎉 Success! Upgraded to Pro AI via ${gateway.toUpperCase()}.`);
          if (onUpgradedSuccess) onUpgradedSuccess();
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 2000);
        }
      }
    } catch (err) {
      alert('Checkout error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
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

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
          
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
                Basic features for creating your initial resume.
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> 1 Active Resume Draft
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> 5 AI Generations / Day Limit
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> High-Quality A4 PDF Export
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#10b981' }} /> Basic ATS Score
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
                {gateway === 'razorpay' ? '₹499' : '$9.00'} <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>/ month</span>
              </h2>

              {/* Payment Gateway Toggle */}
              <div style={{ display: 'flex', gap: '0.4rem', margin: '0.75rem 0' }}>
                <button 
                  type="button" 
                  className={`btn btn-sm ${gateway === 'razorpay' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => setGateway('razorpay')}
                >
                  🇮🇳 Razorpay (INR)
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm ${gateway === 'stripe' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => setGateway('stripe')}
                >
                  🌐 Stripe (USD)
                </button>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.825rem', color: '#f1f5f9' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={14} style={{ color: '#38bdf8' }} /> <strong>Unlimited Resumes in Cloud</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={14} style={{ color: '#38bdf8' }} /> <strong>Unlimited AI Generations</strong> (No Daily Quota)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={14} style={{ color: '#38bdf8' }} /> <strong>Job Description (JD) Auto-Tailor</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={14} style={{ color: '#38bdf8' }} /> <strong>Native DOCX Word Document Export</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={14} style={{ color: '#38bdf8' }} /> <strong>Job Tracker & Interview Simulator</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={14} style={{ color: '#38bdf8' }} /> <strong>All Premium Templates & QR Sharing</strong>
                </li>
              </ul>
            </div>

            <button 
              className="btn btn-ai" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.75rem' }}
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing {gateway.toUpperCase()} Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Pay with {gateway === 'razorpay' ? 'Razorpay (₹499)' : 'Stripe ($9)'}</span>
                </>
              )}
            </button>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', color: '#64748b', fontSize: '0.75rem' }}>
          <ShieldCheck size={15} style={{ color: '#10b981' }} />
          <span>Instant Activation • 7-Day Money-Back Guarantee • 256-Bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
}

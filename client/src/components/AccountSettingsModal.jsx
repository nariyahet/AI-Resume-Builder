import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Loader2,
  Zap,
  Receipt,
  Sparkles
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [billingData, setBillingData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '');
      setEmail(user?.email || '');
      fetchBillingUsage();
    }
  }, [isOpen, user]);

  const fetchBillingUsage = async () => {
    try {
      const res = await axiosClient.get('/billing/usage');
      if (res.data?.success) {
        setBillingData(res.data);
      }
    } catch (e) {
      // fallback
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await axiosClient.put('/admin/profile', {
        name,
        email,
        newPassword
      });
      if (res.data?.success) {
        setMsg('Profile updated successfully!');
        if (res.data.user) {
          login(localStorage.getItem('ai_resume_token'), res.data.user);
        }
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete your account, saved resumes, and tracker data. Are you sure?')) return;
    try {
      await axiosClient.delete('/admin/account');
      logout();
      onClose();
      alert('Account deleted.');
    } catch (e) {
      alert('Failed to delete account.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="modal-title">Account Settings & Free Plan</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button
            className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile & Security
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'billing' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('billing')}
          >
            Plan & Usage
          </button>
        </div>

        {msg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
            {msg}
          </div>
        )}

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Change Password (leave blank to keep current)</label>
              <input
                type="password"
                className="form-input"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile Changes'}
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <h5 style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.35rem' }}>
                Danger Zone
              </h5>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
                onClick={handleDeleteAccount}
              >
                Delete My Account & All Data
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PLAN & USAGE */}
        {activeTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Current Plan Badge */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Plan
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={18} style={{ color: 'var(--primary)' }} /> 100% Free Plan — All Features Unlocked
                </h3>
              </div>
              <span className="ats-score-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Free Forever
              </span>
            </div>

            {/* Truthful Usage Stats */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.825rem' }}>
                <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <Zap size={14} style={{ color: '#eab308' }} /> Cloud Resumes Saved
                </span>
                <strong style={{ color: 'var(--primary)' }}>
                  {billingData?.resumesCount ?? 0} (Unlimited allowed)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.825rem' }}>
                <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} /> AI Operations Used Today
                </span>
                <strong style={{ color: '#10b981' }}>
                  {billingData?.aiDailyUsed ?? 0}
                </strong>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                AI Resume Studio is free for all job seekers. All features including PDF/DOCX exports, ATS auditing, cover letters, and interview practice are available without paywalls or credit cards.
              </p>
            </div>

            {/* Historical Invoices (if any exists in DB) */}
            {billingData?.payments && billingData.payments.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Receipt size={14} style={{ color: '#10b981' }} /> Past Transaction Records:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {billingData.payments.map(p => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{p.plan}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({p.gateway})</span>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: 700 }}>
                        Completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

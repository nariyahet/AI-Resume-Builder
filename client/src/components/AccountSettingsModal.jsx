import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  CreditCard, 
  ShieldAlert, 
  Check, 
  Loader2, 
  Zap, 
  Crown,
  Receipt
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
            <User size={20} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Account Settings & Subscription</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
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
            Usage & Invoices
          </button>
        </div>

        {msg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
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

            <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '1rem' }}>
              <h5 style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.35rem' }}>
                Danger Zone
              </h5>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#ef4444', color: '#fca5a5' }}
                onClick={handleDeleteAccount}
              >
                Delete My Account & All Data
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: USAGE & BILLING */}
        {activeTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Current Plan Badge */}
            <div style={{ background: '#111827', border: '1px solid #334155', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Subscription
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {billingData?.isPro ? <><Crown size={18} style={{ color: '#fbbf24' }} /> Pro AI Member</> : 'Free Starter Plan'}
                </h3>
              </div>
              <span className="ats-score-badge" style={{ background: billingData?.isPro ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: billingData?.isPro ? '#fbbf24' : '#60a5fa' }}>
                {billingData?.isPro ? 'Active' : 'Free Tier'}
              </span>
            </div>

            {/* AI Quotas Progress Bar */}
            <div style={{ background: '#111827', border: '1px solid #334155', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.825rem' }}>
                <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={14} style={{ color: '#eab308' }} /> Daily AI Generations Quota
                </span>
                <strong style={{ color: '#fff' }}>
                  {billingData?.isPro ? 'Unlimited (Pro)' : `${billingData?.aiDailyUsed || 1} / ${billingData?.aiDailyLimit || 5} today`}
                </strong>
              </div>
              {!billingData?.isPro && (
                <div style={{ height: '8px', background: '#334155', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${((billingData?.aiDailyUsed || 1) / 5) * 100}%`, height: '100%', background: '#38bdf8', borderRadius: '999px' }} />
                </div>
              )}
            </div>

            {/* Payments / Invoice History */}
            <div>
              <h5 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Receipt size={14} style={{ color: '#10b981' }} /> Billing & Payment History:
              </h5>

              {billingData?.payments?.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No transactions recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {billingData?.payments?.map(p => (
                    <div key={p.id} style={{ background: '#111827', border: '1px solid #334155', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <div>
                        <strong style={{ color: '#fff' }}>{p.plan}</strong>
                        <span style={{ color: '#64748b', marginLeft: '6px' }}>({p.gateway})</span>
                      </div>
                      <div style={{ color: '#34d399', fontWeight: 700 }}>
                        ₹{p.amount / 100} • Completed
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  FileText,
  Briefcase,
  Cpu,
  Globe2,
  Mail,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function AdminDashboardModal({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/admin/metrics');
      if (res.data?.success) {
        setMetrics(res.data.metrics);
      }
    } catch (e) {
      console.warn('Admin metrics error:', e);
      setError(e.response?.data?.message || 'Access denied. Administrator privileges required.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatValue = (val) => {
    if (val === undefined || val === null) return 'Not available';
    return val;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
            <h3 className="modal-title">Platform Admin & Community Analytics</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Real-time metrics on user accounts, cloud resumes, job applications, public portfolios, and Gemini AI operations. 100% Free platform with zero paywalls.
        </p>

        {error ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
            <ShieldCheck size={36} style={{ color: '#ef4444', margin: '0 auto 0.75rem' }} />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Access Denied
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              {error}
            </p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>Loading platform metrics...</p>
          </div>
        ) : (
          /* 6 Free Platform Metric Cards */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginTop: '1rem' }}>

            {/* 1. Total Users */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Users</span>
                <Users size={18} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {formatValue(metrics?.totalUsers)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Active job seekers</span>
            </div>

            {/* 2. Total Resumes */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Cloud Resumes</span>
                <FileText size={18} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {formatValue(metrics?.totalResumes)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Saved & autosaved</span>
            </div>

            {/* 3. Public Resumes */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Public Resumes</span>
                <Globe2 size={18} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {formatValue(metrics?.publicResumes)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Live shareable URLs</span>
            </div>

            {/* 4. Applications Tracked */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Jobs Tracked</span>
                <Briefcase size={18} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {formatValue(metrics?.totalApplicationsTracked)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pipeline applications</span>
            </div>

            {/* 5. Cover Letters */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Cover Letters</span>
                <Mail size={18} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {formatValue(metrics?.totalCoverLetters)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Generated letters</span>
            </div>

            {/* 6. AI Operations */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>AI Operations</span>
                <Cpu size={18} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {formatValue(metrics?.aiOperations)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Gemini AI requests</span>
            </div>

          </div>
        )}

        <button
          className="btn btn-outline"
          style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
          onClick={onClose}
        >
          Close Admin Analytics
        </button>
      </div>
    </div>
  );
}

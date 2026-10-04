import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building,
  DollarSign
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function JobTrackerModal({ isOpen, onClose }) {
  const [applications, setApplications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    location: '',
    salary: '',
    applied_date: new Date().toISOString().split('T')[0],
    status: 'Applied',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchApplications();
    }
  }, [isOpen]);

  const fetchApplications = async () => {
    try {
      const res = await axiosClient.get('/tracker');
      if (res.data?.success) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.warn('Fetch tracker error:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/tracker', formData);
      if (res.data?.success) {
        setShowAddForm(false);
        setFormData({
          company: '',
          role: '',
          location: '',
          salary: '',
          applied_date: new Date().toISOString().split('T')[0],
          status: 'Applied',
          notes: ''
        });
        fetchApplications();
      }
    } catch (err) {
      alert('Failed to save application.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosClient.put(`/tracker/${id}`, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this application?')) return;
    try {
      await axiosClient.delete(`/tracker/${id}`);
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete application.');
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Offer': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: '#10b981' };
      case 'Interview': return { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', border: '#a855f7' };
      case 'Rejected': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444' };
      default: return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: '#3b82f6' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={22} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Job Application Tracker (Kanban / Table)</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', flex: '1 1 200px' }}>
            Track your job hunt pipeline across applied companies, interview dates, and offer letters.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} /> {showAddForm ? 'Cancel' : 'Track New Job'}
          </button>
        </div>

        {/* Add Application Form */}
        {showAddForm && (
          <form onSubmit={handleSave} style={{ background: '#111827', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>Track New Application</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Google, TCS, Startup"
                  required 
                  value={formData.company} 
                  onChange={e => setFormData({ ...formData, company: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Full Stack Developer"
                  required 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Ahmedabad / Remote"
                  value={formData.location} 
                  onChange={e => setFormData({ ...formData, location: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Salary / Compensation</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. ₹12 LPA or $90k"
                  value={formData.salary} 
                  onChange={e => setFormData({ ...formData, salary: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Applied Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.applied_date} 
                  onChange={e => setFormData({ ...formData, applied_date: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pipeline Status</label>
                <select 
                  className="form-select" 
                  value={formData.status} 
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interviewing</option>
                  <option value="Offer">Offer Received 🎉</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes & Follow-up Links</label>
              <textarea 
                className="form-textarea" 
                rows={2}
                placeholder="Interview date, referral name, recruiter contact..."
                value={formData.notes} 
                onChange={e => setFormData({ ...formData, notes: e.target.value })} 
              />
            </div>

            <button type="submit" className="btn btn-ai" style={{ alignSelf: 'flex-start' }}>
              Save Application
            </button>
          </form>
        )}

        {/* Application Cards List */}
        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <Building size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p>No job applications tracked yet. Click "+ Track New Job" above to organize your pipeline.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.map(app => {
              const sc = getStatusColor(app.status);
              return (
                <div 
                  key={app.id} 
                  style={{
                    background: '#111827',
                    border: '1px solid #334155',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#fff' }}>{app.company}</strong>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '999px',
                        background: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                        fontWeight: 600
                      }}>
                        {app.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                      {app.role} {app.location ? `• ${app.location}` : ''} {app.salary ? `• ${app.salary}` : ''}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                      <span>Applied: {app.applied_date}</span>
                      {app.notes && <span>• Notes: {app.notes}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select 
                      className="form-select" 
                      style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem', width: 'auto' }}
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(app.id)}
                      title="Remove from tracker"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

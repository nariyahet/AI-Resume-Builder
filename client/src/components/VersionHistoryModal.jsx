import React, { useState } from 'react';
import { 
  X, 
  History, 
  RotateCcw, 
  BookmarkPlus, 
  Check, 
  Calendar, 
  Clock,
  Sparkles
} from 'lucide-react';

export default function VersionHistoryModal({ 
  isOpen, 
  onClose, 
  resume, 
  setResume 
}) {
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [restoredMsg, setRestoredMsg] = useState('');

  if (!isOpen) return null;

  const versions = resume.version_history || [];

  const handleSaveSnapshot = () => {
    const label = snapshotLabel.trim() || `Snapshot #${versions.length + 1}`;
    const newVersion = {
      id: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      data: {
        summary: resume.summary,
        experience: resume.experience,
        skills: resume.skills,
        education: resume.education,
        projects: resume.projects,
        target_role: resume.target_role,
        template_id: resume.template_id,
        theme_color: resume.theme_color
      }
    };

    setResume(prev => ({
      ...prev,
      version_history: [newVersion, ...(prev.version_history || [])]
    }));
    setSnapshotLabel('');
  };

  const handleRestore = (version) => {
    if (!window.confirm(`Restore resume state to "${version.label}"?`)) return;
    setResume(prev => ({
      ...prev,
      ...version.data
    }));
    setRestoredMsg(`Restored to "${version.label}"!`);
    setTimeout(() => {
      setRestoredMsg('');
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Resume Version History & Restore</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
          Compare previous resume revisions and instantly restore any version created before AI optimizations or edits.
        </p>

        {restoredMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: '#34d399', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={15} />
            <span>{restoredMsg}</span>
          </div>
        )}

        {/* Create Manual Snapshot */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#111827', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #334155', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Label for current version (e.g. Original Before AI JD Tailor)"
            value={snapshotLabel}
            onChange={(e) => setSnapshotLabel(e.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <button className="btn btn-primary" onClick={handleSaveSnapshot} style={{ flexShrink: 0 }}>
            <BookmarkPlus size={15} />
            <span>Save Snapshot</span>
          </button>
        </div>

        {/* Versions List */}
        {versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
            <History size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p>No previous versions recorded yet.</p>
            <p style={{ fontSize: '0.775rem', marginTop: '0.2rem' }}>
              Whenever you use AI auto-tailor or click "Save Snapshot", revisions are preserved here safely.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
              Saved Versions ({versions.length}):
            </span>

            {versions.map((ver, i) => (
              <div 
                key={ver.id || i}
                style={{
                  background: '#111827',
                  border: '1px solid #334155',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{ver.label}</strong>
                    {i === 0 && (
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                        Latest
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={12} />
                    <span>{new Date(ver.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>{ver.data?.skills?.length || 0} skills, {ver.data?.experience?.length || 0} jobs</span>
                  </div>

                  {ver.data?.summary && (
                    <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.4rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{ver.data.summary}"
                    </p>
                  )}
                </div>

                <button 
                  className="btn btn-outline btn-sm"
                  style={{ flexShrink: 0 }}
                  onClick={() => handleRestore(ver)}
                >
                  <RotateCcw size={13} />
                  <span>Restore</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

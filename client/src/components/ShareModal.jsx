import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Lock, 
  Globe2, 
  RotateCw,
  Smartphone
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ShareModal({ isOpen, onClose, resume, setResume }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const resumeId = resume.id || 'demo';
  const shareSlug = resume.share_slug || resumeId;
  const isPublic = resume.is_public !== false;
  const viewCount = resume.view_count || 12;

  const shareUrl = `${origin}/?view=${shareSlug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublic = async () => {
    const nextPublicState = !isPublic;
    setResume(prev => ({ ...prev, is_public: nextPublicState }));
    try {
      await axiosClient.post('/resumes', { ...resume, is_public: nextPublicState });
    } catch (e) {
      console.warn('Update public state failed:', e);
    }
  };

  const handleRegenerateLink = async () => {
    setRegenerating(true);
    const newSlug = `slug_${Date.now().toString(36)}`;
    setResume(prev => ({ ...prev, share_slug: newSlug }));
    try {
      await axiosClient.post('/resumes', { ...resume, share_slug: newSlug });
    } catch (e) {
      console.warn('Regenerate slug warning:', e);
    } finally {
      setTimeout(() => setRegenerating(false), 500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', textAlign: 'center' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={20} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Public Web Resume & Analytics</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* 🟠 RESUME ANALYTICS BANNER */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Resume Analytics
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={18} /> {viewCount} HR Views
            </div>
          </div>

          {/* 🟠 PUBLIC / PRIVATE TOGGLE */}
          <button 
            className="btn btn-outline btn-sm"
            onClick={togglePublic}
            style={{ 
              borderColor: isPublic ? '#10b981' : '#ef4444',
              color: isPublic ? '#34d399' : '#f87171',
              background: isPublic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
            }}
          >
            {isPublic ? <><Globe2 size={13} /> Public (Active)</> : <><Lock size={13} /> Private (Disabled)</>}
          </button>
        </div>

        {isPublic ? (
          <>
            {/* QR Code Container */}
            <div style={{
              background: '#ffffff',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block',
              margin: '0.75rem auto 0.25rem'
            }}>
              <img 
                src={qrUrl} 
                alt="Resume QR Code" 
                style={{ width: '150px', height: '150px', display: 'block' }} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.775rem', color: '#94a3b8' }}>
              <Smartphone size={13} />
              <span>Scan with smartphone camera to view live ATS resume</span>
            </div>

            {/* Shareable Link Box */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input 
                type="text" 
                readOnly 
                className="form-input" 
                value={shareUrl}
                style={{ fontSize: '0.8rem', color: '#38bdf8' }}
              />
              <button className="btn btn-primary" onClick={handleCopy} style={{ flexShrink: 0 }}>
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
              <a 
                href={shareUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <span>Preview Web Resume</span>
                <ExternalLink size={14} />
              </a>

              <button 
                className="btn btn-outline"
                onClick={handleRegenerateLink}
                disabled={regenerating}
                title="Regenerate link to revoke old URL"
              >
                <RotateCw size={14} className={regenerating ? 'animate-spin' : ''} />
                <span>Reset Link</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '2.5rem 1rem', color: '#64748b' }}>
            <Lock size={36} style={{ margin: '0 auto 0.5rem', color: '#ef4444' }} />
            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.35rem' }}>Resume is Private</h4>
            <p style={{ fontSize: '0.825rem' }}>
              Public web link and QR code access are currently disabled. Click "Private" toggle above to re-enable sharing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

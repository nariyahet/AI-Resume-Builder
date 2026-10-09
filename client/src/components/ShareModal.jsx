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
  Smartphone,
  Mail,
  MessageCircle,
  Gift,
  AlertCircle
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ShareModal({ isOpen, onClose, resume, setResume }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!isOpen) return null;

  const isSaved = Boolean(resume && resume.id && resume.id !== 'local-draft');
  const origin = window.location.origin;
  const resumeId = resume?.id || '';
  const shareSlug = resume?.share_slug || resumeId;
  const isPublic = resume?.is_public !== false;
  const viewCount = resume?.view_count !== undefined && resume?.view_count !== null ? Number(resume.view_count) : 0;

  const shareUrl = `${origin}/?view=${shareSlug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const togglePublic = async () => {
    const nextPublicState = !isPublic;
    if (setResume) {
      setResume(prev => ({ ...prev, is_public: nextPublicState }));
    }
    try {
      await axiosClient.post('/resumes', { ...resume, is_public: nextPublicState });
    } catch (e) {
      console.warn('Update public state failed:', e);
    }
  };

  const handleRegenerateLink = async () => {
    setRegenerating(true);
    const newSlug = `slug_${Date.now().toString(36)}`;
    if (setResume) {
      setResume(prev => ({ ...prev, share_slug: newSlug }));
    }
    try {
      await axiosClient.post('/resumes', { ...resume, share_slug: newSlug });
    } catch (e) {
      console.warn('Regenerate slug warning:', e);
    } finally {
      setTimeout(() => setRegenerating(false), 500);
    }
  };

  // WhatsApp share message
  const whatsappText = `I created my resume with AI Resume Studio — it’s free. Check it out: ${shareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  // LinkedIn share URL
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  // Email share mailto
  const emailSubject = 'My Resume';
  const emailBody = `Here is my resume created with AI Resume Studio: ${shareUrl}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={20} style={{ color: 'var(--primary)' }} />
              Share your resume
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Your resume is ready to share.
            </p>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {!isSaved ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <AlertCircle size={28} style={{ color: '#f59e0b' }} />
            </div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Save your resume first to create a share link.
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
              Please save your resume in the editor to sync it with your account before creating a verified public link.
            </p>
            <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '160px', margin: '0 auto' }}>
              Return to Editor
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Resume Analytics & Public Status */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              textAlign: 'left'
            }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Resume Visibility
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={16} style={{ color: '#38bdf8' }} /> {viewCount} HR Views
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={togglePublic}
                style={{
                  borderColor: isPublic ? '#10b981' : '#ef4444',
                  color: isPublic ? '#059669' : '#dc2626',
                  background: isPublic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  fontWeight: 600
                }}
              >
                {isPublic ? <><Globe2 size={13} /> Public (Active)</> : <><Lock size={13} /> Private (Disabled)</>}
              </button>
            </div>

            {isPublic ? (
              <>
                {/* PRIMARY: Copy Link Box */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    readOnly
                    className="form-input"
                    value={shareUrl}
                    style={{ flex: '1 1 240px', fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleCopy}
                    style={{ flexShrink: 0, minWidth: '130px', justifyContent: 'center' }}
                  >
                    {copied ? <><Check size={14} /> ✓ Link copied!</> : <><Copy size={14} /> Copy Link</>}
                  </button>
                </div>

                {/* SOCIAL SHARE BUTTONS: WhatsApp, LinkedIn, Email */}
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    Share With Recruiters & Network
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{
                        flex: '1 1 130px',
                        justifyContent: 'center',
                        borderColor: '#25D366',
                        color: '#128C7E',
                        background: 'rgba(37, 211, 102, 0.08)',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <MessageCircle size={15} style={{ color: '#25D366' }} />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{
                        flex: '1 1 130px',
                        justifyContent: 'center',
                        borderColor: '#0A66C2',
                        color: '#0A66C2',
                        background: 'rgba(10, 102, 194, 0.08)',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <Share2 size={15} style={{ color: '#0A66C2' }} />
                      <span>LinkedIn</span>
                    </a>

                    <a
                      href={emailUrl}
                      className="btn btn-outline btn-sm"
                      style={{
                        flex: '1 1 130px',
                        justifyContent: 'center',
                        borderColor: 'var(--primary)',
                        color: 'var(--primary)',
                        background: 'rgba(99, 102, 241, 0.08)',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <Mail size={15} />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                {/* QR Code Container */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: '#ffffff',
                    padding: '0.9rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-block',
                    margin: '0.25rem auto',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <img
                      src={qrUrl}
                      alt="Resume QR Code"
                      style={{ width: '130px', height: '130px', display: 'block' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <Smartphone size={13} />
                    <span>Scan with smartphone camera to view live ATS resume</span>
                  </div>
                </div>

                {/* Link Utilities */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ flex: '1 1 160px', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <span>Preview Web Resume</span>
                    <ExternalLink size={13} />
                  </a>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleRegenerateLink}
                    disabled={regenerating}
                    title="Regenerate link to revoke old URL"
                  >
                    <RotateCw size={13} className={regenerating ? 'animate-spin' : ''} />
                    <span>Reset Link</span>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Lock size={36} style={{ margin: '0 auto 0.5rem', color: '#ef4444' }} />
                <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.35rem' }}>Resume is Private</h4>
                <p style={{ fontSize: '0.825rem' }}>
                  Public web link and QR code access are currently disabled. Click "Private" toggle above to re-enable sharing.
                </p>
              </div>
            )}

            {/* BOTTOM GROWTH MESSAGE */}
            <div style={{
              marginTop: '0.5rem',
              padding: '0.85rem 1rem',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <Gift size={15} /> 🎁 Share AI Resume Studio
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Help a friend create a professional resume — it's free.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Smartphone 
} from 'lucide-react';

export default function ShareModal({ isOpen, onClose, resumeId, resumeTitle }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = `${origin}/?view=${resumeId || 'demo'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={20} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Share Public Web Resume</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8', textAlign: 'left' }}>
          Share your online resume with recruiters, add it to your LinkedIn profile, or include the QR code directly on business cards!
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#ffffff',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'inline-block',
          margin: '0.5rem auto'
        }}>
          <img 
            src={qrUrl} 
            alt="Resume QR Code" 
            style={{ width: '160px', height: '160px', display: 'block' }} 
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.775rem', color: '#94a3b8' }}>
          <Smartphone size={13} />
          <span>Scan with any smartphone camera to view live resume</span>
        </div>

        {/* Shareable Link Box */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
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

        <div style={{ marginTop: '0.5rem' }}>
          <a 
            href={shareUrl} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>Open Live Web Resume</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Trash2, 
  Copy, 
  Download, 
  Plus, 
  Check, 
  Calendar 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function CoverLetterManagerModal({ isOpen, onClose, onOpenGenerator }) {
  const [letters, setLetters] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchLetters();
    }
  }, [isOpen]);

  const fetchLetters = async () => {
    try {
      const res = await axiosClient.get('/cover-letters');
      if (res.data?.success) {
        setLetters(res.data.letters || []);
      }
    } catch (e) {
      console.warn('Cover letter fetch warning:', e);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (company, text) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${company.replace(/\s+/g, '_')}_Cover_Letter.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved cover letter?')) return;
    try {
      await axiosClient.delete(`/cover-letters/${id}`);
      setLetters(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      alert('Failed to delete cover letter.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={22} style={{ color: '#a855f7' }} />
            <h3 className="modal-title">Saved Cover Letters Library</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
            Access and manage all cover letters previously generated for your target companies.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => { onClose(); onOpenGenerator(); }}>
            <Plus size={14} /> New Cover Letter
          </button>
        </div>

        {letters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <Mail size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p>No saved cover letters in library.</p>
            <p style={{ fontSize: '0.775rem', marginTop: '0.2rem' }}>
              Generate tailored letters in the AI Cover Letter tool to save them here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {letters.map(letter => (
              <div 
                key={letter.id}
                style={{
                  background: '#111827',
                  border: '1px solid #334155',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', wordBreak: 'break-word' }}>
                      {letter.company_name} — <span style={{ color: '#38bdf8' }}>{letter.job_role}</span>
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Tone: {letter.tone || 'Professional'} • Saved on {new Date(letter.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCopy(letter.id, letter.letter_content)}
                    >
                      {copiedId === letter.id ? <><Check size={13} style={{ color: '#10b981' }} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>

                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDownload(letter.company_name, letter.letter_content)}
                    >
                      <Download size={13} /> .txt
                    </button>

                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(letter.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p style={{ 
                  fontSize: '0.8rem', 
                  color: '#cbd5e1', 
                  lineHeight: 1.5, 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-line'
                }}>
                  {letter.letter_content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

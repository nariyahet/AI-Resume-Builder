import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AiKeyModal({ isOpen, onClose }) {
  const { geminiKey, setGeminiKey } = useAuth();
  const [inputKey, setInputKey] = useState(geminiKey || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setGeminiKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setInputKey('');
    setGeminiKey('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Google Gemini AI Settings</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
          The backend provides smart fallback generation out-of-the-box. To unleash full live Google Gemini models (Gemini Flash), enter your free API Key below:
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Google Gemini API Key</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="AIzaSy..." 
              value={inputKey} 
              onChange={(e) => setInputKey(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer" 
              style={{ fontSize: '0.785rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              Get Free Key from Google AI Studio <ExternalLink size={12} />
            </a>

            {geminiKey && (
              <button 
                type="button" 
                onClick={handleClear} 
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Clear Key
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {saved ? (
              <>
                <Check size={16} />
                <span>Key Saved!</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Save API Key</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

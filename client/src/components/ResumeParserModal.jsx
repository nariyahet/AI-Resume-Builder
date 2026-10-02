import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ResumeParserModal({ isOpen, onClose, onParsedSuccess }) {
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file contents.');
    };
    reader.readAsText(file);
  };

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await axiosClient.post('/ai/parse-resume', {
        resumeText: rawText
      });
      if (res.data?.success && res.data.resume) {
        onParsedSuccess(res.data.resume);
        onClose();
      } else {
        setError('Failed to parse resume structure.');
      }
    } catch (err) {
      setError('AI Parsing error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Smart Resume Importer & Parser</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
          Upload your existing resume file or paste raw text. AI will automatically extract your contact info, experience, skills, and education to populate the editor!
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* File Drag/Drop or Select */}
        <label style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #334155',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem 1rem',
          cursor: 'pointer',
          background: 'rgba(30, 41, 59, 0.4)',
          transition: 'border-color 0.2s'
        }}>
          <UploadCloud size={32} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
            {fileName ? `Selected: ${fileName}` : 'Click to Upload Resume (.txt, .md, text files)'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            or paste your text directly in the box below
          </span>
          <input 
            type="file" 
            accept=".txt,.md,.json,.doc,.docx"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </label>

        {/* Or Paste Raw Text */}
        <div className="form-group">
          <label className="form-label">Or Paste Resume Text</label>
          <textarea 
            className="form-textarea"
            rows={6}
            placeholder="Paste complete resume text here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-ai"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={handleParse}
          disabled={loading || !rawText.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Extracting Experience, Skills & Education...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Parse & Populate Editor</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

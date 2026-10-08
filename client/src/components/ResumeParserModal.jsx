import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  Sparkles,
  Loader2,
  AlertCircle,
  FileCheck,
  Info
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ResumeParserModal({ isOpen, onClose, onParsedSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleParse = async () => {
    setLoading(true);
    setError('');

    try {
      if (selectedFile) {
        // Send actual binary file to backend multer + pdf-parse + mammoth endpoint
        const formData = new FormData();
        formData.append('resumeFile', selectedFile);

        const res = await axiosClient.post('/ai/upload-parse', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data?.success && res.data.resume) {
          onParsedSuccess(res.data.resume);
          onClose();
        } else {
          setError(res.data?.message || 'Failed to extract structure from file.');
        }
      } else if (rawText.trim()) {
        // Fallback text parser
        const res = await axiosClient.post('/ai/parse-resume', {
          resumeText: rawText
        });
        if (res.data?.success && res.data.resume) {
          onParsedSuccess(res.data.resume);
          onClose();
        } else {
          setError('Failed to parse text.');
        }
      } else {
        setError('Please select a PDF/DOCX file or paste resume text.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse resume document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="modal-title">PDF & DOCX Resume Parser</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Upload your existing <strong>.pdf</strong> or <strong>.docx</strong> resume to extract and map fields into the editor. Only genuine extracted details are populated.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Real File Upload Drop Zone */}
        <label style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: selectedFile ? '2px solid #10b981' : '2px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem 1rem',
          cursor: 'pointer',
          background: selectedFile ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
          transition: 'all 0.2s'
        }}>
          {selectedFile ? (
            <>
              <FileCheck size={36} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all', textAlign: 'center' }}>
                {selectedFile.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem', textAlign: 'center' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
              </span>
            </>
          ) : (
            <>
              <UploadCloud size={36} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>
                Click to Upload PDF or Word (.docx) File
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', textAlign: 'center' }}>
                Supports binary PDF, Word (.docx), and plain text documents
              </span>
            </>
          )}

          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </label>

        {/* Or Text Alternative */}
        {!selectedFile && (
          <div className="form-group" style={{ marginTop: '0.25rem' }}>
            <label className="form-label">Or Paste Raw Resume Text</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Paste plain resume text here if you don't have the file..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
        )}

        <div style={{
          background: 'rgba(100, 116, 139, 0.08)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Please review imported information before saving. Missing fields (such as links or dates) remain blank and are never fabricated.
          </p>
        </div>

        <button
          className="btn btn-ai"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={handleParse}
          disabled={loading || (!selectedFile && !rawText.trim())}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Parsing Document & Mapping Genuine Resume Fields...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Extract & Populate Editor</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Loader2, 
  Check, 
  AlertCircle,
  FileCheck
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} style={{ color: '#38bdf8' }} />
            <h3 className="modal-title">Real PDF & DOCX Resume Parser</h3>
          </div>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
          Upload your actual <strong>.pdf</strong> or <strong>.docx</strong> file directly. Our backend parser (pdf-parse + mammoth) will extract the raw binary document and AI will auto-populate your entire resume!
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
          border: selectedFile ? '2px solid #10b981' : '2px dashed #334155',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem 1rem',
          cursor: 'pointer',
          background: selectedFile ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.4)',
          transition: 'all 0.2s'
        }}>
          {selectedFile ? (
            <>
              <FileCheck size={36} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all', textAlign: 'center' }}>
                {selectedFile.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#a7f3d0', marginTop: '0.2rem', textAlign: 'center' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
              </span>
            </>
          ) : (
            <>
              <UploadCloud size={36} style={{ color: '#38bdf8', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', textAlign: 'center' }}>
                Click to Upload PDF or Word (.docx) File
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', textAlign: 'center' }}>
                Supports standard binary PDF, Word (.docx), and text files
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
          <div className="form-group">
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

        <button 
          className="btn btn-ai"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          onClick={handleParse}
          disabled={loading || (!selectedFile && !rawText.trim())}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Parsing Binary Document & Mapping Resume Fields...</span>
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

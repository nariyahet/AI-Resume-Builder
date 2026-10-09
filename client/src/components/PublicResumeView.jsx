import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ExternalLink,
  Loader2,
  Lock,
  AlertCircle
} from 'lucide-react';
import ResumePreview from './ResumePreview';
import { exportResumeToPdf } from '../utils/pdfExport';

export default function PublicResumeView({
  resume,
  loading = false,
  error = '',
  onNavigateHome
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!resume) return;
    setIsDownloading(true);
    try {
      await exportResumeToPdf(resume, 'resume-print-area');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = window.location.pathname;
    }
  };

  const candidateName = resume?.personal_info?.fullName || resume?.title || 'Shared Resume';

  return (
    <div className="public-resume-shell">
      {/* 1. Clean Public Header Navigation (Hidden on Print) */}
      <header className="public-resume-header no-print">
        <div
          className="public-header-brand"
          onClick={handleHomeClick}
          title="Go to AI Resume Studio"
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary), #818cf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <FileText size={18} />
          </div>
          <div>
            <div className="public-brand-title">AI Resume Studio</div>
            {resume && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidateName}</div>}
          </div>
          <span className="public-badge">Public Resume</span>
        </div>

        <div className="public-header-actions">
          {resume && !loading && !error && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleDownload}
                disabled={isDownloading}
                title="Download high-quality PDF"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm desktop-only-btn"
                onClick={handlePrint}
                title="Print resume"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleHomeClick}
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600 }}
            title="Create your own professional ATS resume"
          >
            <span>Create Your Resume</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </header>

      {/* 2. Main Public Resume Area */}
      <main className="public-resume-main">
        {loading ? (
          <div className="public-empty-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Loading public resume...
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Fetching verified public candidate details.
            </p>
          </div>
        ) : error ? (
          <div className="public-empty-card">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#ef4444'
            }}>
              <Lock size={26} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Resume Unavailable or Private
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {error || 'This resume is private, the sharing link has expired, or the resume no longer exists.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ margin: '0 auto' }}
              onClick={handleHomeClick}
            >
              Go to AI Resume Studio
            </button>
          </div>
        ) : resume ? (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ResumePreview
              resume={resume}
              readOnly={true}
            />
          </div>
        ) : (
          <div className="public-empty-card">
            <AlertCircle size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              No Resume Data Found
            </h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ margin: '1rem auto 0' }}
              onClick={handleHomeClick}
            >
              Back to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

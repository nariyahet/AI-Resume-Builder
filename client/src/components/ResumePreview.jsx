import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  ZoomIn, 
  ZoomOut, 
  Palette, 
  Layout, 
  Type, 
  MoveVertical,
  Sliders,
  Download,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { exportResumeToDocx } from '../utils/docxExport';
import { COLOR_PALETTES, PAGE_STYLES } from '../data/customizationOptions';

export default function ResumePreview({ resume, setResume }) {
  // Mobile & desktop auto-fit scale calculator
  const getAutoFitScale = () => {
    if (typeof window === 'undefined') return 1;
    const w = window.innerWidth;
    if (w <= 1080) {
      const avail = Math.max(260, w - 24);
      return Math.min(1, Number((avail / 794).toFixed(2)));
    } else {
      const avail = Math.max(300, w - 530 - 48);
      return Math.min(1.1, Math.max(0.4, Number((avail / 794).toFixed(2))));
    }
  };

  const [scale, setScale] = useState(() => getAutoFitScale());
  const [fontFamily, setFontFamily] = useState('Inter');
  const [spacingDensity, setSpacingDensity] = useState('normal'); // 'compact', 'normal', 'relaxed'

  // Auto-adapt scale on screen resize
  React.useEffect(() => {
    const handleResize = () => {
      setScale(getAutoFitScale());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const templates = [
    { id: 'modern', name: 'Modern Tech' },
    { id: 'harvard', name: 'Harvard Classic ATS' },
    { id: 'executive', name: 'Executive Corporate' },
    { id: 'minimal', name: 'Minimalist' },
    { id: 'split', name: 'Two-Column Split' }
  ];

  const fonts = [
    { id: 'Inter', name: 'Inter (Clean Tech)' },
    { id: 'Outfit', name: 'Outfit (Modern Display)' },
    { id: 'Merriweather', name: 'Merriweather (Classic Serif)' },
    { id: 'Roboto', name: 'Roboto (Standard Sans)' }
  ];

  const {
    personal_info = {},
    target_role = '',
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    template_id = 'modern',
    theme_color = '#2563eb',
    page_style = 'modern'
  } = resume;

  // Export as Plain Text / Docx helper
  const handleExportTxt = () => {
    let content = `${personal_info.fullName || 'RESUME'}\n`;
    content += `${target_role || ''}\n`;
    content += `${personal_info.email || ''} | ${personal_info.phone || ''} | ${personal_info.location || ''}\n\n`;

    if (summary) {
      content += `PROFESSIONAL SUMMARY\n${summary}\n\n`;
    }

    if (experience && experience.length > 0) {
      content += `WORK EXPERIENCE\n`;
      experience.forEach(exp => {
        const expDates = exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate || '');
        content += `${exp.role || ''} - ${exp.company || ''}${expDates ? ` (${expDates})` : ''}\n`;
        content += `${exp.description || ''}\n\n`;
      });
    }

    if (skills && skills.length > 0) {
      content += `SKILLS\n${skills.join(', ')}\n\n`;
    }

    if (education && education.length > 0) {
      content += `EDUCATION\n`;
      education.forEach(edu => {
        content += `${edu.degree || ''} - ${edu.institution || ''} (${edu.year || ''})\n`;
      });
      content += '\n';
    }

    if (projects && projects.length > 0) {
      content += `PROJECTS\n`;
      projects.forEach(p => {
        content += `${p.name || ''}: ${p.description || ''}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(personal_info.fullName || 'Resume').replace(/\s+/g, '_')}_Text.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSpacingStyle = () => {
    if (spacingDensity === 'compact') {
      return { lineHeight: 1.35, fontSizeMultiplier: '0.94' };
    }
    if (spacingDensity === 'relaxed') {
      return { lineHeight: 1.6, fontSizeMultiplier: '1.04' };
    }
    return { lineHeight: 1.45, fontSizeMultiplier: '1' };
  };

  return (
    <div className="preview-pane">
      {/* Top Toolbar */}
      <div className="preview-toolbar no-print">
        {/* Template Selector */}
        <div className="toolbar-group">
          <Layout size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TEMPLATE:</span>
          <select 
            className="form-select" 
            style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.775rem' }}
            value={template_id}
            onChange={(e) => setResume(prev => ({ ...prev, template_id: e.target.value }))}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Page Style Selector */}
        <div className="toolbar-group">
          <Sliders size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>STYLE:</span>
          <select 
            className="form-select" 
            style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.775rem' }}
            value={page_style}
            onChange={(e) => setResume(prev => ({ ...prev, page_style: e.target.value }))}
          >
            {PAGE_STYLES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Font Selector */}
        <div className="toolbar-group">
          <Type size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FONT:</span>
          <select 
            className="form-select" 
            style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.775rem' }}
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {fonts.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Spacing / Fit */}
        <div className="toolbar-group">
          <MoveVertical size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FIT:</span>
          <select 
            className="form-select" 
            style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.775rem' }}
            value={spacingDensity}
            onChange={(e) => setSpacingDensity(e.target.value)}
          >
            <option value="compact">1-Page Compact</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </div>

        {/* Color Palette Switcher (All 16 Colors) */}
        <div className="toolbar-group">
          <Palette size={14} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', flexWrap: 'wrap', maxWidth: '175px' }}>
            {COLOR_PALETTES.map(c => {
              const isSelected = (theme_color || '#2563eb').toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  title={c.name}
                  onClick={() => setResume(prev => ({ ...prev, theme_color: c.hex }))}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.15)',
                    boxShadow: isSelected ? '0 0 0 1.5px var(--primary)' : 'none',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    padding: 0
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="toolbar-group zoom-group">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setScale(s => Math.max(0.3, Number((s - 0.05).toFixed(2))))}
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setScale(s => Math.min(1.4, Number((s + 0.05).toFixed(2))))}
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setScale(getAutoFitScale())}
            title="Auto-Fit to Screen"
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
          >
            Fit
          </button>

          <button 
            className="btn btn-outline btn-sm desktop-only-btn"
            onClick={() => exportResumeToDocx(resume)}
            title="Export editable Microsoft Word document (.docx)"
            style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', fontWeight: 600 }}
          >
            <FileText size={12} /> .DOCX
          </button>

          <button 
            className="btn btn-outline btn-sm desktop-only-btn"
            onClick={handleExportTxt}
            title="Export as Text / Word draft"
          >
            <Download size={12} /> .TXT
          </button>
        </div>
      </div>

      {/* A4 Resume Container Area */}
      <div className="preview-scroll-area">
        <div 
          className="resume-scale-wrapper"
          style={{
            width: `${Math.round(794 * scale)}px`,
            minHeight: `${Math.round(1123 * scale)}px`,
            position: 'relative',
            margin: '0 auto'
          }}
        >
          <div 
            id="resume-print-area"
            className={`resume-sheet template-${template_id} style-${page_style || 'modern'}`}
            style={{ 
              '--theme-color': theme_color,
              fontFamily: `${fontFamily}, sans-serif`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              lineHeight: getSpacingStyle().lineHeight
            }}
          >
          {/* ========================================================= */}
          {/* TWO-COLUMN SPLIT TEMPLATE                                 */}
          {/* ========================================================= */}
          {template_id === 'split' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '20px', minHeight: '100%' }}>
              {/* Left Column Sidebar */}
              <div style={{ borderRight: '1.5px solid #e2e8f0', paddingRight: '15px' }}>
                {personal_info.profile_photo && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                    <img 
                      src={personal_info.profile_photo} 
                      alt={personal_info.fullName || 'Candidate Photo'}
                      className={`resume-photo shape-${personal_info.photo_shape || 'circle'}`}
                      style={{ width: '80px', height: '80px' }}
                    />
                  </div>
                )}

                <div style={{ borderBottom: `2px solid ${theme_color}`, paddingBottom: '10px', marginBottom: '15px' }}>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
                    {personal_info.fullName || 'Your Name'}
                  </h1>
                  <div style={{ fontSize: '0.85rem', color: theme_color, fontWeight: 600, marginTop: '4px' }}>
                    {target_role || 'Target Role'}
                  </div>
                </div>

                {/* Contacts Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: '#475569', marginBottom: '20px' }}>
                  {personal_info.email && <div><Mail size={11} style={{ color: theme_color, display: 'inline', marginRight: '4px' }} />{personal_info.email}</div>}
                  {personal_info.phone && <div><Phone size={11} style={{ color: theme_color, display: 'inline', marginRight: '4px' }} />{personal_info.phone}</div>}
                  {personal_info.location && <div><MapPin size={11} style={{ color: theme_color, display: 'inline', marginRight: '4px' }} />{personal_info.location}</div>}
                  {personal_info.website && <div><Globe size={11} style={{ color: theme_color, display: 'inline', marginRight: '4px' }} />{personal_info.website}</div>}
                  {personal_info.linkedin && <div><LinkIcon size={11} style={{ color: theme_color, display: 'inline', marginRight: '4px' }} />{personal_info.linkedin}</div>}
                </div>

                {/* Skills Sidebar */}
                {skills && skills.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: theme_color, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                      Skills
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skills.map((s, i) => (
                        <span key={i} className="resume-skill-badge" style={{ fontSize: '0.7rem', padding: '2px 5px' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Sidebar */}
                {education && education.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: theme_color, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                      Education
                    </h3>
                    {education.map((edu, i) => (
                      <div key={edu.id || i} style={{ marginBottom: '8px', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{edu.degree}</div>
                        <div style={{ color: '#475569' }}>{edu.institution}</div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{edu.year}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Content Column */}
              <div>
                {/* Summary */}
                {summary && (
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${theme_color}`, paddingBottom: '3px', marginBottom: '6px' }}>
                      Professional Profile
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.45, textAlign: 'justify' }}>
                      {summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {experience && experience.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${theme_color}`, paddingBottom: '3px', marginBottom: '8px' }}>
                      Experience
                    </h2>
                    {experience.map((exp, i) => (
                      <div key={exp.id || i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{exp.role}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate || '')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.775rem', color: theme_color, fontWeight: 600 }}>{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                        {exp.description && (
                          <div style={{ fontSize: '0.775rem', color: '#334155', marginTop: '4px', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                            {exp.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {projects && projects.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${theme_color}`, paddingBottom: '3px', marginBottom: '8px' }}>
                      Key Projects
                    </h2>
                    {projects.map((proj, i) => (
                      <div key={proj.id || i} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: theme_color }}>{proj.name}</div>
                        {proj.description && (
                          <div style={{ fontSize: '0.775rem', color: '#334155', marginTop: '2px', lineHeight: 1.4 }}>
                            {proj.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* STANDARD TEMPLATES (Modern, Harvard, Executive, Minimal)   */
            /* ========================================================= */
            <>
              {/* HEADER SECTION */}
              <header className={`resume-header ${personal_info.profile_photo ? 'resume-header-with-photo' : ''}`}>
                {personal_info.profile_photo && (
                  <div className="resume-photo-wrapper">
                    <img 
                      src={personal_info.profile_photo} 
                      alt={personal_info.fullName || 'Candidate Photo'}
                      className={`resume-photo shape-${personal_info.photo_shape || 'circle'}`}
                    />
                  </div>
                )}
                <div className="resume-header-text" style={{ flex: 1 }}>
                  <h1 className="resume-name">
                    {personal_info.fullName || 'Your Name'}
                  </h1>
                  <div className="resume-role">
                    {target_role || 'Target Job Title'}
                  </div>

                  <div className="resume-contacts">
                    {personal_info.email && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} style={{ color: theme_color }} /> {personal_info.email}
                      </span>
                    )}
                    {personal_info.phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} style={{ color: theme_color }} /> {personal_info.phone}
                      </span>
                    )}
                    {personal_info.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} style={{ color: theme_color }} /> {personal_info.location}
                      </span>
                    )}
                    {personal_info.website && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={12} style={{ color: theme_color }} /> {personal_info.website}
                      </span>
                    )}
                    {personal_info.linkedin && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <LinkIcon size={12} style={{ color: theme_color }} /> {personal_info.linkedin}
                      </span>
                    )}
                    {personal_info.github && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <LinkIcon size={12} style={{ color: theme_color }} /> {personal_info.github}
                      </span>
                    )}
                  </div>
                </div>
              </header>

              {/* PROFESSIONAL SUMMARY */}
              {summary && (
                <section className="resume-section">
                  <h2 className="resume-section-title">
                    {template_id === 'harvard' ? 'EXECUTIVE SUMMARY' : 'Professional Summary'}
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.5, textAlign: 'justify' }}>
                    {summary}
                  </p>
                </section>
              )}

              {/* WORK EXPERIENCE */}
              {experience && experience.length > 0 && (
                <section className="resume-section">
                  <h2 className="resume-section-title">
                    {template_id === 'harvard' ? 'PROFESSIONAL EXPERIENCE' : 'Work Experience'}
                  </h2>
                  {experience.map((exp, i) => (
                    <div key={exp.id || i} className="resume-item">
                      <div className="resume-item-top">
                        <div>
                          <span className="resume-item-title">{exp.role || 'Role'}</span>
                          {exp.company && (
                            <span className="resume-item-company"> — {exp.company}</span>
                          )}
                          {exp.location && (
                            <span style={{ fontSize: '0.775rem', color: '#64748b' }}> ({exp.location})</span>
                          )}
                        </div>
                        <span className="resume-item-date">
                          {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate || '')}
                        </span>
                      </div>
                      {exp.description && (
                        <div className="resume-item-desc">
                          {exp.description}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* SKILLS */}
              {skills && skills.length > 0 && (
                <section className="resume-section">
                  <h2 className="resume-section-title">
                    {template_id === 'harvard' ? 'TECHNICAL & CORE COMPETENCIES' : 'Technical Proficiencies'}
                  </h2>
                  {template_id === 'harvard' ? (
                    <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '4px' }}>
                      <strong>Core Skills:</strong> {skills.join(' • ')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                      {skills.map((skill, i) => (
                        <span key={i} className="resume-skill-badge">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* PROJECTS */}
              {projects && projects.length > 0 && (
                <section className="resume-section">
                  <h2 className="resume-section-title">
                    {template_id === 'harvard' ? 'KEY PROJECTS & INITIATIVES' : 'Key Projects'}
                  </h2>
                  {projects.map((proj, i) => (
                    <div key={proj.id || i} className="resume-item">
                      <div className="resume-item-top">
                        <span className="resume-item-title" style={{ color: theme_color }}>
                          {proj.name}
                        </span>
                        {proj.link && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {proj.link}
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        <div className="resume-item-desc">
                          {proj.description}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* EDUCATION */}
              {education && education.length > 0 && (
                <section className="resume-section">
                  <h2 className="resume-section-title">
                    {template_id === 'harvard' ? 'EDUCATION' : 'Education'}
                  </h2>
                  {education.map((edu, i) => (
                    <div key={edu.id || i} className="resume-item">
                      <div className="resume-item-top">
                        <div>
                          <span className="resume-item-title">{edu.degree || 'Degree'}</span>
                          {edu.institution && (
                            <span className="resume-item-company"> — {edu.institution}</span>
                          )}
                        </div>
                        <span className="resume-item-date">
                          {edu.year} {edu.score ? `| ${edu.score}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* CERTIFICATIONS */}
              {certifications && certifications.length > 0 && (
                <section className="resume-section">
                  <h2 className="resume-section-title">
                    {template_id === 'harvard' ? 'CERTIFICATIONS' : 'Certifications'}
                  </h2>
                  {certifications.map((cert, i) => (
                    <div key={cert.id || i} className="resume-item">
                      <div className="resume-item-top">
                        <div>
                          <span className="resume-item-title">{cert.name}</span>
                          {cert.issuer && (
                            <span className="resume-item-company"> — {cert.issuer}</span>
                          )}
                        </div>
                        {cert.year && (
                          <span className="resume-item-date">{cert.year}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* CUSTOM SECTIONS (Awards, Publications, Volunteer, etc.) */}
              {resume.custom_sections && resume.custom_sections.length > 0 && (
                resume.custom_sections.map((sec, i) => {
                  const heading = sec.title || sec.heading || 'Additional Section';
                  return (
                    <section key={sec.id || i} className="resume-section">
                      <h2 className="resume-section-title">
                        {template_id === 'harvard' ? heading.toUpperCase() : heading}
                      </h2>
                      <div className="resume-item-desc" style={{ whiteSpace: 'pre-line' }}>
                        {sec.content}
                      </div>
                    </section>
                  );
                })
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

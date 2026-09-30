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
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';

export default function ResumePreview({ resume, setResume }) {
  const [scale, setScale] = useState(1);

  const colors = [
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Deep Purple', hex: '#7c3aed' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Crimson', hex: '#e11d48' },
    { name: 'Dark Slate', hex: '#0f172a' }
  ];

  const templates = [
    { id: 'modern', name: 'Modern Tech' },
    { id: 'executive', name: 'Executive Corporate' },
    { id: 'minimal', name: 'Minimalist' }
  ];

  const {
    personal_info = {},
    target_role = '',
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    template_id = 'modern',
    theme_color = '#2563eb'
  } = resume;

  return (
    <div className="preview-pane">
      {/* Top Toolbar */}
      <div className="preview-toolbar no-print">
        <div className="toolbar-group">
          <Layout size={15} style={{ color: '#94a3b8' }} />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TEMPLATE:</span>
          <select 
            className="form-select" 
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={template_id}
            onChange={(e) => setResume(prev => ({ ...prev, template_id: e.target.value }))}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Color Palette Switcher */}
        <div className="toolbar-group">
          <Palette size={15} style={{ color: '#94a3b8' }} />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>COLOR:</span>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {colors.map(c => (
              <button
                key={c.hex}
                title={c.name}
                onClick={() => setResume(prev => ({ ...prev, theme_color: c.hex }))}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: c.hex,
                  border: theme_color === c.hex ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transform: theme_color === c.hex ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="toolbar-group">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setScale(s => Math.max(0.6, s - 0.1))}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: '0.775rem', color: '#cbd5e1' }}>
            {Math.round(scale * 100)}%
          </span>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setScale(s => Math.min(1.3, s + 0.1))}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* A4 Resume Container Area */}
      <div className="preview-scroll-area">
        <div 
          id="resume-print-area"
          className={`resume-sheet template-${template_id}`}
          style={{ 
            '--theme-color': theme_color,
            transform: `scale(${scale})`
          }}
        >
          {/* HEADER SECTION */}
          <header className="resume-header">
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
              {personal_info.linkedin && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={12} style={{ color: theme_color }} /> {personal_info.linkedin}
                </span>
              )}
              {personal_info.github && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <LinkIcon size={12} style={{ color: theme_color }} /> {personal_info.github}
                </span>
              )}
            </div>
          </header>

          {/* PROFESSIONAL SUMMARY */}
          {summary && (
            <section className="resume-section">
              <h2 className="resume-section-title">Professional Summary</h2>
              <p style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.5, textAlign: 'justify' }}>
                {summary}
              </p>
            </section>
          )}

          {/* WORK EXPERIENCE */}
          {experience && experience.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">Work Experience</h2>
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
                      {exp.startDate ? `${exp.startDate} - ${exp.endDate || 'Present'}` : ''}
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
              <h2 className="resume-section-title">Technical Proficiencies</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {skills.map((skill, i) => (
                  <span key={i} className="resume-skill-badge">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* PROJECTS */}
          {projects && projects.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">Key Projects</h2>
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
              <h2 className="resume-section-title">Education</h2>
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
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderGit2, 
  Plus, 
  Trash2, 
  Wand2, 
  Loader2,
  Award,
  ArrowRight,
  Camera,
  Upload,
  Palette
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { COLOR_PALETTES, PAGE_STYLES, PHOTO_SHAPES } from '../data/customizationOptions';

export default function ResumeForm({ resume, setResume, onSwitchToPreview }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [aiLoading, setAiLoading] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [activeExpEnhancing, setActiveExpEnhancing] = useState(null);
  const editorTabsRef = useRef(null);

  // Keep the selected editor step visible inside the horizontal tab rail.
  useEffect(() => {
    const container = editorTabsRef.current;
    if (!container) return;
    const activeButton = container.querySelector('.tab-btn.active');
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeButton.getBoundingClientRect();
    const relativeLeft = activeRect.left - containerRect.left;
    const relativeRight = activeRect.right - containerRect.left;
    const edgeMargin = 16;

    if (relativeLeft < edgeMargin) {
      container.scrollTo({
        left: Math.max(0, container.scrollLeft + relativeLeft - edgeMargin),
        behavior: 'smooth'
      });
    } else if (relativeRight > containerRect.width - edgeMargin) {
      container.scrollTo({
        left: container.scrollLeft + (relativeRight - containerRect.width) + edgeMargin,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  // Profile Photo Upload Handlers
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, JPEG, PNG, or WebP).');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert('Photo size exceeds 2MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setResume(prev => ({
          ...prev,
          personal_info: {
            ...prev.personal_info,
            profile_photo: dataUrl,
            photo_shape: prev.personal_info?.photo_shape || 'circle'
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setResume(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        profile_photo: ''
      }
    }));
  };

  const handlePhotoShapeChange = (shape) => {
    setResume(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        photo_shape: shape
      }
    }));
  };

  // Helper for personal info changes
  const handlePersonalChange = (field, value) => {
    setResume(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  // 1-Click Full Resume AI Generation
  const handleMagicGenerate = async () => {
    if (!magicPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await axiosClient.post('/ai/generate-full', {
        promptText: magicPrompt,
        targetRole: resume.target_role || 'Software Engineer'
      });
      if (res.data?.success && res.data.resume) {
        setResume(prev => ({
          ...prev,
          ...res.data.resume,
          template_id: prev.template_id,
          theme_color: prev.theme_color
        }));
        setActiveTab('personal');
      }
    } catch (err) {
      console.error('Magic generate failed:', err);
      alert('AI Generation encountered an issue. Please try again or check your Gemini Key in AI Settings.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Polish Professional Summary
  const handleEnhanceSummary = async () => {
    setAiLoading(true);
    try {
      const res = await axiosClient.post('/ai/enhance-summary', {
        targetRole: resume.target_role,
        experience: resume.experience,
        skills: resume.skills,
        rawSummary: resume.summary
      });
      if (res.data?.success && res.data.summary) {
        setResume(prev => ({
          ...prev,
          summary: res.data.summary
        }));
      }
    } catch (err) {
      console.error('Enhance summary failed:', err);
      alert('Failed to polish summary. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Polish Bullets for an Experience item
  const handleEnhanceBullets = async (index, exp) => {
    setActiveExpEnhancing(index);
    try {
      const res = await axiosClient.post('/ai/enhance-bullets', {
        role: exp.role,
        company: exp.company,
        rawBullets: exp.description
      });
      if (res.data?.success && Array.isArray(res.data.bullets)) {
        const polishedText = res.data.bullets.map(b => `• ${b}`).join('\n');
        setResume(prev => {
          const updated = [...prev.experience];
          updated[index] = { ...updated[index], description: polishedText };
          return { ...prev, experience: updated };
        });
      }
    } catch (err) {
      console.error('Enhance bullets failed:', err);
      alert('Failed to polish bullet points.');
    } finally {
      setActiveExpEnhancing(null);
    }
  };

  // Experience handlers
  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          id: `exp-${Date.now()}`,
          role: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        }
      ]
    }));
  };

  const updateExperience = (index, field, value) => {
    setResume(prev => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const handleDurationChange = (index, value) => {
    setResume(prev => {
      const updated = [...(prev.experience || [])];
      updated[index] = {
        ...updated[index],
        startDate: value,
        endDate: '',
        year: value
      };
      return { ...prev, experience: updated };
    });
  };

  const removeExperience = (index) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Education handlers
  const addEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          id: `edu-${Date.now()}`,
          degree: '',
          institution: '',
          year: '',
          score: ''
        }
      ]
    }));
  };

  const updateEducation = (index, field, value) => {
    setResume(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const removeEducation = (index) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Projects handlers
  const addProject = () => {
    setResume(prev => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        {
          id: `proj-${Date.now()}`,
          name: '',
          link: '',
          description: ''
        }
      ]
    }));
  };

  const updateProject = (index, field, value) => {
    setResume(prev => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  const removeProject = (index) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  // Skills handlers
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim().replace(/,/g, '');
      if (val && !resume.skills?.includes(val)) {
        setResume(prev => ({
          ...prev,
          skills: [...(prev.skills || []), val]
        }));
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    setResume(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s !== skillToRemove)
    }));
  };

  return (
    <div className="editor-pane">
      {/* Tabs */}
      <nav className="editor-tabs" ref={editorTabsRef} aria-label="Resume editor sections">
        <button 
          className={`tab-btn ${activeTab === 'magic' ? 'active' : ''}`}
          onClick={() => setActiveTab('magic')}
        >
          <Wand2 size={13} />
          <span>⚡ AI Auto-Fill</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={13} />
          <span>1. Profile</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          <Briefcase size={13} />
          <span>2. Experience</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Code size={13} />
          <span>3. Skills</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <GraduationCap size={13} />
          <span>4. Education</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderGit2 size={13} />
          <span>5. Projects</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <Award size={13} />
          <span>6. Custom</span>
        </button>
      </nav>

      {/* Editor Content Area */}
      <div className="editor-scroll">

        {/* 1-CLICK MAGIC TAB */}
        {activeTab === 'magic' && (
          <div className="form-section">
            <div className="section-header">
              <span className="section-title">
                <Sparkles size={18} style={{ color: '#a855f7' }} />
                1-Click AI Resume Generator
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Paste your raw notes, existing bio, or LinkedIn summary below. Our AI will automatically parse and restructure it into an ATS-ready professional resume!
            </p>

            <div className="form-group">
              <label className="form-label">Target Role / Designation</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Senior Full Stack Developer, Marketing Specialist"
                value={resume.target_role || ''}
                onChange={(e) => setResume(prev => ({ ...prev, target_role: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Raw Details / Notes / Bio</label>
              <textarea 
                className="form-textarea"
                rows={6}
                placeholder="Example: I have 3 years of experience in React and Node.js. Worked at ABC company building dashboards. Studied at GTU with 8.5 CGPA. Built an AI resume app. Email: darshan@example.com..."
                value={magicPrompt}
                onChange={(e) => setMagicPrompt(e.target.value)}
              />
            </div>

            <button 
              className="btn btn-ai"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
              onClick={handleMagicGenerate}
              disabled={aiLoading || !magicPrompt.trim()}
            >
              {aiLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI is crafting your resume...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Complete Resume with AI</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* PERSONAL INFO TAB */}
        {activeTab === 'personal' && (
          <div className="form-section">
            <div className="section-header">
              <span className="section-title">Personal Details</span>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Resume Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Full Stack Developer Resume"
                  value={resume.title || ''}
                  onChange={(e) => setResume(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Job Role</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Full Stack Developer"
                  value={resume.target_role || ''}
                  onChange={(e) => setResume(prev => ({ ...prev, target_role: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Darshan Patel"
                  value={resume.personal_info?.fullName || ''}
                  onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="darshan@example.com"
                  value={resume.personal_info?.email || ''}
                  onChange={(e) => handlePersonalChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="+91 98765 43210"
                  value={resume.personal_info?.phone || ''}
                  onChange={(e) => handlePersonalChange('phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (City, State)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ahmedabad, Gujarat"
                  value={resume.personal_info?.location || ''}
                  onChange={(e) => handlePersonalChange('location', e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">LinkedIn Profile</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="linkedin.com/in/username"
                  value={resume.personal_info?.linkedin || ''}
                  onChange={(e) => handlePersonalChange('linkedin', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GitHub / Portfolio</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="github.com/username"
                  value={resume.personal_info?.github || ''}
                  onChange={(e) => handlePersonalChange('github', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website / Personal URL</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. https://alexrivera.dev"
                value={resume.personal_info?.website || ''}
                onChange={(e) => handlePersonalChange('website', e.target.value)}
              />
            </div>

            {/* PROFILE PHOTO SECTION */}
            <div className="item-card" style={{ marginTop: '0.5rem', background: 'var(--bg-card)' }}>
              <div className="item-card-header">
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Camera size={16} style={{ color: 'var(--primary)' }} />
                  Profile Photo (Optional)
                </strong>
                {resume.personal_info?.profile_photo && (
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={handleRemovePhoto}
                    title="Remove Photo"
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {resume.personal_info?.profile_photo ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={resume.personal_info.profile_photo} 
                      alt="Profile preview" 
                      style={{ 
                        width: '72px', 
                        height: '72px', 
                        objectFit: 'cover',
                        borderRadius: resume.personal_info?.photo_shape === 'rounded' ? '12px' : resume.personal_info?.photo_shape === 'square' ? '2px' : '50%',
                        border: '2px solid var(--primary)'
                      }} 
                    />
                  </div>
                ) : (
                  <div style={{ 
                    width: '72px', 
                    height: '72px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-pane)', 
                    border: '1.5px dashed var(--border-color)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <User size={28} />
                  </div>
                )}

                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <label 
                      className="btn btn-outline btn-sm" 
                      style={{ cursor: 'pointer', margin: 0 }}
                    >
                      <Upload size={13} />
                      {resume.personal_info?.profile_photo ? 'Change Photo' : 'Upload Photo'}
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp,image/jpg" 
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                      />
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Max 2MB (JPG, PNG, WebP)
                    </span>
                  </div>

                  {/* Photo Shape Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Shape:</span>
                    {PHOTO_SHAPES.map(s => {
                      const isActive = (resume.personal_info?.photo_shape || 'circle') === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                          style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={() => handlePhotoShapeChange(s.id)}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE STYLE & COLOR PALETTE CONTROLS */}
            <div className="item-card" style={{ marginTop: '0.5rem', background: 'var(--bg-card)' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <Palette size={16} style={{ color: 'var(--primary)' }} />
                Resume Aesthetics & Styling
              </strong>

              {/* Page Style Selector */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Page Style</label>
                <select
                  className="form-select"
                  value={resume.page_style || 'modern'}
                  onChange={(e) => setResume(prev => ({ ...prev, page_style: e.target.value }))}
                >
                  {PAGE_STYLES.map(style => (
                    <option key={style.id} value={style.id}>
                      {style.name} — {style.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Palette Selector */}
              <div className="form-group">
                <label className="form-label">Accent Color Palette</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {COLOR_PALETTES.map(p => {
                    const isSelected = (resume.theme_color || '#2563eb').toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setResume(prev => ({ ...prev, theme_color: p.hex }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? `2px solid ${p.hex}` : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--bg-pane)' : 'transparent',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: isSelected ? 700 : 500,
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.hex, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Professional Summary</label>
                <button 
                  className="btn btn-ai btn-sm"
                  onClick={handleEnhanceSummary}
                  disabled={aiLoading}
                  type="button"
                >
                  <Sparkles size={12} />
                  <span>{aiLoading ? 'Improving...' : 'Improve with AI'}</span>
                </button>
              </div>
              <textarea 
                className="form-textarea"
                rows={4}
                placeholder="High-impact 3-4 lines highlighting your core skills, experience, and achievements..."
                value={resume.summary || ''}
                onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>

            {/* Step Navigation */}
            <div className="step-nav-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('experience')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Next: 2. Experience</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* WORK EXPERIENCE TAB */}
        {activeTab === 'experience' && (
          <div className="form-section">
            <div className="section-header">
              <span className="section-title">Work Experience</span>
              <button className="btn btn-outline btn-sm" onClick={addExperience}>
                <Plus size={14} />
                <span>Add Job</span>
              </button>
            </div>

            {(resume.experience || []).map((exp, index) => (
              <div key={exp.id || index} className="item-card">
                <div className="item-card-header">
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {exp.role || `Position #${index + 1}`} {exp.company ? `at ${exp.company}` : ''}
                  </strong>
                  <button 
                    className="delete-btn" 
                    onClick={() => removeExperience(index)}
                    title="Remove position"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Job Title / Role</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Lead Developer"
                      value={exp.role || ''}
                      onChange={(e) => updateExperience(index, 'role', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Google / Infosys"
                      value={exp.company || ''}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Duration / Dates</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Jan 2022 - Present"
                      value={exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate || exp.year || '')}
                      onChange={(e) => handleDurationChange(index, e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Ahmedabad, IN / Remote"
                      value={exp.location || ''}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Key Responsibilities & Achievements</label>
                    <button 
                      className="btn btn-ai btn-sm"
                      onClick={() => handleEnhanceBullets(index, exp)}
                      disabled={activeExpEnhancing === index}
                      type="button"
                    >
                      <Sparkles size={12} />
                      <span>{activeExpEnhancing === index ? 'Improving...' : 'Improve with AI'}</span>
                    </button>
                  </div>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    placeholder="• Spearheaded ...\n• Improved performance by 30%..."
                    value={exp.description || ''}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}

            {(resume.experience || []).length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem', padding: '1.5rem' }}>
                No work experience added yet. Click "+ Add Job" above or use 1-Click AI.
              </p>
            )}

            {/* Step Navigation */}
            <div className="step-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('personal')}
              >
                ← 1. Profile
              </button>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('skills')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Next: 3. Skills</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="form-section">
            <div className="section-header">
              <span className="section-title">Technical & Professional Skills</span>
            </div>

            <div className="form-group">
              <label className="form-label">Type skill and press Enter</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. React.js, Node.js, MySQL, Docker..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
              />
            </div>

            <div className="skills-container">
              {(resume.skills || []).map((skill, i) => (
                <span key={i} className="skill-tag">
                  {skill}
                  <button className="skill-tag-remove" onClick={() => removeSkill(skill)}>
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Quick Skill Recommendations */}
            <div style={{ marginTop: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Popular Tech Recommendations (Click to Add):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {['JavaScript', 'TypeScript', 'React.js', 'Next.js', 'Node.js', 'Express', 'MySQL', 'MongoDB', 'REST APIs', 'Git', 'Tailwind CSS', 'Docker'].map((s) => (
                  <button 
                    key={s} 
                    className="btn btn-outline btn-sm" 
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => {
                      if (!resume.skills?.includes(s)) {
                        setResume(prev => ({ ...prev, skills: [...(prev.skills || []), s] }));
                      }
                    }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Navigation */}
            <div className="step-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('experience')}
              >
                ← 2. Experience
              </button>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('education')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Next: 4. Education</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* EDUCATION TAB */}
        {activeTab === 'education' && (
          <div className="form-section">
            <div className="section-header">
              <span className="section-title">Education & Qualifications</span>
              <button className="btn btn-outline btn-sm" onClick={addEducation}>
                <Plus size={14} />
                <span>Add Education</span>
              </button>
            </div>

            {(resume.education || []).map((edu, index) => (
              <div key={edu.id || index} className="item-card">
                <div className="item-card-header">
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {edu.degree || `Education #${index + 1}`}
                  </strong>
                  <button className="delete-btn" onClick={() => removeEducation(index)}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Degree / Program</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. B.Tech in Computer Engineering"
                    value={edu.degree || ''}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">University / College / School</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Gujarat Technological University"
                    value={edu.institution || ''}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Passing Year / Duration</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 2019 - 2023"
                      value={edu.year || ''}
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Score / CGPA / Percentage</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 8.75 CGPA or 85%"
                      value={edu.score || ''}
                      onChange={(e) => updateEducation(index, 'score', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Step Navigation */}
            <div className="step-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('skills')}
              >
                ← 3. Skills
              </button>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('projects')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Next: 5. Projects</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="form-section">
            <div className="section-header">
              <span className="section-title">Key Projects & Portfolios</span>
              <button className="btn btn-outline btn-sm" onClick={addProject}>
                <Plus size={14} />
                <span>Add Project</span>
              </button>
            </div>

            {(resume.projects || []).map((proj, index) => (
              <div key={proj.id || index} className="item-card">
                <div className="item-card-header">
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {proj.name || `Project #${index + 1}`}
                  </strong>
                  <button className="delete-btn" onClick={() => removeProject(index)}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Project Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. AI Resume Generator"
                      value={proj.name || ''}
                      onChange={(e) => updateProject(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Live Link / GitHub Repo</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. github.com/username/project"
                      value={proj.link || ''}
                      onChange={(e) => updateProject(index, 'link', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Description & Tech Stack</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3}
                    placeholder="Built full-stack application with React, Express, MySQL and Gemini API..."
                    value={proj.description || ''}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}

            {/* Step Navigation */}
            <div className="step-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('education')}
              >
                ← 4. Education
              </button>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('custom')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Next: 6. Custom</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* CUSTOM SECTIONS TAB (Awards, Volunteer, Languages, Certifications) */}
        {activeTab === 'custom' && (
          <div className="form-section">
            <div className="section-header">
              <span className="section-title">
                <Award size={18} style={{ color: '#fbbf24' }} />
                Custom Sections
              </span>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setResume(prev => ({
                    ...prev,
                    custom_sections: [
                      ...(prev.custom_sections || []),
                      { id: `sec-${Date.now()}`, title: '', content: '' }
                    ]
                  }));
                }}
              >
                <Plus size={14} />
                <span>Add Section</span>
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Add custom headers such as <em>Awards & Honors</em>, <em>Certifications</em>, <em>Publications</em>, <em>Volunteer Work</em>, or <em>Languages</em>.
            </p>

            {(resume.custom_sections || []).map((sec, index) => (
              <div key={sec.id || index} className="item-card">
                <div className="item-card-header">
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {sec.title || `Section #${index + 1}`}
                  </strong>
                  <button 
                    className="delete-btn"
                    onClick={() => {
                      setResume(prev => ({
                        ...prev,
                        custom_sections: prev.custom_sections.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Section Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Awards & Honors / Certifications / Languages"
                    value={sec.title || ''}
                    onChange={(e) => {
                      const updated = [...(resume.custom_sections || [])];
                      updated[index] = { ...updated[index], title: e.target.value };
                      setResume(prev => ({ ...prev, custom_sections: updated }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Content (Bullets or Text)</label>
                  <textarea 
                    className="form-textarea"
                    rows={4}
                    placeholder="• Gold Medalist in Hackathon 2024\n• AWS Certified Cloud Solutions Architect"
                    value={sec.content || ''}
                    onChange={(e) => {
                      const updated = [...(resume.custom_sections || [])];
                      updated[index] = { ...updated[index], content: e.target.value };
                      setResume(prev => ({ ...prev, custom_sections: updated }));
                    }}
                  />
                </div>
              </div>
            ))}

            {(resume.custom_sections || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                No custom sections added yet. Click "+ Add Section" above.
              </div>
            )}

            {/* Step Navigation */}
            <div className="step-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('projects')}
              >
                ← 5. Projects
              </button>
              {onSwitchToPreview ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onSwitchToPreview}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>View Completed Resume</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <span style={{ fontSize: '0.825rem', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Resume Setup Complete
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

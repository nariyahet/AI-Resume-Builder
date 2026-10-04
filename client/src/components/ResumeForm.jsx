import React, { useState } from 'react';
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
  FileSpreadsheet,
  Award,
  ArrowRight
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ResumeForm({ resume, setResume, onSwitchToPreview }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [aiLoading, setAiLoading] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [activeExpEnhancing, setActiveExpEnhancing] = useState(null);

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
      <div className="editor-tabs">
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
      </div>

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

            {/* EXECUTIVE SUMMARY */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Professional Summary</label>
                <button 
                  className="btn btn-ai btn-sm"
                  onClick={handleEnhanceSummary}
                  disabled={aiLoading}
                  type="button"
                >
                  <Sparkles size={12} />
                  <span>AI Polish Summary</span>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
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
                      value={exp.startDate ? `${exp.startDate} - ${exp.endDate || 'Present'}` : (exp.year || '')}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Key Responsibilities & Achievements</label>
                    <button 
                      className="btn btn-ai btn-sm"
                      onClick={() => handleEnhanceBullets(index, exp)}
                      disabled={activeExpEnhancing === index}
                      type="button"
                    >
                      <Sparkles size={12} />
                      <span>{activeExpEnhancing === index ? 'Polishing...' : 'AI Enhance Bullets'}</span>
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
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', padding: '1.5rem' }}>
                No work experience added yet. Click "+ Add Job" above or use 1-Click AI.
              </p>
            )}

            {/* Step Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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

            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Add custom headers such as <em>Awards & Honors</em>, <em>Certifications</em>, <em>Publications</em>, <em>Volunteer Work</em>, or <em>Languages</em>.
            </p>

            {(resume.custom_sections || []).map((sec, index) => (
              <div key={sec.id || index} className="item-card">
                <div className="item-card-header">
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
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
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                No custom sections added yet. Click "+ Add Section" above.
              </div>
            )}

            {/* Step Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
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

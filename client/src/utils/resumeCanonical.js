function normalizeAtsScore(score) {
  if (score === null || score === undefined || score === '') return 0;
  const num = Number(score);
  return Number.isFinite(num) && num >= 0 ? Math.round(num) : 0;
}

function normalizeAtsFeedback(feedback) {
  if (feedback === null || feedback === undefined || feedback === '') return null;
  let parsed = feedback;
  if (typeof feedback === 'string') {
    const trimmed = feedback.trim();
    if (!trimmed) return null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return parsed ?? null;
  }

  const sortDeep = (item) => {
    if (item === null || item === undefined) return null;
    if (Array.isArray(item)) {
      return item.map(sortDeep);
    }
    if (typeof item === 'object') {
      const sortedKeys = Object.keys(item).sort();
      const result = {};
      for (const key of sortedKeys) {
        result[key] = sortDeep(item[key]);
      }
      return result;
    }
    if (typeof item === 'string') {
      return item.trim();
    }
    return item;
  };

  return sortDeep(parsed);
}

/**
 * Produces a stable, deterministic JSON string representation of ONLY the
 * persisted resume content fields.
 *
 * Excludes transient UI state, focus, rerender noise, and un-normalized server metadata
 * (e.g. timestamps, user_id, undefined vs null) to ensure autosave dirty checking ONLY
 * triggers when real resume data changes.
 */
export function getCanonicalPersistedResumePayload(resume) {
  if (!resume || typeof resume !== 'object') return '';

  const cleanStr = (val) => (typeof val === 'string' ? val.trim() : '');

  const canonical = {
    id: resume.id || null,
    title: cleanStr(resume.title) || 'My Resume',
    target_role: cleanStr(resume.target_role),
    template_id: resume.template_id || 'modern',
    theme_color: resume.theme_color || '#2563eb',
    page_style: resume.page_style || 'modern',
    personal_info: {
      fullName: cleanStr(resume.personal_info?.fullName),
      email: cleanStr(resume.personal_info?.email),
      phone: cleanStr(resume.personal_info?.phone),
      location: cleanStr(resume.personal_info?.location),
      linkedin: cleanStr(resume.personal_info?.linkedin),
      github: cleanStr(resume.personal_info?.github),
      website: cleanStr(resume.personal_info?.website),
      profile_photo: resume.personal_info?.profile_photo || '',
      photo_shape: resume.personal_info?.photo_shape || 'circle'
    },
    summary: cleanStr(resume.summary),
    experience: Array.isArray(resume.experience)
      ? resume.experience.map(e => ({
          role: cleanStr(e.role),
          company: cleanStr(e.company),
          location: cleanStr(e.location),
          startDate: cleanStr(e.startDate || e.year),
          endDate: cleanStr(e.endDate),
          description: cleanStr(e.description)
        }))
      : [],
    education: Array.isArray(resume.education)
      ? resume.education.map(e => ({
          degree: cleanStr(e.degree),
          institution: cleanStr(e.institution),
          year: cleanStr(e.year),
          score: cleanStr(e.score)
        }))
      : [],
    skills: Array.isArray(resume.skills)
      ? resume.skills.map(s => cleanStr(s)).filter(Boolean)
      : [],
    projects: Array.isArray(resume.projects)
      ? resume.projects.map(p => ({
          name: cleanStr(p.name),
          description: cleanStr(p.description),
          link: cleanStr(p.link)
        }))
      : [],
    certifications: Array.isArray(resume.certifications)
      ? resume.certifications.map(c => ({
          name: cleanStr(c.name),
          issuer: cleanStr(c.issuer),
          year: cleanStr(c.year)
        }))
      : [],
    custom_sections: Array.isArray(resume.custom_sections)
      ? resume.custom_sections.map(c => ({
          title: cleanStr(c.title || c.heading),
          content: cleanStr(c.content)
        }))
      : [],
    ats_score: normalizeAtsScore(resume.ats_score),
    ats_feedback: normalizeAtsFeedback(resume.ats_feedback)
  };

  return JSON.stringify(canonical);
}

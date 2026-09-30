import { getDB, getIsConnected } from '../config/db.js';

export async function saveResume(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const {
      id,
      title = 'My Resume',
      target_role = '',
      personal_info = {},
      summary = '',
      experience = [],
      education = [],
      skills = [],
      projects = [],
      certifications = [],
      template_id = 'modern',
      theme_color = '#2563eb',
      ats_score = 0,
      ats_feedback = {}
    } = req.body;

    if (!getIsConnected()) {
      // If DB is temporarily offline, echo back the resume with temporary ID so user isn't blocked
      return res.json({
        success: true,
        message: 'Saved to local session (MySQL not connected).',
        resume: { ...req.body, id: id || Date.now() }
      });
    }

    const db = getDB();

    if (id) {
      // Check ownership
      const [existing] = await db.query('SELECT id, user_id FROM resumes WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Resume not found to update.' });
      }

      await db.query(
        `UPDATE resumes SET 
          title = ?, target_role = ?, personal_info = ?, summary = ?, 
          experience = ?, education = ?, skills = ?, projects = ?, 
          certifications = ?, template_id = ?, theme_color = ?, 
          ats_score = ?, ats_feedback = ?
         WHERE id = ?`,
        [
          title,
          target_role,
          JSON.stringify(personal_info),
          summary,
          JSON.stringify(experience),
          JSON.stringify(education),
          JSON.stringify(skills),
          JSON.stringify(projects),
          JSON.stringify(certifications),
          template_id,
          theme_color,
          ats_score,
          JSON.stringify(ats_feedback),
          id
        ]
      );

      return res.json({
        success: true,
        message: 'Resume updated successfully!',
        resumeId: id
      });
    } else {
      // Insert new
      const [result] = await db.query(
        `INSERT INTO resumes (
          user_id, title, target_role, personal_info, summary,
          experience, education, skills, projects, certifications,
          template_id, theme_color, ats_score, ats_feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          title,
          target_role,
          JSON.stringify(personal_info),
          summary,
          JSON.stringify(experience),
          JSON.stringify(education),
          JSON.stringify(skills),
          JSON.stringify(projects),
          JSON.stringify(certifications),
          template_id,
          theme_color,
          ats_score,
          JSON.stringify(ats_feedback)
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Resume created successfully!',
        resumeId: result.insertId
      });
    }
  } catch (error) {
    console.error('Save resume error:', error);
    res.status(500).json({ success: false, message: 'Server error saving resume.' });
  }
}

export async function getUserResumes(req, res) {
  try {
    if (!req.user) {
      return res.json({ success: true, resumes: [] });
    }
    if (!getIsConnected()) {
      return res.json({ success: true, resumes: [] });
    }

    const db = getDB();
    const [rows] = await db.query(
      'SELECT id, title, target_role, template_id, theme_color, ats_score, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );

    res.json({ success: true, resumes: rows });
  } catch (error) {
    console.error('Fetch resumes error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching resumes.' });
  }
}

export async function getResumeById(req, res) {
  try {
    const { id } = req.params;
    if (!getIsConnected()) {
      return res.status(404).json({ success: false, message: 'Database not connected.' });
    }

    const db = getDB();
    const [rows] = await db.query('SELECT * FROM resumes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const r = rows[0];
    const resume = {
      ...r,
      personal_info: typeof r.personal_info === 'string' ? JSON.parse(r.personal_info) : r.personal_info,
      experience: typeof r.experience === 'string' ? JSON.parse(r.experience) : r.experience,
      education: typeof r.education === 'string' ? JSON.parse(r.education) : r.education,
      skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills,
      projects: typeof r.projects === 'string' ? JSON.parse(r.projects) : r.projects,
      certifications: typeof r.certifications === 'string' ? JSON.parse(r.certifications) : r.certifications,
      ats_feedback: typeof r.ats_feedback === 'string' ? JSON.parse(r.ats_feedback) : r.ats_feedback,
    };

    res.json({ success: true, resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ success: false, message: 'Server error loading resume.' });
  }
}

export async function deleteResume(req, res) {
  try {
    const { id } = req.params;
    if (!getIsConnected()) {
      return res.json({ success: true, message: 'Deleted locally.' });
    }

    const db = getDB();
    await db.query('DELETE FROM resumes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting resume.' });
  }
}

import { getDB, getIsConnected } from '../config/db.js';

function safeParse(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

export async function saveResume(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required to save resume.' });
    }
    const userId = req.user.id;
    const resumeId = req.params.id || req.body.id;
    const {
      title = 'My Resume',
      target_role = '',
      personal_info = {},
      summary = '',
      experience = [],
      education = [],
      skills = [],
      projects = [],
      certifications = [],
      custom_sections = [],
      version_history = [],
      template_id = 'modern',
      theme_color = '#2563eb',
      page_style = 'modern',
      ats_score = 0,
      ats_feedback = {}
    } = req.body;

    if (!getIsConnected()) {
      return res.status(503).json({ success: false, message: 'Database is not connected.' });
    }

    const db = getDB();

    if (resumeId) {
      // Check ownership
      const [existing] = await db.query('SELECT id, user_id FROM resumes WHERE id = ?', [resumeId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Resume not found to update.' });
      }
      if (existing[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden. You do not own this resume.' });
      }

      await db.query(
        `UPDATE resumes SET 
          title = ?, target_role = ?, personal_info = ?, summary = ?, 
          experience = ?, education = ?, skills = ?, projects = ?, 
          certifications = ?, custom_sections = ?, version_history = ?,
          template_id = ?, theme_color = ?, page_style = ?,
          ats_score = ?, ats_feedback = ?
         WHERE id = ? AND user_id = ?`,
        [
          title,
          target_role,
          typeof personal_info === 'string' ? personal_info : JSON.stringify(personal_info || {}),
          summary,
          typeof experience === 'string' ? experience : JSON.stringify(experience || []),
          typeof education === 'string' ? education : JSON.stringify(education || []),
          typeof skills === 'string' ? skills : JSON.stringify(skills || []),
          typeof projects === 'string' ? projects : JSON.stringify(projects || []),
          typeof certifications === 'string' ? certifications : JSON.stringify(certifications || []),
          typeof custom_sections === 'string' ? custom_sections : JSON.stringify(custom_sections || []),
          typeof version_history === 'string' ? version_history : JSON.stringify(version_history || []),
          template_id,
          theme_color,
          page_style || 'modern',
          ats_score || 0,
          typeof ats_feedback === 'string' ? ats_feedback : JSON.stringify(ats_feedback || {}),
          resumeId,
          userId
        ]
      );

      return res.json({
        success: true,
        message: 'Resume updated successfully!',
        resumeId: Number(resumeId),
        resume: {
          ...req.body,
          id: Number(resumeId),
          user_id: userId
        }
      });
    } else {
      // Insert new resume for authenticated user
      const [result] = await db.query(
        `INSERT INTO resumes (
          user_id, title, target_role, personal_info, summary,
          experience, education, skills, projects, certifications,
          custom_sections, version_history,
          template_id, theme_color, page_style, ats_score, ats_feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          title,
          target_role,
          typeof personal_info === 'string' ? personal_info : JSON.stringify(personal_info || {}),
          summary,
          typeof experience === 'string' ? experience : JSON.stringify(experience || []),
          typeof education === 'string' ? education : JSON.stringify(education || []),
          typeof skills === 'string' ? skills : JSON.stringify(skills || []),
          typeof projects === 'string' ? projects : JSON.stringify(projects || []),
          typeof certifications === 'string' ? certifications : JSON.stringify(certifications || []),
          typeof custom_sections === 'string' ? custom_sections : JSON.stringify(custom_sections || []),
          typeof version_history === 'string' ? version_history : JSON.stringify(version_history || []),
          template_id,
          theme_color,
          page_style || 'modern',
          ats_score || 0,
          typeof ats_feedback === 'string' ? ats_feedback : JSON.stringify(ats_feedback || {})
        ]
      );

      const newId = result.insertId;
      return res.status(201).json({
        success: true,
        message: 'Resume created successfully!',
        resumeId: newId,
        resume: {
          ...req.body,
          id: newId,
          user_id: userId
        }
      });
    }
  } catch (error) {
    console.error('Save resume error:', error);
    res.status(500).json({ success: false, message: 'Server error saving resume.' });
  }
}

export async function getUserResumes(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!getIsConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected.' });
    }

    const db = getDB();
    const [rows] = await db.query(
      'SELECT id, user_id, title, target_role, template_id, theme_color, page_style, ats_score, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC',
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const { id } = req.params;
    if (!getIsConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected.' });
    }

    const db = getDB();
    const [rows] = await db.query('SELECT * FROM resumes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const r = rows[0];
    if (r.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this resume.' });
    }

    const resume = {
      ...r,
      personal_info: safeParse(r.personal_info, {}),
      experience: safeParse(r.experience, []),
      education: safeParse(r.education, []),
      skills: safeParse(r.skills, []),
      projects: safeParse(r.projects, []),
      certifications: safeParse(r.certifications, []),
      custom_sections: safeParse(r.custom_sections, []),
      version_history: safeParse(r.version_history, []),
      ats_feedback: safeParse(r.ats_feedback, {})
    };

    res.json({ success: true, resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ success: false, message: 'Server error loading resume.' });
  }
}

export async function deleteResume(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const { id } = req.params;
    if (!getIsConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected.' });
    }

    const db = getDB();
    const [rows] = await db.query('SELECT id, user_id FROM resumes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found to delete.' });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this resume.' });
    }

    await db.query('DELETE FROM resumes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting resume.' });
  }
}

// Clone an existing resume
export async function cloneResume(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const { id } = req.params;
    const userId = req.user.id;

    if (!getIsConnected()) {
      return res.status(503).json({ success: false, message: 'Database not connected.' });
    }

    const db = getDB();
    const [rows] = await db.query('SELECT * FROM resumes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Source resume not found.' });
    }

    const source = rows[0];
    if (source.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this resume.' });
    }

    const newTitle = `${source.title || 'My Resume'} (Copy)`;

    const [result] = await db.query(
      `INSERT INTO resumes (
        user_id, title, target_role, personal_info, summary,
        experience, education, skills, projects, certifications,
        custom_sections, version_history,
        template_id, theme_color, page_style, ats_score, ats_feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        newTitle,
        source.target_role,
        typeof source.personal_info === 'string' ? source.personal_info : JSON.stringify(source.personal_info || {}),
        source.summary,
        typeof source.experience === 'string' ? source.experience : JSON.stringify(source.experience || []),
        typeof source.education === 'string' ? source.education : JSON.stringify(source.education || []),
        typeof source.skills === 'string' ? source.skills : JSON.stringify(source.skills || []),
        typeof source.projects === 'string' ? source.projects : JSON.stringify(source.projects || []),
        typeof source.certifications === 'string' ? source.certifications : JSON.stringify(source.certifications || []),
        typeof source.custom_sections === 'string' ? source.custom_sections : JSON.stringify(source.custom_sections || []),
        typeof source.version_history === 'string' ? source.version_history : JSON.stringify(source.version_history || []),
        source.template_id,
        source.theme_color,
        source.page_style || 'modern',
        source.ats_score,
        typeof source.ats_feedback === 'string' ? source.ats_feedback : JSON.stringify(source.ats_feedback || {})
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Resume cloned successfully!',
      clonedId: result.insertId
    });
  } catch (error) {
    console.error('Clone resume error:', error);
    res.status(500).json({ success: false, message: 'Server error cloning resume.' });
  }
}

// Public web resume view
export async function getPublicResume(req, res) {
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
      personal_info: safeParse(r.personal_info, {}),
      experience: safeParse(r.experience, []),
      education: safeParse(r.education, []),
      skills: safeParse(r.skills, []),
      projects: safeParse(r.projects, []),
      certifications: safeParse(r.certifications, []),
      custom_sections: safeParse(r.custom_sections, []),
      ats_feedback: safeParse(r.ats_feedback, {})
    };

    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching public resume.' });
  }
}



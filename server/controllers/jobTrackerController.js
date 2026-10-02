import { getDB, getIsConnected } from '../config/db.js';

export async function getApplications(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    if (!getIsConnected() || !userId) {
      return res.json({ success: true, applications: [] });
    }

    const db = getDB();
    const [rows] = await db.query(
      'SELECT * FROM job_applications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, applications: rows });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications.' });
  }
}

export async function createApplication(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const { company, role, location, salary, applied_date, status = 'Applied', notes, resume_id } = req.body;

    if (!company || !role) {
      return res.status(400).json({ success: false, message: 'Company and Role are required.' });
    }

    if (!getIsConnected()) {
      return res.json({ 
        success: true, 
        message: 'Saved to session', 
        application: { ...req.body, id: Date.now() } 
      });
    }

    const db = getDB();
    const [result] = await db.query(
      `INSERT INTO job_applications (user_id, company, role, location, salary, applied_date, status, notes, resume_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, company, role, location || '', salary || '', applied_date || new Date().toISOString().split('T')[0], status, notes || '', resume_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Job application tracked!',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Server error saving application.' });
  }
}

export async function updateApplication(req, res) {
  try {
    const { id } = req.params;
    const { company, role, location, salary, applied_date, status, notes } = req.body;

    if (!getIsConnected()) {
      return res.json({ success: true, message: 'Updated session.' });
    }

    const db = getDB();
    await db.query(
      `UPDATE job_applications SET company = ?, role = ?, location = ?, salary = ?, applied_date = ?, status = ?, notes = ? WHERE id = ?`,
      [company, role, location, salary, applied_date, status, notes, id]
    );

    res.json({ success: true, message: 'Application updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating application.' });
  }
}

export async function deleteApplication(req, res) {
  try {
    const { id } = req.params;
    if (!getIsConnected()) {
      return res.json({ success: true, message: 'Deleted locally.' });
    }

    const db = getDB();
    await db.query('DELETE FROM job_applications WHERE id = ?', [id]);
    res.json({ success: true, message: 'Application removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting application.' });
  }
}

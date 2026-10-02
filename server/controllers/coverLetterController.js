import { getDB, getIsConnected } from '../config/db.js';

export async function getCoverLetters(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    if (!getIsConnected() || !userId) {
      return res.json({ success: true, letters: [] });
    }

    const db = getDB();
    const [rows] = await db.query(
      'SELECT * FROM cover_letters WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, letters: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching cover letters.' });
  }
}

export async function saveCoverLetter(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const { company_name, job_role, letter_content, tone = 'professional' } = req.body;

    if (!company_name || !letter_content) {
      return res.status(400).json({ success: false, message: 'Company name and letter content required.' });
    }

    if (!getIsConnected()) {
      return res.json({ success: true, message: 'Saved locally.', letter: { ...req.body, id: Date.now() } });
    }

    const db = getDB();
    const [result] = await db.query(
      'INSERT INTO cover_letters (user_id, company_name, job_role, letter_content, tone) VALUES (?, ?, ?, ?, ?)',
      [userId, company_name, job_role || 'Position', letter_content, tone]
    );

    res.status(201).json({ success: true, message: 'Cover letter saved in library!', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error saving cover letter.' });
  }
}

export async function deleteCoverLetter(req, res) {
  try {
    const { id } = req.params;
    if (!getIsConnected()) return res.json({ success: true });
    const db = getDB();
    await db.query('DELETE FROM cover_letters WHERE id = ?', [id]);
    res.json({ success: true, message: 'Cover letter deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting cover letter.' });
  }
}

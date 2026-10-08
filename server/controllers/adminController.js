import bcrypt from 'bcryptjs';
import { getDB, getIsConnected } from '../config/db.js';

// Admin Metrics Overview (100% Free Platform Analytics)
export async function getAdminMetrics(req, res) {
  try {
    if (!getIsConnected()) {
      return res.json({
        success: true,
        metrics: {
          totalUsers: 'Not available',
          totalResumes: 'Not available',
          publicResumes: 'Not available',
          totalApplicationsTracked: 'Not available',
          totalCoverLetters: 'Not available',
          aiOperations: 'Not available',
          planType: '100% Free'
        }
      });
    }

    const db = getDB();
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalResumes }]] = await db.query('SELECT COUNT(*) as totalResumes FROM resumes');
    const [[{ publicResumes }]] = await db.query('SELECT COUNT(*) as publicResumes FROM resumes WHERE is_public = 1 OR is_public = TRUE');
    const [[{ totalApplicationsTracked }]] = await db.query('SELECT COUNT(*) as totalApplicationsTracked FROM job_applications');
    const [[{ totalCoverLetters }]] = await db.query('SELECT COUNT(*) as totalCoverLetters FROM cover_letters');
    const [[{ aiOperations }]] = await db.query('SELECT COALESCE(SUM(ai_daily_count), 0) as aiOperations FROM users');

    res.json({
      success: true,
      metrics: {
        totalUsers: totalUsers ?? 0,
        totalResumes: totalResumes ?? 0,
        publicResumes: publicResumes ?? 0,
        totalApplicationsTracked: totalApplicationsTracked ?? 0,
        totalCoverLetters: totalCoverLetters ?? 0,
        aiOperations: aiOperations ?? 0,
        planType: '100% Free'
      }
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error loading admin metrics.' });
  }
}

// User Profile Update
export async function updateProfile(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const { name, email, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login required.' });
    }

    if (!getIsConnected()) {
      return res.json({ success: true, message: 'Profile updated in session.' });
    }

    const db = getDB();

    if (newPassword && newPassword.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      await db.query('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [name, email, passwordHash, userId]);
    } else {
      await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
    }

    res.json({ success: true, message: 'Account details updated successfully!', user: { id: userId, name, email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// User Account Deletion
export async function deleteAccount(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (getIsConnected()) {
      const db = getDB();
      await db.query('DELETE FROM resumes WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM job_applications WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM cover_letters WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM users WHERE id = ?', [userId]);
    }

    res.json({ success: true, message: 'Account and all data deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
}

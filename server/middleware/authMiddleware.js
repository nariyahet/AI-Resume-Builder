import jwt from 'jsonwebtoken';
import { getDB, getIsConnected } from '../config/db.js';

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_ai_resume_jwt_key_2026_xyz');
    req.user = decoded; // { id, email, name, role }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

// Optional auth for guests who want to save or preview without mandatory login
export function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_ai_resume_jwt_key_2026_xyz');
      req.user = decoded;
    }
  } catch (err) {
    // Continue as guest
  }
  next();
}

// Admin-only middleware: authenticates user and enforces administrator role
export async function adminMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_ai_resume_jwt_key_2026_xyz');
    req.user = decoded;

    if (getIsConnected()) {
      const db = getDB();
      const [rows] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      if (rows.length === 0 || rows[0].role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
      }
      req.user.role = rows[0].role;
    } else {
      // Offline fallback: check decoded token role
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

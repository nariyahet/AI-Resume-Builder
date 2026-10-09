import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, getIsConnected } from '../config/db.js';
import { getJwtSecret } from '../middleware/authMiddleware.js';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!getIsConnected()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not connected. Please verify MySQL credentials in server/.env' 
      });
    }

    const db = getDB();
    const [existing] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email, name, role: 'user' }, getJwtSecret(), { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: { id: userId, name, email, role: 'user' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!getIsConnected()) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not connected. Please verify MySQL credentials in server/.env' 
      });
    }

    const db = getDB();
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function getMe(req, res) {
  try {
    if (!getIsConnected()) {
      return res.json({ success: true, user: req.user });
    }
    const db = getDB();
    const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
}

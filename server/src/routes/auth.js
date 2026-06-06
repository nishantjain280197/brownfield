/**
 * @module routes/auth
 * @description Authentication routes for login, logout, and token refresh.
 * Sessions have a configurable inactivity timeout (default 15 minutes).
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../db/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/audit');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('routes/auth');

const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '8h';

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token.
 * @body {string} username - User's username.
 * @body {string} password - User's password.
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'MISSING_CREDENTIALS', message: 'Username and password are required' });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      logAuditEvent({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: { username },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
    }

    const sessionId = uuidv4();

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, jti: sessionId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY },
    );
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at)
       VALUES (?, ?, ?, ?)`
    ).run(sessionId, user.id, token, expiresAt);

    logAuditEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('User logged in', { userId: user.id, username: user.username });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'LOGIN_ERROR', message: 'An error occurred during login' });
  }
});

/**
 * POST /api/auth/logout
 * Invalidates the current session.
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.user.sessionId);

    logAuditEvent({
      userId: req.user.userId,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ error: 'LOGOUT_ERROR', message: 'An error occurred during logout' });
  }
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
router.get('/me', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Profile fetch error', { error: error.message });
    res.status(500).json({ error: 'PROFILE_ERROR', message: 'An error occurred' });
  }
});

module.exports = router;

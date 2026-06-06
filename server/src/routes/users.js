/**
 * @module routes/users
 * @description User management routes (admin-only).
 * Supports CRUD operations on user accounts with role-based access.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/audit');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('routes/users');

/**
 * GET /api/users
 * Lists all users (admin only).
 */
router.get('/', authenticate, requireRole('admin'), (req, res) => {
  try {
    const db = getDatabase();
    const users = db.prepare('SELECT id, username, email, role, is_active, created_at, updated_at FROM users').all();
    res.json({ users });
  } catch (error) {
    logger.error('Failed to list users', { error: error.message });
    res.status(500).json({ error: 'LIST_USERS_FAILED', message: error.message });
  }
});

/**
 * POST /api/users
 * Creates a new user (admin only).
 * @body {string} username - Unique username.
 * @body {string} email - Email address.
 * @body {string} password - Password (will be hashed).
 * @body {string} [role='user'] - User role.
 */
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'username, email, and password are required' });
    }

    const validRoles = ['admin', 'user', 'adjuster', 'underwriter'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'INVALID_ROLE', message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'USER_EXISTS', message: 'Username or email already exists' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, username, email, passwordHash, role);

    logAuditEvent({
      userId: req.user.userId,
      action: 'CREATE_USER',
      resource: 'users',
      details: { createdUserId: id, username, role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      user: { id, username, email, role, is_active: 1 },
    });
  } catch (error) {
    logger.error('Failed to create user', { error: error.message });
    res.status(500).json({ error: 'CREATE_USER_FAILED', message: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Updates a user's role or active status (admin only).
 * @param {string} id - User ID.
 * @body {string} [role] - New role.
 * @body {boolean} [is_active] - Active status.
 */
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const updates = [];
    const params = [];
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'NO_UPDATES', message: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    logAuditEvent({
      userId: req.user.userId,
      action: 'UPDATE_USER',
      resource: 'users',
      details: { targetUserId: id, changes: { role, is_active } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const updated = db.prepare('SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?').get(id);
    res.json({ user: updated });
  } catch (error) {
    logger.error('Failed to update user', { error: error.message });
    res.status(500).json({ error: 'UPDATE_USER_FAILED', message: error.message });
  }
});

module.exports = router;

/**
 * @module routes/audit
 * @description Audit trail API endpoints for viewing logged actions (admin only).
 */

const express = require('express');
const { getDatabase } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('routes/audit');

/**
 * GET /api/audit
 * Retrieves paginated audit log entries (admin only).
 * @query {number} [page=1] - Page number.
 * @query {number} [limit=50] - Results per page (max 200).
 * @query {string} [action] - Filter by action type.
 * @query {string} [user_id] - Filter by user ID.
 * @query {string} [start_date] - Filter entries after this date.
 * @query {string} [end_date] - Filter entries before this date.
 */
router.get('/', authenticate, requireRole('admin'), (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const db = getDatabase();
    let whereClause = '1=1';
    const params = [];

    if (req.query.action) {
      whereClause += ' AND action = ?';
      params.push(req.query.action);
    }
    if (req.query.user_id) {
      whereClause += ' AND user_id = ?';
      params.push(req.query.user_id);
    }
    if (req.query.start_date) {
      whereClause += ' AND created_at >= ?';
      params.push(req.query.start_date);
    }
    if (req.query.end_date) {
      whereClause += ' AND created_at <= ?';
      params.push(req.query.end_date);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM audit_log WHERE ${whereClause}`).get(...params);
    const entries = db.prepare(
      `SELECT * FROM audit_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const parsedEntries = entries.map(e => ({
      ...e,
      details: e.details ? JSON.parse(e.details) : null,
    }));

    res.json({
      entries: parsedEntries,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch audit log', { error: error.message });
    res.status(500).json({ error: 'AUDIT_FETCH_FAILED', message: error.message });
  }
});

module.exports = router;

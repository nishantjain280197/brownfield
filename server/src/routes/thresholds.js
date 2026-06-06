/**
 * @module routes/thresholds
 * @description API endpoints for managing configurable risk severity thresholds.
 * Thresholds determine how weather data is classified into risk levels.
 */

const express = require('express');
const { getDatabase } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/audit');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('routes/thresholds');

/**
 * GET /api/thresholds
 * Returns all risk thresholds, optionally filtered by peril type.
 * @query {string} [peril_type] - Filter by peril type.
 */
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    let query = 'SELECT * FROM risk_thresholds';
    const params = [];

    if (req.query.peril_type) {
      query += ' WHERE peril_type = ?';
      params.push(req.query.peril_type);
    }

    query += ' ORDER BY peril_type, min_value ASC';
    const thresholds = db.prepare(query).all(...params);
    res.json({ thresholds });
  } catch (error) {
    logger.error('Failed to fetch thresholds', { error: error.message });
    res.status(500).json({ error: 'FETCH_THRESHOLDS_FAILED', message: error.message });
  }
});

/**
 * PUT /api/thresholds/:id
 * Updates a risk threshold value (admin only).
 * @param {string} id - Threshold ID.
 * @body {number} [min_value] - New minimum value.
 * @body {number} [max_value] - New maximum value.
 * @body {string} [description] - Updated description.
 */
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { min_value, max_value, description } = req.body;

    const db = getDatabase();
    const threshold = db.prepare('SELECT * FROM risk_thresholds WHERE id = ?').get(id);
    if (!threshold) {
      return res.status(404).json({ error: 'THRESHOLD_NOT_FOUND', message: 'Threshold not found' });
    }

    const updates = [];
    const params = [];
    if (min_value !== undefined) { updates.push('min_value = ?'); params.push(min_value); }
    if (max_value !== undefined) { updates.push('max_value = ?'); params.push(max_value); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'NO_UPDATES', message: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    updates.push('updated_by = ?');
    params.push(req.user.userId);
    params.push(id);

    db.prepare(`UPDATE risk_thresholds SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    logAuditEvent({
      userId: req.user.userId,
      action: 'UPDATE_THRESHOLD',
      resource: 'thresholds',
      details: { thresholdId: id, changes: { min_value, max_value, description } },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const updated = db.prepare('SELECT * FROM risk_thresholds WHERE id = ?').get(id);
    res.json({ threshold: updated });
  } catch (error) {
    logger.error('Failed to update threshold', { error: error.message });
    res.status(500).json({ error: 'UPDATE_THRESHOLD_FAILED', message: error.message });
  }
});

module.exports = router;

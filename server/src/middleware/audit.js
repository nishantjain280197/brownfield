/**
 * @module middleware/audit
 * @description Audit trail middleware that logs all search queries with user ID and timestamp.
 */

const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../db/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('audit');

/**
 * Logs an audit event to the database.
 * @param {object} entry - Audit entry.
 * @param {string} [entry.userId] - ID of the user performing the action.
 * @param {string} entry.action - Action type (e.g., 'SEARCH', 'LOGIN', 'EXPORT').
 * @param {string} entry.resource - Resource acted upon.
 * @param {object} [entry.details] - Additional action details.
 * @param {string} [entry.ipAddress] - Client IP address.
 * @param {string} [entry.userAgent] - Client user agent string.
 */
function logAuditEvent({ userId, action, resource, details, ipAddress, userAgent }) {
  try {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO audit_log (id, user_id, action, resource, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuidv4(),
      userId || null,
      action,
      resource,
      details ? JSON.stringify(details) : null,
      ipAddress || null,
      userAgent || null,
    );
  } catch (error) {
    logger.error('Failed to write audit log', { error: error.message });
  }
}

/**
 * Express middleware that automatically logs search requests to the audit trail.
 * Captures user ID, search parameters, IP, and user agent.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
function auditSearchMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    logAuditEvent({
      userId: req.user?.userId,
      action: 'SEARCH',
      resource: req.originalUrl,
      details: {
        query: req.query,
        body: req.body,
        statusCode: res.statusCode,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    return originalJson(body);
  };

  next();
}

module.exports = { logAuditEvent, auditSearchMiddleware };

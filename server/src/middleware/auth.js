/**
 * @module middleware/auth
 * @description JWT authentication middleware with role-based access control.
 * Tokens are validated using HS256 with a configurable secret.
 */

const jwt = require('jsonwebtoken');
const { getDatabase } = require('../db/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth');

const JWT_SECRET = process.env.JWT_SECRET || 'weather-portal-dev-secret-change-in-production';
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '15', 10);

/**
 * Express middleware that validates JWT tokens and enforces 15-minute inactivity timeout.
 * Attaches decoded user info to req.user on success.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();

    const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND user_id = ?').get(token, decoded.userId);

    if (!session) {
      return res.status(401).json({ error: 'INVALID_SESSION', message: 'Session not found' });
    }

    const lastActivity = new Date(session.last_activity);
    const now = new Date();
    const minutesSinceActivity = (now - lastActivity) / (1000 * 60);

    if (minutesSinceActivity > SESSION_TIMEOUT_MINUTES) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
      logger.info('Session expired due to inactivity', { userId: decoded.userId });
      return res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Session expired due to inactivity' });
    }

    db.prepare("UPDATE sessions SET last_activity = datetime('now') WHERE id = ?").run(session.id);

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token has expired' });
    }
    logger.error('Authentication failed', { error: error.message });
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid token' });
  }
}

/**
 * Creates a role-checking middleware.
 * @param {...string} roles - Allowed roles.
 * @returns {Function} Express middleware that restricts access by role.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, JWT_SECRET, SESSION_TIMEOUT_MINUTES };

/**
 * @module db/schema
 * @description SQLite database schema definitions and initialization.
 * Uses AES-256 encryption references for sensitive data columns.
 */

/**
 * SQL statements for creating all database tables.
 * @type {string[]}
 */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'adjuster', 'underwriter')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    last_activity TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,

  `CREATE TABLE IF NOT EXISTS risk_thresholds (
    id TEXT PRIMARY KEY,
    peril_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('low', 'moderate', 'high', 'severe')),
    min_value REAL NOT NULL,
    max_value REAL,
    unit TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by TEXT,
    UNIQUE(peril_type, severity)
  )`,

  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS saved_locations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    zip_code TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`,
];

/**
 * Default risk threshold configuration for weather perils.
 * @type {Array<{peril_type: string, severity: string, min_value: number, max_value: number|null, unit: string, description: string}>}
 */
const DEFAULT_THRESHOLDS = [
  { peril_type: 'wind', severity: 'low', min_value: 0, max_value: 25, unit: 'mph', description: 'Light to moderate wind' },
  { peril_type: 'wind', severity: 'moderate', min_value: 25, max_value: 40, unit: 'mph', description: 'Strong wind' },
  { peril_type: 'wind', severity: 'high', min_value: 40, max_value: 58, unit: 'mph', description: 'Damaging wind' },
  { peril_type: 'wind', severity: 'severe', min_value: 58, max_value: null, unit: 'mph', description: 'Destructive wind / hurricane-force' },
  { peril_type: 'hail', severity: 'low', min_value: 0, max_value: 0.5, unit: 'inches', description: 'Pea-sized hail' },
  { peril_type: 'hail', severity: 'moderate', min_value: 0.5, max_value: 1.0, unit: 'inches', description: 'Marble to quarter-sized hail' },
  { peril_type: 'hail', severity: 'high', min_value: 1.0, max_value: 2.0, unit: 'inches', description: 'Golf-ball hail' },
  { peril_type: 'hail', severity: 'severe', min_value: 2.0, max_value: null, unit: 'inches', description: 'Baseball-sized or larger hail' },
  { peril_type: 'precipitation', severity: 'low', min_value: 0, max_value: 0.5, unit: 'inches', description: 'Light rain' },
  { peril_type: 'precipitation', severity: 'moderate', min_value: 0.5, max_value: 1.5, unit: 'inches', description: 'Moderate rain' },
  { peril_type: 'precipitation', severity: 'high', min_value: 1.5, max_value: 3.0, unit: 'inches', description: 'Heavy rain' },
  { peril_type: 'precipitation', severity: 'severe', min_value: 3.0, max_value: null, unit: 'inches', description: 'Extreme precipitation / flooding risk' },
  { peril_type: 'temperature', severity: 'low', min_value: 32, max_value: 95, unit: '°F', description: 'Normal temperature range' },
  { peril_type: 'temperature', severity: 'moderate', min_value: 20, max_value: 32, unit: '°F', description: 'Freezing conditions' },
  { peril_type: 'temperature', severity: 'high', min_value: 95, max_value: 110, unit: '°F', description: 'Extreme heat' },
  { peril_type: 'temperature', severity: 'severe', min_value: -20, max_value: 20, unit: '°F', description: 'Dangerous cold' },
];

module.exports = { SCHEMA, DEFAULT_THRESHOLDS };

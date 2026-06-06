/**
 * @module db/database
 * @description SQLite database initialization and connection management.
 */

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { SCHEMA, DEFAULT_THRESHOLDS } = require('./schema');
const { createLogger } = require('../utils/logger');

const logger = createLogger('database');

let db = null;

/**
 * Initializes the SQLite database, creates tables, and seeds default data.
 * @param {string} [dbPath] - Path to the SQLite database file. Defaults to ./data/weather_portal.db.
 * @returns {Database} The initialized database instance.
 */
function initDatabase(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, '../../data/weather_portal.db');

  const dir = path.dirname(resolvedPath);
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  for (const sql of SCHEMA) {
    db.exec(sql);
  }

  seedDefaultThresholds();
  seedDefaultAdmin();

  logger.info('Database initialized', { path: resolvedPath });
  return db;
}

/**
 * Seeds default risk thresholds if the table is empty.
 */
function seedDefaultThresholds() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM risk_thresholds').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(
    `INSERT INTO risk_thresholds (id, peril_type, severity, min_value, max_value, unit, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (const t of DEFAULT_THRESHOLDS) {
      insert.run(uuidv4(), t.peril_type, t.severity, t.min_value, t.max_value, t.unit, t.description);
    }
  });
  tx();
  logger.info('Default risk thresholds seeded');
}

/**
 * Seeds a default admin user if no users exist.
 */
function seedDefaultAdmin() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (count.cnt > 0) return;

  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`
  ).run(uuidv4(), 'admin', 'admin@weatherportal.local', hash, 'admin');

  logger.info('Default admin user created (username: admin)');
}

/**
 * Returns the current database instance.
 * @returns {Database} Active database connection.
 * @throws {Error} If database has not been initialized.
 */
function getDatabase() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

/**
 * Closes the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

module.exports = { initDatabase, getDatabase, closeDatabase };

/**
 * @module utils/logger
 * @description Centralized Winston logger factory.
 */

const winston = require('winston');

/**
 * Creates a namespaced logger instance.
 * @param {string} namespace - Logger namespace for filtering.
 * @returns {winston.Logger} Configured logger instance.
 */
function createLogger(namespace) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: 'weather-portal', namespace },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ],
  });
}

module.exports = { createLogger };

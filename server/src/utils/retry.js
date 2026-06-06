/**
 * @module utils/retry
 * @description Retry utility with exponential backoff for external API calls.
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('retry');

/**
 * Executes an async function with exponential backoff retry logic.
 * @param {Function} fn - Async function to execute.
 * @param {object} [options] - Retry configuration.
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [options.baseDelay=1000] - Base delay in milliseconds.
 * @param {number} [options.maxDelay=30000] - Maximum delay cap in milliseconds.
 * @param {Function} [options.shouldRetry] - Predicate to decide if error is retryable.
 * @returns {Promise<*>} Result of the successful function call.
 * @throws {Error} Final error after all retries are exhausted.
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        break;
      }

      const jitter = Math.random() * 0.3 + 0.85;
      const delay = Math.min(baseDelay * Math.pow(2, attempt) * jitter, maxDelay);
      logger.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${Math.round(delay)}ms`, {
        error: error.message,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { retryWithBackoff };

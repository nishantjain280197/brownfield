/**
 * @module utils/validation
 * @description Input validation helpers for API requests.
 */

/**
 * Validates a US ZIP code (5-digit or ZIP+4 format).
 * @param {string} zip - ZIP code string.
 * @returns {boolean} True if valid.
 */
function isValidZipCode(zip) {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

/**
 * Validates latitude value.
 * @param {number} lat - Latitude.
 * @returns {boolean} True if within valid range [-90, 90].
 */
function isValidLatitude(lat) {
  const num = Number(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

/**
 * Validates longitude value.
 * @param {number} lon - Longitude.
 * @returns {boolean} True if within valid range [-180, 180].
 */
function isValidLongitude(lon) {
  const num = Number(lon);
  return !isNaN(num) && num >= -180 && num <= 180;
}

/**
 * Validates a date string in YYYY-MM-DD format.
 * @param {string} dateStr - Date string to validate.
 * @returns {boolean} True if valid date in correct format.
 */
function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(date.getTime());
}

/**
 * Validates an address string (non-empty, reasonable length).
 * @param {string} address - Address to validate.
 * @returns {boolean} True if valid.
 */
function isValidAddress(address) {
  return typeof address === 'string' && address.trim().length >= 3 && address.trim().length <= 500;
}

/**
 * Sanitizes a string to prevent injection attacks.
 * @param {string} input - Raw user input.
 * @returns {string} Sanitized string.
 */
function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>'";&]/g, '').trim();
}

module.exports = {
  isValidZipCode,
  isValidLatitude,
  isValidLongitude,
  isValidDate,
  isValidAddress,
  sanitize,
};

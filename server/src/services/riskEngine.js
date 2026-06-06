/**
 * @module services/riskEngine
 * @description Risk assessment engine that evaluates weather data against configurable thresholds.
 * Thresholds are loaded from the database at runtime.
 */

const { getDatabase } = require('../db/database');

/** WMO weather codes that indicate hail conditions. */
const HAIL_WMO_CODES = [96, 99];

/** WMO weather codes that indicate thunderstorm conditions. */
const STORM_WMO_CODES = [95, 96, 99];

/** WMO weather codes indicating freezing conditions. */
const FREEZING_WMO_CODES = [56, 57, 66, 67, 77];

/**
 * Loads risk thresholds from the database for a given peril type.
 * @param {string} perilType - The peril type (e.g., 'wind', 'hail', 'precipitation', 'temperature').
 * @returns {Array<{severity: string, min_value: number, max_value: number|null}>} Sorted thresholds.
 */
function loadThresholds(perilType) {
  const db = getDatabase();
  return db
    .prepare('SELECT severity, min_value, max_value, unit, description FROM risk_thresholds WHERE peril_type = ? ORDER BY min_value ASC')
    .all(perilType);
}

/**
 * Evaluates a numeric value against configurable thresholds.
 * @param {number} value - The measured value.
 * @param {string} perilType - The peril type to look up thresholds for.
 * @returns {{severity: string, value: number, thresholds: object[]}} Assessment result.
 */
function assessRisk(value, perilType) {
  const thresholds = loadThresholds(perilType);
  let severity = 'unknown';

  for (const t of thresholds) {
    const aboveMin = value >= t.min_value;
    const belowMax = t.max_value === null || value < t.max_value;
    if (aboveMin && belowMax) {
      severity = t.severity;
      break;
    }
  }

  if (severity === 'unknown' && thresholds.length > 0) {
    const lastThreshold = thresholds[thresholds.length - 1];
    if (value >= lastThreshold.min_value) {
      severity = lastThreshold.severity;
    }
  }

  return { severity, value, thresholds };
}

/**
 * Performs a full risk assessment on a day's weather data.
 * @param {object} dailyData - Daily weather data from Open-Meteo.
 * @param {number} dailyData.temperature_2m_max - Maximum temperature (°F).
 * @param {number} dailyData.temperature_2m_min - Minimum temperature (°F).
 * @param {number} dailyData.precipitation_sum - Total precipitation (inches).
 * @param {number} dailyData.windspeed_10m_max - Maximum wind speed (mph).
 * @param {number} dailyData.windgusts_10m_max - Maximum wind gusts (mph).
 * @param {number} dailyData.weathercode - WMO weather code.
 * @returns {object} Complete risk assessment with severity ratings per peril.
 */
function assessDailyRisk(dailyData) {
  const {
    temperature_2m_max,
    temperature_2m_min,
    precipitation_sum,
    windspeed_10m_max,
    windgusts_10m_max,
    weathercode,
  } = dailyData;

  const windRisk = assessRisk(windspeed_10m_max || 0, 'wind');
  const precipRisk = assessRisk(precipitation_sum || 0, 'precipitation');
  const hailDetected = HAIL_WMO_CODES.includes(weathercode);
  const stormDetected = STORM_WMO_CODES.includes(weathercode);

  const tempExtremeHigh = assessRisk(temperature_2m_max || 70, 'temperature');
  const tempExtremeLow = assessRisk(temperature_2m_min || 50, 'temperature');
  const tempRisk = compareSeverity(tempExtremeHigh.severity, tempExtremeLow.severity) > 0
    ? tempExtremeHigh
    : tempExtremeLow;

  const hailRisk = {
    severity: hailDetected ? 'high' : 'low',
    detected: hailDetected,
    weathercode,
  };

  const overallSeverity = calculateOverallSeverity([
    windRisk.severity,
    precipRisk.severity,
    hailRisk.severity,
    tempRisk.severity,
  ]);

  return {
    overall: overallSeverity,
    wind: { ...windRisk, gusts: windgusts_10m_max },
    precipitation: precipRisk,
    hail: hailRisk,
    temperature: { ...tempRisk, max: temperature_2m_max, min: temperature_2m_min },
    storm: { detected: stormDetected, weathercode },
    freezing: { detected: FREEZING_WMO_CODES.includes(weathercode) },
  };
}

/** @type {Record<string, number>} Numeric ordering for severity levels. */
const SEVERITY_ORDER = { low: 0, moderate: 1, high: 2, severe: 3, unknown: -1 };

/**
 * Compares two severity strings.
 * @param {string} a - First severity.
 * @param {string} b - Second severity.
 * @returns {number} Positive if a > b, negative if a < b, 0 if equal.
 */
function compareSeverity(a, b) {
  return (SEVERITY_ORDER[a] || 0) - (SEVERITY_ORDER[b] || 0);
}

/**
 * Calculates the overall severity from an array of individual severities.
 * The overall severity is the maximum severity found.
 * @param {string[]} severities - Array of severity strings.
 * @returns {string} The highest severity.
 */
function calculateOverallSeverity(severities) {
  let max = 'low';
  for (const s of severities) {
    if (compareSeverity(s, max) > 0) {
      max = s;
    }
  }
  return max;
}

module.exports = {
  assessRisk,
  assessDailyRisk,
  loadThresholds,
  compareSeverity,
  calculateOverallSeverity,
  HAIL_WMO_CODES,
  STORM_WMO_CODES,
  FREEZING_WMO_CODES,
  SEVERITY_ORDER,
};

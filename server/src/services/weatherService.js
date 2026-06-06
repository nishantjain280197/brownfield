/**
 * @module services/weatherService
 * @description Service for fetching weather data from Open-Meteo API with retry logic.
 * All external API calls use exponential backoff per compliance requirements.
 */

const { retryWithBackoff } = require('../utils/retry');
const { createLogger } = require('../utils/logger');

const logger = createLogger('weatherService');

const OPEN_METEO_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Determines if an HTTP error is retryable (5xx or network error).
 * @param {Error} error - The error to evaluate.
 * @returns {boolean} True if the request should be retried.
 */
function isRetryableError(error) {
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }
  if (error.status >= 500) return true;
  if (error.status === 429) return true;
  return false;
}

/**
 * Fetches historical weather data for a location and date range from Open-Meteo.
 * @param {number} latitude - Location latitude.
 * @param {number} longitude - Location longitude.
 * @param {string} startDate - Start date (YYYY-MM-DD).
 * @param {string} endDate - End date (YYYY-MM-DD).
 * @returns {Promise<object>} Parsed weather data from Open-Meteo.
 * @throws {Error} If the API call fails after all retries.
 */
async function fetchHistoricalWeather(latitude, longitude, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,windgusts_10m_max,weathercode',
    hourly: 'windspeed_10m,precipitation,temperature_2m,weathercode',
    temperature_unit: 'fahrenheit',
    windspeed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'America/Chicago',
  });

  const url = `${OPEN_METEO_BASE}?${params}`;
  logger.info('Fetching historical weather', { latitude, longitude, startDate, endDate });

  return retryWithBackoff(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        const error = new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    { maxRetries: 3, baseDelay: 1000, maxDelay: 15000, shouldRetry: isRetryableError },
  );
}

/**
 * Geocodes an address string to latitude/longitude using Nominatim.
 * @param {string} address - Human-readable address or place name.
 * @returns {Promise<{lat: number, lon: number, display_name: string}>} Geocoded coordinates.
 * @throws {Error} If geocoding fails or returns no results.
 */
async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
  });

  const url = `${NOMINATIM_BASE}/search?${params}`;

  const results = await retryWithBackoff(
    async () => {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'WeatherInsurancePortal/1.0' },
      });
      if (!response.ok) {
        const error = new Error(`Nominatim API error: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    { maxRetries: 2, baseDelay: 1500, shouldRetry: isRetryableError },
  );

  if (!results || results.length === 0) {
    throw new Error('No results found for the given address');
  }

  return {
    lat: parseFloat(results[0].lat),
    lon: parseFloat(results[0].lon),
    display_name: results[0].display_name,
  };
}

/**
 * Fetches 3-year historical comparison data for a given location and date of loss.
 * Returns weather data for the DOL date across 3 consecutive years.
 * @param {number} latitude - Location latitude.
 * @param {number} longitude - Location longitude.
 * @param {string} dateOfLoss - Date of loss (YYYY-MM-DD).
 * @returns {Promise<object[]>} Array of yearly weather data objects.
 */
async function fetch3YearComparison(latitude, longitude, dateOfLoss) {
  const dolDate = new Date(dateOfLoss + 'T00:00:00Z');
  const dolYear = dolDate.getUTCFullYear();
  const monthDay = dateOfLoss.slice(5);

  const years = [dolYear, dolYear - 1, dolYear - 2];
  const results = [];

  for (const year of years) {
    const date = `${year}-${monthDay}`;
    try {
      const data = await fetchHistoricalWeather(latitude, longitude, date, date);
      results.push({ year, date, data });
    } catch (error) {
      logger.warn(`Failed to fetch data for year ${year}`, { error: error.message });
      results.push({ year, date, data: null, error: error.message });
    }
  }

  return results;
}

module.exports = {
  fetchHistoricalWeather,
  geocodeAddress,
  fetch3YearComparison,
  isRetryableError,
};

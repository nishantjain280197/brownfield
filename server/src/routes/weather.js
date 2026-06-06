/**
 * @module routes/weather
 * @description Weather data API endpoints for risk assessment lookups.
 * All search queries are logged to the audit trail.
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { auditSearchMiddleware } = require('../middleware/audit');
const { fetchHistoricalWeather, geocodeAddress, fetch3YearComparison } = require('../services/weatherService');
const { assessDailyRisk } = require('../services/riskEngine');
const { isValidLatitude, isValidLongitude, isValidDate, isValidAddress, sanitize } = require('../utils/validation');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('routes/weather');

/**
 * GET /api/weather/search
 * Search weather data by coordinates and date range.
 * @query {number} lat - Latitude.
 * @query {number} lon - Longitude.
 * @query {string} start_date - Start date (YYYY-MM-DD).
 * @query {string} end_date - End date (YYYY-MM-DD).
 */
router.get('/search', authenticate, auditSearchMiddleware, async (req, res) => {
  try {
    const { lat, lon, start_date, end_date } = req.query;

    if (!isValidLatitude(lat) || !isValidLongitude(lon)) {
      return res.status(400).json({ error: 'INVALID_COORDINATES', message: 'Valid latitude and longitude are required' });
    }
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({ error: 'INVALID_DATE', message: 'Valid start_date and end_date (YYYY-MM-DD) are required' });
    }

    const weatherData = await fetchHistoricalWeather(
      parseFloat(lat), parseFloat(lon), start_date, end_date
    );

    const dailyAssessments = [];
    if (weatherData.daily) {
      const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, windspeed_10m_max, windgusts_10m_max, weathercode } = weatherData.daily;
      for (let i = 0; i < time.length; i++) {
        const assessment = assessDailyRisk({
          temperature_2m_max: temperature_2m_max[i],
          temperature_2m_min: temperature_2m_min[i],
          precipitation_sum: precipitation_sum[i],
          windspeed_10m_max: windspeed_10m_max[i],
          windgusts_10m_max: windgusts_10m_max[i],
          weathercode: weathercode[i],
        });
        dailyAssessments.push({ date: time[i], ...assessment });
      }
    }

    res.json({
      location: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
      dateRange: { start: start_date, end: end_date },
      weather: weatherData,
      riskAssessments: dailyAssessments,
    });
  } catch (error) {
    logger.error('Weather search failed', { error: error.message });
    res.status(500).json({ error: 'WEATHER_FETCH_FAILED', message: error.message });
  }
});

/**
 * GET /api/weather/geocode
 * Geocode an address or ZIP code to coordinates.
 * @query {string} address - Address or ZIP code to geocode.
 */
router.get('/geocode', authenticate, async (req, res) => {
  try {
    const { address } = req.query;
    if (!address || !isValidAddress(address)) {
      return res.status(400).json({ error: 'INVALID_ADDRESS', message: 'A valid address is required' });
    }

    const result = await geocodeAddress(sanitize(address));
    res.json(result);
  } catch (error) {
    logger.error('Geocoding failed', { error: error.message });
    res.status(500).json({ error: 'GEOCODE_FAILED', message: error.message });
  }
});

/**
 * GET /api/weather/comparison
 * Fetch 3-year historical comparison for a date of loss.
 * @query {number} lat - Latitude.
 * @query {number} lon - Longitude.
 * @query {string} date_of_loss - Date of loss (YYYY-MM-DD).
 */
router.get('/comparison', authenticate, auditSearchMiddleware, async (req, res) => {
  try {
    const { lat, lon, date_of_loss } = req.query;

    if (!isValidLatitude(lat) || !isValidLongitude(lon)) {
      return res.status(400).json({ error: 'INVALID_COORDINATES', message: 'Valid latitude and longitude are required' });
    }
    if (!isValidDate(date_of_loss)) {
      return res.status(400).json({ error: 'INVALID_DATE', message: 'Valid date_of_loss (YYYY-MM-DD) is required' });
    }

    const comparisonData = await fetch3YearComparison(
      parseFloat(lat), parseFloat(lon), date_of_loss
    );

    const assessedComparison = comparisonData.map(yearData => {
      if (!yearData.data?.daily) return yearData;

      const daily = yearData.data.daily;
      const assessment = assessDailyRisk({
        temperature_2m_max: daily.temperature_2m_max?.[0],
        temperature_2m_min: daily.temperature_2m_min?.[0],
        precipitation_sum: daily.precipitation_sum?.[0],
        windspeed_10m_max: daily.windspeed_10m_max?.[0],
        windgusts_10m_max: daily.windgusts_10m_max?.[0],
        weathercode: daily.weathercode?.[0],
      });

      return { ...yearData, riskAssessment: assessment };
    });

    res.json({
      location: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
      dateOfLoss: date_of_loss,
      comparison: assessedComparison,
    });
  } catch (error) {
    logger.error('Comparison fetch failed', { error: error.message });
    res.status(500).json({ error: 'COMPARISON_FAILED', message: error.message });
  }
});

module.exports = router;

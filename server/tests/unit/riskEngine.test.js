const path = require('path');
const fs = require('fs');

// Setup an in-memory DB for testing the risk engine with DB thresholds
const TEST_DB = path.join(__dirname, '../risk_test.db');

jest.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

beforeAll(() => {
  const { initDatabase } = require('../../src/db/database');
  initDatabase(TEST_DB);
});

afterAll(() => {
  const { closeDatabase } = require('../../src/db/database');
  closeDatabase();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

const {
  assessRisk,
  assessDailyRisk,
  loadThresholds,
  compareSeverity,
  calculateOverallSeverity,
  HAIL_WMO_CODES,
  STORM_WMO_CODES,
  FREEZING_WMO_CODES,
  SEVERITY_ORDER,
} = require('../../src/services/riskEngine');

describe('Risk Engine', () => {
  describe('compareSeverity', () => {
    it('correctly orders severity levels', () => {
      expect(compareSeverity('severe', 'low')).toBeGreaterThan(0);
      expect(compareSeverity('low', 'severe')).toBeLessThan(0);
      expect(compareSeverity('moderate', 'moderate')).toBe(0);
      expect(compareSeverity('high', 'moderate')).toBeGreaterThan(0);
    });

    it('handles unknown severity', () => {
      expect(compareSeverity('unknown', 'low')).toBeLessThan(0);
    });
  });

  describe('calculateOverallSeverity', () => {
    it('returns the highest severity', () => {
      expect(calculateOverallSeverity(['low', 'moderate', 'high'])).toBe('high');
      expect(calculateOverallSeverity(['low', 'severe'])).toBe('severe');
      expect(calculateOverallSeverity(['low', 'low', 'low'])).toBe('low');
    });

    it('handles empty array', () => {
      expect(calculateOverallSeverity([])).toBe('low');
    });

    it('handles single severity', () => {
      expect(calculateOverallSeverity(['moderate'])).toBe('moderate');
    });
  });

  describe('loadThresholds', () => {
    it('loads wind thresholds from database', () => {
      const thresholds = loadThresholds('wind');
      expect(thresholds.length).toBe(4);
      expect(thresholds[0].severity).toBe('low');
    });

    it('loads precipitation thresholds', () => {
      const thresholds = loadThresholds('precipitation');
      expect(thresholds.length).toBe(4);
    });

    it('returns empty for unknown peril', () => {
      const thresholds = loadThresholds('nonexistent');
      expect(thresholds).toEqual([]);
    });
  });

  describe('assessRisk', () => {
    it('classifies low wind speed', () => {
      const result = assessRisk(10, 'wind');
      expect(result.severity).toBe('low');
      expect(result.value).toBe(10);
    });

    it('classifies moderate wind speed', () => {
      const result = assessRisk(30, 'wind');
      expect(result.severity).toBe('moderate');
    });

    it('classifies high wind speed', () => {
      const result = assessRisk(50, 'wind');
      expect(result.severity).toBe('high');
    });

    it('classifies severe wind speed', () => {
      const result = assessRisk(70, 'wind');
      expect(result.severity).toBe('severe');
    });

    it('classifies precipitation levels', () => {
      expect(assessRisk(0.2, 'precipitation').severity).toBe('low');
      expect(assessRisk(1.0, 'precipitation').severity).toBe('moderate');
      expect(assessRisk(2.0, 'precipitation').severity).toBe('high');
      expect(assessRisk(5.0, 'precipitation').severity).toBe('severe');
    });

    it('returns thresholds in the result', () => {
      const result = assessRisk(30, 'wind');
      expect(result.thresholds).toBeDefined();
      expect(result.thresholds.length).toBeGreaterThan(0);
    });
  });

  describe('assessDailyRisk', () => {
    it('assesses a calm day', () => {
      const result = assessDailyRisk({
        temperature_2m_max: 75,
        temperature_2m_min: 55,
        precipitation_sum: 0.1,
        windspeed_10m_max: 10,
        windgusts_10m_max: 15,
        weathercode: 0,
      });

      expect(result.overall).toBe('low');
      expect(result.wind.severity).toBe('low');
      expect(result.hail.detected).toBe(false);
      expect(result.storm.detected).toBe(false);
      expect(result.freezing.detected).toBe(false);
    });

    it('assesses a severe storm day', () => {
      const result = assessDailyRisk({
        temperature_2m_max: 95,
        temperature_2m_min: 70,
        precipitation_sum: 4.0,
        windspeed_10m_max: 65,
        windgusts_10m_max: 80,
        weathercode: 99,
      });

      expect(result.overall).toBe('severe');
      expect(result.wind.severity).toBe('severe');
      expect(result.hail.detected).toBe(true);
      expect(result.storm.detected).toBe(true);
    });

    it('detects hail from WMO code 96', () => {
      const result = assessDailyRisk({
        temperature_2m_max: 80,
        temperature_2m_min: 60,
        precipitation_sum: 0.5,
        windspeed_10m_max: 20,
        windgusts_10m_max: 30,
        weathercode: 96,
      });

      expect(result.hail.detected).toBe(true);
      expect(result.hail.severity).toBe('high');
    });

    it('detects freezing conditions', () => {
      const result = assessDailyRisk({
        temperature_2m_max: 30,
        temperature_2m_min: 15,
        precipitation_sum: 0.2,
        windspeed_10m_max: 15,
        windgusts_10m_max: 20,
        weathercode: 66,
      });

      expect(result.freezing.detected).toBe(true);
    });

    it('handles null/undefined values gracefully', () => {
      const result = assessDailyRisk({
        temperature_2m_max: null,
        temperature_2m_min: undefined,
        precipitation_sum: 0,
        windspeed_10m_max: 0,
        windgusts_10m_max: null,
        weathercode: 0,
      });

      expect(result.overall).toBeDefined();
      expect(result.wind).toBeDefined();
    });

    it('includes gusts in wind assessment', () => {
      const result = assessDailyRisk({
        temperature_2m_max: 80,
        temperature_2m_min: 60,
        precipitation_sum: 0,
        windspeed_10m_max: 30,
        windgusts_10m_max: 55,
        weathercode: 0,
      });

      expect(result.wind.gusts).toBe(55);
    });

    it('includes temperature max and min', () => {
      const result = assessDailyRisk({
        temperature_2m_max: 100,
        temperature_2m_min: 72,
        precipitation_sum: 0,
        windspeed_10m_max: 10,
        windgusts_10m_max: 15,
        weathercode: 0,
      });

      expect(result.temperature.max).toBe(100);
      expect(result.temperature.min).toBe(72);
    });
  });

  describe('constants', () => {
    it('defines hail WMO codes', () => {
      expect(HAIL_WMO_CODES).toContain(96);
      expect(HAIL_WMO_CODES).toContain(99);
    });

    it('defines storm WMO codes', () => {
      expect(STORM_WMO_CODES).toContain(95);
      expect(STORM_WMO_CODES).toContain(96);
      expect(STORM_WMO_CODES).toContain(99);
    });

    it('defines freezing WMO codes', () => {
      expect(FREEZING_WMO_CODES).toContain(56);
      expect(FREEZING_WMO_CODES).toContain(57);
      expect(FREEZING_WMO_CODES).toContain(66);
      expect(FREEZING_WMO_CODES).toContain(67);
      expect(FREEZING_WMO_CODES).toContain(77);
    });

    it('defines correct severity ordering', () => {
      expect(SEVERITY_ORDER.low).toBeLessThan(SEVERITY_ORDER.moderate);
      expect(SEVERITY_ORDER.moderate).toBeLessThan(SEVERITY_ORDER.high);
      expect(SEVERITY_ORDER.high).toBeLessThan(SEVERITY_ORDER.severe);
    });
  });
});

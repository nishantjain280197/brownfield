const { isRetryableError } = require('../../src/services/weatherService');

jest.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock global fetch for testing API calls
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  global.fetch = originalFetch;
});
afterEach(() => {
  jest.clearAllMocks();
});

const { fetchHistoricalWeather, geocodeAddress, fetch3YearComparison } = require('../../src/services/weatherService');

describe('Weather Service', () => {
  describe('isRetryableError', () => {
    it('considers 5xx errors retryable', () => {
      const error = new Error('Server error');
      error.status = 500;
      expect(isRetryableError(error)).toBe(true);

      error.status = 503;
      expect(isRetryableError(error)).toBe(true);
    });

    it('considers 429 (rate limit) retryable', () => {
      const error = new Error('Rate limited');
      error.status = 429;
      expect(isRetryableError(error)).toBe(true);
    });

    it('considers connection errors retryable', () => {
      const error = new Error('Connection reset');
      error.code = 'ECONNRESET';
      expect(isRetryableError(error)).toBe(true);

      error.code = 'ETIMEDOUT';
      expect(isRetryableError(error)).toBe(true);

      error.code = 'ENOTFOUND';
      expect(isRetryableError(error)).toBe(true);
    });

    it('considers 4xx errors (except 429) non-retryable', () => {
      const error = new Error('Bad request');
      error.status = 400;
      expect(isRetryableError(error)).toBe(false);

      error.status = 404;
      expect(isRetryableError(error)).toBe(false);
    });

    it('considers generic errors non-retryable', () => {
      const error = new Error('Something went wrong');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('fetchHistoricalWeather', () => {
    it('calls Open-Meteo API with correct parameters', async () => {
      const mockData = { daily: { time: ['2024-01-01'], temperature_2m_max: [75] } };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchHistoricalWeather(30.27, -97.74, '2024-01-01', '2024-01-01');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('archive-api.open-meteo.com')
      );
    });

    it('throws on API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        fetchHistoricalWeather(30.27, -97.74, '2024-01-01', '2024-01-01')
      ).rejects.toThrow('Open-Meteo API error');
    });
  });

  describe('geocodeAddress', () => {
    it('returns coordinates from Nominatim', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { lat: '30.2672', lon: '-97.7431', display_name: 'Austin, TX' },
        ]),
      });

      const result = await geocodeAddress('Austin, TX');
      expect(result.lat).toBeCloseTo(30.2672);
      expect(result.lon).toBeCloseTo(-97.7431);
      expect(result.display_name).toBe('Austin, TX');
    });

    it('throws when no results found', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await expect(geocodeAddress('xyznonexistent')).rejects.toThrow('No results found');
    });

    it('throws on Nominatim API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(geocodeAddress('Austin, TX')).rejects.toThrow();
    });
  });

  describe('fetch3YearComparison', () => {
    it('fetches data for 3 consecutive years', async () => {
      const mockData = { daily: { time: ['2024-06-15'], temperature_2m_max: [85] } };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetch3YearComparison(30.27, -97.74, '2024-06-15');
      expect(result.length).toBe(3);
      expect(result[0].year).toBe(2024);
      expect(result[1].year).toBe(2023);
      expect(result[2].year).toBe(2022);
    });

    it('handles partial failures gracefully', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ daily: { time: ['2024-06-15'] } }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
        });
      });

      const result = await fetch3YearComparison(30.27, -97.74, '2024-06-15');
      expect(result.length).toBe(3);
      expect(result[0].data).toBeDefined();
      expect(result[1].error).toBeDefined();
    });
  });
});

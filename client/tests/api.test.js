import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Must import after mocking fetch
const { apiRequest, login, logout, geocode, searchWeather, fetchComparison, fetchThresholds } = await import('../src/utils/api');

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('apiRequest', () => {
  it('includes auth token when available', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await apiRequest('/test');
    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token',
      }),
    }));
  });

  it('throws structured error on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'AUTH_REQUIRED', message: 'Not authenticated' }),
    });

    await expect(apiRequest('/test')).rejects.toThrow('Not authenticated');
  });
});

describe('login', () => {
  it('sends POST with credentials', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'jwt-token', user: { id: '1' } }),
    });

    const result = await login('admin', 'pass');
    expect(result.token).toBe('jwt-token');
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
    }));
  });
});

describe('geocode', () => {
  it('sends address as query parameter', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lat: 30.27, lon: -97.74, display_name: 'Austin, TX' }),
    });

    const result = await geocode('Austin, TX');
    expect(result.lat).toBe(30.27);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('geocode?address=Austin'),
      expect.anything()
    );
  });
});

describe('searchWeather', () => {
  it('sends correct query parameters', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ weather: {}, riskAssessments: [] }),
    });

    await searchWeather(30, -97, '2024-01-01', '2024-01-01');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('lat=30'),
      expect.anything()
    );
  });
});

describe('fetchComparison', () => {
  it('sends date_of_loss parameter', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ comparison: [] }),
    });

    await fetchComparison(30, -97, '2024-06-15');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('date_of_loss=2024-06-15'),
      expect.anything()
    );
  });
});

describe('fetchThresholds', () => {
  it('fetches all thresholds without filter', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ thresholds: [] }),
    });

    await fetchThresholds();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/thresholds',
      expect.anything()
    );
  });

  it('applies peril type filter', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ thresholds: [] }),
    });

    await fetchThresholds('wind');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/thresholds?peril_type=wind',
      expect.anything()
    );
  });
});

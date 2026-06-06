/**
 * @module utils/api
 * @description HTTP client for Weather Insurance Portal API.
 * Handles JWT token injection and structured error responses.
 */

const API_BASE = '/api';

/**
 * Makes an authenticated API request.
 * @param {string} endpoint - API endpoint path (e.g., '/weather/search').
 * @param {object} [options={}] - Fetch options.
 * @returns {Promise<object>} Parsed JSON response.
 * @throws {Error} With error code and message from the API.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    const err = new Error(error.message || 'Request failed');
    err.code = error.error;
    err.status = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Login API call.
 * @param {string} username - Username.
 * @param {string} password - Password.
 * @returns {Promise<{token: string, user: object}>} Auth response.
 */
export async function login(username, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

/**
 * Logout API call.
 * @returns {Promise<object>} Confirmation.
 */
export async function logout() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

/**
 * Fetch current user profile.
 * @returns {Promise<{user: object}>} User profile.
 */
export async function fetchProfile() {
  return apiRequest('/auth/me');
}

/**
 * Geocode an address to coordinates.
 * @param {string} address - Address string.
 * @returns {Promise<{lat: number, lon: number, display_name: string}>} Coordinates.
 */
export async function geocode(address) {
  return apiRequest(`/weather/geocode?address=${encodeURIComponent(address)}`);
}

/**
 * Search weather data by coordinates and date range.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {string} startDate - Start date.
 * @param {string} endDate - End date.
 * @returns {Promise<object>} Weather data with risk assessments.
 */
export async function searchWeather(lat, lon, startDate, endDate) {
  const params = new URLSearchParams({ lat, lon, start_date: startDate, end_date: endDate });
  return apiRequest(`/weather/search?${params}`);
}

/**
 * Fetch 3-year historical comparison.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {string} dateOfLoss - Date of loss.
 * @returns {Promise<object>} Comparison data.
 */
export async function fetchComparison(lat, lon, dateOfLoss) {
  const params = new URLSearchParams({ lat, lon, date_of_loss: dateOfLoss });
  return apiRequest(`/weather/comparison?${params}`);
}

/**
 * Fetch risk thresholds.
 * @param {string} [perilType] - Optional peril type filter.
 * @returns {Promise<{thresholds: object[]}>} Thresholds.
 */
export async function fetchThresholds(perilType) {
  const params = perilType ? `?peril_type=${perilType}` : '';
  return apiRequest(`/thresholds${params}`);
}

/**
 * @module App
 * @description Root application component for the Weather Insurance Portal.
 * Manages search state and orchestrates data fetching.
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import SearchPanel from './components/SearchPanel';
import RiskAssessment from './components/RiskAssessment';
import WeatherResults from './components/WeatherResults';
import InteractiveMap from './components/InteractiveMap';
import HistoricalComparison from './components/HistoricalComparison';
import { searchWeather, fetchComparison } from './utils/api';
import { downloadReport } from './utils/pdfGenerator';

/**
 * Main application component.
 * @returns {React.ReactElement} The application UI.
 */
export default function App() {
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const [searchResults, setSearchResults] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [location, setLocation] = useState(null);
  const [dateOfLoss, setDateOfLoss] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async ({ lat, lon, dateOfLoss: dol, displayName }) => {
    setLoading(true);
    setError('');
    setSearchResults(null);
    setComparison(null);

    try {
      const locData = { latitude: lat, longitude: lon, display_name: displayName };
      setLocation(locData);
      setDateOfLoss(dol);

      const [weatherData, comparisonData] = await Promise.all([
        searchWeather(lat, lon, dol, dol),
        fetchComparison(lat, lon, dol),
      ]);

      setSearchResults(weatherData);
      setComparison(comparisonData);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(() => {
    if (!searchResults || !location) return;
    downloadReport({
      location,
      dateOfLoss,
      comparison: comparison?.comparison,
      riskAssessments: searchResults.riskAssessments,
      weather: searchResults.weather,
    });
  }, [searchResults, comparison, location, dateOfLoss]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-800">Weather Insurance Portal</h1>
            <p className="text-xs text-gray-500">Risk Assessment &amp; Claims Documentation</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.username} <span className="text-gray-400">({user?.role})</span>
            </span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Search + Map */}
          <div className="lg:col-span-1 space-y-6">
            <SearchPanel onSearch={handleSearch} loading={loading} />

            {location && (
              <InteractiveMap
                lat={location.latitude}
                lon={location.longitude}
                displayName={location.display_name}
                severity={searchResults?.riskAssessments?.[0]?.overall}
              />
            )}
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <div className="card text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-500">Fetching weather data...</p>
              </div>
            )}

            {!loading && searchResults && (
              <>
                {/* Action bar */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Results for <strong>{location?.display_name}</strong> on {dateOfLoss}
                  </p>
                  <button onClick={handleDownloadPdf} className="btn-primary text-sm">
                    Download PDF Report
                  </button>
                </div>

                <RiskAssessment assessment={searchResults.riskAssessments?.[0]} />
                <WeatherResults assessments={searchResults.riskAssessments} />
                {comparison && <HistoricalComparison comparison={comparison.comparison} />}
              </>
            )}

            {!loading && !searchResults && !error && (
              <div className="card text-center py-16 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium">Search for a location</p>
                <p className="text-sm mt-1">Enter an address, ZIP code, or coordinates to view weather risk data</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

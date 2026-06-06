/**
 * @module components/SearchPanel
 * @description Search panel with tabs for address, ZIP code, and coordinate search.
 */

import React, { useState } from 'react';
import { geocode } from '../utils/api';

/**
 * Search panel component for location and date input.
 * @param {object} props - Component props.
 * @param {Function} props.onSearch - Callback with search parameters {lat, lon, dateOfLoss, displayName}.
 * @param {boolean} props.loading - Whether a search is in progress.
 * @returns {React.ReactElement} Search panel UI.
 */
export default function SearchPanel({ onSearch, loading }) {
  const [tab, setTab] = useState('address');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [dateOfLoss, setDateOfLoss] = useState('');
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!dateOfLoss) {
      setError('Date of loss is required');
      return;
    }

    try {
      let location;

      if (tab === 'address') {
        if (!address.trim()) { setError('Address is required'); return; }
        setGeocoding(true);
        location = await geocode(address);
      } else if (tab === 'zip') {
        if (!/^\d{5}(-\d{4})?$/.test(zipCode)) { setError('Valid ZIP code required'); return; }
        setGeocoding(true);
        location = await geocode(zipCode);
      } else {
        if (!lat || !lon) { setError('Latitude and longitude required'); return; }
        location = { lat: parseFloat(lat), lon: parseFloat(lon), display_name: `${lat}, ${lon}` };
      }

      setGeocoding(false);
      onSearch({
        lat: location.lat,
        lon: location.lon,
        dateOfLoss,
        displayName: location.display_name,
      });
    } catch (err) {
      setGeocoding(false);
      setError(err.message || 'Search failed');
    }
  };

  const tabs = [
    { id: 'address', label: 'Address' },
    { id: 'zip', label: 'ZIP Code' },
    { id: 'coords', label: 'Coordinates' },
  ];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Search Location</h2>

      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
        )}

        {tab === 'address' && (
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              placeholder="123 Main St, City, State"
            />
          </div>
        )}

        {tab === 'zip' && (
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              id="zipCode"
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="input-field"
              placeholder="73301"
              maxLength={10}
            />
          </div>
        )}

        {tab === 'coords' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input id="lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="input-field" placeholder="30.2672" />
            </div>
            <div>
              <label htmlFor="lon" className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input id="lon" type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)} className="input-field" placeholder="-97.7431" />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="dateOfLoss" className="block text-sm font-medium text-gray-700 mb-1">Date of Loss</label>
          <input
            id="dateOfLoss"
            type="date"
            value={dateOfLoss}
            onChange={(e) => setDateOfLoss(e.target.value)}
            className="input-field"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading || geocoding}>
          {geocoding ? 'Locating...' : loading ? 'Searching...' : 'Search Weather Data'}
        </button>
      </form>
    </div>
  );
}

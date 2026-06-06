/**
 * @module components/InteractiveMap
 * @description Leaflet map component showing the searched location.
 * Gracefully degrades if the mapping service is unavailable.
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

/**
 * Component that re-centers the map when location changes.
 * @param {object} props - Component props.
 * @param {[number, number]} props.center - New center coordinates [lat, lon].
 */
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

/**
 * Interactive map displaying the search location with a marker.
 * @param {object} props - Component props.
 * @param {number} props.lat - Latitude.
 * @param {number} props.lon - Longitude.
 * @param {string} [props.displayName] - Location display name for popup.
 * @param {string} [props.severity] - Overall risk severity for marker color.
 * @returns {React.ReactElement} Map component or fallback.
 */
export default function InteractiveMap({ lat, lon, displayName, severity }) {
  const [mapError, setMapError] = useState(false);

  if (!lat || !lon) return null;

  if (mapError) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Location</h2>
        <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
          <p className="font-medium">Map unavailable</p>
          <p className="text-sm mt-1">Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}</p>
          {displayName && <p className="text-sm mt-1">{displayName}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Location Map</h2>
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[lat, lon]}
          zoom={13}
          className="leaflet-container"
          whenReady={() => {}}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setMapError(true),
            }}
          />
          <Marker position={[lat, lon]}>
            <Popup>
              <strong>{displayName || 'Search Location'}</strong>
              <br />
              {lat.toFixed(4)}, {lon.toFixed(4)}
              {severity && (
                <>
                  <br />
                  Risk: <span className="capitalize font-medium">{severity}</span>
                </>
              )}
            </Popup>
          </Marker>
          <MapRecenter center={[lat, lon]} />
        </MapContainer>
      </div>
    </div>
  );
}

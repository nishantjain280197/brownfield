/**
 * @module components/RiskAssessment
 * @description Displays risk severity ratings for weather perils.
 */

import React from 'react';

/**
 * Renders a severity badge with appropriate color.
 * @param {object} props - Component props.
 * @param {string} props.severity - Severity level.
 * @returns {React.ReactElement} Badge element.
 */
export function SeverityBadge({ severity }) {
  return <span className={`severity-badge severity-${severity || 'low'}`}>{severity || 'N/A'}</span>;
}

/**
 * Severity bar visualization showing risk level as a percentage fill.
 * @param {object} props - Component props.
 * @param {string} props.severity - Severity level.
 * @returns {React.ReactElement} Visual bar.
 */
function SeverityBar({ severity }) {
  const widths = { low: '25%', moderate: '50%', high: '75%', severe: '100%' };
  const colors = { low: 'bg-green-500', moderate: 'bg-amber-500', high: 'bg-orange-500', severe: 'bg-red-500' };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${colors[severity] || 'bg-gray-400'} transition-all`} style={{ width: widths[severity] || '0%' }} />
    </div>
  );
}

/**
 * Full risk assessment display panel.
 * @param {object} props - Component props.
 * @param {object} props.assessment - Risk assessment data from the API.
 * @returns {React.ReactElement} Risk assessment cards.
 */
export default function RiskAssessment({ assessment }) {
  if (!assessment) return null;

  const perils = [
    { key: 'wind', label: 'Wind', detail: `${assessment.wind?.value?.toFixed(1) || 0} mph (gusts: ${assessment.wind?.gusts?.toFixed(1) || 0} mph)` },
    { key: 'precipitation', label: 'Precipitation', detail: `${assessment.precipitation?.value?.toFixed(2) || 0} inches` },
    { key: 'hail', label: 'Hail', detail: assessment.hail?.detected ? 'Hail detected (WMO code)' : 'No hail detected' },
    { key: 'temperature', label: 'Temperature', detail: `High: ${assessment.temperature?.max?.toFixed(1) || '-'}°F / Low: ${assessment.temperature?.min?.toFixed(1) || '-'}°F` },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Risk Assessment</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Overall:</span>
          <SeverityBadge severity={assessment.overall} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perils.map(peril => {
          const severity = peril.key === 'hail' ? assessment.hail?.severity : assessment[peril.key]?.severity;
          return (
            <div key={peril.key} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700">{peril.label}</span>
                <SeverityBadge severity={severity} />
              </div>
              <p className="text-sm text-gray-500">{peril.detail}</p>
              <SeverityBar severity={severity} />
            </div>
          );
        })}
      </div>

      {assessment.storm?.detected && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-md text-sm text-yellow-800">
          ⚡ Thunderstorm activity detected on this date (WMO code: {assessment.storm.weathercode})
        </div>
      )}
      {assessment.freezing?.detected && (
        <div className="mt-4 bg-blue-50 border border-blue-200 px-4 py-3 rounded-md text-sm text-blue-800">
          ❄ Freezing conditions detected on this date
        </div>
      )}
    </div>
  );
}

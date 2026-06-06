/**
 * @module components/WeatherResults
 * @description Displays weather data results with daily breakdowns.
 */

import React from 'react';
import { SeverityBadge } from './RiskAssessment';

/**
 * Weather results table component.
 * @param {object} props - Component props.
 * @param {object[]} props.assessments - Array of daily risk assessments.
 * @returns {React.ReactElement} Weather results table.
 */
export default function WeatherResults({ assessments }) {
  if (!assessments || assessments.length === 0) return null;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Weather Data</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Overall</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Wind (mph)</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Precip (in)</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Temp (°F)</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Hail</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((day, i) => (
              <tr key={day.date || i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3 font-mono text-xs">{day.date}</td>
                <td className="py-2 px-3"><SeverityBadge severity={day.overall} /></td>
                <td className="py-2 px-3">{day.wind?.value?.toFixed(1) || '-'}</td>
                <td className="py-2 px-3">{day.precipitation?.value?.toFixed(2) || '-'}</td>
                <td className="py-2 px-3">
                  {day.temperature?.max?.toFixed(0) || '-'} / {day.temperature?.min?.toFixed(0) || '-'}
                </td>
                <td className="py-2 px-3">{day.hail?.detected ? '⚠ Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

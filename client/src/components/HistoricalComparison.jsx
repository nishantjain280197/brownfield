/**
 * @module components/HistoricalComparison
 * @description 3-year historical comparison chart using Recharts.
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SeverityBadge } from './RiskAssessment';

/**
 * Renders a 3-year historical comparison of weather perils.
 * @param {object} props - Component props.
 * @param {object[]} props.comparison - Array of year comparison data.
 * @returns {React.ReactElement} Comparison charts and table.
 */
export default function HistoricalComparison({ comparison }) {
  if (!comparison || comparison.length === 0) return null;

  const chartData = comparison
    .filter(yr => yr.riskAssessment)
    .map(yr => ({
      year: yr.year,
      wind: yr.riskAssessment.wind?.value || 0,
      precipitation: yr.riskAssessment.precipitation?.value || 0,
      tempMax: yr.riskAssessment.temperature?.max || 0,
      tempMin: yr.riskAssessment.temperature?.min || 0,
    }));

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">3-Year Historical Comparison</h2>

      {chartData.length > 0 && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="wind" name="Wind (mph)" fill="#3b82f6" />
              <Bar dataKey="precipitation" name="Precip (in)" fill="#06b6d4" />
              <Bar dataKey="tempMax" name="Temp Max (°F)" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Year</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Overall</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Wind</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Precip.</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Hail</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(yr => (
              <tr key={yr.year} className="border-b border-gray-50">
                <td className="py-2 px-3 font-medium">{yr.year}</td>
                <td className="py-2 px-3 font-mono text-xs">{yr.date}</td>
                <td className="py-2 px-3">
                  {yr.riskAssessment ? <SeverityBadge severity={yr.riskAssessment.overall} /> : <span className="text-gray-400">No data</span>}
                </td>
                <td className="py-2 px-3">{yr.riskAssessment?.wind?.value?.toFixed(1) || '-'} mph</td>
                <td className="py-2 px-3">{yr.riskAssessment?.precipitation?.value?.toFixed(2) || '-'} in</td>
                <td className="py-2 px-3">{yr.riskAssessment?.hail?.detected ? '⚠ Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

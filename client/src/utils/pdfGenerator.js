/**
 * @module utils/pdfGenerator
 * @description PDF report generator for claims documentation.
 * Generates reports with location coordinates, date of loss, and 3-year historical comparison.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Severity color map for PDF rendering.
 * @type {Record<string, number[]>}
 */
const SEVERITY_COLORS = {
  low: [34, 197, 94],
  moderate: [245, 158, 11],
  high: [249, 115, 22],
  severe: [239, 68, 68],
};

/**
 * Generates a PDF claims documentation report.
 * @param {object} params - Report parameters.
 * @param {object} params.location - Location with lat, lon, display_name.
 * @param {string} params.dateOfLoss - Date of loss (YYYY-MM-DD).
 * @param {object[]} params.comparison - 3-year comparison data.
 * @param {object[]} params.riskAssessments - Daily risk assessments.
 * @param {object} [params.weather] - Raw weather data.
 * @returns {jsPDF} Generated PDF document.
 */
export function generateClaimsReport({ location, dateOfLoss, comparison, riskAssessments, weather }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('Weather Insurance Risk Assessment Report', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Location info
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Location Details', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(60);
  if (location.display_name) {
    doc.text(`Address: ${location.display_name}`, 14, y);
    y += 6;
  }
  doc.text(`Coordinates: ${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`, 14, y);
  y += 6;
  doc.text(`Date of Loss: ${dateOfLoss}`, 14, y);
  y += 12;

  // Risk summary for DOL
  if (riskAssessments && riskAssessments.length > 0) {
    const dolAssessment = riskAssessments[0];
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Risk Assessment Summary', 14, y);
    y += 8;

    const riskData = [
      ['Overall', dolAssessment.overall?.toUpperCase() || 'N/A'],
      ['Wind', `${dolAssessment.wind?.severity || 'N/A'} (${dolAssessment.wind?.value?.toFixed(1) || 0} mph)`],
      ['Precipitation', `${dolAssessment.precipitation?.severity || 'N/A'} (${dolAssessment.precipitation?.value?.toFixed(2) || 0} in)`],
      ['Hail', dolAssessment.hail?.detected ? 'DETECTED' : 'Not detected'],
      ['Temperature', `${dolAssessment.temperature?.severity || 'N/A'} (${dolAssessment.temperature?.max?.toFixed(1) || 'N/A'}°F / ${dolAssessment.temperature?.min?.toFixed(1) || 'N/A'}°F)`],
    ];

    doc.autoTable({
      startY: y,
      head: [['Peril', 'Assessment']],
      body: riskData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  // 3-year comparison
  if (comparison && comparison.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('3-Year Historical Comparison', 14, y);
    y += 8;

    const compRows = comparison.map(yr => {
      if (!yr.riskAssessment) return [yr.year, yr.date, 'No data', '-', '-', '-'];
      const ra = yr.riskAssessment;
      return [
        yr.year,
        yr.date,
        ra.overall?.toUpperCase() || 'N/A',
        `${ra.wind?.value?.toFixed(1) || 0} mph`,
        `${ra.precipitation?.value?.toFixed(2) || 0} in`,
        `${ra.temperature?.max?.toFixed(0) || '-'}°F`,
      ];
    });

    doc.autoTable({
      startY: y,
      head: [['Year', 'Date', 'Overall Risk', 'Wind', 'Precip.', 'Temp Max']],
      body: compRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Weather Insurance Portal | Page ${i} of ${pageCount} | Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    );
  }

  return doc;
}

/**
 * Downloads the generated PDF report.
 * @param {object} reportData - Data to include in the report.
 */
export function downloadReport(reportData) {
  const doc = generateClaimsReport(reportData);
  const filename = `weather_report_${reportData.dateOfLoss || 'unknown'}_${Date.now()}.pdf`;
  doc.save(filename);
}

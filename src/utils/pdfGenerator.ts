/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Build } from '../types';
import { round } from './mathEngine';

interface TableRow {
  label: string;
  valA: string | number;
  valB: string | number;
  rawA?: number;
  rawB?: number;
  isBetterLower?: boolean;
  unit?: string;
  isHeader?: boolean;
}

export function generateComparisonPdf(
  buildA: Build,
  metricsA: any,
  buildB: Build,
  metricsB: any,
  aiComparison: string | null
) {
  // Create PDF document (portrait, mm, a4: 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2); // 180mm

  let currentPage = 1;

  // Helper to draw the header on any page
  const drawHeaderBanner = (pageNum: number) => {
    // Elegant teal banner at top
    doc.setFillColor(0, 191, 166); // Brand Quantum Teal
    doc.rect(margin, 12, contentWidth, 18, 'F');

    // Title text inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SILICONOMICS', margin + 6, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('EXECUTIVE COMPARISON & FEASIBILITY BRIEFING', margin + 6, 25);

    // Document type / Page indicator on top right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`PAGE ${pageNum}`, margin + contentWidth - 18, 22);
  };

  // Helper to draw standard page footers for traceability
  const drawFooter = (pageNum: number) => {
    const footerY = pageHeight - 12;
    doc.setDrawColor(0, 191, 166, 0.2);
    doc.setLineWidth(0.1);
    doc.line(margin, footerY - 3, margin + contentWidth, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);

    // Traceability indicators as required by the Siliconomics Build Specification
    const leftText = `Siliconomics platform v1.0.3-C • Deterministic Engine Compliant`;
    const rightText = `Generated: ${new Date().toLocaleString()} • Authorized Audit Copy`;
    doc.text(leftText, margin, footerY);
    doc.text(rightText, margin + contentWidth - doc.getTextWidth(rightText), footerY);
  };

  // Initial draw of page 1 frame
  drawHeaderBanner(currentPage);
  drawFooter(currentPage);

  let y = 38;

  // Write Scenario Title Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 28, 30); // Dark Ink
  doc.text('1. COMPARISON OF ACTIVE SEMICONDUCTOR SCENARIOS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const introText = `This board-ready comparative audit isolates and evaluates technical performance bottlenecks, manufacturing yields, and financial architectures between Scenario A (${buildA.name}) and Scenario B (${buildB.name}).`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += (splitIntro.length * 3.5) + 3;

  // Render Traceability Metadata Box (Principle 4 - Reproducibility)
  doc.setFillColor(249, 248, 246); // Off-white/cream light tint
  doc.setDrawColor(0, 191, 166, 0.15);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setTextColor(0, 191, 166);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('IMMUTABLE TRACEABILITY LEDGER (V1.0 SPEC)', margin + 4, y + 5);

  doc.setTextColor(26, 28, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  // Left Column of ledger
  doc.text(`Build A Name: ${buildA.name}`, margin + 4, y + 10);
  doc.text(`Build A ID:   ${buildA.id}`, margin + 4, y + 14);
  doc.text(`Formula Lib:  ${buildA.formulaVersion}`, margin + 4, y + 18);

  // Right Column of ledger
  const col2X = margin + (contentWidth / 2) + 2;
  doc.text(`Build B Name: ${buildB.name}`, col2X, y + 10);
  doc.text(`Build B ID:   ${buildB.id}`, col2X, y + 14);
  doc.text(`Ref Model:    ${buildA.referenceModel}`, col2X, y + 18);

  y += 29;

  // Setup Comparison Table Rows
  const tableData: TableRow[] = [
    // ENGINEERING SECTION
    { label: 'ENGINEERING METRICS', valA: '', valB: '', isHeader: true },
    { label: 'Process Node Class', valA: buildA.processNode, valB: buildB.processNode },
    { label: 'Silicon Die Area', valA: `${round(metricsA.totalDieArea, 1)} mm²`, valB: `${round(metricsB.totalDieArea, 1)} mm²`, rawA: metricsA.totalDieArea, rawB: metricsB.totalDieArea, unit: ' mm²', isBetterLower: true },
    { label: 'Transistor Count', valA: `${buildA.transistorCount} B`, valB: `${buildB.transistorCount} B`, rawA: buildA.transistorCount, rawB: buildB.transistorCount, unit: ' B' },
    { label: 'Silicon Topology Design', valA: buildA.topology, valB: buildB.topology },
    { label: 'Dies per Wafer (DPW)', valA: `${metricsA.dpw} dies`, valB: `${metricsB.dpw} dies`, rawA: metricsA.dpw, rawB: metricsB.dpw, unit: ' dies' },
    { label: 'Murphy Die Yield', valA: `${round(metricsA.dieYield * 100, 1)}%`, valB: `${round(metricsB.dieYield * 100, 1)}%`, rawA: metricsA.dieYield * 100, rawB: metricsB.dieYield * 100, unit: '%' },

    // MANUFACTURING SECTION
    { label: 'MANUFACTURING & ASSEMBLY YIELDS', valA: '', valB: '', isHeader: true },
    { label: 'Defect Density (D0)', valA: `${buildA.defectDensity} /cm²`, valB: `${buildB.defectDensity} /cm²`, rawA: buildA.defectDensity, rawB: buildB.defectDensity, unit: '/cm²', isBetterLower: true },
    { label: 'Packaging Yield', valA: `${buildA.packagingYield}%`, valB: `${buildB.packagingYield}%`, rawA: buildA.packagingYield, rawB: buildB.packagingYield, unit: '%' },
    { label: 'Electrical Test Yield', valA: `${buildA.testYield}%`, valB: `${buildB.testYield}%`, rawA: buildA.testYield, rawB: buildB.testYield, unit: '%' },

    // FINANCIAL ARCHITECTURE
    { label: 'FINANCIAL ARCHITECTURE', valA: '', valB: '', isHeader: true },
    { label: 'Foundry Wafer Cost', valA: `$${buildA.waferCost.toLocaleString()}`, valB: `$${buildB.waferCost.toLocaleString()}`, rawA: buildA.waferCost, rawB: buildB.waferCost, unit: '', isBetterLower: true },
    { label: 'Calculated Silicon Die Cost', valA: `$${round(metricsA.rawDieCost, 2)}`, valB: `$${round(metricsB.rawDieCost, 2)}`, rawA: metricsA.rawDieCost, rawB: metricsB.rawDieCost, unit: '', isBetterLower: true },
    { label: 'Packaged Unit COGS', valA: `$${round(metricsA.grossCostPerGoodDie, 2)}`, valB: `$${round(metricsB.grossCostPerGoodDie, 2)}`, rawA: metricsA.grossCostPerGoodDie, rawB: metricsB.grossCostPerGoodDie, unit: '', isBetterLower: true },
    { label: 'Average Selling Price (ASP)', valA: `$${buildA.asp.toLocaleString()}`, valB: `$${buildB.asp.toLocaleString()}`, rawA: buildA.asp, rawB: buildB.asp, unit: '' },
    { label: 'Gross Program Margin', valA: `${round(metricsA.grossMargin, 1)}%`, valB: `${round(metricsB.grossMargin, 1)}%`, rawA: metricsA.grossMargin, rawB: metricsB.grossMargin, unit: '%' },
    { label: 'Non-Recurring Engineering (NRE)', valA: `$${buildA.nreCost} M`, valB: `$${buildB.nreCost} M`, rawA: buildA.nreCost, rawB: buildB.nreCost, unit: ' M', isBetterLower: true },
    { label: 'Amortized Program Break-Even', valA: `${round(metricsA.breakEvenVolumeMillion, 2)} M`, valB: `${round(metricsB.breakEvenVolumeMillion, 2)} M`, rawA: metricsA.breakEvenVolumeMillion, rawB: metricsB.breakEvenVolumeMillion, unit: ' M', isBetterLower: true },
    { label: 'Projected Net Lifetime Profit', valA: `$${round(metricsA.lifetimeNetProfitMillion, 1)} M`, valB: `$${round(metricsB.lifetimeNetProfitMillion, 1)} M`, rawA: metricsA.lifetimeNetProfitMillion, rawB: metricsB.lifetimeNetProfitMillion, unit: ' M' },
    { label: 'Program Return (ROI)', valA: `${round(metricsA.roi, 1)}%`, valB: `${round(metricsB.roi, 1)}%`, rawA: metricsA.roi, rawB: metricsB.roi, unit: '%' }
  ];

  // Draw Table Columns Headers
  const colWidths = {
    param: 65,
    valA: 45,
    valB: 45,
    delta: 25
  };

  const drawTableHeaderRow = (currentY: number) => {
    doc.setFillColor(26, 28, 30); // Deep Ink/Charcoal background
    doc.rect(margin, currentY, contentWidth, 7.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    
    doc.text('PARAMETER LENS', margin + 3, currentY + 5);
    doc.text('SCENARIO A', margin + colWidths.param + 3, currentY + 5);
    doc.text('SCENARIO B', margin + colWidths.param + colWidths.valA + 3, currentY + 5);
    doc.text('DELTA (B VS A)', margin + colWidths.param + colWidths.valA + colWidths.valB + 3, currentY + 5);
  };

  drawTableHeaderRow(y);
  y += 7.5;

  // Render Table Data Rows
  tableData.forEach((row) => {
    // Check page space
    if (y + 8 > pageHeight - 18) {
      doc.addPage();
      currentPage++;
      drawHeaderBanner(currentPage);
      drawFooter(currentPage);
      y = 38;
      drawTableHeaderRow(y);
      y += 7.5;
    }

    if (row.isHeader) {
      // Draw category section subheader
      doc.setFillColor(235, 233, 229); // warm light cream background
      doc.rect(margin, y, contentWidth, 6, 'F');

      doc.setTextColor(0, 191, 166); // Teal Accent
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(row.label, margin + 3, y + 4.2);
      y += 6;
      return;
    }

    // Draw alternating row background
    if (y % 12 === 0) {
      doc.setFillColor(252, 251, 249);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y, contentWidth, 7, 'F');

    // Draw grid bottom divider line
    doc.setDrawColor(220, 220, 220, 0.4);
    doc.setLineWidth(0.1);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    // Render Parameter Name
    doc.text(row.label, margin + 3, y + 4.5);

    // Highlight differences
    const isDifferent = row.valA !== row.valB;
    if (isDifferent) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 28, 30);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 110, 110);
    }

    // Render Build A Value
    doc.text(String(row.valA), margin + colWidths.param + 3, y + 4.5);

    // Render Build B Value
    doc.text(String(row.valB), margin + colWidths.param + colWidths.valA + 3, y + 4.5);

    // Render Delta calculations
    if (row.rawA !== undefined && row.rawB !== undefined) {
      const diff = row.rawB - row.rawA;
      if (diff === 0) {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text('-', margin + colWidths.param + colWidths.valA + colWidths.valB + 3, y + 4.5);
      } else {
        const isPositive = diff > 0;
        const isGood = row.isBetterLower ? !isPositive : isPositive;

        const prefix = isPositive ? '+' : '';
        const diffText = `${prefix}${round(diff, 2)}${row.unit || ''}`;

        // Set green for positive/good shifts, red for negative/bad
        if (isGood) {
          doc.setFillColor(230, 245, 235); // Light green bg pill
          doc.rect(margin + colWidths.param + colWidths.valA + colWidths.valB + 1, y + 1.2, 22, 4.6, 'F');
          doc.setTextColor(20, 115, 80); // Deep green
        } else {
          doc.setFillColor(254, 235, 235); // Light red bg pill
          doc.rect(margin + colWidths.param + colWidths.valA + colWidths.valB + 1, y + 1.2, 22, 4.6, 'F');
          doc.setTextColor(185, 28, 28); // Deep red
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        // Center text within the pill
        const textOffset = 12 - (doc.getTextWidth(diffText) / 2);
        doc.text(diffText, margin + colWidths.param + colWidths.valA + colWidths.valB + textOffset, y + 4.4);
      }
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text('-', margin + colWidths.param + colWidths.valA + colWidths.valB + 3, y + 4.5);
    }

    y += 7;
  });

  y += 6;

  // Render Section 2: AI CONSULTANT ADVISORY IF ACTIVE
  if (aiComparison) {
    // We force a new page for the AI analysis to ensure professional clean spacing!
    doc.addPage();
    currentPage++;
    drawHeaderBanner(currentPage);
    drawFooter(currentPage);
    y = 38;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 30);
    doc.text('2. STRATEGIC DECISION-SUPPORT ASSESSMENT', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const advisoryIntroText = `The following expert strategic audit has been compiled dynamically by the Siliconomics AI Advisor. It details structural trade-offs, technology and yield scaling risks, and financial return analysis to assist executive leadership in tape-out approvals.`;
    const splitAdvisoryIntro = doc.splitTextToSize(advisoryIntroText, contentWidth);
    doc.text(splitAdvisoryIntro, margin, y);
    y += (splitAdvisoryIntro.length * 3.5) + 5;

    // AI summary card border
    const aiCardStartY = y;
    doc.setFillColor(249, 248, 246);
    doc.setDrawColor(26, 28, 30, 0.1);
    doc.setLineWidth(0.2);
    // Draw temporary rectangle to capture text, we fill it first then draw content. We will draw the actual outer box later or use simple lines.
    
    // Parse markdown into plain text lines cleanly
    const lines = aiComparison.split('\n');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 2;
        return;
      }

      // Check if page overflow
      if (y > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        drawHeaderBanner(currentPage);
        drawFooter(currentPage);
        y = 38;
      }

      if (trimmed.startsWith('###')) {
        y += 3;
        const heading = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '').toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 191, 166);
        doc.setFontSize(8.5);
        doc.text(heading, margin + 4, y);
        y += 4.5;
        // reset font styles
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const listContent = trimmed.replace(/^[-*]\s*/, '');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        // Handle nested bold formatting in list
        const boldMatch = listContent.match(/^\*\*(.*?)\*\*:(.*)$/);
        if (boldMatch) {
          const boldPart = `• ${boldMatch[1]}:`;
          const normalPart = boldMatch[2];
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(26, 28, 30);
          doc.text(boldPart, margin + 4, y);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          
          const textX = margin + 4 + doc.getTextWidth(boldPart) + 1;
          const remainingW = contentWidth - 8 - doc.getTextWidth(boldPart) - 1;
          const splitNormal = doc.splitTextToSize(normalPart, remainingW);
          
          doc.text(splitNormal, textX, y);
          y += (splitNormal.length * 3.5);
        } else {
          const bulletText = `• ${listContent}`;
          const splitBullet = doc.splitTextToSize(bulletText, contentWidth - 8);
          doc.text(splitBullet, margin + 4, y);
          y += (splitBullet.length * 3.5);
        }
      } else {
        // Plain paragraph
        const splitParagraph = doc.splitTextToSize(trimmed, contentWidth - 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(splitParagraph, margin + 4, y);
        y += (splitParagraph.length * 3.5) + 1.5;
      }
    });

    // Draw enclosing card outline for AI advisory
    const aiCardEndY = y;
    doc.rect(margin, aiCardStartY - 2, contentWidth, (aiCardEndY - aiCardStartY) + 4, 'S');
  } else {
    // If no AI comparison executed yet, draw a placeholder container prompting user
    if (y + 35 > pageHeight - 18) {
      doc.addPage();
      currentPage++;
      drawHeaderBanner(currentPage);
      drawFooter(currentPage);
      y = 38;
    }

    doc.setFillColor(249, 248, 246);
    doc.setDrawColor(0, 191, 166, 0.1);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 26, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 191, 166);
    doc.text('2. STRATEGIC AI ADVISORY SUMMARY (OPTIONAL)', margin + 5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    const promptText = `No dynamic AI expert comparison is appended to this report. To include full-text tactical recommendation matrices, exit this PDF, click 'Run Expert AI Comparison' on the Side-by-Side Comparison Desk to compute advisory recommendations, then re-generate this PDF report.`;
    const splitPrompt = doc.splitTextToSize(promptText, contentWidth - 10);
    doc.text(splitPrompt, margin + 5, y + 11);
    y += 28;
  }

  // Draw signature / sign-off section
  if (y + 25 > pageHeight - 18) {
    doc.addPage();
    currentPage++;
    drawHeaderBanner(currentPage);
    drawFooter(currentPage);
    y = 38;
  }

  y += 4;
  doc.setDrawColor(200, 200, 200, 0.5);
  doc.setLineWidth(0.15);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(26, 28, 30);
  doc.text('FEASIBILITY SIGN-OFF PANEL', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Prepared by: Siliconomics Architecture Committee', margin, y + 5);
  doc.text('Approved by: VP Engineering Operations', margin, y + 9);

  // Signature lines on right
  const signX = margin + contentWidth - 65;
  doc.line(signX, y + 5, signX + 60, y + 5);
  doc.text('CHIEF SEMICONDUCTOR ARCHITECT SIGNATURE', signX, y + 8.5);

  // Save the PDF
  const safeTitle = `${buildA.name.split(' ')[0]}_vs_${buildB.name.split(' ')[0]}`.replace(/[^a-zA-Z0-9_]/g, '_');
  doc.save(`Siliconomics_Executive_Summary_${safeTitle}.pdf`);
}

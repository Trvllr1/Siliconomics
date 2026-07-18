/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Legacy PDF module. The Reports & Exports center now lives in
 * `reportPdf.ts` / `reportCsv.ts` / `reportJson.ts` (assembled via
 * `reportData.ts`). This file retains only the side-by-side comparison
 * export used by ComparisonView.
 */

import { jsPDF } from 'jspdf';
import { Build, Snapshot } from '../types';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const COLORS = {
  bg: '#0D1117',
  text: '#F0F6FC',
  accent: '#00BFA6',
  muted: '#7D7B78',
} as const;

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
}

export function generateComparisonPdf(
  buildA: Build,
  snapA: Snapshot,
  buildB: Build,
  snapB: Snapshot,
  aiComparison: string | null
): void {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const [br, bg, bc] = parseRgb(COLORS.bg);
  const [tr, tg, tb] = parseRgb(COLORS.text);
  const [ar, ag, ab] = parseRgb(COLORS.accent);
  const [mr, mg, mb] = parseRgb(COLORS.muted);

  doc.setFillColor(br, bg, bc);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(ar, ag, ab);
  doc.text('SILICONOMICS', MARGIN, 80);

  doc.setFontSize(24);
  doc.setTextColor(tr, tg, tb);
  doc.text('Comparison Report', MARGIN, 95);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(mr, mg, mb);
  doc.text(`${buildA.name} vs ${buildB.name}`, MARGIN, 110);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, MARGIN, 118);

  doc.addPage();
  doc.setFillColor(br, bg, bc);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(tr, tg, tb);
  doc.text('Side-by-Side Comparison', MARGIN, 25);

  const rows: [string, string, string][] = [
    ['Die Area', `${snapA.totalDieArea.toFixed(1)} mm²`, `${snapB.totalDieArea.toFixed(1)} mm²`],
    ['Die Yield', `${(snapA.dieYield * 100).toFixed(1)}%`, `${(snapB.dieYield * 100).toFixed(1)}%`],
    ['DPW', `${snapA.dpw}`, `${snapB.dpw}`],
    ['Raw Die Cost', `$${snapA.rawDieCost.toFixed(2)}`, `$${snapB.rawDieCost.toFixed(2)}`],
    ['Fully Loaded Cost', `$${snapA.fullyLoadedCostPerDie.toFixed(2)}`, `$${snapB.fullyLoadedCostPerDie.toFixed(2)}`],
    ['Gross Margin', `${snapA.grossMargin.toFixed(1)}%`, `${snapB.grossMargin.toFixed(1)}%`],
    ['Operating Margin', `${snapA.operatingMargin.toFixed(1)}%`, `${snapB.operatingMargin.toFixed(1)}%`],
    ['Break-Even Volume', `${snapA.breakEvenVolumeMillion.toFixed(2)}M`, `${snapB.breakEvenVolumeMillion.toFixed(2)}M`],
    ['ROI', `${snapA.roi.toFixed(1)}%`, `${snapB.roi.toFixed(1)}%`],
    ['Lifetime Net Profit', `$${snapA.lifetimeNetProfitMillion.toFixed(1)}M`, `$${snapB.lifetimeNetProfitMillion.toFixed(1)}M`],
  ];

  const rcols = [
    { label: 'Metric', w: 45 },
    { label: buildA.name, w: 55 },
    { label: buildB.name, w: 55 },
  ];

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(ar, ag, ab);
  let cx = MARGIN;
  for (const col of rcols) {
    doc.text(col.label, cx, 35);
    cx += col.w;
  }
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 37, PAGE_W - MARGIN, 37);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(tr, tg, tb);
  let rowY = 43;
  for (const [label, valA, valB] of rows) {
    cx = MARGIN;
    doc.text(label, cx, rowY);
    cx += rcols[0]!.w;
    doc.text(valA, cx, rowY);
    cx += rcols[1]!.w;
    doc.text(valB, cx, rowY);
    rowY += 6;
  }

  if (aiComparison) {
    // AI analysis always starts on a fresh page for readability.
    doc.addPage();
    doc.setFillColor(br, bg, bc);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    rowY = 25;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(ar, ag, ab);
    doc.text('AI Comparison Analysis', MARGIN, rowY);
    rowY += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(tr, tg, tb);
    const lines = doc.splitTextToSize(aiComparison, CONTENT_W);
    for (const line of lines) {
      if (rowY > PAGE_H - 20) {
        doc.addPage();
        doc.setFillColor(br, bg, bc);
        doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
        rowY = 25;
      }
      doc.text(line, MARGIN, rowY);
      rowY += 5;
    }
  }

  doc.save(`siliconomics-comparison-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

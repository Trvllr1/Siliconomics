/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise PDF report engine.
 *
 * Print-grade, board-ready documents built from a ReportPackage:
 *  - generateBuildReportPdf: full executive program report (~10 pages)
 *  - generateBoardPacketPdf: consolidated portfolio packet
 *
 * Design principles:
 *  - Light print theme (dark-background PDFs do not survive printing or
 *    projector review).
 *  - Every page carries the document ID, confidentiality line, and page
 *    numbers; non-approved builds carry a DRAFT watermark on every page.
 *  - Every figure comes from the shared ReportPackage, so the PDF, CSV, and
 *    JSON artifacts of a session always agree.
 *  - The document is self-defending: data vintage, formula version,
 *    provenance, and SHA-256 fingerprint are printed, and Appendix B carries
 *    full calculation traces for the headline metrics.
 */

import { jsPDF } from 'jspdf';
import { Decision, MetricCardData } from '../types';
import {
  ReportPackage,
  REPORT_ENGINE_VERSION,
  fmtUsd,
  fmtMillions,
  fmtPct,
  fmtNum,
} from './reportData';

// ---------------------------------------------------------------------------
// Layout constants (A4, points)
// ---------------------------------------------------------------------------

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 52;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 70;

const INK: Rgb = [17, 24, 39];
const SLATE: Rgb = [100, 116, 139];
const TEAL: Rgb = [15, 118, 110];
const RULE: Rgb = [203, 213, 225];
const FILL: Rgb = [241, 245, 249];
const RED: Rgb = [185, 28, 28];
const AMBER: Rgb = [180, 83, 9];
const GREEN: Rgb = [4, 120, 87];

type Rgb = [number, number, number];

function verdictColor(outcome: string): Rgb {
  if (outcome === 'Proceed') return GREEN;
  if (outcome === 'Proceed with Risk' || outcome === 'Requires Investigation') return AMBER;
  return RED;
}

// ---------------------------------------------------------------------------
// Layout engine
// ---------------------------------------------------------------------------

interface TableOptions {
  widths: number[];
  aligns?: ('l' | 'r')[];
  fontSize?: number;
}

interface DocMeta {
  documentId: string;
  buildLabel: string;
  isDraft: boolean;
}

function createEngine(meta: DocMeta) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;
  let sectionNo = 0;

  const ensure = (space: number) => {
    if (y + space > BOTTOM) {
      doc.addPage();
      y = MARGIN + 14;
    }
  };

  const setFont = (style: 'normal' | 'bold' | 'italic', size: number, color: Rgb) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const engine = {
    doc,
    get y() {
      return y;
    },
    set y(val: number) {
      y = val;
    },
    newPage() {
      doc.addPage();
      y = MARGIN + 14;
    },
    spacer(n = 8) {
      y += n;
    },
    rule(color: Rgb = RULE, weight = 0.6) {
      ensure(8);
      doc.setDrawColor(...color);
      doc.setLineWidth(weight);
      doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
      y += 8;
    },
    h1(text: string) {
      sectionNo += 1;
      ensure(60);
      y += 14;
      setFont('bold', 15, TEAL);
      doc.text(`${sectionNo}.`, MARGIN, y + 12);
      setFont('bold', 15, INK);
      doc.text(text, MARGIN + 22, y + 12);
      y += 20;
      doc.setDrawColor(...TEAL);
      doc.setLineWidth(1.2);
      doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
      y += 14;
    },
    h2(text: string) {
      ensure(36);
      y += 8;
      setFont('bold', 11, INK);
      doc.text(text.toUpperCase(), MARGIN, y + 9);
      y += 20;
    },
    p(text: string, opts: { size?: number; color?: Rgb; italic?: boolean; after?: number } = {}) {
      setFont(opts.italic ? 'italic' : 'normal', opts.size ?? 9.5, opts.color ?? INK);
      const lines = doc.splitTextToSize(text, CONTENT_W);
      for (const line of lines) {
        ensure(12.5);
        doc.text(line, MARGIN, y + 9);
        y += 12.5;
      }
      y += opts.after ?? 5;
    },
    bullet(text: string, color: Rgb = TEAL) {
      setFont('normal', 9.5, INK);
      const lines = doc.splitTextToSize(text, CONTENT_W - 14);
      ensure(12.5);
      doc.setFillColor(...color);
      doc.circle(MARGIN + 4, y + 5.5, 1.5, 'F');
      for (const line of lines) {
        ensure(12.5);
        doc.text(line, MARGIN + 13, y + 9);
        y += 12.5;
      }
      y += 3;
    },
    mono(text: string, opts: { size?: number; color?: Rgb } = {}) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(opts.size ?? 8);
      doc.setTextColor(...(opts.color ?? SLATE));
      const lines = doc.splitTextToSize(text, CONTENT_W - 10);
      for (const line of lines) {
        ensure(10.5);
        doc.text(line, MARGIN + 10, y + 8);
        y += 10.5;
      }
      y += 4;
    },
    banner(title: string, subtitle: string, color: Rgb) {
      ensure(56);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(MARGIN, y, CONTENT_W, 44, 4, 4, 'F');
      setFont('bold', 14, [255, 255, 255]);
      doc.text(title, MARGIN + 14, y + 19);
      setFont('normal', 9, [255, 255, 255]);
      const sub = doc.splitTextToSize(subtitle, CONTENT_W - 28);
      doc.text(sub[0] ?? '', MARGIN + 14, y + 33);
      y += 54;
    },
    kpiGrid(items: { label: string; value: string; unit?: string; tone?: Rgb }[]) {
      const perRow = 4;
      const gap = 8;
      const cardW = (CONTENT_W - gap * (perRow - 1)) / perRow;
      const cardH = 52;
      for (let i = 0; i < items.length; i += perRow) {
        ensure(cardH + 8);
        const rowItems = items.slice(i, i + perRow);
        rowItems.forEach((item, j) => {
          const x = MARGIN + j * (cardW + gap);
          doc.setFillColor(...FILL);
          doc.setDrawColor(...RULE);
          doc.setLineWidth(0.5);
          doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');
          setFont('bold', 6.5, SLATE);
          doc.text(item.label.toUpperCase(), x + 8, y + 13, { maxWidth: cardW - 16 });
          setFont('bold', 13, item.tone ?? INK);
          doc.text(item.value, x + 8, y + 34);
          if (item.unit) {
            setFont('normal', 7, SLATE);
            doc.text(item.unit, x + 8, y + 45);
          }
        });
        y += cardH + 8;
      }
      y += 2;
    },
    kv(pairs: [string, string][], opts: { labelW?: number; fontSize?: number } = {}) {
      const labelW = opts.labelW ?? 170;
      const size = opts.fontSize ?? 9;
      for (const [label, value] of pairs) {
        const wrapped = doc.splitTextToSize(value, CONTENT_W - labelW);
        const h = Math.max(wrapped.length * 11.5, 12.5);
        ensure(h);
        setFont('bold', size, SLATE);
        doc.text(label, MARGIN, y + 9);
        setFont('normal', size, INK);
        doc.text(wrapped, MARGIN + labelW, y + 9);
        y += h + 2;
      }
      y += 4;
    },
    table(headers: string[], rows: string[][], opts: TableOptions) {
      const totalW = opts.widths.reduce((a, b) => a + b, 0);
      const cols = opts.widths.map((w) => (w / totalW) * CONTENT_W);
      const aligns = opts.aligns ?? headers.map(() => 'l' as const);
      const size = opts.fontSize ?? 8;
      const pad = 5;

      const drawRow = (cells: string[], isHeader: boolean, zebra: boolean) => {
        doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
        doc.setFontSize(isHeader ? size - 0.5 : size);
        const wrapped = cells.map((c, i) => doc.splitTextToSize(String(c ?? ''), cols[i] - pad * 2));
        const rowH = Math.max(...wrapped.map((w) => w.length), 1) * (size + 2.5) + pad * 2 - 1;
        if (y + rowH > BOTTOM) {
          doc.addPage();
          y = MARGIN + 14;
          if (!isHeader) drawRow(headers, true, false);
        }
        let x = MARGIN;
        for (let i = 0; i < cells.length; i++) {
          if (isHeader) {
            doc.setFillColor(...INK);
            doc.rect(x, y, cols[i], rowH, 'F');
          } else if (zebra) {
            doc.setFillColor(...FILL);
            doc.rect(x, y, cols[i], rowH, 'F');
          }
          doc.setDrawColor(...RULE);
          doc.setLineWidth(0.4);
          doc.rect(x, y, cols[i], rowH, 'S');
          doc.setTextColor(...(isHeader ? ([255, 255, 255] as Rgb) : INK));
          const textX = aligns[i] === 'r' ? x + cols[i] - pad : x + pad;
          doc.text(wrapped[i], textX, y + pad + size - 1, { align: aligns[i] === 'r' ? 'right' : 'left' });
          x += cols[i];
        }
        y += rowH;
      };

      ensure(30);
      drawRow(headers, true, false);
      rows.forEach((r, i) => drawRow(r, false, i % 2 === 1));
      y += 12;
    },
    /** Cost-contributor table with a proportional share bar. */
    costTable(rows: { name: string; category: string; cost: number; pct: number }[]) {
      const widths = [200, 90, 80, 50, 100];
      const headers = ['Cost element', 'Category', '$ / unit', 'Share', ''];
      const totalW = widths.reduce((a, b) => a + b, 0);
      const cols = widths.map((w) => (w / totalW) * CONTENT_W);
      const pad = 5;
      const size = 8;
      const rowH = 17;
      const maxPct = Math.max(...rows.map((r) => r.pct), 1);

      const drawHeader = () => {
        let x = MARGIN;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size - 0.5);
        headers.forEach((h, i) => {
          doc.setFillColor(...INK);
          doc.rect(x, y, cols[i], rowH, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(h, x + pad, y + 11.5);
          x += cols[i];
        });
        y += rowH;
      };

      ensure(rowH * 2);
      drawHeader();
      rows.forEach((r, idx) => {
        if (y + rowH > BOTTOM) {
          doc.addPage();
          y = MARGIN + 14;
          drawHeader();
        }
        let x = MARGIN;
        const cells = [r.name, r.category, fmtUsd(r.cost), `${r.pct.toFixed(1)}%`];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(size);
        cells.forEach((c, i) => {
          if (idx % 2 === 1) {
            doc.setFillColor(...FILL);
            doc.rect(x, y, cols[i], rowH, 'F');
          }
          doc.setDrawColor(...RULE);
          doc.setLineWidth(0.4);
          doc.rect(x, y, cols[i], rowH, 'S');
          doc.setTextColor(...INK);
          const alignRight = i === 2 || i === 3;
          doc.text(
            doc.splitTextToSize(c, cols[i] - pad * 2)[0] ?? '',
            alignRight ? x + cols[i] - pad : x + pad,
            y + 11.5,
            { align: alignRight ? 'right' : 'left' }
          );
          x += cols[i];
        });
        // Share bar cell
        if (idx % 2 === 1) {
          doc.setFillColor(...FILL);
          doc.rect(x, y, cols[4], rowH, 'F');
        }
        doc.setDrawColor(...RULE);
        doc.rect(x, y, cols[4], rowH, 'S');
        const barW = Math.max((r.pct / maxPct) * (cols[4] - pad * 2), 1.5);
        doc.setFillColor(...TEAL);
        doc.rect(x + pad, y + 5, barW, rowH - 10, 'F');
        y += rowH;
      });
      y += 12;
    },
    /**
     * Stamps footers (and DRAFT watermarks when applicable) on every page.
     * Call exactly once, after all content is placed.
     */
    finalize() {
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        if (meta.isDraft) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(92);
          doc.setTextColor(226, 232, 240);
          doc.text('DRAFT', PAGE_W / 2, PAGE_H / 2 + 100, { align: 'center', angle: 45 });
        }
        if (i > 1) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(...TEAL);
          doc.text('SILICONOMICS', MARGIN, 30);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...SLATE);
          doc.text(meta.buildLabel, PAGE_W - MARGIN, 30, { align: 'right' });
          doc.setDrawColor(...RULE);
          doc.setLineWidth(0.4);
          doc.line(MARGIN, 36, PAGE_W - MARGIN, 36);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...SLATE);
        doc.text(`${meta.documentId}  ·  CONFIDENTIAL${meta.isDraft ? '  ·  DRAFT — NOT APPROVED' : ''}`, MARGIN, PAGE_H - 34);
        doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 34, { align: 'right' });
      }
      return doc;
    },
  };
  return engine;
}

type Engine = ReturnType<typeof createEngine>;

// ---------------------------------------------------------------------------
// Shared sections
// ---------------------------------------------------------------------------

function heroKpis(pkg: ReportPackage): { label: string; value: string; unit?: string; tone?: Rgb }[] {
  const s = pkg.snapshot;
  return [
    { label: 'Gross Margin', value: fmtPct(s.grossMargin), tone: s.grossMargin >= 40 ? GREEN : s.grossMargin >= 20 ? AMBER : RED },
    { label: 'Operating Margin', value: fmtPct(s.operatingMargin) },
    { label: 'Fully Loaded Cost / Die', value: fmtUsd(s.fullyLoadedCostPerDie) },
    { label: 'ASP', value: fmtUsd(pkg.build.designModel.asp) },
    { label: 'ROI', value: fmtPct(s.roi), tone: s.roi >= 30 ? GREEN : RED },
    { label: 'Break-even Volume', value: fmtNum(s.breakEvenVolumeMillion, 2), unit: 'M units' },
    { label: 'Lifetime Net Profit', value: fmtMillions(s.lifetimeNetProfitMillion), tone: s.lifetimeNetProfitMillion >= 0 ? GREEN : RED },
    { label: 'Die Sort Yield', value: fmtPct(s.dieYield * 100, 1), unit: 'Murphy model' },
  ];
}

function coverPage(e: Engine, pkg: ReportPackage, title: string, subtitle: string) {
  const { doc } = e;
  const { build } = pkg;

  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, 6, 'F');

  e.y = 118;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text('SILICONOMICS', MARGIN, e.y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text('Deterministic Silicon Program Economics', MARGIN, e.y + 14);

  e.y += 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(title, CONTENT_W);
  doc.text(titleLines, MARGIN, e.y);
  e.y += titleLines.length * 30 + 6;

  doc.setFontSize(13);
  doc.setTextColor(...SLATE);
  const subLines = doc.splitTextToSize(subtitle, CONTENT_W);
  doc.text(subLines, MARGIN, e.y);
  e.y += subLines.length * 16 + 26;

  const isDraft = build.status !== 'Approved';
  doc.setFillColor(...(isDraft ? ([254, 243, 199] as Rgb) : ([209, 250, 229] as Rgb)));
  doc.setDrawColor(...(isDraft ? AMBER : GREEN));
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGIN, e.y, 250, 26, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...(isDraft ? AMBER : GREEN));
  doc.text(
    isDraft ? `DRAFT — STATUS: ${build.status.toUpperCase()}` : 'APPROVED — FROZEN BUILD',
    MARGIN + 12,
    e.y + 17
  );
  e.y += 54;

  e.h2('Document Control');
  const vintage = pkg.vintageRows
    .map((v) => `${v.item}: ${v.value}${v.freshness ? ` (${v.freshness.label})` : ''}`)
    .join('  ·  ');
  e.kv(
    [
      ['Document ID', pkg.documentId],
      ['Generated (UTC)', pkg.generatedAt],
      ['Generator', REPORT_ENGINE_VERSION],
      ['Build', `${build.name} — ${build.version} (${build.id})`],
      ['Owner / Organization', `${build.owner} · ${build.organization}`],
      ['Formula Version', build.formulaVersion],
      ['Data Vintage', vintage || 'Not stamped (pre-provenance build)'],
      ['Integrity', `${pkg.integrity.algorithm} over ${pkg.integrity.scope}`],
      ['Design Model Hash', pkg.integrity.designModelHash],
    ],
    { labelW: 150, fontSize: 8.5 }
  );

  e.spacer(10);
  e.rule();
  e.p(
    'Every figure in this document is a deterministic computation over the stated assumptions — no estimates were ' +
      'generated by AI. Formulas are versioned, inputs carry dated provenance, and Appendix B reproduces the full ' +
      'calculation trace for each headline metric. Verify this document against the system of record by comparing the ' +
      'design-model hash above.',
    { size: 8.5, color: SLATE, italic: true }
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text('CONFIDENTIAL — BOARD & EXECUTIVE DISTRIBUTION ONLY', MARGIN, PAGE_H - 92);
}

function executiveSummarySection(e: Engine, pkg: ReportPackage) {
  e.h1('Executive Summary');
  e.banner(
    pkg.recommendation.outcome.toUpperCase(),
    `Automated gate evaluation · confidence ${pkg.recommendation.confidence}% · ${pkg.recommendation.summary}`,
    verdictColor(pkg.recommendation.outcome)
  );
  e.p(pkg.briefing.summary);
  e.kpiGrid(heroKpis(pkg));

  if (pkg.briefing.keyFindings.length > 0) {
    e.h2('Key Findings');
    pkg.briefing.keyFindings.forEach((f) => e.bullet(f));
  }
  if (pkg.briefing.risks.length > 0) {
    e.h2('Risks');
    pkg.briefing.risks.forEach((r) => e.bullet(r, RED));
  }
  if (pkg.briefing.opportunities.length > 0) {
    e.h2('Opportunities');
    pkg.briefing.opportunities.forEach((o) => e.bullet(o, GREEN));
  }
}

function designConfigSection(e: Engine, pkg: ReportPackage) {
  const dm = pkg.build.designModel;
  e.h1('Design Configuration');
  e.p(
    'Frozen input parameters for this build. Once a build leaves Draft, these values are immutable and covered by the ' +
      'design-model hash on the cover page.',
    { color: SLATE, size: 8.5 }
  );
  const rows: string[][] = [
    ['Process node', dm.processNode, 'Foundry', dm.foundry.toUpperCase()],
    ['Topology', dm.topology === 'chiplet' ? `Chiplet × ${dm.chipletCount}` : 'Monolithic', 'Packaging', dm.packagingType.toUpperCase()],
    ['Die area', `${fmtNum(dm.dieArea)} mm² (${dm.dieWidth} × ${dm.dieHeight} mm)`, 'IO die area', `${fmtNum(dm.ioDieArea)} mm²`],
    ['Interposer area', dm.interposerArea ? `${fmtNum(dm.interposerArea)} mm²` : '—', 'Transistors', `${fmtNum(dm.transistorCount, 1)} B`],
    ['TDP', `${fmtNum(dm.tdp)} W`, 'Defect density D0', `${dm.defectDensity} def/cm²`],
    ['Wafer cost', fmtUsd(dm.waferCost, 0), 'Wafer starts / month', fmtNum(dm.waferStartsPerMonth)],
    ['Packaging cost', fmtUsd(dm.packagingCost), 'Packaging yield', fmtPct(dm.packagingYield)],
    ['Test time', `${dm.testTimeSeconds} s`, 'Test yield', fmtPct(dm.testYield)],
    ['Test cost / second', fmtUsd(dm.testCostPerSecond), 'NRE', `$${fmtNum(dm.nreCost)} M`],
    ['ASP', fmtUsd(dm.asp), 'Target volume', `${fmtNum(dm.targetVolume)} M units`],
  ];
  e.table(['Parameter', 'Value', 'Parameter', 'Value'], rows, {
    widths: [110, 150, 110, 150],
    fontSize: 8.5,
  });
}

function economicsSection(e: Engine, pkg: ReportPackage) {
  const s = pkg.snapshot;
  e.h1('Unit Economics & Cost Structure');
  e.h2('Per-Unit Cost Stack');
  e.table(
    ['Stage', 'Value', 'Note'],
    [
      ['Raw die cost', fmtUsd(s.rawDieCost), 'Silicon only, yield-adjusted (Murphy)'],
      ['Packaging & test', fmtUsd(s.packagingAndTestingCost), 'Assembly, interposer, test insertions'],
      ['Gross cost per good die', fmtUsd(s.grossCostPerGoodDie), '(Silicon + packaging) / test yield'],
      ['Amortized NRE', fmtUsd(s.amortizedNreCost), 'Total NRE / target volume'],
      ['IP royalty burden', fmtUsd(s.totalRoyaltyBurdenPerUnit), 'Per-unit royalties across blocks'],
      ['Fully loaded cost per die', fmtUsd(s.fullyLoadedCostPerDie), 'Basis for operating margin'],
      ['ASP', fmtUsd(pkg.build.designModel.asp), `Gross margin ${fmtPct(s.grossMargin)} · operating margin ${fmtPct(s.operatingMargin)}`],
    ],
    { widths: [150, 90, 250], aligns: ['l', 'r', 'l'], fontSize: 8.5 }
  );

  e.h2('Cost Contributors (ranked)');
  const contributors = [...s.costContributors]
    .sort((a, b) => b.costPerUnit - a.costPerUnit)
    .slice(0, 12)
    .map((c) => ({ name: c.name, category: c.category, cost: c.costPerUnit, pct: c.percentageOfTotal }));
  e.costTable(contributors);
}

function programEconomicsSection(e: Engine, pkg: ReportPackage) {
  const s = pkg.snapshot;
  e.h1('Program Economics');
  e.kpiGrid([
    { label: 'Lifetime Revenue', value: fmtMillions(s.lifetimeRevenueMillion) },
    { label: 'Lifetime COGS', value: fmtMillions(s.lifetimeCOGSMillion) },
    { label: 'Lifetime Gross Profit', value: fmtMillions(s.lifetimeGrossProfitMillion) },
    { label: 'Lifetime Net Profit', value: fmtMillions(s.lifetimeNetProfitMillion), tone: s.lifetimeNetProfitMillion >= 0 ? GREEN : RED },
  ]);
  e.table(
    ['Program measure', 'Value'],
    [
      ['Base NRE (masks, design, tooling)', `$${fmtNum(pkg.build.designModel.nreCost)} M`],
      ['IP licensing NRE', fmtMillions(s.totalIpNreM)],
      ['License fees', fmtMillions(s.totalLicenseFeesM)],
      ['Engineering labor', fmtMillions(s.engineeringLaborCostM)],
      ['Verification labor', fmtMillions(s.verificationLaborCostM)],
      ['Break-even volume', `${fmtNum(s.breakEvenVolumeMillion, 2)} M units`],
      ['ROI on total NRE', fmtPct(s.roi)],
      ['Monthly / annual good units', `${fmtNum(s.monthlyVolumeMillion, 2)} M / ${fmtNum(s.annualVolumeMillion, 2)} M`],
      ['Wafer utilization', fmtPct(s.waferUtilization)],
      ['Dies per wafer', fmtNum(s.dpw)],
    ],
    { widths: [260, 230], fontSize: 8.5 }
  );
}

function timeSection(e: Engine, pkg: ReportPackage) {
  e.h1('Time-Phased Outlook');
  if (!pkg.time || !pkg.build.timeModel) {
    e.p(
      'Time-dimension modeling is not enabled for this build. Figures elsewhere in this report are lifetime aggregates. ' +
        'Enable a time model in the Build Workspace to project quarterly yield ramp, ASP erosion, respin risk, and cash flow.',
      { color: SLATE, italic: true }
    );
    return;
  }
  const t = pkg.time;
  e.p(t.constraintExplanation, { color: SLATE, size: 8.5 });
  e.kpiGrid([
    {
      label: 'Break-even Quarter (expected)',
      value: t.expected.breakEvenQuarter !== null ? `Q${t.expected.breakEvenQuarter}` : 'Not reached',
      tone: t.expected.breakEvenQuarter !== null ? GREEN : RED,
    },
    { label: 'Program Constraint', value: t.programConstraint.toUpperCase() },
    { label: 'Expected Revenue', value: fmtMillions(t.expected.totalRevenueM) },
    { label: 'Expected Net Profit', value: fmtMillions(t.expected.totalNetProfitM), tone: t.expected.totalNetProfitM >= 0 ? GREEN : RED },
  ]);

  e.h2('Scenario Comparison');
  const scenarioRows = [t.baseline, t.withRespin, t.expected]
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => [
      s.label,
      fmtPct(s.probability * 100, 0),
      fmtMillions(s.totalRevenueM),
      fmtMillions(s.totalNetProfitM),
      s.breakEvenQuarter !== null ? `Q${s.breakEvenQuarter}` : 'Not reached',
    ]);
  e.table(['Scenario', 'Probability', 'Revenue', 'Net Profit', 'Break-even'], scenarioRows, {
    widths: [160, 70, 90, 90, 80],
    aligns: ['l', 'r', 'r', 'r', 'r'],
    fontSize: 8.5,
  });

  e.h2('Quarterly Projection (expected scenario)');
  const qRows = t.expected.projections.map((q) => [
    q.label + (q.isRespinQuarter ? ' ⚠' : ''),
    q.d0.toFixed(3),
    fmtPct(q.effectiveYield * 100, 1),
    fmtNum(q.goodUnits, 2),
    fmtUsd(q.asp, 0),
    fmtNum(q.revenueM, 1),
    fmtNum(q.grossProfitM, 1),
    fmtNum(q.cumulativeCashFlowM, 1),
  ]);
  e.table(
    ['Quarter', 'D0', 'Eff. yield', 'Units (M)', 'ASP', 'Rev ($M)', 'GP ($M)', 'Cum. cash ($M)'],
    qRows,
    { widths: [70, 45, 55, 55, 50, 55, 55, 70], aligns: ['l', 'r', 'r', 'r', 'r', 'r', 'r', 'r'], fontSize: 7.5 }
  );
  e.p('⚠ marks respin-impacted quarters. Cumulative cash flow includes NRE outlay.', { size: 7.5, color: SLATE, italic: true });
}

function sensitivitySection(e: Engine, pkg: ReportPackage) {
  e.h1('Sensitivity Analysis');
  e.p(
    'Each input parameter varied ±20% with all others held constant; swing is the full range of the output across the ' +
      'variation band. Parameters are ranked by gross-margin exposure — these are the assumptions to challenge first.',
    { color: SLATE, size: 8.5 }
  );
  e.table(
    ['Rank', 'Parameter', 'Gross-margin swing', 'Lifetime net-profit swing'],
    pkg.sensitivityDrivers.map((d, i) => [
      String(i + 1),
      d.paramLabel,
      `${d.grossMarginSwingPp.toFixed(2)} pp`,
      fmtMillions(d.netProfitSwingM),
    ]),
    { widths: [40, 190, 130, 130], aligns: ['l', 'l', 'r', 'r'], fontSize: 8.5 }
  );
}

function supplyChainSection(e: Engine, pkg: ReportPackage) {
  const sc = pkg.snapshot.supplyChain;
  e.h1('Supply Chain Risk');
  const tone: Rgb = sc.riskLevel === 'low' ? GREEN : sc.riskLevel === 'moderate' ? AMBER : RED;
  e.kpiGrid([
    { label: 'Composite Risk', value: `${sc.compositeRiskScore.toFixed(0)} / 100`, unit: sc.riskLevel.toUpperCase(), tone },
    { label: 'Supplier Concentration', value: sc.supplierConcentrationScore.toFixed(0) },
    { label: 'Geopolitical Exposure', value: sc.geopoliticalRiskScore.toFixed(0) },
    { label: 'Risk Cost Adder', value: fmtUsd(sc.riskAdjustedCostAdder), unit: 'per unit' },
  ]);
  if (sc.topCommodityCosts.length > 0) {
    e.h2('Top Commodity Exposures');
    e.table(
      ['Commodity', 'Category', 'Cost / unit'],
      sc.topCommodityCosts.map((c) => [c.name, c.category, fmtUsd(c.costPerUnit)]),
      { widths: [220, 130, 90], aligns: ['l', 'l', 'r'], fontSize: 8.5 }
    );
  }
}

function architectureSection(e: Engine, pkg: ReportPackage) {
  if (pkg.blocks.length === 0) return;
  e.h1('Architecture Bill of Materials');
  e.table(
    ['Block', 'Category', 'Impl.', 'Area (mm²)', 'NRE ($M)', 'Royalty ($)', 'Criticality', 'Supply risk'],
    pkg.blocks.map((b) => [
      b.name,
      b.category,
      b.implementation,
      fmtNum(b.estimatedAreaMm2, 1),
      b.nreImpactM != null ? fmtNum(b.nreImpactM, 1) : '—',
      b.royaltyPerUnit != null ? fmtNum(b.royaltyPerUnit, 2) : '—',
      b.manufacturingCriticality,
      b.supplyChainRisk,
    ]),
    { widths: [110, 65, 60, 55, 50, 55, 60, 55], aligns: ['l', 'l', 'l', 'r', 'r', 'r', 'l', 'l'], fontSize: 7.5 }
  );
}

function decisionSection(e: Engine, decisions: Decision[], title = 'Decision Record') {
  if (decisions.length === 0) return;
  e.h1(title);
  e.table(
    ['Date', 'Outcome', 'Approver', 'Builds', 'Rationale'],
    decisions.map((d) => [
      new Date(d.timestamp).toISOString().slice(0, 10),
      d.outcome,
      d.approver,
      d.buildIds.join(', '),
      d.rationale + (d.followUpActions.length ? ` Follow-ups: ${d.followUpActions.join('; ')}` : ''),
    ]),
    { widths: [55, 75, 70, 80, 210], fontSize: 7.5 }
  );
}

function provenanceAppendix(e: Engine, pkg: ReportPackage) {
  e.h1('Appendix A — Assumptions, Provenance & Data Vintage');
  if (pkg.vintageRows.length > 0) {
    e.h2('Data Vintage');
    e.table(
      ['Dataset', 'Version / date', 'Freshness'],
      pkg.vintageRows.map((v) => [v.item, v.value, v.freshness ? v.freshness.label : '—']),
      { widths: [180, 180, 130], fontSize: 8.5 }
    );
  } else {
    e.p('This build predates data-vintage stamping. Re-apply reference models in the Build Workspace to stamp vintage.', {
      color: SLATE,
      italic: true,
    });
  }
  e.h2('Metric Registry');
  e.p('Every metric in this report, with its governing formula, reference model, and confidence rating.', {
    color: SLATE,
    size: 8.5,
  });
  const grouped = new Map<string, MetricCardData[]>();
  for (const m of pkg.snapshot.metricsList) {
    const arr = grouped.get(m.category) ?? [];
    arr.push(m);
    grouped.set(m.category, arr);
  }
  for (const [category, metrics] of grouped) {
    e.h2(category);
    e.table(
      ['Metric', 'Value', 'Conf.', 'Formula', 'Reference'],
      metrics.map((m) => [m.label, `${m.value}${m.unit ? ' ' + m.unit : ''}`, `${m.confidence}%`, m.formula, m.reference]),
      { widths: [100, 70, 35, 160, 125], aligns: ['l', 'r', 'r', 'l', 'l'], fontSize: 7 }
    );
  }
}

function traceAppendix(e: Engine, pkg: ReportPackage) {
  e.h1('Appendix B — Calculation Traces');
  e.p(
    'Full derivation paths for the headline metrics. Any figure can be independently reproduced from the design ' +
      'configuration in Section 2 and the equations below.',
    { color: SLATE, size: 8.5 }
  );
  const heroTerms = ['yield', 'margin', 'cost per good die', 'fully loaded', 'break-even', 'roi', 'dies per wafer'];
  const heroes = pkg.snapshot.metricsList
    .filter((m) => heroTerms.some((t) => m.label.toLowerCase().includes(t)))
    .slice(0, 8);
  const list = heroes.length > 0 ? heroes : pkg.snapshot.metricsList.slice(0, 6);

  for (const m of list) {
    e.h2(`${m.label} = ${m.value}${m.unit ? ' ' + m.unit : ''}`);
    e.p(m.trace.definition, { size: 8.5, color: SLATE });
    e.mono(`Equation: ${m.trace.equation}`);
    const inputs = Object.entries(m.trace.inputs)
      .map(([k, v]) => `${k} = ${v}`)
      .join('   ·   ');
    if (inputs) e.mono(`Inputs:   ${inputs}`);
    m.trace.calculationPath.forEach((step, i) => e.mono(`  ${i + 1}. ${step}`, { color: INK }));
    e.p(`Reference: ${m.trace.referenceModel} · Formula version: ${m.trace.version}`, { size: 7.5, color: SLATE, italic: true });
  }
}

function signOffPage(e: Engine, pkg: ReportPackage) {
  const { doc } = e;
  e.newPage();
  e.h1('Sign-Off & Document Control');
  e.p(
    'This report was generated deterministically from the frozen build definition identified below. Signatories confirm ' +
      'they have reviewed the assumptions in Appendix A and the derivations in Appendix B.',
    { color: SLATE, size: 8.5 }
  );
  e.spacer(8);
  const roles = ['Chief Executive Officer', 'Chief Financial Officer', 'Chief Technology Officer', 'VP, Silicon Engineering'];
  for (const role of roles) {
    e.spacer(30);
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, e.y, MARGIN + 220, e.y);
    doc.line(MARGIN + 260, e.y, MARGIN + 380, e.y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(role, MARGIN, e.y + 10);
    doc.text('Date', MARGIN + 260, e.y + 10);
    e.y += 14;
  }
  e.spacer(24);
  e.rule();
  e.kv(
    [
      ['Document ID', pkg.documentId],
      ['Design model hash (SHA-256)', pkg.integrity.designModelHash],
      ['Formula version', pkg.build.formulaVersion],
      ['Generated (UTC)', pkg.generatedAt],
      ['Generator', REPORT_ENGINE_VERSION],
    ],
    { labelW: 170, fontSize: 8 }
  );
  e.p(
    'Disclaimer: outputs are deterministic computations over stated, provenance-labeled assumptions and constitute ' +
      'decision-support information, not professional advice. Reference data is estimate-grade unless marked as a vendor quote.',
    { size: 7.5, color: SLATE, italic: true }
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Full executive program report for a single build. */
export function generateBuildReportPdf(pkg: ReportPackage): jsPDF {
  const e = createEngine({
    documentId: pkg.documentId,
    buildLabel: `${pkg.build.name} · ${pkg.build.version}`,
    isDraft: pkg.build.status !== 'Approved',
  });

  coverPage(e, pkg, pkg.build.name, `Executive Program Report · ${pkg.build.designModel.processNode} ${pkg.build.designModel.topology} · ${pkg.build.version}`);
  e.newPage();
  executiveSummarySection(e, pkg);
  designConfigSection(e, pkg);
  economicsSection(e, pkg);
  programEconomicsSection(e, pkg);
  timeSection(e, pkg);
  sensitivitySection(e, pkg);
  supplyChainSection(e, pkg);
  architectureSection(e, pkg);
  decisionSection(e, pkg.decisions);
  e.newPage();
  provenanceAppendix(e, pkg);
  e.newPage();
  traceAppendix(e, pkg);
  signOffPage(e, pkg);

  return e.finalize();
}

/** Consolidated board packet across multiple builds. */
export function generateBoardPacketPdf(pkgs: ReportPackage[], decisions: Decision[]): jsPDF {
  const anyDraft = pkgs.some((p) => p.build.status !== 'Approved');
  const first = pkgs[0];
  const e = createEngine({
    documentId: `SIL-PORTFOLIO-${(first?.integrity.designModelHash ?? '00000000').slice(0, 8).toUpperCase()}`,
    buildLabel: `Portfolio Packet · ${pkgs.length} builds`,
    isDraft: anyDraft,
  });
  const { doc } = e;

  // Cover
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, 6, 'F');
  e.y = 118;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text('SILICONOMICS', MARGIN, e.y);
  e.y += 64;
  doc.setFontSize(26);
  doc.setTextColor(...INK);
  doc.text('Silicon Portfolio Board Packet', MARGIN, e.y);
  e.y += 34;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE);
  doc.text(`${pkgs.length} program${pkgs.length === 1 ? '' : 's'} · ${decisions.length} decision${decisions.length === 1 ? '' : 's'} on record`, MARGIN, e.y);
  e.y += 40;
  e.kv(
    [
      ['Generated (UTC)', new Date().toISOString()],
      ['Generator', REPORT_ENGINE_VERSION],
      ['Programs included', pkgs.map((p) => `${p.build.name} (${p.build.version}, ${p.build.status})`).join('  ·  ')],
    ],
    { labelW: 150, fontSize: 8.5 }
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text('CONFIDENTIAL — BOARD & EXECUTIVE DISTRIBUTION ONLY', MARGIN, PAGE_H - 92);
  e.newPage();

  // Portfolio summary
  e.h1('Portfolio Summary');
  const totalNre = pkgs.reduce((a, p) => a + p.build.designModel.nreCost + p.snapshot.totalIpNreM + p.snapshot.engineeringLaborCostM + p.snapshot.verificationLaborCostM, 0);
  const totalRev = pkgs.reduce((a, p) => a + p.snapshot.lifetimeRevenueMillion, 0);
  const totalNet = pkgs.reduce((a, p) => a + p.snapshot.lifetimeNetProfitMillion, 0);
  e.kpiGrid([
    { label: 'Programs', value: String(pkgs.length) },
    { label: 'Combined NRE', value: fmtMillions(totalNre) },
    { label: 'Combined Lifetime Revenue', value: fmtMillions(totalRev) },
    { label: 'Combined Net Profit', value: fmtMillions(totalNet), tone: totalNet >= 0 ? GREEN : RED },
  ]);
  e.table(
    ['Program', 'Status', 'Node', 'Verdict', 'GM %', 'ROI %', 'BE (M u)', 'Net ($M)'],
    pkgs.map((p) => [
      `${p.build.name} ${p.build.version}`,
      p.build.status,
      p.build.designModel.processNode,
      p.recommendation.outcome,
      p.snapshot.grossMargin.toFixed(1),
      p.snapshot.roi.toFixed(0),
      p.snapshot.breakEvenVolumeMillion.toFixed(2),
      p.snapshot.lifetimeNetProfitMillion.toFixed(0),
    ]),
    { widths: [120, 70, 45, 90, 40, 40, 45, 50], aligns: ['l', 'l', 'l', 'l', 'r', 'r', 'r', 'r'], fontSize: 7.5 }
  );

  // Per-build digests
  for (const pkg of pkgs) {
    e.newPage();
    e.h1(`Program Digest — ${pkg.build.name}`);
    e.banner(
      pkg.recommendation.outcome.toUpperCase(),
      `Confidence ${pkg.recommendation.confidence}% · ${pkg.recommendation.summary}`,
      verdictColor(pkg.recommendation.outcome)
    );
    e.kpiGrid(heroKpis(pkg));
    e.h2('Top Cost Contributors');
    e.costTable(
      [...pkg.snapshot.costContributors]
        .sort((a, b) => b.costPerUnit - a.costPerUnit)
        .slice(0, 5)
        .map((c) => ({ name: c.name, category: c.category, cost: c.costPerUnit, pct: c.percentageOfTotal }))
    );
    if (pkg.time) {
      e.p(
        `Time outlook: expected break-even ${pkg.time.expected.breakEvenQuarter !== null ? `Q${pkg.time.expected.breakEvenQuarter}` : 'not reached'} · ` +
          `expected net profit ${fmtMillions(pkg.time.expected.totalNetProfitM)} · program is ${pkg.time.programConstraint}-constrained.`,
        { size: 8.5 }
      );
    }
    e.p(`Document ID ${pkg.documentId} · ${pkg.integrity.algorithm} ${pkg.integrity.designModelHash.slice(0, 16)}… · Formula ${pkg.build.formulaVersion}`, {
      size: 7.5,
      color: SLATE,
      italic: true,
    });
  }

  decisionSection(e, decisions, 'Decision Log');
  return e.finalize();
}

export function downloadReportPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

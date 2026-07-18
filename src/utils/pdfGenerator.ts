import { jsPDF } from 'jspdf';
import { Build, MetricCardData, CostContributor, ArchitectureBlock, SupplyChainSnapshot, Snapshot, Decision } from '../types';
import { computeBuildMetrics } from './mathEngine';
import { evaluateBuild } from './ExecutiveRecommendation';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const COLORS = {
  bg: '#0D1117',
  text: '#F0F6FC',
  accent: '#00BFA6',
  muted: '#7D7B78',
  card: '#161B22',
} as const;

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
}

function addMetricCard(doc: jsPDF, y: number, label: string, value: string, unit: string): number {
  const [tr, tg, tb] = parseRgb(COLORS.text);
  const [mr, mg, mb] = parseRgb(COLORS.muted);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(mr, mg, mb);
  doc.text(label.toUpperCase(), MARGIN, y);
  doc.setFontSize(14);
  doc.setTextColor(tr, tg, tb);
  doc.text(value, MARGIN, y + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(mr, mg, mb);
  doc.text(unit, MARGIN + doc.getTextWidth(value) + 2, y + 6);
  return y + 14;
}

export function generateExecutiveReport(
  build: Build,
  metrics: MetricCardData[],
  contributors: CostContributor[],
  blocks: ArchitectureBlock[],
  supplyChain: SupplyChainSnapshot
): jsPDF {
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

  doc.setFontSize(28);
  doc.setTextColor(tr, tg, tb);
  doc.text('Executive Report', MARGIN, 95);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(mr, mg, mb);
  doc.text(build.name, MARGIN, 110);

  doc.setFontSize(9);
  doc.setTextColor(mr, mg, mb);
  doc.text(`Process: ${build.designModel.processNode}  |  Version: ${build.version}  |  Status: ${build.status}`, MARGIN, 120);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, MARGIN, 127);

  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 140, PAGE_W - MARGIN, 140);

  doc.addPage();
  doc.setFillColor(br, bg, bc);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(tr, tg, tb);
  doc.text('Key Metrics', MARGIN, 25);

  const fin = metrics.filter(m => m.category === 'financial');
  const eng = metrics.filter(m => m.category === 'engineering');

  let y = 35;
  if (fin.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(ar, ag, ab);
    doc.text('FINANCIAL', MARGIN, y);
    y += 8;
    for (const m of fin.slice(0, 8)) {
      y = addMetricCard(doc, y, m.label, m.value, m.unit);
    }
  }

  y += 5;
  if (eng.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(ar, ag, ab);
    doc.text('ENGINEERING', MARGIN, y);
    y += 8;
    for (const m of eng.slice(0, 6)) {
      y = addMetricCard(doc, y, m.label, m.value, m.unit);
    }
  }

  doc.addPage();
  doc.setFillColor(br, bg, bc);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(tr, tg, tb);
  doc.text('Cost Breakdown', MARGIN, 25);

  const sorted = [...contributors].sort((a, b) => b.costPerUnit - a.costPerUnit);
  const maxCost = sorted.length > 0 ? sorted[0]!.costPerUnit : 1;
  const barMaxW = 140;
  let cy = 38;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  for (const c of sorted.slice(0, 12)) {
    const barW = (c.costPerUnit / maxCost) * barMaxW;
    doc.setTextColor(tr, tg, tb);
    doc.text(c.name, MARGIN, cy);
    doc.setTextColor(mr, mg, mb);
    doc.text(`$${c.costPerUnit.toFixed(4)}`, MARGIN + barMaxW + 5, cy);
    doc.text(`(${c.percentageOfTotal.toFixed(1)}%)`, MARGIN + barMaxW + 30, cy);
    doc.setFillColor(ar, ag, ab);
    doc.rect(MARGIN + 50, cy - 2, barW, 3, 'F');
    cy += 8;
  }

  doc.addPage();
  doc.setFillColor(br, bg, bc);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(tr, tg, tb);
  doc.text('Supply Chain Risk', MARGIN, 25);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(tr, tg, tb);
  doc.text(`Composite Risk Score: ${supplyChain.compositeRiskScore}%`, MARGIN, 38);
  doc.setFontSize(9);
  doc.setTextColor(mr, mg, mb);
  doc.text(`Risk Level: ${supplyChain.riskLevel.toUpperCase()}`, MARGIN, 46);
  doc.text(`Risk-Adjusted Cost Adder: $${supplyChain.riskAdjustedCostAdder.toFixed(2)}/wafer`, MARGIN, 53);
  doc.text(`High-Risk Blocks: ${supplyChain.highRiskBlockCount} / ${supplyChain.totalBlockCount}`, MARGIN, 60);

  doc.setFontSize(8);
  doc.setTextColor(mr, mg, mb);
  doc.text(`Supplier Concentration: ${supplyChain.supplierConcentrationScore.toFixed(1)}%`, MARGIN, 72);
  doc.text(`Geopolitical Exposure: ${supplyChain.geopoliticalRiskScore.toFixed(1)}%`, MARGIN, 79);
  doc.text(`Lead Time Volatility: ${supplyChain.leadTimeVolatilityScore.toFixed(1)}%`, MARGIN, 86);

  if (blocks.length > 0) {
    y = 100;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(tr, tg, tb);
    doc.text('Architecture Blocks', MARGIN, y);
    y += 8;

    const cols = [
      { label: 'Block', w: 50 },
      { label: 'Category', w: 25 },
      { label: 'Area', w: 20 },
      { label: 'Risk', w: 18 },
      { label: 'Imp.', w: 16 },
      { label: 'NRE', w: 18 },
      { label: 'Royalty', w: 18 },
    ];

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(ar, ag, ab);
    let cx = MARGIN;
    for (const col of cols) {
      doc.text(col.label, cx, y);
      cx += col.w;
    }
    doc.setDrawColor(ar, ag, ab);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 1, PAGE_W - MARGIN, y + 1);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(tr, tg, tb);
    let rowY = y + 6;
    for (const b of blocks) {
      if (rowY > PAGE_H - 20) break;
      cx = MARGIN;
      const vals = [b.name, b.category, `${b.estimatedAreaMm2} mm²`, b.supplyChainRisk, b.implementation.slice(0, 4), b.nreImpactM ? `$${b.nreImpactM}M` : '-', b.royaltyPerUnit ? `$${b.royaltyPerUnit}` : '-'];
      for (let vi = 0; vi < vals.length; vi++) {
        doc.text(vals[vi]!, cx, rowY);
        cx += cols[vi]!.w;
      }
      rowY += 5;
    }
  }

  return doc;
}

function computeScorecardScore(snap: Snapshot, dm: { defectDensity: number; packagingYield: number; testYield: number; nreCost: number; asp: number; topology: string; packagingType: string }): { label: string; score: number; max: number }[] {
  return [
    { label: 'Technical Feasibility', score: Math.round(Math.min(10, (snap.dieYield / 0.95) * 3 + (snap.transistorDensity > 50 ? 4 : 2) + (snap.dpw > 200 ? 3 : 1))), max: 10 },
    { label: 'Manufacturing Readiness', score: Math.round(Math.min(10, (dm.packagingYield / 99) * 4 + (dm.testYield / 99) * 3 + (snap.dieYield > 0.6 ? 3 : 0))), max: 10 },
    { label: 'Capital Efficiency', score: Math.round(Math.min(10, (snap.roi > 50 ? 5 : snap.roi > 20 ? 3 : 1) + (snap.breakEvenVolumeMillion < 2 ? 3 : snap.breakEvenVolumeMillion < 5 ? 2 : 0) + (dm.nreCost < 50 ? 2 : 0))), max: 10 },
    { label: 'Commercial Attractiveness', score: Math.round(Math.min(10, (snap.grossMargin > 60 ? 5 : snap.grossMargin > 35 ? 3 : 1) + (snap.lifetimeNetProfitMillion > 200 ? 3 : snap.lifetimeNetProfitMillion > 0 ? 1 : 0) + (dm.asp > 500 ? 2 : 0))), max: 10 },
    { label: 'Program Confidence', score: Math.round(Math.min(10, (snap.grossMargin > 40 ? 3 : 1) + (snap.roi > 30 ? 3 : 1) + (snap.breakEvenVolumeMillion < 3 ? 4 : 2))), max: 10 },
    { label: 'Supply Chain Resilience', score: Math.round(Math.min(10, 10 - Math.round(snap.supplyChain.compositeRiskScore / 10))), max: 10 },
    { label: 'Schedule Confidence', score: Math.round(Math.min(10, (dm.packagingYield > 97 ? 3 : 1) + (dm.testYield > 97 ? 3 : 1) + (snap.breakEvenVolumeMillion < 4 ? 4 : 2))), max: 10 },
  ];
}

function addPageHeader(doc: jsPDF, title: string, subtitle?: string, pageNum?: number) {
  const [, , , tr, tg, tb] = [0, 0, 0, ...parseRgb(COLORS.text)];
  const [ar, ag, ab] = parseRgb(COLORS.accent);
  doc.setFillColor(...parseRgb(COLORS.bg));
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(ar, ag, ab);
  doc.text('SILICONOMICS', MARGIN, 15);
  doc.setFontSize(14);
  doc.setTextColor(tr, tg, tb);
  doc.text(title, MARGIN, 28);
  if (subtitle) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...parseRgb(COLORS.muted));
    doc.text(subtitle, MARGIN, 35);
  }
  if (pageNum !== undefined) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...parseRgb(COLORS.muted));
    doc.text(`Page ${pageNum}`, PAGE_W - MARGIN - 10, 15);
  }
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 38, PAGE_W - MARGIN, 38);
}

function addTable(doc: jsPDF, cols: { label: string; w: number }[], rows: string[][], startY: number, pageNum: number): number {
  const [ar, ag, ab] = parseRgb(COLORS.accent);
  const [tr, tg, tb] = parseRgb(COLORS.text);
  let y = startY;
  let pn = pageNum;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(ar, ag, ab);
  let cx = MARGIN;
  for (const col of cols) {
    doc.text(col.label, cx, y);
    cx += col.w;
  }
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
  y += 6;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(tr, tg, tb);
  for (const row of rows) {
    if (y > PAGE_H - 20) {
      doc.addPage();
      addPageHeader(doc, 'Board Packet (continued)', undefined, ++pn);
      y = 42;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(ar, ag, ab);
      cx = MARGIN;
      for (const col of cols) {
        doc.text(col.label, cx, y);
        cx += col.w;
      }
      doc.setDrawColor(ar, ag, ab);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
      y += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(tr, tg, tb);
    }
    cx = MARGIN;
    for (let vi = 0; vi < row.length; vi++) {
      doc.text(row[vi] ?? '', cx, y);
      cx += cols[vi]!.w;
    }
    y += 5;
  }
  return y;
}

function startPage(doc: jsPDF, pageNum: number, title: string, subtitle?: string) {
  doc.addPage();
  addPageHeader(doc, title, subtitle, pageNum);
}

export function generateConsolidatedAudit(
  builds: Build[],
  decisions: Decision[]
): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const [br, bg, bc] = parseRgb(COLORS.bg);
  const [tr, tg, tb] = parseRgb(COLORS.text);
  const [ar, ag, ab] = parseRgb(COLORS.accent);
  const [mr, mg, mb] = parseRgb(COLORS.muted);

  let pageNum = 1;

  // ──────────────────────────────────────────────
  // 1. COVER PAGE (page 1, no addPageHeader)
  // ──────────────────────────────────────────────
  doc.setFillColor(br, bg, bc);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(ar, ag, ab);
  doc.text('SILICONOMICS', MARGIN, 70);
  doc.setFontSize(32);
  doc.setTextColor(tr, tg, tb);
  doc.text('Board Packet', MARGIN, 90);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(mr, mg, mb);
  doc.text('Executive Decision Package — Build Portfolio Review', MARGIN, 105);
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, 120);
  doc.text(`Document ID: SIL-BP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`, MARGIN, 128);
  doc.text(`Classification: Confidential — Executive Review Only`, MARGIN, 136);

  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 150, PAGE_W - MARGIN, 150);

  const pendingBuilds = builds.filter(b => b.status === 'TechnicalReview' || b.status === 'FinancialReview' || b.status === 'ProgramReview');
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mr, mg, mb);
  doc.text(`Builds Under Review: ${builds.length} total  |  ${pendingBuilds.length} pending decision`, MARGIN, 165);
  doc.text(`Decisions Recorded: ${decisions.length}`, MARGIN, 173);
  doc.text(`Prepared for: Executive Committee`, MARGIN, 181);

  doc.setFontSize(7);
  doc.setTextColor(mr, mg, mb);
  doc.text('THIS DOCUMENT CONTAINS CONFIDENTIAL AND PROPRIETARY INFORMATION.', MARGIN, PAGE_H - 20);
  doc.text('DO NOT DISTRIBUTE WITHOUT AUTHORIZATION.', MARGIN, PAGE_H - 15);

  // ──────────────────────────────────────────────
  // 2. EXECUTIVE SUMMARY
  // ──────────────────────────────────────────────
  pageNum++;
  startPage(doc, pageNum, 'Executive Summary', 'Portfolio overview and key highlights');

  let y = 44;
  let totalNre = 0;
  let totalNetProfit = 0;
  let totalRevenue = 0;
  for (const b of builds) {
    try {
      const snap = computeBuildMetrics(b).snapshot;
      totalNre += b.designModel.nreCost;
      totalNetProfit += snap.lifetimeNetProfitMillion;
      totalRevenue += snap.lifetimeRevenueMillion;
    } catch { /* skip invalid */ }
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(tr, tg, tb);
  doc.text('PORTFOLIO AT A GLANCE', MARGIN, y);
  y += 7;

  const summaryItems: [string, string, string][] = [
    ['Total Builds in Portfolio', builds.length.toString(), ''],
    ['Pending Executive Decision', pendingBuilds.length.toString(), pendingBuilds.length > 0 ? 'ACTION REQUIRED' : 'None'],
    ['Total NRE at Stake', `$${totalNre.toFixed(0)}M`, 'Combined non-recurring engineering investment'],
    ['Total Projected Revenue', `$${totalRevenue.toFixed(0)}M`, 'Lifetime revenue across all builds'],
    ['Total Projected Net Profit', `$${totalNetProfit.toFixed(0)}M`, totalNetProfit >= 0 ? 'Positive portfolio outlook' : 'Portfolio in deficit'],
    ['Decisions on Record', decisions.length.toString(), 'Historical executive actions'],
  ];

  for (const [label, value, note] of summaryItems) {
    if (y > PAGE_H - 30) { startPage(doc, ++pageNum, 'Executive Summary (continued)'); y = 44; }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(mr, mg, mb);
    doc.text(label.toUpperCase(), MARGIN, y);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(tr, tg, tb);
    doc.text(value, MARGIN, y + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(mr, mg, mb);
    doc.text(note, MARGIN + 50, y + 5);
    y += 12;
  }

  y += 3;
  if (pendingBuilds.length > 0) {
    if (y > PAGE_H - 40) { startPage(doc, ++pageNum, 'Executive Summary (continued)'); y = 44; }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(ar, ag, ab);
    doc.text('BUILDS PENDING EXECUTIVE DECISION', MARGIN, y);
    y += 7;
    for (const pb of pendingBuilds) {
      if (y > PAGE_H - 20) { startPage(doc, ++pageNum, 'Executive Summary (continued)'); y = 44; }
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(tr, tg, tb);
      doc.text(`  •  ${pb.name} v${pb.version} — ${pb.status} (${pb.designModel.processNode}, ${pb.designModel.topology})`, MARGIN, y);
      y += 5;
    }
  }

  // ──────────────────────────────────────────────
  // 3. PER-BUILD DETAIL PAGES
  // ──────────────────────────────────────────────
  for (const b of builds) {
    let snap: Snapshot;
    try { snap = computeBuildMetrics(b).snapshot; } catch { continue; }

    // ── 3a. Build Profile + Design Summary ──
    pageNum++;
    startPage(doc, pageNum, `Build Profile: ${b.name}`, `v${b.version}  |  ${b.status}`);
    y = 44;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(mr, mg, mb);
    doc.text('PROGRAM INFORMATION', MARGIN, y);
    y += 6;
    const profileRows = [
      ['Build Name', b.name, 'Status', b.status],
      ['Version', b.version, 'Owner', b.owner],
      ['Portfolio', b.portfolio, 'Organization', b.organization],
      ['Created', b.createdDate ? b.createdDate.slice(0, 10) : '—', 'Description', b.description || '—'],
    ];
    for (const [l1, v1, l2, v2] of profileRows) {
      if (y > PAGE_H - 25) { startPage(doc, ++pageNum, `${b.name} — Build Profile (continued)`); y = 44; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(mr, mg, mb);
      doc.text(l1!.toUpperCase(), MARGIN, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(tr, tg, tb);
      doc.text(v1!, MARGIN + 35, y);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(mr, mg, mb);
      doc.text(l2!.toUpperCase(), MARGIN + 90, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(tr, tg, tb);
      doc.text(v2!, MARGIN + 125, y);
      y += 7;
    }

    y += 3;
    if (y > PAGE_H - 40) { startPage(doc, ++pageNum, `${b.name} — Design Summary`); y = 44; }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(mr, mg, mb);
    doc.text('DESIGN PARAMETERS', MARGIN, y);
    y += 6;
    const dm = b.designModel;
    const designRows: [string, string][] = [
      ['Process Node', dm.processNode],
      ['Topology', dm.topology + (dm.chipletCount > 1 ? ` (${dm.chipletCount} chiplets)` : '')],
      ['Die Area', `${dm.dieArea} mm²` + (dm.ioDieArea ? `  |  IO: ${dm.ioDieArea} mm²` : '')],
      ['Transistor Count', `${dm.transistorCount}B`],
      ['Transistor Density', `${(dm.transistorCount * 1000 / (dm.dieArea + (dm.ioDieArea || 0))).toFixed(1)} MTr/mm²`],
      ['TDP', `${dm.tdp} W` + ` (${(dm.tdp / dm.dieArea).toFixed(1)} W/mm²)`],
      ['Foundry', dm.foundry.toUpperCase()],
      ['Packaging', `${dm.packagingType}  |  Yield: ${dm.packagingYield}%`],
      ['Defect Density (D0)', `${dm.defectDensity} defects/cm²`],
    ];
    for (const [label, value] of designRows) {
      if (y > PAGE_H - 20) { startPage(doc, ++pageNum, `${b.name} — Design Summary (continued)`); y = 44; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(mr, mg, mb);
      doc.text(label, MARGIN, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(tr, tg, tb);
      doc.text(value, MARGIN + 55, y);
      y += 5;
    }

    // ── 3b. Financial Summary ──
    y += 3;
    if (y > PAGE_H - 50) { startPage(doc, ++pageNum, `${b.name} — Financial Summary`); y = 44; }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(mr, mg, mb);
    doc.text('FINANCIAL SUMMARY', MARGIN, y);
    y += 6;
    const finRows = [
      ['Wafer Cost', `$${dm.waferCost}`, 'NRE Budget', `$${dm.nreCost}M`],
      ['ASP', `$${dm.asp}`, 'Target Volume', `${dm.targetVolume}M units`],
      ['Raw Die Cost', `$${snap.rawDieCost.toFixed(2)}`, 'Fully Loaded Cost', `$${snap.fullyLoadedCostPerDie.toFixed(2)}`],
      ['Gross Margin', `${snap.grossMargin.toFixed(1)}%`, 'Operating Margin', `${snap.operatingMargin.toFixed(1)}%`],
      ['ROI', `${snap.roi.toFixed(1)}%`, 'Break-Even Volume', `${snap.breakEvenVolumeMillion.toFixed(2)}M`],
      ['Lifetime Revenue', `$${snap.lifetimeRevenueMillion.toFixed(0)}M`, 'Lifetime COGS', `$${snap.lifetimeCOGSMillion.toFixed(0)}M`],
      ['Gross Profit', `$${snap.lifetimeGrossProfitMillion.toFixed(0)}M`, 'Net Profit', `$${snap.lifetimeNetProfitMillion.toFixed(0)}M`],
    ];
    for (const [l1, v1, l2, v2] of finRows) {
      if (y > PAGE_H - 20) { startPage(doc, ++pageNum, `${b.name} — Financial Summary (continued)`); y = 44; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(mr, mg, mb);
      doc.text(l1!.toUpperCase(), MARGIN, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(tr, tg, tb);
      doc.text(v1!, MARGIN + 40, y);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(mr, mg, mb);
      doc.text(l2!.toUpperCase(), MARGIN + 95, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(tr, tg, tb);
      doc.text(v2!, MARGIN + 140, y);
      y += 6;
    }

    // ── 3c. Cost Waterfall ──
    pageNum++;
    startPage(doc, pageNum, `${b.name} — Cost Waterfall`, 'Per-unit cost breakdown ($)');
    y = 44;

    const sorted = [...snap.costContributors].sort((a, b) => b.costPerUnit - a.costPerUnit);
    const maxCost = sorted.length > 0 ? sorted[0]!.costPerUnit : 1;
    const barMaxW = 120;
    for (const c of sorted) {
      if (y > PAGE_H - 20) { startPage(doc, ++pageNum, `${b.name} — Cost Waterfall (continued)`); y = 44; }
      const barW = (c.costPerUnit / maxCost) * barMaxW;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(tr, tg, tb);
      doc.text(c.name, MARGIN, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(mr, mg, mb);
      doc.text(`$${c.costPerUnit.toFixed(4)}`, MARGIN + 55, y);
      doc.text(`(${c.percentageOfTotal.toFixed(1)}%)`, MARGIN + 75, y);
      doc.setFillColor(ar, ag, ab);
      doc.rect(MARGIN + 90, y - 2, barW, 3, 'F');
      y += 6;
    }

    // ── 3d. Architecture Blocks ──
    if (b.architecture?.blocks && b.architecture.blocks.length > 0) {
      pageNum++;
      startPage(doc, pageNum, `${b.name} — Architecture Composition`, 'Block-level breakdown');
      y = 44;
      const blkCols = [
        { label: 'Block', w: 35 },
        { label: 'Category', w: 18 },
        { label: 'Area (mm²)', w: 18 },
        { label: 'Power (W)', w: 16 },
        { label: 'Risk', w: 14 },
        { label: 'Imp.', w: 14 },
        { label: 'NRE ($M)', w: 16 },
        { label: 'Royalty ($)', w: 16 },
        { label: 'Sch. (wk)', w: 14 },
        { label: 'Criticality', w: 18 },
      ];
      const blkRows = b.architecture.blocks.map(blk => [
        blk.name,
        blk.category,
        `${blk.estimatedAreaMm2}`,
        blk.estimatedPowerW?.toString() ?? '—',
        blk.supplyChainRisk,
        blk.implementation === 'internal' ? 'Int' : blk.implementation === 'licensed' ? 'Lic' : blk.implementation === 'custom' ? 'Cus' : 'OS',
        blk.nreImpactM ? blk.nreImpactM.toString() : '—',
        blk.royaltyPerUnit ? blk.royaltyPerUnit.toString() : '—',
        blk.scheduleImpactWeeks?.toString() ?? '—',
        blk.manufacturingCriticality,
      ]);
      y = addTable(doc, blkCols, blkRows, y, pageNum) + 5;
      if (y > PAGE_H - 25) { startPage(doc, ++pageNum, `${b.name} — Architecture Notes`); y = 44; }
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(mr, mg, mb);
      doc.text(`Composition version: ${b.architecture.version || '—'}`, MARGIN, y);
      if (b.architecture.rationale) { y += 5; doc.text(`Rationale: ${b.architecture.rationale}`, MARGIN, y); }
    }

    // ── 3e. Executive Scorecard ──
    pageNum++;
    startPage(doc, pageNum, `${b.name} — Executive Scorecard`, '7-dimension build assessment (0–10)');
    y = 44;

    const scores = computeScorecardScore(snap, b.designModel);
    const scCols = [
      { label: 'Dimension', w: 55 },
      { label: 'Score', w: 15 },
      { label: 'Max', w: 12 },
      { label: 'Status', w: 18 },
      { label: 'Rating', w: 65 },
    ];
    const scRows = scores.map(s => {
      const status = s.score >= 7 ? 'PASS' : s.score >= 4 ? 'WARN' : 'FAIL';
      const rating = s.score >= 9 ? 'Excellent' : s.score >= 7 ? 'Good' : s.score >= 5 ? 'Adequate' : s.score >= 3 ? 'Concerning' : 'Critical';
      return [s.label, s.score.toString(), s.max.toString(), status, rating];
    });
    y = addTable(doc, scCols, scRows, y, pageNum);

    y += 3;
    for (const s of scores) {
      if (y > PAGE_H - 15) { startPage(doc, ++pageNum, `${b.name} — Scorecard (continued)`); y = 44; }
      const pct = (s.score / s.max);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(mr, mg, mb);
      doc.text(s.label, MARGIN, y);
      doc.setFillColor(pct >= 0.7 ? ar : pct >= 0.4 ? 255 : 255, pct >= 0.7 ? ag : pct >= 0.4 ? 200 : 100, pct >= 0.7 ? ab : pct >= 0.4 ? 0 : 0);
      doc.rect(MARGIN + 55, y - 2, pct * 65, 4, 'F');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(tr, tg, tb);
      doc.text(`${s.score}/${s.max}`, MARGIN + 55 + pct * 65 + 2, y);
      y += 7;
    }

    // ── 3f. Risk Dashboard ──
    pageNum++;
    startPage(doc, pageNum, `${b.name} — Risk Dashboard`, 'Multi-category risk exposure analysis');
    y = 44;

    const dieYieldPct = snap.dieYield * 100;
    const riskDimensions = [
      { label: 'Manufacturing Risk', value: dieYieldPct < 50 ? 'HIGH' : dieYieldPct < 75 ? 'MODERATE' : 'LOW', detail: `Die Yield: ${dieYieldPct.toFixed(1)}% | DPW: ${snap.dpw} | Defect Density: ${dm.defectDensity}` },
      { label: 'Financial Risk', value: snap.grossMargin < 20 ? 'HIGH' : snap.grossMargin < 40 ? 'MODERATE' : 'LOW', detail: `Margin: ${snap.grossMargin.toFixed(1)}% | ROI: ${snap.roi.toFixed(1)}% | BE Vol: ${snap.breakEvenVolumeMillion.toFixed(2)}M` },
      { label: 'Supply Chain Risk', value: snap.supplyChain.riskLevel.toUpperCase(), detail: `Score: ${snap.supplyChain.compositeRiskScore} | Supplier: ${snap.supplyChain.supplierConcentrationScore.toFixed(0)}% | Geo: ${snap.supplyChain.geopoliticalRiskScore.toFixed(0)}%` },
      { label: 'Technology Risk', value: dm.defectDensity > 0.3 ? 'ELEVATED' : 'NOMINAL', detail: `Node: ${dm.processNode} | Topology: ${dm.topology} | D0: ${dm.defectDensity}` },
      { label: 'Packaging Risk', value: dm.packagingYield < 95 ? 'ELEVATED' : 'NOMINAL', detail: `Type: ${dm.packagingType} | Yield: ${dm.packagingYield}% | Test Yield: ${dm.testYield}%` },
      { label: 'Program Risk', value: snap.roi < 20 ? 'HIGH' : snap.roi < 50 ? 'MODERATE' : 'LOW', detail: `ROI: ${snap.roi.toFixed(1)}% | Margin: ${snap.grossMargin.toFixed(1)}% | BE: ${snap.breakEvenVolumeMillion.toFixed(2)}M` },
    ];

    for (const rd of riskDimensions) {
      if (y > PAGE_H - 25) { startPage(doc, ++pageNum, `${b.name} — Risk Dashboard (continued)`); y = 44; }
      const isHigh = rd.value === 'HIGH' || rd.value === 'ELEVATED' || rd.value === 'CRITICAL';
      const isMod = rd.value === 'MODERATE';
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(mr, mg, mb);
      doc.text(rd.label.toUpperCase(), MARGIN, y);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(isHigh ? 255 : isMod ? 255 : ar, isHigh ? 80 : isMod ? 200 : ag, isHigh ? 80 : isMod ? 0 : ab);
      doc.text(rd.value, MARGIN + 55, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(mr, mg, mb);
      doc.text(rd.detail, MARGIN, y + 5);
      y += 11;
    }

    // ── 3g. Supply Chain Deep Dive ──
    y += 2;
    if (y > PAGE_H - 40) { startPage(doc, ++pageNum, `${b.name} — Supply Chain Analysis`); y = 44; }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(mr, mg, mb);
    doc.text('SUPPLY CHAIN ANALYSIS', MARGIN, y);
    y += 6;
    const scItems: [string, string][] = [
      ['Composite Risk Score', `${snap.supplyChain.compositeRiskScore}/100`],
      ['Risk Level', snap.supplyChain.riskLevel.toUpperCase()],
      ['Risk-Adjusted Cost Adder', `$${snap.supplyChain.riskAdjustedCostAdder.toFixed(2)}/wafer`],
      ['Supplier Concentration', `${snap.supplyChain.supplierConcentrationScore.toFixed(1)}%`],
      ['Geopolitical Exposure', `${snap.supplyChain.geopoliticalRiskScore.toFixed(1)}%`],
      ['Lead Time Volatility', `${snap.supplyChain.leadTimeVolatilityScore.toFixed(1)}%`],
      ['High-Risk Blocks', `${snap.supplyChain.highRiskBlockCount} / ${snap.supplyChain.totalBlockCount}`],
    ];
    for (const [label, value] of scItems) {
      if (y > PAGE_H - 20) { startPage(doc, ++pageNum, `${b.name} — Supply Chain (continued)`); y = 44; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(mr, mg, mb);
      doc.text(label, MARGIN, y);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(tr, tg, tb);
      doc.text(value, MARGIN + 55, y);
      y += 5;
    }

    // ── 3h. Executive Recommendation ──
    pageNum++;
    startPage(doc, pageNum, `${b.name} — Executive Recommendation`, 'Automated decision analysis');
    y = 44;

    const rec = evaluateBuild(snap, b.designModel);

    const outcomeColors: Record<string, [number, number, number]> = {
      'Proceed': [0, 191, 166],
      'Proceed with Risk': [255, 200, 0],
      'Requires Investigation': [255, 165, 0],
      'Hold': [255, 100, 50],
      'Reject': [255, 50, 50],
    };
    const oc = outcomeColors[rec.outcome] ?? [mr, mg, mb];

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(mr, mg, mb);
    doc.text('RECOMMENDATION', MARGIN, y);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...oc);
    doc.text(rec.outcome, MARGIN, y + 8);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(tr, tg, tb);
    doc.text(`Confidence: ${rec.confidence.toFixed(0)}%`, MARGIN + 60, y + 8);
    y += 15;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mr, mg, mb);
    const summaryLines = doc.splitTextToSize(rec.summary, CONTENT_W);
    for (const line of summaryLines) {
      if (y > PAGE_H - 20) { startPage(doc, ++pageNum, `${b.name} — Recommendation (continued)`); y = 44; }
      doc.text(line, MARGIN, y);
      y += 4;
    }

    y += 4;
    if (rec.supportingEvidence.length > 0) {
      if (y > PAGE_H - 30) { startPage(doc, ++pageNum, `${b.name} — Recommendation (continued)`); y = 44; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(ar, ag, ab);
      doc.text('SUPPORTING EVIDENCE', MARGIN, y);
      y += 5;
      for (const ev of rec.supportingEvidence) {
        if (y > PAGE_H - 15) { startPage(doc, ++pageNum, `${b.name} — Recommendation (continued)`); y = 44; }
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(tr, tg, tb);
        doc.text(`  ✓  ${ev}`, MARGIN, y);
        y += 4;
      }
      y += 3;
    }

    if (rec.riskFactors.length > 0) {
      if (y > PAGE_H - 30) { startPage(doc, ++pageNum, `${b.name} — Recommendation (continued)`); y = 44; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 100, 100);
      doc.text('RISK FACTORS', MARGIN, y);
      y += 5;
      for (const rf of rec.riskFactors) {
        if (y > PAGE_H - 15) { startPage(doc, ++pageNum, `${b.name} — Recommendation (continued)`); y = 44; }
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(tr, tg, tb);
        doc.text(`  ✗  ${rf}`, MARGIN, y);
        y += 4;
      }
    }

    // ── 3i. Key Metrics Detail ──
    pageNum++;
    startPage(doc, pageNum, `${b.name} — Key Metrics Detail`, 'All computed metrics by category');
    y = 44;

    const categories = [
      { key: 'engineering', label: 'ENGINEERING' },
      { key: 'manufacturing', label: 'MANUFACTURING' },
      { key: 'financial', label: 'FINANCIAL' },
      { key: 'program', label: 'PROGRAM' },
      { key: 'commercial', label: 'COMMERCIAL' },
    ];
    for (const cat of categories) {
      const catMetrics = snap.metricsList.filter(m => m.category === cat.key);
      if (catMetrics.length === 0) continue;
      if (y > PAGE_H - 30) { startPage(doc, ++pageNum, `${b.name} — Metrics (continued)`); y = 44; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(ar, ag, ab);
      doc.text(cat.label, MARGIN, y);
      y += 5;
      for (const m of catMetrics) {
        if (y > PAGE_H - 15) { startPage(doc, ++pageNum, `${b.name} — Metrics (continued)`); y = 44; }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(tr, tg, tb);
        doc.text(m.label, MARGIN, y);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(mr, mg, mb);
        const valStr = `${m.value} ${m.unit}`;
        doc.text(valStr, MARGIN + 60, y);
        if (m.delta && m.delta.value) {
          doc.setTextColor(m.delta.type === 'positive' ? ar : m.delta.type === 'negative' ? 255 : mr, m.delta.type === 'positive' ? ag : m.delta.type === 'negative' ? 100 : mg, m.delta.type === 'positive' ? ab : m.delta.type === 'negative' ? 100 : mb);
          doc.text(m.delta.value, MARGIN + 100, y);
        }
        y += 4.5;
      }
      y += 2;
    }
  }

  // ──────────────────────────────────────────────
  // 4. DECISION HISTORY
  // ──────────────────────────────────────────────
  if (decisions.length > 0) {
    pageNum++;
    startPage(doc, pageNum, 'Decision History', 'Full record of executive decisions');
    y = 44;

    const dcols = [
      { label: 'Date', w: 22 },
      { label: 'Builds', w: 30 },
      { label: 'Outcome', w: 28 },
      { label: 'Approver', w: 22 },
      { label: 'Rationale', w: 68 },
    ];
    const dRows = decisions.map(d => [
      d.timestamp.slice(0, 10),
      d.buildIds.join(', '),
      d.outcome,
      d.approver,
      (d.rationale || '').length > 55 ? (d.rationale || '').slice(0, 55) + '...' : (d.rationale || ''),
    ]);
    y = addTable(doc, dcols, dRows, y, pageNum);

    y += 3;
    for (const d of decisions) {
      if (d.followUpActions && d.followUpActions.length > 0) {
        if (y > PAGE_H - 30) { startPage(doc, ++pageNum, 'Decision History (continued)'); y = 44; }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(mr, mg, mb);
        doc.text(`Follow-up: ${d.outcome} — ${d.approver}`, MARGIN, y);
        y += 4;
        for (const action of d.followUpActions) {
          if (y > PAGE_H - 15) break;
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(tr, tg, tb);
          doc.text(`  → ${action}`, MARGIN, y);
          y += 4;
        }
        y += 2;
      }
    }
  }

  // ──────────────────────────────────────────────
  // 5. SIGN-OFF PAGE
  // ──────────────────────────────────────────────
  pageNum++;
  startPage(doc, pageNum, 'Sign-Off & Approval', 'Executive committee resolution');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mr, mg, mb);
  const resolutionLines = [
    'This Board Packet summarizes the complete technical, financial, and programmatic analysis',
    'of the semiconductor builds under review. The Executive Committee is called upon to render',
    'a decision for each build marked as pending review.',
  ];
  y = 48;
  for (const line of resolutionLines) {
    doc.text(line, MARGIN, y);
    y += 5;
  }

  y += 10;
  const sigBlocks = [
    { title: 'Chief Executive Officer', name: '__________________________' },
    { title: 'Chief Technology Officer', name: '__________________________' },
    { title: 'Chief Financial Officer', name: '__________________________' },
    { title: 'VP, Engineering', name: '__________________________' },
    { title: 'VP, Operations', name: '__________________________' },
  ];

  for (const sb of sigBlocks) {
    if (y > PAGE_H - 40) break;
    doc.setDrawColor(mr, mg, mb);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + 80, y);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(tr, tg, tb);
    doc.text(sb.name, MARGIN, y - 2);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(mr, mg, mb);
    doc.text(sb.title, MARGIN, y - 7);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(mr, mg, mb);
    doc.text('Date: _______________', MARGIN + 90, y - 2);
    y += 18;
  }

  y += 5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(mr, mg, mb);
  doc.text('DOCUMENT CONTROL', MARGIN, y);
  y += 5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mr, mg, mb);
  doc.text(`Document ID: SIL-BP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`, MARGIN, y);
  y += 4;
  doc.text(`Generated: ${new Date().toISOString()}`, MARGIN, y);
  y += 4;
  doc.text(`Classification: Confidential — Executive Review Only`, MARGIN, y);
  y += 4;
  doc.text(`This document is electronically generated. Signature blocks indicate approval intent.`, MARGIN, y);

  return doc;
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

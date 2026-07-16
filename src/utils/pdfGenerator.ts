import { jsPDF } from 'jspdf';
import { Build, MetricCardData, CostContributor, ArchitectureBlock, SupplyChainSnapshot, Snapshot, Decision } from '../types';

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

export function generateConsolidatedAudit(
  builds: Build[],
  decisions: Decision[]
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

  doc.setFontSize(24);
  doc.setTextColor(tr, tg, tb);
  doc.text('Consolidated Audit Report', MARGIN, 95);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(mr, mg, mb);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, MARGIN, 110);
  doc.text(`Builds: ${builds.length}  |  Decisions: ${decisions.length}`, MARGIN, 118);

  doc.addPage();
  doc.setFillColor(br, bg, bc);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(tr, tg, tb);
  doc.text('Build Register', MARGIN, 25);

  const bcols = [
    { label: 'Name', w: 40 },
    { label: 'Version', w: 15 },
    { label: 'Node', w: 15 },
    { label: 'Status', w: 18 },
    { label: 'Die', w: 18 },
    { label: 'Wafer $', w: 18 },
    { label: 'ASP', w: 18 },
    { label: 'Vol (M)', w: 20 },
  ];

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(ar, ag, ab);
  let cx = MARGIN;
  for (const col of bcols) {
    doc.text(col.label, cx, 35);
    cx += col.w;
  }
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 37, PAGE_W - MARGIN, 37);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(tr, tg, tb);
  let rowY = 43;
  for (const b of builds) {
    if (rowY > PAGE_H - 20) break;
    cx = MARGIN;
    const vals = [b.name, b.version, b.designModel.processNode, b.status, `${b.designModel.dieArea} mm²`, `$${b.designModel.waferCost}`, `$${b.designModel.asp}`, b.designModel.targetVolume.toString()];
    for (let vi = 0; vi < vals.length; vi++) {
      doc.text(vals[vi]!, cx, rowY);
      cx += bcols[vi]!.w;
    }
    rowY += 5;
  }

  if (decisions.length > 0) {
    doc.addPage();
    doc.setFillColor(br, bg, bc);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(tr, tg, tb);
    doc.text('Decision History', MARGIN, 25);

    const dcols = [
      { label: 'Builds', w: 35 },
      { label: 'Outcome', w: 30 },
      { label: 'Approver', w: 25 },
      { label: 'Date', w: 20 },
      { label: 'Rationale', w: 55 },
    ];

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(ar, ag, ab);
    cx = MARGIN;
    for (const col of dcols) {
      doc.text(col.label, cx, 35);
      cx += col.w;
    }
    doc.setDrawColor(ar, ag, ab);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 37, PAGE_W - MARGIN, 37);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(tr, tg, tb);
    rowY = 43;
    for (const d of decisions) {
      if (rowY > PAGE_H - 20) break;
      cx = MARGIN;
      const rationale = d.rationale || '';
      const vals = [d.buildIds.join(', '), d.outcome, d.approver, d.timestamp.slice(0, 10), rationale.length > 60 ? rationale.slice(0, 60) + '...' : rationale];
      for (let vi = 0; vi < vals.length; vi++) {
        doc.text(vals[vi]!, cx, rowY);
        cx += dcols[vi]!.w;
      }
      rowY += 5;
    }
  }

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
    if (rowY > PAGE_H - 60 || true) {
      doc.addPage();
      doc.setFillColor(br, bg, bc);
      doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
      rowY = 25;
    }
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

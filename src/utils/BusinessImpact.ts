import { Build, Snapshot } from '../types';

export interface BusinessImpact {
  category: 'engineering' | 'manufacturing' | 'financial' | 'program';
  severity: 'positive' | 'negative' | 'neutral';
  metric: string;
  delta: string;
  narrative: string;
}

function fmt(num: number): string {
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}

function pct(num: number): string {
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
}

function deltaPct(a: number, b: number): string {
  if (a === 0) return 'N/A';
  return pct(((b - a) / a) * 100);
}

function deltaAbs(a: number, b: number): string {
  const diff = b - a;
  return `${diff >= 0 ? '+' : ''}${fmt(diff)}`;
}

export function computeBusinessImpact(
  buildA: Build,
  snapA: Snapshot,
  buildB: Build,
  snapB: Snapshot,
): BusinessImpact[] {
  const dmA = buildA.designModel;
  const dmB = buildB.designModel;
  const impacts: BusinessImpact[] = [];
  const sev = (a: number, b: number, worseWhenHigher: boolean): 'positive' | 'negative' | 'neutral' => {
    const diff = b - a;
    if (Math.abs(diff) < 0.001) return 'neutral';
    return worseWhenHigher ? (diff < 0 ? 'positive' : 'negative') : (diff > 0 ? 'positive' : 'negative');
  };

  // ── Engineering ──

  if (dmA.processNode !== dmB.processNode) {
    impacts.push({
      category: 'engineering',
      severity: 'neutral',
      metric: 'Process Node Migration',
      delta: `${dmA.processNode} → ${dmB.processNode}`,
      narrative: `Migrating from ${dmA.processNode} to ${dmB.processNode} fundamentally alters transistor density targets, leakage profiles, and mask complexity. This node shift redefines the program's competitive positioning and cost structure at the lithography level.`,
    });
  }

  if (dmA.topology !== dmB.topology) {
    impacts.push({
      category: 'engineering',
      severity: dmB.topology === 'chiplet' ? 'positive' : 'negative',
      metric: 'Topology Architecture Shift',
      delta: `${dmA.topology} → ${dmB.topology}`,
      narrative: dmB.topology === 'chiplet'
        ? `Adopting a chiplet architecture decomposes the design into smaller, higher-yielding dies, reducing reticle-limit risk and improving overall silicon utilization at the cost of advanced packaging complexity.`
        : `Consolidating to a monolithic die simplifies packaging and assembly but concentrates defect risk into a single larger silicon area, increasing yield sensitivity to defect density.`,
    });
  }

  const totalAreaA = snapA.totalDieArea;
  const totalAreaB = snapB.totalDieArea;
  if (Math.abs(totalAreaB - totalAreaA) > 1) {
    const s = sev(totalAreaA, totalAreaB, true);
    impacts.push({
      category: 'engineering',
      severity: s,
      metric: 'Total Silicon Area',
      delta: `${fmt(totalAreaA)} → ${fmt(totalAreaB)} mm² (${deltaAbs(totalAreaA, totalAreaB)} mm²)`,
      narrative: s === 'negative'
        ? `Die area increases by ${deltaAbs(totalAreaA, totalAreaB)} mm² (${deltaPct(totalAreaA, totalAreaB)}), reducing gross dies per wafer and driving up unit silicon cost. Each wafer now yields fewer gross die sites, placing downward pressure on margin.`
        : `Die area decreases by ${deltaAbs(totalAreaA, totalAreaB)} mm² (${deltaPct(totalAreaA, totalAreaB)}), increasing potential die sites per wafer and improving silicon cost efficiency.`,
    });
  }

  // ── Manufacturing ──

  if (Math.abs(dmB.defectDensity - dmA.defectDensity) > 0.001) {
    const s = sev(dmA.defectDensity, dmB.defectDensity, true);
    impacts.push({
      category: 'manufacturing',
      severity: s,
      metric: 'Defect Density (D0)',
      delta: `${dmA.defectDensity} → ${dmB.defectDensity} defects/cm²`,
      narrative: s === 'negative'
        ? `Defect density rises from ${dmA.defectDensity} to ${dmB.defectDensity} defects/cm², directly suppressing Murphy die yield. Even small D0 increases trigger exponential scrap cost growth at advanced nodes, elevating manufacturing risk.`
        : `Defect density improves from ${dmA.defectDensity} to ${dmB.defectDensity} defects/cm², directly enhancing Murphy die yield and reducing silicon scrap rates. This strengthens manufacturing reliability.`,
    });
  }

  if (Math.abs(dmB.packagingYield - dmA.packagingYield) > 0.1) {
    const s = sev(dmA.packagingYield, dmB.packagingYield, false);
    impacts.push({
      category: 'manufacturing',
      severity: s,
      metric: 'Packaging Yield',
      delta: `${dmA.packagingYield}% → ${dmB.packagingYield}%`,
      narrative: s === 'negative'
        ? `Packaging yield drops from ${dmA.packagingYield}% to ${dmB.packagingYield}%, increasing costly packaging rework and reducing the number of fully functional shipped units per wafer start.`
        : `Packaging yield rises from ${dmA.packagingYield}% to ${dmB.packagingYield}%, reducing per-unit packaging overhead and improving gross margin.`,
    });
  }

  if (Math.abs(dmB.testYield - dmA.testYield) > 0.1) {
    const s = sev(dmA.testYield, dmB.testYield, false);
    impacts.push({
      category: 'manufacturing',
      severity: s,
      metric: 'Electrical Test Yield',
      delta: `${dmA.testYield}% → ${dmB.testYield}%`,
      narrative: s === 'negative'
        ? `Test yield contracts from ${dmA.testYield}% to ${dmB.testYield}%, discarding a larger fraction of packaged parts at final electrical test. This directly adds to COGS without recovering wafer or packaging costs.`
        : `Test yield expands from ${dmA.testYield}% to ${dmB.testYield}%, increasing the proportion of electrically good units shipped and improving overall factory efficiency.`,
    });
  }

  // ── Financial ──

  if (Math.abs(dmB.waferCost - dmA.waferCost) > 1) {
    const s = sev(dmA.waferCost, dmB.waferCost, true);
    impacts.push({
      category: 'financial',
      severity: s,
      metric: 'Foundry Wafer Cost',
      delta: `$${dmA.waferCost.toLocaleString()} → $${dmB.waferCost.toLocaleString()}`,
      narrative: s === 'negative'
        ? `Wafer cost increases by $${(dmB.waferCost - dmA.waferCost).toLocaleString()} (${deltaPct(dmA.waferCost, dmB.waferCost)}), cascading directly into higher raw die cost and compressing gross margin unless offset by yield improvements.`
        : `Wafer cost decreases by $${(dmA.waferCost - dmB.waferCost).toLocaleString()} (${deltaPct(dmB.waferCost, dmA.waferCost)}), improving raw die cost structure and expanding margin headroom.`,
    });
  }

  if (Math.abs(dmB.nreCost - dmA.nreCost) > 0.5) {
    const s = sev(dmA.nreCost, dmB.nreCost, true);
    impacts.push({
      category: 'financial',
      severity: s,
      metric: 'Non-Recurring Engineering (NRE)',
      delta: `$${dmA.nreCost}M → $${dmB.nreCost}M`,
      narrative: s === 'negative'
        ? `NRE investment rises by $${(dmB.nreCost - dmA.nreCost).toFixed(1)}M to $${dmB.nreCost}M, raising the break-even volume threshold and extending the time to program profitability.`
        : `NRE investment falls by $${(dmA.nreCost - dmB.nreCost).toFixed(1)}M to $${dmB.nreCost}M, lowering the break-even barrier and accelerating time to profitability.`,
    });
  }

  if (Math.abs(dmB.asp - dmA.asp) > 0.5) {
    const s = sev(dmA.asp, dmB.asp, false);
    impacts.push({
      category: 'financial',
      severity: s,
      metric: 'Average Selling Price (ASP)',
      delta: `$${dmA.asp.toLocaleString()} → $${dmB.asp.toLocaleString()}`,
      narrative: s === 'positive'
        ? `ASP increases by $${(dmB.asp - dmA.asp).toLocaleString()} (${deltaPct(dmA.asp, dmB.asp)}), directly expanding gross margin per unit and improving revenue potential at any given volume.`
        : `ASP decreases by $${(dmA.asp - dmB.asp).toLocaleString()} (${deltaPct(dmB.asp, dmA.asp)}), compressing gross margin and requiring higher volume to achieve equivalent profit targets.`,
    });
  }

  // Derived financial impacts
  const marginDiff = snapB.grossMargin - snapA.grossMargin;
  if (Math.abs(marginDiff) > 0.5) {
    const s = sev(snapA.grossMargin, snapB.grossMargin, false);
    impacts.push({
      category: 'financial',
      severity: s,
      metric: 'Gross Margin',
      delta: `${snapA.grossMargin.toFixed(1)}% → ${snapB.grossMargin.toFixed(1)}%`,
      narrative: s === 'positive'
        ? `Gross margin expands by ${marginDiff.toFixed(1)}pp to ${snapB.grossMargin.toFixed(1)}%, reflecting a structurally more profitable program with greater resilience to volume fluctuation.`
        : `Gross margin contracts by ${Math.abs(marginDiff).toFixed(1)}pp to ${snapB.grossMargin.toFixed(1)}%, indicating a structurally thinner program that is more sensitive to wafer cost or yield volatility.`,
    });
  }

  const roiDiff = snapB.roi - snapA.roi;
  if (Math.abs(roiDiff) > 1) {
    const s = sev(snapA.roi, snapB.roi, false);
    impacts.push({
      category: 'financial',
      severity: s,
      metric: 'Return on Investment (ROI)',
      delta: `${snapA.roi.toFixed(1)}% → ${snapB.roi.toFixed(1)}%`,
      narrative: s === 'positive'
        ? `ROI improves by ${roiDiff.toFixed(1)}pp to ${snapB.roi.toFixed(1)}%, demonstrating meaningfully stronger capital efficiency and a more attractive risk-adjusted return profile.`
        : `ROI declines by ${Math.abs(roiDiff).toFixed(1)}pp to ${snapB.roi.toFixed(1)}%, signaling weaker capital efficiency and diminished risk-adjusted return relative to the baseline.`,
    });
  }

  const breakEvenDiff = snapB.breakEvenVolumeMillion - snapA.breakEvenVolumeMillion;
  if (Math.abs(breakEvenDiff) > 0.05) {
    const s = sev(snapA.breakEvenVolumeMillion, snapB.breakEvenVolumeMillion, true);
    impacts.push({
      category: 'financial',
      severity: s,
      metric: 'Break-Even Volume',
      delta: `${snapA.breakEvenVolumeMillion.toFixed(2)}M → ${snapB.breakEvenVolumeMillion.toFixed(2)}M units`,
      narrative: s === 'positive'
        ? `Break-even threshold drops by ${Math.abs(breakEvenDiff).toFixed(2)}M units to ${snapB.breakEvenVolumeMillion.toFixed(2)}M, meaning the program reaches profitability sooner with lower volume commitment.`
        : `Break-even threshold rises by ${breakEvenDiff.toFixed(2)}M units to ${snapB.breakEvenVolumeMillion.toFixed(2)}M, requiring significantly higher committed volume before the program becomes profitable.`,
    });
  }

  return impacts;
}

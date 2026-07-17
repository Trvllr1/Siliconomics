import { Build, Snapshot } from '../types';

export interface ExecutiveBriefing {
  summary: string;
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  supportingEvidence: string[];
}

function fmt(num: number): string {
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}

export function generateBriefing(build: Build, snap: Snapshot): ExecutiveBriefing {
  const dm = build.designModel;
  const findings: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];
  const evidence: string[] = [];

  const yieldPct = (snap.dieYield * 100).toFixed(1);
  const marginPct = snap.grossMargin.toFixed(1);
  const roiPct = snap.roi.toFixed(1);
  const breakEvenUnits = snap.breakEvenVolumeMillion.toFixed(2);

  findings.push(`${build.name} targets ${dm.processNode} ${dm.topology} with ${dm.transistorCount}B transistors across ${snap.totalDieArea} mm².`);
  findings.push(`Die yield at ${yieldPct}% with ${snap.dpw} dies per wafer.`);
  findings.push(`Gross margin ${marginPct}%, ROI ${roiPct}%, break-even at ${breakEvenUnits}M units.`);

  if (snap.dieYield < 0.6) {
    risks.push(`Die yield of ${yieldPct}% is below the 60% threshold, indicating elevated silicon scrap risk and compounding cost pressure per good unit.`);
  } else if (snap.dieYield >= 0.8) {
    opportunities.push(`Die yield of ${yieldPct}% significantly exceeds baseline, providing strong manufacturing cost advantage.`);
    evidence.push(`Die yield of ${yieldPct}% demonstrates mature process line performance.`);
  }

  if (snap.grossMargin < 25) {
    risks.push(`Gross margin of ${marginPct}% is critically thin, leaving minimal headroom for wafer cost escalation or ASP erosion.`);
  } else if (snap.grossMargin >= 50) {
    opportunities.push(`Gross margin of ${marginPct}% provides substantial buffer against cost volatility and competitive pricing pressure.`);
    evidence.push(`Gross margin of ${marginPct}% exceeds the 50% target, confirming strong unit economics.`);
  }

  if (snap.roi < 30) {
    risks.push(`ROI of ${roiPct}% is below the ${30}% minimum, suggesting marginal capital efficiency relative to NRE investment.`);
  } else if (snap.roi >= 60) {
    opportunities.push(`ROI of ${roiPct}% demonstrates exceptional capital efficiency, making this a high-return program.`);
    evidence.push(`ROI of ${roiPct}% confirms strong return on the ${dm.nreCost}M NRE investment.`);
  }

  if (snap.breakEvenVolumeMillion > 5) {
    risks.push(`Break-even volume of ${breakEvenUnits}M units exceeds the 5M ceiling, requiring substantial market commitment before profitability.`);
  } else if (snap.breakEvenVolumeMillion <= 2) {
    opportunities.push(`Low break-even volume of ${breakEvenUnits}M units enables rapid time-to-profitability with manageable market risk.`);
    evidence.push(`Break-even at ${breakEvenUnits}M units is well within the target range.`);
  }

  if (dm.defectDensity > 0.3) {
    risks.push(`Defect density of ${dm.defectDensity} defects/cm² exceeds the 0.3 threshold, increasing yield uncertainty at volume production.`);
  } else {
    evidence.push(`Defect density of ${dm.defectDensity} defects/cm² indicates a mature, controlled process line.`);
  }

  if (dm.packagingYield < 97 || dm.testYield < 97) {
    risks.push(`Packaging (${dm.packagingYield}%) or test yield (${dm.testYield}%) below 97%, adding downstream cost pressure.`);
  } else {
    opportunities.push(`Packaging yield (${dm.packagingYield}%) and test yield (${dm.testYield}%) both exceed 97%, indicating strong assembly quality.`);
  }

  if (snap.supplyChain.riskLevel === 'high' || snap.supplyChain.riskLevel === 'critical') {
    risks.push(`Supply chain risk rated ${snap.supplyChain.riskLevel} with ${snap.supplyChain.highRiskBlockCount} high-risk architecture blocks.`);
  }

  const netProfit = snap.lifetimeNetProfitMillion;
  if (netProfit > 0) {
    opportunities.push(`Program generates $${fmt(netProfit)} lifetime net profit, confirming commercial viability.`);
    evidence.push(`Lifetime net profit of $${fmt(netProfit)} validates the program's financial model.`);
  } else {
    risks.push(`Program shows negative lifetime net profit ($${fmt(netProfit)}), requiring fundamental restructuring.`);
  }

  const totalRisks = risks.length;
  let recommendation: string;
  if (totalRisks === 0) {
    recommendation = `${build.name} meets all critical thresholds. Proceed with full program investment. All financial and technical metrics are within acceptable ranges.`;
  } else if (totalRisks <= 2) {
    recommendation = `${build.name} meets most thresholds with ${totalRisks} manageable risk factor${totalRisks > 1 ? 's' : ''}. Proceed with targeted mitigation plans for identified risks.`;
  } else if (totalRisks <= 4) {
    recommendation = `${build.name} has ${totalRisks} risk factors requiring active management. Program may proceed conditionally with executive oversight and quarterly risk reviews.`;
  } else {
    recommendation = `${build.name} faces ${totalRisks} material risk factors. Recommend holding for remediation planning before proceeding to investment decision.`;
  }

  const metricSummary = `${build.name} (${dm.processNode}, ${dm.topology}): ${yieldPct}% yield | ${marginPct}% margin | ${roiPct}% ROI | ${breakEvenUnits}M BE | $${fmt(snap.lifetimeNetProfitMillion)} net profit`;

  return {
    summary: metricSummary,
    keyFindings: findings,
    risks,
    opportunities,
    recommendation,
    supportingEvidence: evidence,
  };
}

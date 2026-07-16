import { Snapshot, DecisionOutcome } from '../types';

export interface RecommendationDetail {
  outcome: DecisionOutcome;
  confidence: number;
  summary: string;
  supportingEvidence: string[];
  riskFactors: string[];
}

interface Thresholds {
  minDieYield: number;
  minGrossMargin: number;
  minRoi: number;
  maxBreakEvenVolumeMillion: number;
  maxDefectDensity: number;
}

const DEFAULT_THRESHOLDS: Thresholds = {
  minDieYield: 0.25,
  minGrossMargin: 20,
  minRoi: 30,
  maxBreakEvenVolumeMillion: 5,
  maxDefectDensity: 0.3,
};

export function evaluateBuild(
  snap: Snapshot,
  dm: { defectDensity: number; packagingYield: number; testYield: number },
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): RecommendationDetail {
  const evidence: string[] = [];
  const risks: string[] = [];
  let passCount = 0;
  let totalChecks = 0;

  // 1. Die Yield
  totalChecks++;
  if (snap.dieYield >= thresholds.minDieYield) {
    passCount++;
    evidence.push(`Die yield of ${(snap.dieYield * 100).toFixed(1)}% exceeds the ${(thresholds.minDieYield * 100).toFixed(0)}% minimum threshold.`);
  } else {
    risks.push(`Die yield of ${(snap.dieYield * 100).toFixed(1)}% falls below the ${(thresholds.minDieYield * 100).toFixed(0)}% minimum, indicating elevated silicon scrap risk.`);
  }

  // 2. Gross Margin
  totalChecks++;
  if (snap.grossMargin >= thresholds.minGrossMargin) {
    passCount++;
    evidence.push(`Gross margin of ${snap.grossMargin.toFixed(1)}% meets or exceeds the ${thresholds.minGrossMargin}% corporate threshold.`);
  } else {
    risks.push(`Gross margin of ${snap.grossMargin.toFixed(1)}% is below the ${thresholds.minGrossMargin}% target, indicating thin profitability.`);
  }

  // 3. ROI
  totalChecks++;
  if (snap.roi >= thresholds.minRoi) {
    passCount++;
    evidence.push(`ROI of ${snap.roi.toFixed(1)}% exceeds the ${thresholds.minRoi}% minimum, confirming strong capital efficiency.`);
  } else {
    risks.push(`ROI of ${snap.roi.toFixed(1)}% is below the ${thresholds.minRoi}% threshold, suggesting marginal return on NRE investment.`);
  }

  // 4. Break-Even Volume
  totalChecks++;
  if (snap.breakEvenVolumeMillion <= thresholds.maxBreakEvenVolumeMillion) {
    passCount++;
    evidence.push(`Break-even volume of ${snap.breakEvenVolumeMillion.toFixed(2)}M units is within the ${thresholds.maxBreakEvenVolumeMillion}M ceiling.`);
  } else {
    risks.push(`Break-even volume of ${snap.breakEvenVolumeMillion.toFixed(2)}M units exceeds the ${thresholds.maxBreakEvenVolumeMillion}M ceiling, requiring substantial market commitment.`);
  }

  // 5. Defect Density
  totalChecks++;
  if (dm.defectDensity <= thresholds.maxDefectDensity) {
    passCount++;
    evidence.push(`Defect density of ${dm.defectDensity} defects/cm² is at or below the ${thresholds.maxDefectDensity} threshold, indicating a mature process line.`);
  } else {
    risks.push(`Defect density of ${dm.defectDensity} defects/cm² exceeds the ${thresholds.maxDefectDensity} threshold, increasing yield uncertainty.`);
  }

  // 6. Packaging & Test Yields
  if (dm.packagingYield < 97 || dm.testYield < 97) {
    risks.push(`Packaging (${dm.packagingYield}%) or test yield (${dm.testYield}%) falls below 97%, adding downstream cost pressure.`);
  } else {
    evidence.push(`Packaging yield (${dm.packagingYield}%) and test yield (${dm.testYield}%) both exceed 97%, indicating strong assembly and test quality.`);
  }

  // Determine outcome
  const ratio = totalChecks > 0 ? passCount / totalChecks : 0;
  let outcome: DecisionOutcome;
  let summary: string;

  if (ratio >= 0.8 && risks.length === 0) {
    outcome = 'Proceed';
    summary = 'All critical thresholds are met or exceeded. The program is financially and technically sound.';
  } else if (ratio >= 0.6 && risks.length <= 2) {
    outcome = 'Proceed with Risk';
    summary = `Most thresholds are met, but ${risks.length} risk factor${risks.length > 1 ? 's' : ''} require active mitigation. Program can proceed with conditional oversight.`;
  } else if (ratio >= 0.4) {
    outcome = 'Requires Investigation';
    summary = `Only ${passCount} of ${totalChecks} thresholds are satisfied. Structured investigation and remediation planning are required before proceeding.`;
  } else if (ratio >= 0.2) {
    outcome = 'Hold';
    summary = `Majority of thresholds (${totalChecks - passCount} of ${totalChecks}) are not met. Program should be held pending material design or market revisions.`;
  } else {
    outcome = 'Reject';
    summary = 'Critical thresholds are broadly unmet. The program does not meet minimum viability criteria in its current form.';
  }

  return { outcome, confidence: Math.round(ratio * 100), summary, supportingEvidence: evidence, riskFactors: risks };
}

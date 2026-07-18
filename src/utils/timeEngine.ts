/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Time-Dimension Modeling Engine
 *
 * Adds a quarterly time axis to the deterministic cost model: D0 yield-learning
 * curves, ASP erosion, volume ramps, supply-vs-demand reconciliation,
 * respin-risk scenarios, and a multi-year quarterly P&L with cumulative
 * cash flow.
 *
 * Design principles:
 *  - Deterministic parametric curves (not Monte Carlo) — 3–5 inputs per curve
 *    replace 20 quarterly arrays, keeping the model explainable.
 *  - Pure functions with no side effects; all inputs explicit.
 *  - When TimeModel is absent, the engine returns a single aggregated quarter
 *    that exactly matches the static mathEngine.ts lifetime metrics
 *    (the "equivalence theorem").
 */

import type { Build, DesignModel, TimeModel, QuarterlyProjection, RespinConfig } from '../types';
import { calculateMurphyYield, computeBuildMetrics } from './mathEngine';

const QUARTERS_PER_YEAR = 4;

/**
 * Compute D0 for a given quarter using the yield-learning curve:
 *   D0(q) = d0Mature + (d0Initial - d0Mature) * exp(-q / tau)
 */
export function computeD0(quarter: number, d0Initial: number, d0Mature: number, tau: number): number {
  if (tau <= 0) return d0Mature;
  return d0Mature + (d0Initial - d0Mature) * Math.exp(-quarter / tau);
}

/**
 * Compute ASP for a given quarter with annual erosion.
 *   ASP(q) = asp0 * (1 - erosionRatePerQuarter)^q
 */
export function computeAsp(asp0: number, annualErosionPct: number, quarter: number): number {
  if (annualErosionPct <= 0) return asp0;
  const quarterlyRate = 1 - annualErosionPct / 100;
  const compounded = Math.pow(quarterlyRate, quarter / QUARTERS_PER_YEAR);
  return asp0 * Math.max(0.01, compounded);
}

/**
 * Compute the ramp multiplier for a given quarter.
 *   'flat':  1.0 always
 *   'linear': min(1, (q+1) / rampDuration)
 *   's-curve': sigmoid centered at rampDuration/2
 */
export function rampMultiplier(quarter: number, shape: TimeModel['rampShape'], rampDuration: number): number {
  if (shape === 'flat') return 1;
  if (rampDuration <= 0) return 1;
  if (shape === 'linear') {
    return Math.min(1, (quarter + 1) / rampDuration);
  }
  if (shape === 's-curve') {
    const midpoint = rampDuration / 2;
    const steepness = 1.5;
    return 1 / (1 + Math.exp(-steepness * (quarter - midpoint)));
  }
  return 1;
}

/**
 * Distribute total volume across quarters based on allocation profile.
 */
function distributeVolume(
  totalVolumeM: number,
  profile: TimeModel['volumeAllocation'],
  quarters: number
): number[] {
  if (totalVolumeM <= 0 || quarters <= 0) return new Array(quarters).fill(0);

  const qs = Array.from({ length: quarters }, (_, q) => q);
  let weights: number[];

  switch (profile) {
    case 'front-loaded':
      weights = qs.map(q => Math.exp(-0.3 * q));
      break;
    case 'back-loaded':
      weights = qs.map(q => Math.exp(-0.3 * (quarters - 1 - q)));
      break;
    case 'bell':
      weights = qs.map(q => Math.exp(-0.15 * Math.pow(q - quarters / 2, 2)));
      break;
    case 'even':
    default:
      weights = qs.map(() => 1);
      break;
  }

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  return weights.map(w => totalWeight > 0 ? (totalVolumeM * w) / totalWeight : 0);
}

/**
 * Compute respin scenarios.
 * Returns three sets of quarterly projections:
 *   - baseline: no respin
 *   - withRespin: deterministic scenario where respin occurs
 *   - expected: probability-weighted average
 */
export interface RespinOutcome {
  label: string;
  probability: number;
  projections: QuarterlyProjection[];
  totalRevenueM: number;
  totalNetProfitM: number;
  cumulativeCashFlowM: number;
  breakEvenQuarter: number | null;
}

export interface TimeEngineResult {
  projection: QuarterlyProjection[];
  baseline: RespinOutcome;
  withRespin: RespinOutcome | null;
  expected: RespinOutcome;
  breakEvenQuarter: number | null;
  programConstraint: 'supply' | 'demand' | 'balanced';
  constraintExplanation: string;
}

/**
 * Main time engine.
 * Computes a full quarterly projection for a build with an optional timeModel.
 * When timeModel is absent, returns a single aggregated projection that
 * matches the static computeBuildMetrics lifetime values.
 */
export function computeTimeProjection(
  build: Build,
  quarterlyProjections?: QuarterlyProjection[]
): TimeEngineResult {
  const dm = build.designModel;
  const tm = build.timeModel;

  if (!tm) {
    if (quarterlyProjections && quarterlyProjections.length > 0) {
      const aggregated = aggregateProjections(quarterlyProjections);
      const baseline: RespinOutcome = {
        label: 'Single-Period (Static)',
        probability: 1,
        projections: quarterlyProjections,
        totalRevenueM: aggregated.revenueM,
        totalNetProfitM: aggregated.netProfitM,
        cumulativeCashFlowM: aggregated.cumulativeCashFlowM,
        breakEvenQuarter: aggregated.cumulativeCashFlowM >= 0 ? 0 : null,
      };
      return {
        projection: quarterlyProjections,
        baseline,
        withRespin: null,
        expected: baseline,
        breakEvenQuarter: baseline.breakEvenQuarter,
        programConstraint: 'balanced',
        constraintExplanation: 'Time-dimension modeling not enabled. Using static lifetime aggregation.',
      };
    }
    // Equivalence theorem: derive a single static projection from computeBuildMetrics
    const { snapshot: s } = computeBuildMetrics(build);
    const sq = staticQuarterFromSnapshot(dm, s);
    const projections = [sq];
    const baseline: RespinOutcome = {
      label: 'Single-Period (Static)',
      probability: 1,
      projections,
      totalRevenueM: sq.revenueM,
      totalNetProfitM: sq.netProfitM,
      cumulativeCashFlowM: sq.cumulativeCashFlowM,
      breakEvenQuarter: sq.cumulativeCashFlowM >= 0 ? 0 : null,
    };
    return {
      projection: projections,
      baseline,
      withRespin: null,
      expected: baseline,
      breakEvenQuarter: baseline.breakEvenQuarter,
      programConstraint: 'balanced',
      constraintExplanation: 'Time-dimension modeling not enabled. Using static lifetime aggregation.',
    };
  }

  const quarters = tm.projectionQuarters || 20;

  // --- Volume distribution (demand per quarter) ---
  const demandPerQuarter = distributeVolume(
    dm.targetVolume,
    tm.volumeAllocation || 'even',
    quarters
  );

  // --- Baseline projections (no respin) ---
  const baselineProj = computeQuarterlyProjections(
    dm, tm, null, demandPerQuarter, quarters
  );
  const baselineAgg = aggregateProjections(baselineProj);
  const baselineBE = findBreakEvenQuarter(baselineProj);

  const baseline: RespinOutcome = {
    label: 'Baseline (No Respin)',
    probability: 1 - (tm.respin?.probability ?? 0),
    projections: baselineProj,
    totalRevenueM: baselineAgg.revenueM,
    totalNetProfitM: baselineAgg.netProfitM,
    cumulativeCashFlowM: baselineAgg.cumulativeCashFlowM,
    breakEvenQuarter: baselineBE,
  };

  // --- Respin scenario ---
  let withRespin: RespinOutcome | null = null;

  if (tm.respin && tm.respin.probability > 0) {
    const respinProj = computeQuarterlyProjections(
      dm, tm, tm.respin, demandPerQuarter, quarters
    );
    const respinAgg = aggregateProjections(respinProj);
    const respinBE = findBreakEvenQuarter(respinProj);

    withRespin = {
      label: `With Respin (${(tm.respin.probability * 100).toFixed(0)}% probability)`,
      probability: tm.respin.probability,
      projections: respinProj,
      totalRevenueM: respinAgg.revenueM,
      totalNetProfitM: respinAgg.netProfitM,
      cumulativeCashFlowM: respinAgg.cumulativeCashFlowM,
      breakEvenQuarter: respinBE,
    };
  }

  // --- Probability-weighted expected outcome ---
  const expectedProj = baselineProj.map((bp, qi) => {
    const rp = withRespin?.projections?.[qi];
    if (!rp) return bp;
    const p = tm.respin!.probability;
    return {
      ...bp,
      goodUnits: bp.goodUnits * (1 - p) + rp.goodUnits * p,
      revenueM: bp.revenueM * (1 - p) + rp.revenueM * p,
      cogsM: bp.cogsM * (1 - p) + rp.cogsM * p,
      grossProfitM: bp.grossProfitM * (1 - p) + rp.grossProfitM * p,
      netProfitM: bp.netProfitM * (1 - p) + rp.netProfitM * p,
      cumulativeCashFlowM: bp.cumulativeCashFlowM * (1 - p) + rp.cumulativeCashFlowM * p,
    };
  });

  // Recalculate cumulative for expected
  let cumNre = 0;
  let cumCF = 0;
  for (let qi = 0; qi < expectedProj.length; qi++) {
    const ep = expectedProj[qi]!;
    cumNre += qi === 0 ? (dm.nreCost || 0) : 0;
    cumCF += ep.netProfitM - (qi === 0 ? (dm.nreCost || 0) : 0);
    expectedProj[qi] = {
      ...ep,
      cumulativeNreM: cumNre,
      cumulativeCashFlowM: cumCF,
    };
  }
  const expectedAgg = aggregateProjections(expectedProj);
  const expectedBE = findBreakEvenQuarter(expectedProj);

  const expected: RespinOutcome = {
    label: 'Expected (Probability-Weighted)',
    probability: 1,
    projections: expectedProj,
    totalRevenueM: expectedAgg.revenueM,
    totalNetProfitM: expectedAgg.netProfitM,
    cumulativeCashFlowM: expectedAgg.cumulativeCashFlowM,
    breakEvenQuarter: expectedBE,
  };

  // --- Supply vs demand constraint ---
  const totalSupply = baselineProj.reduce((s, q) => s + q.supplyUnits, 0);
  const totalDemand = baselineProj.reduce((s, q) => s + q.demandUnits, 0);
  let programConstraint: TimeEngineResult['programConstraint'] = 'balanced';
  let constraintExplanation: string;

  if (totalSupply < totalDemand * 0.95) {
    programConstraint = 'supply';
    constraintExplanation = `Program is supply-constrained: maximum output of ${(totalSupply / 1e6).toFixed(2)}M units ` +
      `falls ${(((totalDemand - totalSupply) / totalDemand) * 100).toFixed(1)}% short of the ${(totalDemand / 1e6).toFixed(2)}M target volume. ` +
      `Consider increasing wafer starts or improving yield.`;
  } else if (totalDemand < totalSupply * 0.95) {
    programConstraint = 'demand';
    constraintExplanation = `Program is demand-constrained: target volume of ${(totalDemand / 1e6).toFixed(2)}M units ` +
      `uses only ${((totalDemand / totalSupply) * 100).toFixed(1)}% of available manufacturing capacity. ` +
      `Consider expanding market or reducing wafer starts to optimize cost.`;
  } else {
    constraintExplanation = `Supply and demand are balanced at approximately ${(totalDemand / 1e6).toFixed(2)}M units across the program horizon.`;
  }

  return {
    projection: expectedProj,
    baseline,
    withRespin,
    expected,
    breakEvenQuarter: expectedBE,
    programConstraint,
    constraintExplanation,
  };
}

/**
 * Compute quarterly projections for a given respin scenario (or null for baseline).
 */
/**
 * Compute per-unit COGS for a quarter given dynamic die yield.
 * Raw die cost = waferCost / (DPW * dieYield), scaled by test yield.
 */
function computeCogsPerUnit(dm: DesignModel, dieYield: number): number {
  const dpw = Math.floor(
    (Math.PI * 300 * 300) / (4 * dm.dieArea) - (Math.PI * 300) / Math.sqrt(2 * dm.dieArea)
  );
  const rawDieCost = Math.max(dpw * dieYield, 0.001) > 0
    ? (dm.waferCost || 0) / (dpw * dieYield)
    : 0;
  const pkgCost = dm.packagingCost || 0;
  const testCost = (dm.testTimeSeconds || 0) * (dm.testCostPerSecond || 0);
  const testYield = Math.max((dm.testYield || 98) / 100, 0.001);
  return (rawDieCost + pkgCost + testCost) / testYield;
}

function computeQuarterlyProjections(
  dm: DesignModel,
  tm: TimeModel,
  respin: RespinConfig | null,
  demandPerQuarter: number[],
  quarters: number
): QuarterlyProjection[] {
  const projections: QuarterlyProjection[] = [];
  let cumulativeNre = 0;
  let cumulativeCashFlow = 0;
  let respinApplied = false;
  let respinRecoveryRemaining = 0;

  for (let q = 0; q < quarters; q++) {
    // D0 for this quarter (with respin impact if applicable)
    let effectiveD0 = computeD0(q, tm.d0Initial, tm.d0Mature, tm.d0Tau);
    if (respin && respinApplied && respinRecoveryRemaining > 0) {
      effectiveD0 *= respin.yieldImpact;
      respinRecoveryRemaining--;
    }

    // Die yield at this quarter's D0
    const dieYield = calculateMurphyYield(dm.dieArea, effectiveD0);

    // Full stack yield
    const pkgYield = (dm.packagingYield || 99) / 100;
    const testYield = (dm.testYield || 98) / 100;
    const effectiveYield = dieYield * pkgYield * testYield;

    // Per-unit COGS at this quarter's yield
    const cogsPerUnit = computeCogsPerUnit(dm, dieYield);

    // Supply: max units from wafer starts
    const dpw = Math.floor(
      (Math.PI * 300 * 300) / (4 * dm.dieArea) - (Math.PI * 300) / Math.sqrt(2 * dm.dieArea)
    );
    const goodDiesPerWafer = Math.max(1, Math.floor(dpw * effectiveYield));
    const supplyM = (goodDiesPerWafer * (dm.waferStartsPerMonth || 0) * 3) / 1e6;

    // Supply after ramp factor
    const ramp = rampMultiplier(q, tm.rampShape, tm.rampDurationQuarters);
    const maxSupplyM = Math.min(tm.maxQuarterlySupplyMillion, supplyM) * ramp;

    // Demand for this quarter
    const demandM = demandPerQuarter[q] || 0;

    // Shipped = min(supply, demand)
    const goodUnitsM = Math.min(maxSupplyM, demandM);
    const goodUnits = goodUnitsM * 1e6;

    // ASP for this quarter
    const asp = computeAsp(dm.asp, tm.annualAspErosionPct, q);

    // Revenue
    const revenueM = goodUnitsM * asp;

    // COGS
    const cogsM = goodUnitsM * cogsPerUnit;

    // Gross profit
    const grossProfitM = revenueM - cogsM;

    // NRE: book in Q0 (and respin cost in respin quarter)
    const nreThisQuarter = q === 0 ? (dm.nreCost || 0) : 0;
    let isRespinQuarter = false;
    if (respin && !respinApplied && q >= Math.ceil(respin.scheduleDelayQuarters / 2)) {
      // Respin occurs ~halfway through the delay
      cumulativeNre += respin.costM;
      respinApplied = true;
      respinRecoveryRemaining = respin.recoveryQuarters;
      isRespinQuarter = true;
    }

    cumulativeNre += nreThisQuarter;
    const netProfitM = grossProfitM - nreThisQuarter - (isRespinQuarter ? respin?.costM ?? 0 : 0);
    cumulativeCashFlow += netProfitM;

    projections.push({
      quarter: q,
      label: `Q${(q % 4) + 1} ${2027 + Math.floor(q / 4)}`,
      d0: effectiveD0,
      dieYield,
      effectiveYield,
      goodUnits,
      supplyUnits: Math.round(maxSupplyM * 1e6),
      demandUnits: Math.round(demandM * 1e6),
      asp,
      revenueM: round2(revenueM),
      cogsM: round2(cogsM),
      grossProfitM: round2(grossProfitM),
      cumulativeNreM: round2(cumulativeNre),
      netProfitM: round2(netProfitM),
      cumulativeCashFlowM: round2(cumulativeCashFlow),
      isRespinQuarter,
    });
  }

  return projections;
}

/**
 * Create a single static quarter from computeBuildMetrics results.
 * Guarantees exact equivalence with the static model when TimeModel is absent.
 */
function staticQuarterFromSnapshot(dm: DesignModel, s: Awaited<ReturnType<typeof computeBuildMetrics>>['snapshot']): QuarterlyProjection {
  const totalUnits = (dm.targetVolume || 0) * 1e6;
  const nre = dm.nreCost || 0;
  return {
    quarter: 0,
    label: 'Lifetime',
    d0: dm.defectDensity || 0.08,
    dieYield: s.dieYield,
    effectiveYield: s.dieYield * ((dm.packagingYield || 99) / 100) * ((dm.testYield || 98.5) / 100),
    goodUnits: totalUnits,
    supplyUnits: totalUnits,
    demandUnits: totalUnits,
    asp: dm.asp || 0,
    revenueM: round2(s.lifetimeRevenueMillion),
    cogsM: round2(s.lifetimeCOGSMillion),
    grossProfitM: round2(s.lifetimeGrossProfitMillion),
    cumulativeNreM: nre,
    netProfitM: round2(s.lifetimeNetProfitMillion),
    cumulativeCashFlowM: round2(s.lifetimeNetProfitMillion),
    isRespinQuarter: false,
  };
}

/**
 * Aggregate quarterly projections into a single summary.
 */
export function aggregateProjections(projections: QuarterlyProjection[]): {
  revenueM: number;
  cogsM: number;
  grossProfitM: number;
  netProfitM: number;
  cumulativeCashFlowM: number;
} {
  const last = projections[projections.length - 1];
  return {
    revenueM: projections.reduce((s, q) => s + q.revenueM, 0),
    cogsM: projections.reduce((s, q) => s + q.cogsM, 0),
    grossProfitM: projections.reduce((s, q) => s + q.grossProfitM, 0),
    netProfitM: projections.reduce((s, q) => s + q.netProfitM, 0),
    cumulativeCashFlowM: last ? last.cumulativeCashFlowM : 0,
  };
}

/**
 * Find the first quarter where cumulative cash flow becomes non-negative.
 */
export function findBreakEvenQuarter(projections: QuarterlyProjection[]): number | null {
  for (const q of projections) {
    if (q.cumulativeCashFlowM >= 0) return q.quarter;
  }
  return null;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

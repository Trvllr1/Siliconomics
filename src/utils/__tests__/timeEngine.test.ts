/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  computeD0,
  computeAsp,
  rampMultiplier,
  computeTimeProjection,
  aggregateProjections,
  findBreakEvenQuarter,
} from '../timeEngine';
import { computeBuildMetrics } from '../mathEngine';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import type { Build, TimeModel } from '../../types';

const x1 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x1')!;
const x2 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x2')!;
const brooklyn = DEFAULT_BUILDS.find((b) => b.id === 'brooklyn-a2')!;

function clone(build: Build): Build {
  return structuredClone(build) as Build;
}

// --- Unit tests for pure math helpers ---

describe('computeD0', () => {
  it('starts at d0Initial for quarter 0', () => {
    expect(computeD0(0, 0.15, 0.05, 4)).toBeCloseTo(0.15, 4);
  });

  it('asymptotically approaches d0Mature', () => {
    const d0 = computeD0(100, 0.15, 0.05, 4);
    expect(d0).toBeGreaterThan(0.049);
    expect(d0).toBeLessThanOrEqual(0.06);
    expect(computeD0(0, 0.15, 0.05, 4)).toBeGreaterThan(computeD0(20, 0.15, 0.05, 4));
  });

  it('returns d0Mature when tau <= 0', () => {
    expect(computeD0(5, 0.15, 0.05, 0)).toBe(0.05);
  });

  it('d0 decreases monotonically with quarter', () => {
    for (let q = 0; q < 20; q++) {
      expect(computeD0(q, 0.15, 0.05, 4)).toBeGreaterThanOrEqual(computeD0(q + 1, 0.15, 0.05, 4));
    }
  });
});

describe('computeAsp', () => {
  it('starts at initial ASP for quarter 0', () => {
    expect(computeAsp(285, 3, 0)).toBeCloseTo(285, 2);
  });

  it('decays by ~3% per year', () => {
    const afterYear = computeAsp(285, 3, 4);
    expect(afterYear).toBeLessThan(285);
    expect(afterYear).toBeGreaterThan(276); // ~97% of 285
  });

  it('returns initial ASP when erosion is 0', () => {
    expect(computeAsp(100, 0, 20)).toBe(100);
  });

  it('never goes below 1 cent', () => {
    expect(computeAsp(1, 99, 100)).toBeGreaterThanOrEqual(0.01);
  });
});

describe('rampMultiplier', () => {
  it('flat shape always returns 1', () => {
    for (let q = 0; q < 20; q++) {
      expect(rampMultiplier(q, 'flat', 8)).toBe(1);
    }
  });

  it('linear ramp reaches 1 at rampDuration', () => {
    expect(rampMultiplier(0, 'linear', 8)).toBeCloseTo(1 / 8, 4);
    expect(rampMultiplier(7, 'linear', 8)).toBeCloseTo(1, 4);
    expect(rampMultiplier(11, 'linear', 8)).toBeCloseTo(1, 4);
  });

  it('s-curve starts near 0 and ends near 1', () => {
    const early = rampMultiplier(0, 's-curve', 8);
    const late = rampMultiplier(16, 's-curve', 8);
    expect(early).toBeLessThan(0.01);
    expect(late).toBeCloseTo(1, 2);
  });
});

// --- Equivalence theorem ---

describe('Equivalence Theorem — no timeModel matches static computeBuildMetrics', () => {
  for (const build of DEFAULT_BUILDS) {
    it(`static result for ${build.id} matches aggregated quarterly result`, () => {
      const staticResult = computeBuildMetrics(build);

      // Strip timeModel to test the equivalence theorem (static fallback)
      const staticBuild = clone(build);
      delete staticBuild.timeModel;
      const timeResult = computeTimeProjection(staticBuild);

      // Should produce a single aggregated projection
      expect(timeResult.projection).toHaveLength(1);
      expect(timeResult.projection[0]!.quarter).toBe(0);

      const q = timeResult.projection[0]!;

      // Single quarter's revenue should approximate the static lifetime revenue
      // (small rounding differences expected)
      expect(q.revenueM).toBeCloseTo(staticResult.snapshot.lifetimeRevenueMillion, 0);
      expect(q.cogsM).toBeCloseTo(staticResult.snapshot.lifetimeCOGSMillion, 0);

      // Net profit = gross profit - NRE
      // Static: grossProfit = lifetimeGrossProfitMillion
      const staticGrossProfit = staticResult.snapshot.lifetimeGrossProfitMillion;
      const staticNetProfit = staticResult.snapshot.lifetimeNetProfitMillion;
      expect(q.grossProfitM).toBeCloseTo(staticGrossProfit, 0);
      expect(q.netProfitM).toBeCloseTo(staticNetProfit, 0);
    });
  }
});

// --- TimeModel-enabled builds ---

describe('computeTimeProjection — Manhattan-X1 with automotive timeModel', () => {
  const b = clone(x1);
  const tm: TimeModel = {
    d0Initial: 0.15,
    d0Mature: 0.08,
    d0Tau: 6,
    rampShape: 'linear',
    rampDurationQuarters: 4,
    peakQuarterlyVolumeMillion: 0.3,
    annualAspErosionPct: 3,
    maxQuarterlySupplyMillion: 0.35,
    respin: null,
    projectionQuarters: 20,
    volumeAllocation: 'even',
  };
  b.timeModel = tm;

  let result: ReturnType<typeof computeTimeProjection>;

  it('produces 20 quarterly projections', () => {
    result = computeTimeProjection(b);
    expect(result.projection).toHaveLength(20);
  });

  it('baseline and expected are the same (no respin)', () => {
    expect(result.baseline.totalRevenueM).toBe(result.expected.totalRevenueM);
  });

  it('first quarter has lower volume due to ramp', () => {
    const q0 = result.projection[0]!;
    const q4 = result.projection[4]!;
    expect(q0.goodUnits).toBeLessThan(q4.goodUnits);
  });

  it('ASP erodes over the projection', () => {
    const q0 = result.projection[0]!;
    const q19 = result.projection[19]!;
    expect(q0.asp).toBeGreaterThan(q19.asp);
  });

  it('D0 improves from initial toward mature', () => {
    const q0 = result.projection[0]!;
    const q19 = result.projection[19]!;
    expect(q0.d0).toBeGreaterThan(q19.d0);
  });

  it('die yield improves as D0 drops', () => {
    const q0 = result.projection[0]!;
    const q19 = result.projection[19]!;
    expect(q19.dieYield).toBeGreaterThan(q0.dieYield);
  });

  it('total lifetime revenue is less than static (due to erosion + ramp)', () => {
    const staticResult = computeBuildMetrics(b);
    // With erosion and ramp, time-phased revenue should be <= static (which assumes constant ASP and full volume)
    expect(result.expected.totalRevenueM).toBeLessThanOrEqual(staticResult.snapshot.lifetimeRevenueMillion);
  });

  it('break-even quarter is found', () => {
    expect(result.breakEvenQuarter).not.toBeNull();
    expect(result.breakEvenQuarter).toBeGreaterThanOrEqual(0);
  });

  it('program constraint is identified', () => {
    expect(['supply', 'demand', 'balanced']).toContain(result.programConstraint);
    expect(result.constraintExplanation).toBeTruthy();
  });
});

describe('computeTimeProjection — Manhattan-X2 with AI accelerator timeModel (supply-constrained + respin)', () => {
  const b = clone(x2);
  const tm: TimeModel = {
    d0Initial: 0.18,
    d0Mature: 0.10,
    d0Tau: 8,
    rampShape: 's-curve',
    rampDurationQuarters: 8,
    peakQuarterlyVolumeMillion: 0.05,
    annualAspErosionPct: 0,
    maxQuarterlySupplyMillion: 0.04,
    respin: {
      probability: 0.35,
      costM: 260,
      scheduleDelayQuarters: 2,
      yieldImpact: 1.2,
      recoveryQuarters: 4,
    },
    projectionQuarters: 20,
    volumeAllocation: 'even',
  };
  b.timeModel = tm;

  let result: ReturnType<typeof computeTimeProjection>;

  it('produces 20 quarterly projections', () => {
    result = computeTimeProjection(b);
    expect(result.projection).toHaveLength(20);
  });

  it('respin scenario is present', () => {
    result = computeTimeProjection(b);
    expect(result.withRespin).not.toBeNull();
  });

  it('expected net profit is between baseline and with-respin', () => {
    result = computeTimeProjection(b);
    expect(result.expected.totalNetProfitM).toBeLessThan(result.baseline.totalNetProfitM);
    if (result.withRespin) {
      expect(result.expected.totalNetProfitM).toBeGreaterThan(result.withRespin.totalNetProfitM);
    }
  });

  it('program is supply-constrained (AI accelerator with CoWoS scarcity)', () => {
    result = computeTimeProjection(b);
    // X2 has high ASP, limited wafer starts, and CoWoS supply constraint
    expect(result.programConstraint).toBe('supply');
  });

  it('respin quarter is flagged in withRespin projections', () => {
    result = computeTimeProjection(b);
    const hasRespinQuarter = result.withRespin!.projections.some(q => q.isRespinQuarter);
    expect(hasRespinQuarter).toBe(true);
  });
});

describe('computeTimeProjection — Brooklyn-A2 with IoT timeModel (demand-constrained)', () => {
  const b = clone(brooklyn);
  const tm: TimeModel = {
    d0Initial: 0.08,
    d0Mature: 0.04,
    d0Tau: 4,
    rampShape: 'linear',
    rampDurationQuarters: 3,
    peakQuarterlyVolumeMillion: 2.5,
    annualAspErosionPct: 8,
    maxQuarterlySupplyMillion: 5.0,
    respin: null,
    projectionQuarters: 20,
    volumeAllocation: 'bell',
  };
  b.timeModel = tm;

  let result: ReturnType<typeof computeTimeProjection>;

  it('produces 20 quarterly projections', () => {
    result = computeTimeProjection(b);
    expect(result.projection).toHaveLength(20);
  });

  it('program is demand-constrained (IoT market-limited)', () => {
    result = computeTimeProjection(b);
    expect(result.programConstraint).toBe('demand');
  });

  it('volume follows bell-shaped distribution', () => {
    result = computeTimeProjection(b);
    const mids = result.projection.slice(8, 12);
    const edges = result.projection.slice(0, 3);
    const midTotal = mids.reduce((s, q) => s + q.goodUnits, 0);
    const edgeTotal = edges.reduce((s, q) => s + q.goodUnits, 0);
    expect(midTotal).toBeGreaterThan(edgeTotal);
  });

  it('ASP erodes significantly (8%/yr)', () => {
    result = computeTimeProjection(b);
    const q0 = result.projection[0]!;
    const q19 = result.projection[19]!;
    const erosionPercent = (1 - q19.asp / q0.asp) * 100;
    expect(erosionPercent).toBeGreaterThan(30); // ~8% * 5 years = 40% erosion
  });
});

describe('aggregateProjections', () => {
  it('sums revenue and COGS correctly', () => {
    const projections = Array.from({ length: 4 }, (_, i) => ({
      quarter: i,
      label: `Q${i + 1}`,
      d0: 0.1,
      dieYield: 0.8,
      effectiveYield: 0.75,
      goodUnits: 100_000,
      supplyUnits: 100_000,
      demandUnits: 100_000,
      asp: 100,
      revenueM: 10,
      cogsM: 6,
      grossProfitM: 4,
      cumulativeNreM: 50,
      netProfitM: 4,
      cumulativeCashFlowM: i === 3 ? 16 : 0,
      isRespinQuarter: false,
    }));
    const result = aggregateProjections(projections);
    expect(result.revenueM).toBeCloseTo(40, 2);
    expect(result.cogsM).toBeCloseTo(24, 2);
    expect(result.grossProfitM).toBeCloseTo(16, 2);
    expect(result.cumulativeCashFlowM).toBeCloseTo(16, 2);
  });
});

describe('findBreakEvenQuarter', () => {
  it('returns null when never break-even', () => {
    const projections = Array.from({ length: 5 }, (_, i) => ({
      quarter: i,
      label: `Q${i + 1}`,
      d0: 0.1,
      dieYield: 0.8,
      effectiveYield: 0.75,
      goodUnits: 100_000,
      supplyUnits: 100_000,
      demandUnits: 100_000,
      asp: 100,
      revenueM: 5,
      cogsM: 10,
      grossProfitM: -5,
      cumulativeNreM: 100,
      netProfitM: -5,
      cumulativeCashFlowM: -100 - 5 * (i + 1),
      isRespinQuarter: false,
    }));
    expect(findBreakEvenQuarter(projections)).toBeNull();
  });

  it('finds the first quarter with non-negative cash flow', () => {
    const projections = Array.from({ length: 5 }, (_, i) => ({
      quarter: i,
      label: `Q${i + 1}`,
      d0: 0.1,
      dieYield: 0.8,
      effectiveYield: 0.75,
      goodUnits: 100_000,
      supplyUnits: 100_000,
      demandUnits: 100_000,
      asp: 100,
      revenueM: 10,
      cogsM: 5,
      grossProfitM: 5,
      cumulativeNreM: 20,
      netProfitM: 5,
      cumulativeCashFlowM: i < 3 ? -20 + 5 * i : 5 * (i - 3),
      isRespinQuarter: false,
    }));
    expect(findBreakEvenQuarter(projections)).toBe(3);
  });
});

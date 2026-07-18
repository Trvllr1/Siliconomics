import { describe, it, expect } from 'vitest';
import { computeSensitivity, getTopSensitivities } from '../SensitivityAnalysis';
import { computeBusinessImpact } from '../BusinessImpact';
import { evaluateBuild } from '../ExecutiveRecommendation';
import { computeBuildMetrics } from '../mathEngine';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';

const x1 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x1')!;
const x2 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x2')!;

describe('SensitivityAnalysis', () => {
  const snap = computeBuildMetrics(x1).snapshot;
  const results = computeSensitivity(x1, snap);

  it('sweeps all 9 parameters across 6 variations', () => {
    expect(results).toHaveLength(9);
    for (const r of results) expect(r.points).toHaveLength(6);
  });

  it('raising ASP raises gross margin; lowering it lowers margin', () => {
    const asp = results.find((r) => r.paramName === 'asp')!;
    const minus20 = asp.points.find((p) => p.variation === -20)!;
    const plus20 = asp.points.find((p) => p.variation === 20)!;
    expect(plus20.grossMargin).toBeGreaterThan(snap.grossMargin);
    expect(minus20.grossMargin).toBeLessThan(snap.grossMargin);
  });

  it('raising defect density increases unit cost', () => {
    const d0 = results.find((r) => r.paramName === 'defectDensity')!;
    const plus20 = d0.points.find((p) => p.variation === 20)!;
    expect(plus20.grossCostPerGoodDie).toBeGreaterThan(snap.grossCostPerGoodDie);
  });

  it('getTopSensitivities returns impacts sorted descending', () => {
    const top = getTopSensitivities(results, 'grossMargin');
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1]!.impact).toBeGreaterThanOrEqual(top[i]!.impact);
    }
  });
});

describe('BusinessImpact', () => {
  it('detects topology and node shifts between two builds', () => {
    const snapA = computeBuildMetrics(x1).snapshot;
    const snapB = computeBuildMetrics(x2).snapshot;
    const impacts = computeBusinessImpact(x1, snapA, x2, snapB);
    expect(impacts.some((i) => i.metric === 'Topology Architecture Shift')).toBe(true);
    expect(impacts.some((i) => i.metric === 'Process Node Migration')).toBe(true);
  });
});

describe('ExecutiveRecommendation.evaluateBuild', () => {
  it('recommends Proceed for a healthy program (Manhattan-X1)', () => {
    const snap = computeBuildMetrics(x1).snapshot;
    const rec = evaluateBuild(snap, x1.designModel);
    expect(rec.outcome).toBe('Proceed');
    expect(rec.riskFactors).toHaveLength(0);
  });

  it('flags a margin-negative program as not clean-Proceed', () => {
    // Force negative margin: X2's ~$3.2k COGS against an ASP far below cost.
    const negative = { ...x2, designModel: { ...x2.designModel, asp: 1250 } };
    const snap = computeBuildMetrics(negative).snapshot;
    const rec = evaluateBuild(snap, negative.designModel);
    expect(rec.outcome).not.toBe('Proceed');
    expect(rec.riskFactors.length).toBeGreaterThan(0);
  });
});

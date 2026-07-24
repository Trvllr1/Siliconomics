import { describe, it, expect } from 'vitest';
import { getMetrics, getComparisonMetrics, getTimeProjections } from '../lib/engineAccess';

describe('engineAccess', () => {
  it('getMetrics returns deterministic snapshot', () => {
    const m1 = getMetrics();
    const m2 = getMetrics();
    expect(m1.snapshot.fullyLoadedCostPerDie).toBe(m2.snapshot.fullyLoadedCostPerDie);
    expect(m1.snapshot.dpw).toBeGreaterThan(0);
  });

  it('getComparisonMetrics returns different build', () => {
    const main = getMetrics();
    const comp = getComparisonMetrics();
    expect(main.build.id).not.toBe(comp.build.id);
  });

  it('getTimeProjections returns 20 quarters', () => {
    const projections = getTimeProjections();
    expect(projections.length).toBe(20);
    expect(projections[0]!.cumulativeCashFlowM).toBeDefined();
  });
});

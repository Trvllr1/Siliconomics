import { describe, it, expect } from 'vitest';
import { round, calculateDPW, calculateMurphyYield, computeBuildMetrics, checkAlerts } from '../mathEngine';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import { Build } from '../../types';

const x1 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x1')!;
const x2 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x2')!;

function clone(build: Build, dmOverrides: Partial<Build['designModel']> = {}): Build {
  return {
    ...structuredClone(build),
    designModel: { ...structuredClone(build.designModel), ...dmOverrides },
  };
}

describe('round', () => {
  it('rounds to the requested precision', () => {
    expect(round(1.23456, 2)).toBe(1.23);
    expect(round(1.235, 2)).toBe(1.24);
    expect(round(-1.005, 1)).toBe(-1);
  });
});

describe('calculateDPW (300mm wafer geometric packing)', () => {
  it('matches hand-computed value for a 100 mm² die', () => {
    // term1 = π·300²/(4·100) = 706.858, term2 = π·300/√200 = 66.643 → floor(640.215) = 640
    expect(calculateDPW(100)).toBe(640);
  });

  it('matches hand-computed value for a 260 mm² die (Manhattan-X1)', () => {
    expect(calculateDPW(260)).toBe(230);
  });

  it('returns 0 for non-positive area and clamps to ≥1 for oversized dies', () => {
    expect(calculateDPW(0)).toBe(0);
    expect(calculateDPW(-5)).toBe(0);
    expect(calculateDPW(70000)).toBe(1); // die larger than usable wafer → clamp
  });

  it('is monotonically non-increasing with area', () => {
    expect(calculateDPW(50)).toBeGreaterThan(calculateDPW(100));
    expect(calculateDPW(100)).toBeGreaterThan(calculateDPW(400));
  });
});

describe('calculateMurphyYield', () => {
  it('matches hand-computed Murphy yield for A=260 mm², D0=0.08 def/cm²', () => {
    // ad0 = 260·0.0008 = 0.208 → ((1 − e^−0.208)/0.208)² = 0.81514
    expect(calculateMurphyYield(260, 0.08)).toBeCloseTo(0.81514, 4);
  });

  it('matches hand-computed Murphy yield for A=145 mm², D0=0.12 def/cm²', () => {
    expect(calculateMurphyYield(145, 0.12)).toBeCloseTo(0.84246, 4);
  });

  it('returns 1 when defect density is zero', () => {
    expect(calculateMurphyYield(500, 0)).toBe(1);
  });

  it('decreases monotonically with area and defect density', () => {
    expect(calculateMurphyYield(100, 0.1)).toBeGreaterThan(calculateMurphyYield(200, 0.1));
    expect(calculateMurphyYield(100, 0.1)).toBeGreaterThan(calculateMurphyYield(100, 0.2));
  });
});

describe('computeBuildMetrics — monolithic (Manhattan-X1 hand-derived)', () => {
  const { snapshot: s } = computeBuildMetrics(x1);

  it('die yield is silicon-only Murphy yield', () => {
    expect(s.dieYield).toBeCloseTo(0.81514, 4);
  });

  it('DPW is 230', () => {
    expect(s.dpw).toBe(230);
  });

  it('raw die cost = waferCost / (DPW × dieYield)', () => {
    // 9500 / (230 × 0.815143) = 50.67
    expect(s.rawDieCost).toBeCloseTo(50.67, 2);
  });

  it('packaged unit cost = (raw + pkg + test) / testYield', () => {
    // (50.671 + 12.50 + 45×0.18) / 0.985 = 72.36
    expect(s.packagingAndTestingCost).toBeCloseTo(20.6, 2);
    expect(s.grossCostPerGoodDie).toBeCloseTo(72.36, 2);
  });

  it('gross margin = (ASP − COGS) / ASP', () => {
    expect(s.grossMargin).toBeCloseTo(74.61, 2);
  });

  it('amortized NRE and fully loaded cost', () => {
    expect(s.amortizedNreCost).toBeCloseTo(110 / 4.5, 3);
    expect(s.fullyLoadedCostPerDie).toBeCloseTo(96.8, 1);
  });

  it('break-even volume = NRE / unit margin', () => {
    expect(s.breakEvenVolumeMillion).toBeCloseTo(110 / (285 - 72.356), 3);
  });

  it('program lifetime financials and ROI', () => {
    expect(s.lifetimeRevenueMillion).toBeCloseTo(4.5 * 285, 1);
    expect(s.roi).toBeCloseTo(769.9, 1);
  });

  it('effective yield stacks die × packaging × test yields exactly once', () => {
    // monthly volume = DPW × Y_die × Y_pkg × Y_test × wafer starts
    const expectedMonthly = (230 * 0.815143 * 0.992 * 0.985 * 8500) / 1e6;
    expect(s.monthlyVolumeMillion).toBeCloseTo(expectedMonthly, 4);
  });
});

describe('computeBuildMetrics — chiplet KGD semantics (Manhattan-X2 hand-derived)', () => {
  const { snapshot: s } = computeBuildMetrics(x2);

  it('die yield is silicon-only: coreYield^N × ioYield (no packaging/interposer yield baked in)', () => {
    const coreY = calculateMurphyYield(145, 0.12);
    const ioY = calculateMurphyYield(180, 0.12);
    expect(s.dieYield).toBeCloseTo(Math.pow(coreY, 4) * ioY, 6);
    expect(s.dieYield).toBeCloseTo(0.4074, 3);
  });

  it('equivalent DPW derives from per-die packing, not a magic multiplier', () => {
    // 1 / (4/432 + 1/343) = 82.14 → 82
    expect(calculateDPW(145)).toBe(432);
    expect(calculateDPW(180)).toBe(343);
    expect(s.dpw).toBe(82);
  });

  it('raw silicon-set cost = N × coreCost + ioCost from per-die DPW and sort yield', () => {
    const coreY = calculateMurphyYield(145, 0.12);
    const ioY = calculateMurphyYield(180, 0.12);
    const expected = (18000 / (432 * coreY)) * 4 + 18000 / (343 * ioY);
    expect(s.rawDieCost).toBeCloseTo(expected, 2);
    expect(s.rawDieCost).toBeCloseTo(262.72, 1);
  });

  it('interposer cost uses explicit interposer area / interposer yield (CoWoS-S)', () => {
    // 760 mm² × $3.50/mm² / 0.96 = 2770.83; + pkg 48 + test 90×0.25 = 2841.33
    expect(s.packagingAndTestingCost).toBeCloseTo(48 + 2770.83 + 22.5, 1);
  });

  it('effective yield applies interposer, packaging and test yields exactly once', () => {
    // monthly = DPW × Y_silicon × Y_interposer × Y_pkg × Y_test × starts
    const expectedMonthly = (82 * s.dieYield * 0.96 * 0.975 * 0.96 * 4000) / 1e6;
    expect(s.monthlyVolumeMillion).toBeCloseTo(expectedMonthly, 4);
  });
});

describe('computeBuildMetrics — structural invariants and edge cases', () => {
  it('defaults interposer area to 1.2 × total system area when unset (ordering fix)', () => {
    const b = clone(x2);
    delete b.designModel.interposerArea;
    const { snapshot } = computeBuildMetrics(b);
    // totalDieArea = 4×145 + 180 = 760 → interposer 912 mm² → 912×3.5/0.96 = 3325
    expect(snapshot.packagingAndTestingCost).toBeCloseTo(48 + 3325 + 22.5, 1);
  });

  it('chiplet with no I/O die contributes zero I/O cost', () => {
    const b = clone(x2, { ioDieArea: 0 });
    const { snapshot } = computeBuildMetrics(b);
    const coreY = calculateMurphyYield(145, 0.12);
    expect(snapshot.rawDieCost).toBeCloseTo((18000 / (432 * coreY)) * 4, 2);
  });

  it('asp = 0 yields defined (zero) margins and break-even, never NaN/Infinity', () => {
    const { snapshot } = computeBuildMetrics(clone(x1, { asp: 0 }));
    expect(snapshot.grossMargin).toBe(0);
    expect(snapshot.breakEvenVolumeMillion).toBe(0);
    expect(Number.isFinite(snapshot.roi)).toBe(true);
  });

  it('testYield = 0 does not produce Infinity in per-unit cost', () => {
    const { snapshot } = computeBuildMetrics(clone(x1, { testYield: 0 }));
    expect(Number.isFinite(snapshot.grossCostPerGoodDie)).toBe(true);
  });

  it('targetVolume = 0 amortizes NRE to zero instead of dividing by zero', () => {
    const { snapshot } = computeBuildMetrics(clone(x1, { targetVolume: 0 }));
    expect(snapshot.amortizedNreCost).toBe(0);
  });

  it('negative unit margin means the program can never break even (0)', () => {
    const { snapshot } = computeBuildMetrics(clone(x1, { asp: 10 }));
    expect(snapshot.breakEvenVolumeMillion).toBe(0);
  });
});

describe('computeBuildMetrics — MPW shuttle pricing', () => {
  it('replaces NRE and volume with shuttle-derived equivalents', () => {
    const b = clone(x1, {
      mpw: {
        enabled: true,
        participants: 10,
        shuttleCostPerSlot: 350_000,
        diesPerSlot: 100,
        shuttlesPerYear: 4,
        reticleSlotArea: 400,
      },
    });
    const { snapshot } = computeBuildMetrics(b);
    // effective NRE = 0.35M×4 = $1.4M; effective volume = 400 dies = 0.0004M units
    // amortized mask NRE per unit = 1.4e6 / 400 = 3500
    expect(snapshot.amortizedNreCost).toBeCloseTo(3500, 0);
    expect(snapshot.metricsList.some((m) => m.id === 'mpw_effective_nre')).toBe(true);
  });
});

describe('supply chain scoring', () => {
  it('composite score, risk level, and concentration follow documented weights', () => {
    const { snapshot } = computeBuildMetrics(x2);
    const blocks = x2.architecture!.blocks;
    const riskMap: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
    const expectedComposite =
      (blocks.reduce((s, b) => s + riskMap[b.supplyChainRisk]!, 0) / (blocks.length * 3)) * 100;
    expect(snapshot.supplyChain.compositeRiskScore).toBeCloseTo(expectedComposite, 1);
    expect(snapshot.supplyChain.totalBlockCount).toBe(blocks.length);
  });
});

describe('checkAlerts', () => {
  it('triggers a rule when the metric crosses the threshold', () => {
    // Force a deeply negative gross margin: X2's ~$3.2k COGS against a $1,250 ASP.
    const negative = clone(x2, { asp: 1250 });
    const { snapshot } = computeBuildMetrics(negative);
    const alerts = checkAlerts(negative, snapshot, [
      {
        id: 'test-margin',
        name: 'Gross margin floor',
        description: '',
        category: 'financial',
        field: 'grossMargin',
        operator: 'lt',
        threshold: 20,
        severity: 'critical',
        messageTemplate: 'Gross margin {value}% below floor',
      },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.severity).toBe('critical');
  });

  it('does not trigger when the metric is healthy', () => {
    const { snapshot } = computeBuildMetrics(x1);
    const alerts = checkAlerts(x1, snapshot, [
      {
        id: 'test-margin',
        name: 'Gross margin floor',
        description: '',
        category: 'financial',
        field: 'grossMargin',
        operator: 'lt',
        threshold: 20,
        severity: 'critical',
        messageTemplate: 'Gross margin {value}% below floor',
      },
    ]);
    expect(alerts).toHaveLength(0);
  });
});

describe('golden snapshots — default builds (locks model behavior)', () => {
  for (const build of DEFAULT_BUILDS) {
    it(`key metrics for ${build.id}`, () => {
      const { snapshot: s } = computeBuildMetrics(build);
      expect({
        dieYieldPct: round(s.dieYield * 100, 3),
        dpw: s.dpw,
        waferUtilization: round(s.waferUtilization, 1),
        rawDieCost: round(s.rawDieCost, 2),
        packagingAndTestingCost: round(s.packagingAndTestingCost, 2),
        grossCostPerGoodDie: round(s.grossCostPerGoodDie, 2),
        grossMargin: round(s.grossMargin, 2),
        fullyLoadedCostPerDie: round(s.fullyLoadedCostPerDie, 2),
        breakEvenVolumeMillion: round(s.breakEvenVolumeMillion, 3),
        roi: round(s.roi, 1),
        monthlyVolumeMillion: round(s.monthlyVolumeMillion, 4),
        lifetimeNetProfitMillion: round(s.lifetimeNetProfitMillion, 1),
        compositeRiskScore: s.supplyChain.compositeRiskScore,
      }).toMatchSnapshot();
    });
  }
});

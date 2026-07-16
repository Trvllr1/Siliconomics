import { Build, Snapshot } from '../types';
import { computeBuildMetrics } from './mathEngine';

export interface SensitivityPoint {
  variation: number;
  label: string;
  grossMargin: number;
  roi: number;
  grossCostPerGoodDie: number;
  breakEvenVolumeMillion: number;
  lifetimeNetProfitMillion: number;
}

export interface SensitivityResult {
  paramName: string;
  paramLabel: string;
  baseline: number;
  points: SensitivityPoint[];
}

export type SensitivityParam = 'defectDensity' | 'waferCost' | 'asp' | 'dieArea' | 'nreCost' | 'packagingYield' | 'testYield' | 'targetVolume' | 'packagingCost';

const PARAM_META: Record<SensitivityParam, { label: string; unit: string }> = {
  defectDensity: { label: 'Defect Density D0', unit: 'def/cm²' },
  waferCost: { label: 'Wafer Cost', unit: '$' },
  asp: { label: 'ASP', unit: '$' },
  dieArea: { label: 'Die Area', unit: 'mm²' },
  nreCost: { label: 'NRE Cost', unit: '$M' },
  packagingYield: { label: 'Packaging Yield', unit: '%' },
  testYield: { label: 'Test Yield', unit: '%' },
  targetVolume: { label: 'Target Volume', unit: 'M units' },
  packagingCost: { label: 'Packaging Cost', unit: '$' },
};

const VARIATIONS = [-20, -10, -5, 5, 10, 20];

function cloneBuild(build: Build): Build {
  return { ...build, designModel: { ...build.designModel } };
}

function applyVariation(build: Build, param: SensitivityParam, pct: number): Build {
  const updated = cloneBuild(build);
  const dm = updated.designModel;
  const current = dm[param] as number;
  dm[param] = Math.max(0, current * (1 + pct / 100));
  if (param === 'packagingYield' || param === 'testYield') {
    dm[param] = Math.min(100, Math.max(0, dm[param]));
  }
  return updated;
}

export function computeSensitivity(build: Build, baseSnap: Snapshot): SensitivityResult[] {
  const dm = build.designModel;
  const results: SensitivityResult[] = [];
  const params: SensitivityParam[] = ['defectDensity', 'waferCost', 'asp', 'dieArea', 'nreCost', 'packagingYield', 'testYield', 'targetVolume', 'packagingCost'];

  for (const param of params) {
    const baseline = dm[param] as number;
    const points: SensitivityPoint[] = [];

    for (const varPct of VARIATIONS) {
      const variedBuild = applyVariation(build, param, varPct);
      const snap = computeBuildMetrics(variedBuild).snapshot;
      const varLabel = `${varPct >= 0 ? '+' : ''}${varPct}%`;
      points.push({
        variation: varPct,
        label: varLabel,
        grossMargin: snap.grossMargin,
        roi: snap.roi,
        grossCostPerGoodDie: snap.grossCostPerGoodDie,
        breakEvenVolumeMillion: snap.breakEvenVolumeMillion,
        lifetimeNetProfitMillion: snap.lifetimeNetProfitMillion,
      });
    }

    results.push({
      paramName: param,
      paramLabel: PARAM_META[param].label,
      baseline,
      points,
    });
  }

  return results;
}

export function getTopSensitivities(
  results: SensitivityResult[],
  metric: keyof Omit<SensitivityPoint, 'variation' | 'label'>,
): { paramName: string; paramLabel: string; impact: number }[] {
  return results
    .map((r) => {
      const min = Math.min(...r.points.map((p) => p[metric]));
      const max = Math.max(...r.points.map((p) => p[metric]));
      return { paramName: r.paramName, paramLabel: r.paramLabel, impact: max - min };
    })
    .sort((a, b) => b.impact - a.impact);
}

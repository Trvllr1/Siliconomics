import { computeBuildMetrics } from '../../utils/mathEngine';
import { computeTimeProjection } from '../../utils/timeEngine';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import type { Build, Snapshot, QuarterlyProjection, MetricCardData, CalculationTrace } from '../../types';

const DEFAULT_BUILD: Build = DEFAULT_BUILDS[0]!;
const COMPARISON_BUILD: Build = DEFAULT_BUILDS[1]!;

export function getDefaultBuild(): Build {
  return DEFAULT_BUILD;
}

export function getComparisonBuild(): Build {
  return COMPARISON_BUILD;
}

export function getMetrics(): ComputedSiteMetrics {
  const result = computeBuildMetrics(DEFAULT_BUILD);
  return {
    snapshot: result.snapshot,
    build: DEFAULT_BUILD,
  };
}

export interface ComputedSiteMetrics {
  snapshot: Snapshot;
  build: Build;
}

export function getComparisonMetrics(): ComputedSiteMetrics {
  const result = computeBuildMetrics(COMPARISON_BUILD);
  return {
    snapshot: result.snapshot,
    build: COMPARISON_BUILD,
  };
}

export function getTimeProjections(): QuarterlyProjection[] {
  const build = DEFAULT_BUILD;
  if (!build.timeModel) return [];
  const result = computeTimeProjection(build);
  return result.projection;
}

export function getComparisonTimeProjections(): QuarterlyProjection[] {
  const build = COMPARISON_BUILD;
  if (!build.timeModel) return [];
  const result = computeTimeProjection(build);
  return result.projection;
}

export function getTraceForMetric(metricId: string): CalculationTrace | null {
  const { snapshot } = getMetrics();
  const metric = snapshot.metricsList.find(m => m.id === metricId);
  return metric?.trace ?? null;
}

export function computeMetricsForBuild(build: Build): ComputedSiteMetrics {
  const result = computeBuildMetrics(build);
  return { snapshot: result.snapshot, build };
}

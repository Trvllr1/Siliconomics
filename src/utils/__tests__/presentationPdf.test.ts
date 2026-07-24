import { describe, expect, it } from 'vitest';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import { computeBuildMetrics } from '../mathEngine';
import { computeBusinessImpact } from '../BusinessImpact';
import { evaluateBuild } from '../ExecutiveRecommendation';
import { generatePresentationPdf, presentationFilename } from '../presentationPdf';

describe('presentation PDF export', () => {
  const build = DEFAULT_BUILDS.find((item) => item.id === 'manhattan-x1')!;
  const comparisonBuild = DEFAULT_BUILDS.find((item) => item.id === 'manhattan-x2')!;
  const snapshot = computeBuildMetrics(build).snapshot;
  const comparisonSnapshot = computeBuildMetrics(comparisonBuild).snapshot;

  it('generates a seven-slide landscape decision presentation', () => {
    const document = generatePresentationPdf({
      build,
      snapshot,
      recommendation: evaluateBuild(snapshot, build.designModel),
      comparisonBuild,
      comparisonSnapshot,
      comparisonRecommendation: evaluateBuild(comparisonSnapshot, comparisonBuild.designModel),
      impacts: computeBusinessImpact(build, snapshot, comparisonBuild, comparisonSnapshot),
      decisions: [],
    });

    expect(document.getNumberOfPages()).toBe(7);
    expect(document.internal.pageSize.getWidth()).toBeGreaterThan(document.internal.pageSize.getHeight());
  });

  it('uses a build-specific PDF filename', () => {
    expect(presentationFilename(build)).toMatch(/^siliconomics-presentation-manhattan-x1-adas-soc-v2-4-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});

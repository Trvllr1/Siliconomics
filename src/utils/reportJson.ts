/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Machine-readable JSON artifacts.
 *
 * The JSON export is the canonical, lossless representation of a program
 * report: full build definition, computed snapshot with calculation traces,
 * time-phased projection, recommendation, sensitivity, decisions, and the
 * SHA-256 integrity envelope. Suitable for archival, downstream BI ingestion,
 * and independent recomputation/verification.
 */

import { Decision } from '../types';
import { ReportPackage, REPORT_ENGINE_VERSION, REPORT_SCHEMA_VERSION } from './reportData';

function reportEnvelope(pkg: ReportPackage) {
  return {
    artifact: 'siliconomics.program-report',
    schemaVersion: REPORT_SCHEMA_VERSION,
    generator: REPORT_ENGINE_VERSION,
    generatedAt: pkg.generatedAt,
    documentId: pkg.documentId,
    classification:
      pkg.build.status === 'Approved'
        ? 'CONFIDENTIAL'
        : 'CONFIDENTIAL - DRAFT, NOT APPROVED FOR DECISION USE',
    integrity: pkg.integrity,
    reproducibility: {
      formulaVersion: pkg.build.formulaVersion,
      dataVintage: pkg.build.dataVintage ?? null,
      note: 'Outputs are deterministic: identical designModel + formulaVersion + data vintage reproduce every figure in this artifact.',
    },
    build: pkg.build,
    recommendation: pkg.recommendation,
    executiveBriefing: pkg.briefing,
    snapshot: pkg.snapshot,
    sensitivity: {
      variationBandPct: 20,
      topDrivers: pkg.sensitivityDrivers,
      detail: pkg.sensitivityDetail,
    },
    timeProjection: pkg.time
      ? {
          programConstraint: pkg.time.programConstraint,
          constraintExplanation: pkg.time.constraintExplanation,
          breakEvenQuarter: pkg.time.breakEvenQuarter,
          baseline: pkg.time.baseline,
          withRespin: pkg.time.withRespin,
          expected: pkg.time.expected,
        }
      : null,
    decisions: pkg.decisions,
  };
}

export function buildReportJson(pkg: ReportPackage): string {
  return JSON.stringify(reportEnvelope(pkg), null, 2);
}

export function portfolioJson(pkgs: ReportPackage[], decisions: Decision[]): string {
  return JSON.stringify(
    {
      artifact: 'siliconomics.portfolio-report',
      schemaVersion: REPORT_SCHEMA_VERSION,
      generator: REPORT_ENGINE_VERSION,
      generatedAt: new Date().toISOString(),
      buildCount: pkgs.length,
      reports: pkgs.map(reportEnvelope),
      decisionLog: decisions,
    },
    null,
    2
  );
}

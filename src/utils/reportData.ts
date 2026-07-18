/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Report data assembler — the single source of truth for every export format.
 *
 * All exporters (PDF, CSV, JSON) consume a ReportPackage assembled here so
 * that a board packet, an analysis workbook, and a machine-readable artifact
 * generated in the same session are guaranteed to agree on every number.
 *
 * Each package carries a SHA-256 fingerprint of the build's designModel —
 * the same field the server hashes when a build is frozen (Constitution
 * Art. VI) — so any exported document can be verified against the system of
 * record.
 */

import {
  Build,
  Decision,
  Snapshot,
  ArchitectureBlock,
  DataVintage,
} from '../types';
import { computeBuildMetrics } from './mathEngine';
import { computeTimeProjection, TimeEngineResult } from './timeEngine';
import { generateBriefing, ExecutiveBriefing } from './ExecutiveBriefing';
import { evaluateBuild, RecommendationDetail } from './ExecutiveRecommendation';
import { computeSensitivity, getTopSensitivities, SensitivityResult } from './SensitivityAnalysis';
import { getFreshness, FreshnessInfo } from './dataFreshness';

export const REPORT_ENGINE_VERSION = 'Siliconomics Report Engine v2.0';
export const REPORT_SCHEMA_VERSION = '2.0';

export interface ReportIntegrity {
  algorithm: 'SHA-256';
  scope: 'designModel';
  designModelHash: string;
  computedAt: string;
}

export interface SensitivityDriver {
  paramName: string;
  paramLabel: string;
  /** Gross-margin swing in percentage points across the ±20% variation band. */
  grossMarginSwingPp: number;
  /** Lifetime net-profit swing in $M across the ±20% variation band. */
  netProfitSwingM: number;
}

export interface VintageRow {
  item: string;
  value: string;
  verified: string | null;
  freshness: FreshnessInfo | null;
}

export interface ReportPackage {
  build: Build;
  snapshot: Snapshot;
  blocks: ArchitectureBlock[];
  briefing: ExecutiveBriefing;
  recommendation: RecommendationDetail;
  /** Quarterly time-phased projection; null when the build has no timeModel. */
  time: TimeEngineResult | null;
  sensitivityDrivers: SensitivityDriver[];
  sensitivityDetail: SensitivityResult[];
  /** Decisions on record that reference this build. */
  decisions: Decision[];
  vintageRows: VintageRow[];
  integrity: ReportIntegrity;
  documentId: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Integrity
// ---------------------------------------------------------------------------

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

function buildVintageRows(vintage: DataVintage | undefined): VintageRow[] {
  if (!vintage) return [];
  return [
    {
      item: 'Reference model dataset',
      value: vintage.referenceModelVersion,
      verified: vintage.referenceModelVerified,
      freshness: getFreshness(vintage.referenceModelVerified),
    },
    {
      item: 'Packaging cost model',
      value: vintage.packagingModelVersion,
      verified: null,
      freshness: null,
    },
    {
      item: 'Commodity price data',
      value: vintage.commodityPriceDate,
      verified: vintage.commodityPriceDate,
      freshness: getFreshness(vintage.commodityPriceDate),
    },
  ];
}

export async function assembleReportPackage(
  build: Build,
  allDecisions: Decision[] = []
): Promise<ReportPackage> {
  const { snapshot } = computeBuildMetrics(build);
  const blocks = build.architecture?.blocks ?? [];
  const briefing = generateBriefing(build, snapshot);
  const recommendation = evaluateBuild(snapshot, build.designModel);
  const time = build.timeModel ? computeTimeProjection(build) : null;

  const sensitivityDetail = computeSensitivity(build, snapshot);
  const byMargin = getTopSensitivities(sensitivityDetail, 'grossMargin');
  const byProfit = new Map(
    getTopSensitivities(sensitivityDetail, 'lifetimeNetProfitMillion').map((d) => [d.paramName, d.impact])
  );
  const sensitivityDrivers: SensitivityDriver[] = byMargin.slice(0, 5).map((d) => ({
    paramName: d.paramName,
    paramLabel: d.paramLabel,
    grossMarginSwingPp: d.impact,
    netProfitSwingM: byProfit.get(d.paramName) ?? 0,
  }));

  const generatedAt = new Date().toISOString();
  const designModelHash = await sha256Hex(JSON.stringify(build.designModel));
  const idPart = build.id.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12) || 'BUILD';
  const documentId = `SIL-${idPart}-${designModelHash.slice(0, 8).toUpperCase()}`;

  return {
    build,
    snapshot,
    blocks,
    briefing,
    recommendation,
    time,
    sensitivityDrivers,
    sensitivityDetail,
    decisions: allDecisions.filter((d) => d.buildIds.includes(build.id)),
    vintageRows: buildVintageRows(build.dataVintage),
    integrity: {
      algorithm: 'SHA-256',
      scope: 'designModel',
      designModelHash,
      computedAt: generatedAt,
    },
    documentId,
    generatedAt,
  };
}

// ---------------------------------------------------------------------------
// Shared formatting — one implementation so every artifact renders numbers
// identically.
// ---------------------------------------------------------------------------

export function fmtUsd(value: number, decimals = 2): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function fmtMillions(valueM: number, decimals = 1): string {
  if (Math.abs(valueM) >= 1000) return `$${(valueM / 1000).toFixed(2)}B`;
  return `$${valueM.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}M`;
}

export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function fmtNum(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'build';
}

export function exportFilename(build: Build, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `siliconomics-${slugify(build.name)}-${slugify(build.version)}-${date}.${ext}`;
}

// ---------------------------------------------------------------------------
// Download helper (browser only)
// ---------------------------------------------------------------------------

export function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

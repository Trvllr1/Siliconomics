/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataProvenance, CommodityPrice, FormulaEntry, ReferenceModel, DataVintage } from '../types';

export type FreshnessLevel = 'fresh' | 'aging' | 'stale';

export interface FreshnessInfo {
  level: FreshnessLevel;
  daysSinceVerified: number;
  label: string;
}

const FRESH_THRESHOLD = 90;
const STALE_THRESHOLD = 180;

export function getFreshness(lastVerified: string, now?: Date): FreshnessInfo {
  const nowDate = now ?? new Date();
  const verified = new Date(lastVerified);
  const diffMs = nowDate.getTime() - verified.getTime();
  const daysSinceVerified = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let level: FreshnessLevel;
  let label: string;

  if (daysSinceVerified <= FRESH_THRESHOLD) {
    level = 'fresh';
    label = `${daysSinceVerified}d old — fresh`;
  } else if (daysSinceVerified <= STALE_THRESHOLD) {
    level = 'aging';
    label = `${daysSinceVerified}d old — aging`;
  } else {
    level = 'stale';
    label = `${daysSinceVerified}d old — stale`;
  }

  return { level, daysSinceVerified, label };
}

export interface DatasetFreshnessSummary {
  referenceModels: { total: number; fresh: number; aging: number; stale: number };
  formulas: { total: number; fresh: number; aging: number; stale: number };
  commodityPrices: { total: number; fresh: number; aging: number; stale: number };
  packagingModel: FreshnessInfo | null;
  overallLevel: FreshnessLevel;
}

export function summarizeDatasetFreshness(
  models: ReferenceModel[],
  formulas: FormulaEntry[],
  prices: CommodityPrice[],
  packagingLastVerified: string | null,
  now?: Date,
): DatasetFreshnessSummary {
  const count = (arr: FreshnessInfo[]) => ({
    total: arr.length,
    fresh: arr.filter((f) => f.level === 'fresh').length,
    aging: arr.filter((f) => f.level === 'aging').length,
    stale: arr.filter((f) => f.level === 'stale').length,
  });

  const modelFreshness = models.map((m) => getFreshness(m.provenance.lastVerified, now));
  const formulaFreshness = formulas.map((f) => getFreshness(f.lastValidated, now));
  const priceFreshness = prices.map((p) => getFreshness(p.updatedDate, now));
  const packagingFreshness = packagingLastVerified ? getFreshness(packagingLastVerified, now) : null;

  const all = [...modelFreshness, ...formulaFreshness, ...priceFreshness];
  if (packagingFreshness) all.push(packagingFreshness);

  const staleCount = all.filter((f) => f.level === 'stale').length;
  const agingCount = all.filter((f) => f.level === 'aging').length;

  let overallLevel: FreshnessLevel;
  if (staleCount > 0) {
    overallLevel = 'stale';
  } else if (agingCount > 0) {
    overallLevel = 'aging';
  } else {
    overallLevel = 'fresh';
  }

  return {
    referenceModels: count(modelFreshness),
    formulas: count(formulaFreshness),
    commodityPrices: count(priceFreshness),
    packagingModel: packagingFreshness,
    overallLevel,
  };
}

export function getProvenanceSummary(provenance: DataProvenance): string {
  const confidenceLabel = { high: 'High', medium: 'Medium', low: 'Low' }[provenance.confidence];
  const typeLabel = provenance.sourceType.replace(/-/g, ' ');
  return `${provenance.source} (${typeLabel}, ${confidenceLabel} confidence)`;
}

export function stampDataVintage(
  referenceModels: ReferenceModel[],
  packagingModelVersion: string,
  commodityPrices: CommodityPrice[],
): DataVintage {
  const latestRefModel = referenceModels.reduce((latest, m) =>
    m.updatedDate > latest.updatedDate ? m : latest,
  );
  const latestPrice = commodityPrices.reduce((latest, p) =>
    p.updatedDate > latest.updatedDate ? p : latest,
  );

  return {
    referenceModelVersion: latestRefModel.version,
    referenceModelVerified: latestRefModel.provenance.lastVerified,
    packagingModelVersion,
    commodityPriceDate: latestPrice.updatedDate,
  };
}

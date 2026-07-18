import { describe, it, expect } from 'vitest';
import { DEFAULT_REFERENCE_MODELS } from '../../data/defaultReferenceModels';
import { DEFAULT_COMMODITY_PRICES } from '../../data/defaultCommodityPrices';
import { DEFAULT_FORMULA_LIBRARY } from '../../data/defaultFormulaLibrary';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import { PACKAGING_MODEL_PROVENANCE } from '../../data/packagingCostModel';
import { getFreshness, summarizeDatasetFreshness, getProvenanceSummary } from '../dataFreshness';
import type { DataProvenanceSourceType, DataConfidence } from '../../types';

const VALID_SOURCE_TYPES: DataProvenanceSourceType[] = ['vendor-quote', 'analyst-estimate', 'published-list-price', 'literature', 'internal-assumption'];
const VALID_CONFIDENCE: DataConfidence[] = ['high', 'medium', 'low'];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

describe('DataProvenance — DEFAULT_REFERENCE_MODELS', () => {
  it('every model has provenance with valid fields', () => {
    for (const m of DEFAULT_REFERENCE_MODELS) {
      expect(m.provenance).toBeDefined();
      expect(m.provenance.source).toBeTruthy();
      expect(VALID_SOURCE_TYPES).toContain(m.provenance.sourceType);
      expect(VALID_CONFIDENCE).toContain(m.provenance.confidence);
      expect(m.provenance.lastVerified).toMatch(ISO_DATE_RE);
    }
  });
});

describe('DataProvenance — DEFAULT_COMMODITY_PRICES', () => {
  it('every commodity price has confidence', () => {
    for (const p of DEFAULT_COMMODITY_PRICES) {
      expect(VALID_CONFIDENCE).toContain(p.confidence);
      expect(p.updatedDate).toMatch(ISO_DATE_RE);
    }
  });
});

describe('DataProvenance — DEFAULT_FORMULA_LIBRARY', () => {
  it('every formula has lastValidated', () => {
    for (const f of DEFAULT_FORMULA_LIBRARY) {
      expect(f.lastValidated).toMatch(ISO_DATE_RE);
    }
  });
});

describe('DataProvenance — PACKAGING_MODEL', () => {
  it('packaging model has provenance with valid fields', () => {
    expect(PACKAGING_MODEL_PROVENANCE.source).toBeTruthy();
    expect(VALID_SOURCE_TYPES).toContain(PACKAGING_MODEL_PROVENANCE.sourceType);
    expect(VALID_CONFIDENCE).toContain(PACKAGING_MODEL_PROVENANCE.confidence);
    expect(PACKAGING_MODEL_PROVENANCE.lastVerified).toMatch(ISO_DATE_RE);
  });
});

describe('DataProvenance — DEFAULT_BUILDS', () => {
  it('every default build has dataVintage', () => {
    for (const b of DEFAULT_BUILDS) {
      expect(b.dataVintage).toBeDefined();
      expect(b.dataVintage!.referenceModelVersion).toBeTruthy();
      expect(b.dataVintage!.referenceModelVerified).toMatch(ISO_DATE_RE);
      expect(b.dataVintage!.packagingModelVersion).toBeTruthy();
      expect(b.dataVintage!.commodityPriceDate).toMatch(ISO_DATE_RE);
    }
  });
});

describe('getFreshness', () => {
  it('returns fresh for dates within 90 days', () => {
    const result = getFreshness('2026-07-15', new Date('2026-08-01'));
    expect(result.level).toBe('fresh');
    expect(result.daysSinceVerified).toBeLessThanOrEqual(90);
  });

  it('returns aging for dates between 90 and 180 days', () => {
    const result = getFreshness('2026-01-01', new Date('2026-05-01'));
    expect(result.level).toBe('aging');
    expect(result.daysSinceVerified).toBeGreaterThan(90);
  });

  it('returns stale for dates older than 180 days', () => {
    const result = getFreshness('2026-01-01', new Date('2026-07-15'));
    expect(result.level).toBe('stale');
    expect(result.daysSinceVerified).toBeGreaterThan(180);
  });

  it('uses Date.now() when no second argument given', () => {
    const recent = new Date().toISOString().split('T')[0]!;
    const result = getFreshness(recent);
    expect(result.level).toBe('fresh');
  });

  it('boundary at exactly 90 days is fresh', () => {
    const result = getFreshness('2026-01-15', new Date('2026-04-15'));
    expect(result.level).toBe('fresh');
    expect(result.daysSinceVerified).toBe(90);
  });

  it('boundary at exactly 91 days is aging', () => {
    const result = getFreshness('2026-01-15', new Date('2026-04-16'));
    expect(result.level).toBe('aging');
    expect(result.daysSinceVerified).toBe(91);
  });
});

describe('summarizeDatasetFreshness', () => {
  it('returns correct counts against live dataset', () => {
    const summary = summarizeDatasetFreshness(
      DEFAULT_REFERENCE_MODELS,
      DEFAULT_FORMULA_LIBRARY,
      DEFAULT_COMMODITY_PRICES,
      PACKAGING_MODEL_PROVENANCE.lastVerified,
      new Date('2026-07-17'),
    );
    expect(summary.referenceModels.total).toBe(DEFAULT_REFERENCE_MODELS.length);
    expect(summary.formulas.total).toBe(DEFAULT_FORMULA_LIBRARY.length);
    expect(summary.commodityPrices.total).toBe(DEFAULT_COMMODITY_PRICES.length);
    expect(summary.packagingModel).not.toBeNull();
  });

  it('has some stale entries when evaluated at production date', () => {
    const summary = summarizeDatasetFreshness(
      DEFAULT_REFERENCE_MODELS,
      DEFAULT_FORMULA_LIBRARY,
      DEFAULT_COMMODITY_PRICES,
      PACKAGING_MODEL_PROVENANCE.lastVerified,
      new Date('2026-07-17'),
    );
    // The dataset includes entries from 2025 (ref-node-10nm, ref-pkg-standard)
    // which are >180d stale by July 2026
    expect(summary.overallLevel).toBe('stale');
    expect(summary.referenceModels.stale).toBeGreaterThan(0);
  });

  it('classifies everything stale with far-future injected date', () => {
    const summary = summarizeDatasetFreshness(
      DEFAULT_REFERENCE_MODELS,
      DEFAULT_FORMULA_LIBRARY,
      DEFAULT_COMMODITY_PRICES,
      PACKAGING_MODEL_PROVENANCE.lastVerified,
      new Date('2027-07-17'),
    );
    expect(summary.referenceModels.stale).toBe(DEFAULT_REFERENCE_MODELS.length);
    expect(summary.formulas.stale).toBe(DEFAULT_FORMULA_LIBRARY.length);
    expect(summary.commodityPrices.stale).toBe(DEFAULT_COMMODITY_PRICES.length);
  });
});

describe('getProvenanceSummary', () => {
  it('returns a non-empty string', () => {
    const summary = getProvenanceSummary(DEFAULT_REFERENCE_MODELS[0]!.provenance);
    expect(summary).toBeTruthy();
    expect(typeof summary).toBe('string');
  });
});

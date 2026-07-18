/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Externalized cost-model constants for advanced packaging and supply-chain scoring.
 * These were previously hardcoded inside mathEngine.ts. Keeping them here makes the
 * assumptions auditable and easy to update as market pricing moves.
 */

import { PackagingType } from '../types';

export interface AdvancedPackagingConfig {
  /** Interposer/RDL cost per mm² (USD). 0 for bridge-based (EMIB) pricing. */
  costPerMm2: number;
  /** Interposer or bridge manufacturing yield (fraction, 0-1). */
  yield: number;
  label: string;
}

/**
 * Advanced packaging interposer pricing and yield assumptions.
 * Sources: TSMC CoWoS pricing disclosures (2025-2026 press/analyst estimates),
 * NVIDIA B200 teardown estimates. These are modeling assumptions, not quotes —
 * revisit quarterly.
 */
export const PACKAGING_COST_MODEL: Record<Exclude<PackagingType, 'standard'>, AdvancedPackagingConfig> = {
  'cowos-s': { costPerMm2: 3.5, yield: 0.96, label: 'CoWoS-S Silicon Interposer' },
  'cowos-r': { costPerMm2: 1.2, yield: 0.98, label: 'CoWoS-R RDL Interposer' },
  'cowos-l': { costPerMm2: 2.2, yield: 0.97, label: 'CoWoS-L Local SI + RDL' },
  emib: { costPerMm2: 0, yield: 0.99, label: 'Intel EMIB' },
};

/** EMIB is priced per embedded bridge rather than per mm². */
export const EMIB_BRIDGE_COST_USD = 12.0;
export const PACKAGING_COST_MODEL_VERSION = 'v1.1';
export const PACKAGING_MODEL_PROVENANCE = { source: 'TSMC CoWoS pricing disclosures (2025-2026 press/analyst estimates), NVIDIA B200 teardown estimates', sourceType: 'analyst-estimate' as const, confidence: 'medium' as const, lastVerified: '2026-07-01' };
export const EMIB_BRIDGES_PER_PACKAGE = 2;

/**
 * Supply-chain scoring weights. These are heuristic modeling weights (not sourced
 * from an industry standard) — they encode the assumption that licensed-IP dependence
 * and high-risk suppliers contribute equally to concentration risk, and that lead-time
 * volatility is dominated by high-risk blocks.
 */
export const SUPPLY_CHAIN_WEIGHTS = {
  supplierConcentration: { licensedWeight: 50, highRiskWeight: 50 },
  leadTimeVolatility: { high: 60, medium: 30, low: 10 },
  /** Maximum risk-adjusted cost uplift applied to silicon cost at 100% composite risk. */
  maxRiskCostUplift: 0.15,
  /** Flat per-unit commodity adder assumed for advanced packaging materials (USD). */
  advancedPackagingCommodityAdder: 15,
} as const;

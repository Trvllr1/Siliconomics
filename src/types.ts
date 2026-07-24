/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PersonaType = 'architect' | 'manufacturing' | 'finance' | 'program' | 'executive';

export interface CalculationTrace {
  name: string;
  equation: string;
  inputs: { [key: string]: number | string };
  definition: string;
  referenceModel: string;
  version: string;
  calculationPath: string[];
}

export interface MetricCardData {
  id: string;
  label: string;
  value: string;
  unit: string;
  confidence: number; // percentage (e.g. 95)
  delta: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  formula: string;
  reference: string;
  trend: 'up' | 'down' | 'flat';
  trace: CalculationTrace;
  category: 'engineering' | 'manufacturing' | 'financial' | 'program' | 'commercial';
}

export type BlockCategory = 'cpu' | 'memory' | 'security' | 'interconnect' | 'accelerator' | 'io' | 'power' | 'packaging' | 'networking' | 'rf' | 'clocking' | 'other';

export interface ArchitectureBlock {
  name: string;
  category: BlockCategory;
  purpose: string;
  implementation: 'internal' | 'licensed' | 'open-source' | 'custom';

  estimatedAreaMm2: number;
  measuredAreaMm2?: number;

  estimatedPowerW?: number;
  measuredPowerW?: number;

  nreImpactM?: number;
  licensingCostM?: number;
  royaltyPerUnit?: number;
  scheduleImpactWeeks?: number;

  verificationEffortPersonMonths?: number;
  manufacturingCriticality: 'low' | 'medium' | 'high' | 'critical';
  supplyChainRisk: 'none' | 'low' | 'medium' | 'high';

  replaces?: string;
}

export interface ArchitectureComposition {
  blocks: ArchitectureBlock[];
  version: string;
  rationale?: string;
}

export type CostContributorCategory = 'silicon' | 'packaging' | 'test' | 'ip-license' | 'ip-royalty' | 'labor' | 'mask' | 'architecture-block' | 'commodity';

export type DataProvenanceSourceType = 'vendor-quote' | 'analyst-estimate' | 'published-list-price' | 'literature' | 'internal-assumption';

export type DataConfidence = 'high' | 'medium' | 'low';

export interface DataProvenance {
  source: string;
  sourceType: DataProvenanceSourceType;
  confidence: DataConfidence;
  lastVerified: string;
  notes?: string;
}

export type CommodityCategory = 'wafer' | 'substrate' | 'interposer' | 'mold-compound' | 'underfill' | 'solder-ball' | 'test-socket' | 'probe-card' | 'memory';

export interface CommodityPrice {
  id: string;
  name: string;
  category: CommodityCategory;
  unit: string;
  priceUsd: number;
  source: string;
  region: string;
  updatedDate: string;
  notes: string;
  confidence: DataConfidence;
}

export type SupplyChainRiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export interface SupplyChainSnapshot {
  compositeRiskScore: number;
  riskLevel: SupplyChainRiskLevel;
  highRiskBlockCount: number;
  totalBlockCount: number;
  commodityCostPerUnit: number;
  supplierConcentrationScore: number;
  geopoliticalRiskScore: number;
  leadTimeVolatilityScore: number;
  riskAdjustedCostAdder: number;
  topCommodityCosts: { name: string; costPerUnit: number; category: CommodityCategory }[];
}

export interface CostContributor {
  name: string;
  category: CostContributorCategory;
  costPerUnit: number;
  percentageOfTotal: number;
  description: string;
}

export type FoundryType = 'tsmc' | 'intel' | 'samsung' | 'globalfoundries';

export type PackagingType = 'standard' | 'cowos-s' | 'cowos-r' | 'cowos-l' | 'emib';

export interface MpwConfig {
  enabled: boolean;
  participants: number;
  shuttleCostPerSlot: number;
  diesPerSlot: number;
  shuttlesPerYear: number;
  reticleSlotArea: number;
}

export interface DesignModel {
  processNode: string;
  dieArea: number;
  dieWidth: number;
  dieHeight: number;
  transistorCount: number;
  tdp: number;
  topology: 'monolithic' | 'chiplet';
  chipletCount: number;
  ioDieArea: number;
  defectDensity: number;
  waferStartsPerMonth: number;
  packagingCost: number;
  testTimeSeconds: number;
  testCostPerSecond: number;
  packagingYield: number;
  testYield: number;
  waferCost: number;
  nreCost: number;
  asp: number;
  targetVolume: number;
  foundry: FoundryType;
  packagingType: PackagingType;
  interposerArea?: number;
  mpw?: MpwConfig;
  laborReferenceModelId?: string;
  designEffortPersonMonths?: number;
  resolvedLaborRateDesign?: number;
  verificationReferenceModelId?: string;
  resolvedLaborRateVerification?: number;
}

export interface RespinConfig {
  probability: number;       // 0-1, e.g. 0.35 = 35% chance of needing a respin
  costM: number;             // mask-set cost in $M for the respin
  scheduleDelayQuarters: number;  // quarters of delay from respin
  yieldImpact: number;       // D0 multiplier after respin (e.g. 1.2 = 20% worse D0 temporarily)
  recoveryQuarters: number;  // quarters to recover baseline yield after respin
}

export interface QuarterlyProjection {
  quarter: number;           // 0 = first production quarter
  label: string;             // e.g. "Q1 2027"
  d0: number;                // defect density this quarter
  dieYield: number;          // Murphy yield at this quarter's D0
  effectiveYield: number;    // full stack yield
  goodUnits: number;         // shipped units this quarter
  supplyUnits: number;       // max possible from wafer supply
  demandUnits: number;       // demand from targetVolume distribution
  asp: number;               // selling price this quarter
  revenueM: number;          // revenue in $M
  cogsM: number;             // COGS in $M
  grossProfitM: number;      // gross profit in $M
  cumulativeNreM: number;    // cumulative NRE spent so far
  netProfitM: number;        // quarterly net profit
  cumulativeCashFlowM: number; // cumulative cash flow
  isRespinQuarter: boolean;  // true if respin occurs this quarter
}

export interface TimeModel {
  // D0 yield-learning curve: D0(q) = d0Mature + (d0Initial - d0Mature) * exp(-q / tau)
  d0Initial: number;          // starting defect density (defects/cm²)
  d0Mature: number;           // mature/long-run defect density
  d0Tau: number;              // learning rate time constant (quarters)

  // Volume ramp
  rampShape: 'linear' | 's-curve' | 'flat';
  rampDurationQuarters: number; // quarters to reach full production
  peakQuarterlyVolumeMillion: number; // max quarterly shipped units (M)

  // ASP erosion
  annualAspErosionPct: number;  // e.g. 3 = 3% per year (~0.75% per quarter)

  // Supply constraint
  maxQuarterlySupplyMillion: number; // max units from wafer starts (M)

  // Respin
  respin: RespinConfig | null;

  // Horizon
  projectionQuarters: number;  // default 20 (5 years)

  // Volume allocation across quarters (demand distribution)
  // If not set, distributes targetVolume evenly across projectionQuarters
  volumeAllocation: 'even' | 'front-loaded' | 'back-loaded' | 'bell';

  // Output (computed)
  quarterlyProjections?: QuarterlyProjection[];
}
export interface DataVintage {
  referenceModelVersion: string;
  referenceModelVerified: string;
  packagingModelVersion: string;
  commodityPriceDate: string;
}

export interface Build {
  id: string;
  name: string;
  description: string;
  creator: string;
  organization: string;
  parentId?: string;
  status: BuildStatus;
  version: string;
  owner: string;
  portfolio: string;
  createdDate: string;
  referenceModel: string;
  formulaVersion: string;
  architecture?: ArchitectureComposition;
  designModel: DesignModel;
  dataVintage?: DataVintage;
  timeModel?: TimeModel;
  frozenAt?: string | Date | null;
  contentHash?: string | null;
}

export type BuildStatus = 'Draft' | 'TechnicalReview' | 'FinancialReview' | 'ProgramReview' | 'Approved' | 'Alert';

export const STATUS_TRANSITIONS: Record<BuildStatus, { next: BuildStatus; requiredPersona: PersonaType; label: string } | null> = {
  Draft: { next: 'TechnicalReview', requiredPersona: 'architect', label: 'Submit for Technical Review' },
  TechnicalReview: { next: 'FinancialReview', requiredPersona: 'manufacturing', label: 'Approve - Pass to Finance' },
  FinancialReview: { next: 'ProgramReview', requiredPersona: 'finance', label: 'Approve - Pass to Program' },
  ProgramReview: { next: 'Approved', requiredPersona: 'executive', label: 'Final Approval' },
  Approved: null,
  Alert: null,
};

export interface Snapshot {
  totalDieArea: number;
  transistorDensity: number;
  tdpPowerDensity: number;
  dieYield: number;
  dpw: number;
  waferUtilization: number;
  rawDieCost: number;
  packagingAndTestingCost: number;
  grossCostPerGoodDie: number;
  amortizedNreCost: number;
  fullyLoadedCostPerDie: number;
  grossMargin: number;
  operatingMargin: number;
  monthlyVolumeMillion: number;
  annualVolumeMillion: number;
  lifetimeRevenueMillion: number;
  lifetimeCOGSMillion: number;
  lifetimeGrossProfitMillion: number;
  lifetimeNetProfitMillion: number;
  breakEvenVolumeMillion: number;
  roi: number;
  totalIpNreM: number;
  totalLicenseFeesM: number;
  totalRoyaltyBurdenPerUnit: number;
  engineeringLaborCostM: number;
  verificationLaborCostM: number;
  costContributors: CostContributor[];
  supplyChain: SupplyChainSnapshot;
  metricsList: MetricCardData[];
}

export interface Comment {
  id: string;
  buildId: string;
  elementId?: string; // Anchor to specific metric card or area
  author: string;
  role: string;
  content: string;
  timestamp: string;
  versionStamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
}

export interface SavedView {
  id: string;
  name: string;
  persona: PersonaType;
  buildId: string;
}

export type DecisionOutcome = 'Proceed' | 'Proceed with Risk' | 'Requires Investigation' | 'Hold' | 'Reject';

export interface Decision {
  id: string;
  buildIds: string[];
  outcome: DecisionOutcome;
  approver: string;
  rationale: string;
  followUpActions: string[];
  timestamp: string;
}

export type ReferenceModelCategory = 'foundry' | 'packaging' | 'labor' | 'mask' | 'certification' | 'cloud' | 'commodity';

export interface ReferenceModel {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ReferenceModelCategory;
  parameters: { [key: string]: number | string | boolean };
  createdDate: string;
  updatedDate: string;
  provenance: DataProvenance;
  isCustom?: boolean;
  sourceModelId?: string;
}

export interface FormulaEntry {
  id: string;
  name: string;
  category: 'engineering' | 'manufacturing' | 'financial' | 'program';
  equation: string;
  description: string;
  inputs: { name: string; unit: string; description: string }[];
  output: { name: string; unit: string; description: string };
  version: string;
  references: string[];
  affectedMetrics: string[];
  lastValidated: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  buildIds: string[];
  tags: string[];
  createdDate: string;
}

export interface ActivityLog {
  id: string;
  buildId: string;
  buildName: string;
  timestamp: string;
  type: 'modification' | 'commit';
  delta: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'engineering' | 'manufacturing' | 'supply-chain' | 'program';
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  severity: AlertSeverity;
  messageTemplate: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  buildId: string;
  buildName: string;
  triggeredValue: number;
  threshold: number;
  operator: string;
  timestamp: string;
  severity: AlertSeverity;
  category: string;
  message: string;
  acknowledged: boolean;
}

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

export type CostContributorCategory = 'silicon' | 'packaging' | 'test' | 'ip-license' | 'ip-royalty' | 'labor' | 'mask' | 'architecture-block';

export interface CostContributor {
  name: string;
  category: CostContributorCategory;
  costPerUnit: number;
  percentageOfTotal: number;
  description: string;
}

export type FoundryType = 'tsmc' | 'intel' | 'samsung';

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
}

export interface Build {
  id: string;
  name: string;
  description: string;
  creator: string;
  organization: string;
  parentId?: string;
  status: 'Approved' | 'Review' | 'Draft' | 'Alert';
  version: string;
  owner: string;
  portfolio: string;
  createdDate: string;
  referenceModel: string;
  formulaVersion: string;
  architecture?: ArchitectureComposition;
  designModel: DesignModel;
}

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
  costContributors: CostContributor[];
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

export type ReferenceModelCategory = 'foundry' | 'packaging' | 'labor' | 'mask' | 'certification' | 'cloud';

export interface ReferenceModel {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ReferenceModelCategory;
  parameters: { [key: string]: number | string | boolean };
  createdDate: string;
  updatedDate: string;
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

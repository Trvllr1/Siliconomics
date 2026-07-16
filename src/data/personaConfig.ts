import { PersonaType } from '../types';

export interface PersonaConfig {
  icon: string;
  color: string;
  label: string;
  defaultTab: string;
  metricOrder: string[];
  designFields: string[];
  blockFields: string[];
}

export const FIELD_OWNER: Record<string, PersonaType> = {
  foundry: 'architect', processNode: 'architect',
  topology: 'architect', dieArea: 'architect', ioDieArea: 'architect',
  chipletCount: 'architect', transistorCount: 'architect', tdp: 'architect',
  packagingType: 'architect', interposerArea: 'architect',
  laborReferenceModelId: 'architect', resolvedLaborRateDesign: 'architect',
  participants: 'architect', shuttleCostPerSlot: 'architect',
  diesPerSlot: 'architect', shuttlesPerYear: 'architect', reticleSlotArea: 'architect',

  defectDensity: 'manufacturing', waferStartsPerMonth: 'manufacturing',
  packagingYield: 'manufacturing', testYield: 'manufacturing',
  packagingCost: 'manufacturing', testTimeSeconds: 'manufacturing',
  testCostPerSecond: 'manufacturing', waferCost: 'manufacturing',

  nreCost: 'finance', asp: 'finance', targetVolume: 'finance',

  designEffortPersonMonths: 'program',
  verificationReferenceModelId: 'program',
  resolvedLaborRateVerification: 'program',
};

export const BLOCK_FIELD_OWNER: Record<string, PersonaType> = {
  name: 'architect', category: 'architect', purpose: 'architect',
  implementation: 'architect', estimatedAreaMm2: 'architect',
  measuredAreaMm2: 'architect', estimatedPowerW: 'architect',
  measuredPowerW: 'architect', nreImpactM: 'architect',
  licensingCostM: 'architect', replaces: 'architect',

  royaltyPerUnit: 'finance',

  scheduleImpactWeeks: 'program',
  verificationEffortPersonMonths: 'program',

  manufacturingCriticality: 'manufacturing',
  supplyChainRisk: 'manufacturing',
};

function personaFields(designKeys: string[], blockKeys: string[]): { designFields: string[]; blockFields: string[] } {
  return {
    designFields: designKeys,
    blockFields: blockKeys,
  };
}

export const PERSONA_CONFIG: Record<PersonaType, PersonaConfig> = {
  architect: {
    icon: 'Cpu',
    color: '#2563EB',
    label: 'Silicon Architect',
    defaultTab: 'build',
    metricOrder: ['engineering', 'manufacturing', 'financial', 'program'],
    ...personaFields(
      Object.entries(FIELD_OWNER).filter(([_, p]) => p === 'architect').map(([f]) => f),
      Object.entries(BLOCK_FIELD_OWNER).filter(([_, p]) => p === 'architect').map(([f]) => f),
    ),
  },
  manufacturing: {
    icon: 'Wrench',
    color: '#7C3AED',
    label: 'Foundry Engineer',
    defaultTab: 'build',
    metricOrder: ['manufacturing', 'engineering', 'financial', 'program'],
    ...personaFields(
      Object.entries(FIELD_OWNER).filter(([_, p]) => p === 'manufacturing').map(([f]) => f),
      Object.entries(BLOCK_FIELD_OWNER).filter(([_, p]) => p === 'manufacturing').map(([f]) => f),
    ),
  },
  finance: {
    icon: 'DollarSign',
    color: '#059669',
    label: 'Financial Analyst',
    defaultTab: 'build',
    metricOrder: ['financial', 'manufacturing', 'engineering', 'program'],
    ...personaFields(
      Object.entries(FIELD_OWNER).filter(([_, p]) => p === 'finance').map(([f]) => f),
      Object.entries(BLOCK_FIELD_OWNER).filter(([_, p]) => p === 'finance').map(([f]) => f),
    ),
  },
  program: {
    icon: 'Clock',
    color: '#D97706',
    label: 'Program Director',
    defaultTab: 'build',
    metricOrder: ['program', 'engineering', 'manufacturing', 'financial'],
    ...personaFields(
      Object.entries(FIELD_OWNER).filter(([_, p]) => p === 'program').map(([f]) => f),
      Object.entries(BLOCK_FIELD_OWNER).filter(([_, p]) => p === 'program').map(([f]) => f),
    ),
  },
  executive: {
    icon: 'Award',
    color: '#0D9488',
    label: 'Executive Board',
    defaultTab: 'dashboard',
    metricOrder: ['financial', 'manufacturing', 'engineering', 'program'],
    designFields: [],
    blockFields: [],
  },
};

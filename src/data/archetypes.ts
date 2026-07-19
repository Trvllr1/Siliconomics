/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Archetype templates are illustrative design starting points, not audited reference data.
 * Each archetype carries process & cost assumptions that should be validated against
 * current ReferenceModel and CommodityPrice entries before being used for production
 * cost analysis. See defaultReferenceModels.ts and defaultCommodityPrices.ts for
 * versioned, provenance-tracked baseline values.
 */

import { Build, FoundryType, PackagingType } from '../types';

export interface Archetype {
  id: string;
  name: string;
  category: 'ASIC' | 'FPGA' | 'Automotive' | 'SmartNIC' | 'NoC' | 'CoWoS' | 'Mobile AP' | 'Edge AI' | 'Custom';
  description: string;
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
  creator?: string;
  isCustom?: boolean;
}

export const PRECONFIG_ARCHETYPES: Archetype[] = [
  {
    id: 'arch-asic',
    name: 'High-Performance ASIC',
    category: 'ASIC',
    description: 'Standard high-performance enterprise custom silicon targeting machine learning, video transcoding, or computing workloads.',
    processNode: '5nm',
    dieArea: 350,
    dieWidth: 18.7,
    dieHeight: 18.7,
    transistorCount: 38.5,
    tdp: 150,
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,
    defectDensity: 0.08,
    waferStartsPerMonth: 6000,
    packagingCost: 18.50,
    testTimeSeconds: 60,
    testCostPerSecond: 0.20,
    packagingYield: 98.8,
    testYield: 98.0,
    waferCost: 9500,
    nreCost: 145,
    asp: 450,
    targetVolume: 3.5,
    foundry: 'tsmc',
    packagingType: 'standard',
  },
  {
    id: 'arch-fpga',
    name: 'High-Density System FPGA',
    category: 'FPGA',
    description: 'Reconfigurable high-pinout FPGA, featuring advanced multi-gigabit transceivers and large programmable fabric block counts.',
    processNode: '7nm',
    dieArea: 410,
    dieWidth: 20.2,
    dieHeight: 20.2,
    transistorCount: 28.0,
    tdp: 75,
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,
    defectDensity: 0.09,
    waferStartsPerMonth: 1500,
    packagingCost: 28.00,
    testTimeSeconds: 120,
    testCostPerSecond: 0.25,
    packagingYield: 98.2,
    testYield: 97.0,
    waferCost: 6200,
    nreCost: 45,
    asp: 850,
    targetVolume: 0.8,
    foundry: 'tsmc',
    packagingType: 'standard',
  },
  {
    id: 'arch-automotive',
    name: 'Safety-Grade Automotive ADAS',
    category: 'Automotive',
    description: 'ISO 26262 safety-critical processor built for autonomous vehicle sensory hubs and redundancy decision logic.',
    processNode: '5nm',
    dieArea: 260,
    dieWidth: 16.1,
    dieHeight: 16.1,
    transistorCount: 22.4,
    tdp: 45,
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,
    defectDensity: 0.08,
    waferStartsPerMonth: 8500,
    packagingCost: 12.50,
    testTimeSeconds: 45,
    testCostPerSecond: 0.18,
    packagingYield: 99.2,
    testYield: 98.5,
    waferCost: 9500,
    nreCost: 110,
    asp: 285,
    targetVolume: 4.5,
    foundry: 'tsmc',
    packagingType: 'standard',
  },
  {
    id: 'arch-smartnic',
    name: 'Hyperscale SmartNIC',
    category: 'SmartNIC',
    description: 'High-throughput data processing unit (DPU) with embedded PCIe Gen5 blocks and inline crypto acceleration.',
    processNode: '7nm',
    dieArea: 185,
    dieWidth: 13.6,
    dieHeight: 13.6,
    transistorCount: 16.8,
    tdp: 35,
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,
    defectDensity: 0.06,
    waferStartsPerMonth: 5000,
    packagingCost: 9.50,
    testTimeSeconds: 30,
    testCostPerSecond: 0.15,
    packagingYield: 99.4,
    testYield: 99.0,
    waferCost: 6200,
    nreCost: 65,
    asp: 195,
    targetVolume: 2.5,
    foundry: 'tsmc',
    packagingType: 'standard',
  },
  {
    id: 'arch-noc',
    name: 'Network-on-Chip (NoC) Hub',
    category: 'NoC',
    description: 'Interconnect controller routing high-bandwidth fabric lines across custom distributed server systems.',
    processNode: '12nm',
    dieArea: 95,
    dieWidth: 9.7,
    dieHeight: 9.7,
    transistorCount: 4.5,
    tdp: 15,
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,
    defectDensity: 0.04,
    waferStartsPerMonth: 12000,
    packagingCost: 4.20,
    testTimeSeconds: 15,
    testCostPerSecond: 0.10,
    packagingYield: 99.7,
    testYield: 99.5,
    waferCost: 3200,
    nreCost: 15,
    asp: 85,
    targetVolume: 8.0,
    foundry: 'tsmc',
    packagingType: 'standard',
  },
  {
    id: 'arch-cowos',
    name: 'CoWoS Multi-Chiplet AI Platform',
    category: 'CoWoS',
    description: 'Extreme computing platform with multiple compute tiles connected over an advanced Silicon Interposer using TSMC CoWoS packaging.',
    processNode: '3nm',
    dieArea: 145,
    dieWidth: 12.0,
    dieHeight: 12.0,
    transistorCount: 92.0,
    tdp: 350,
    topology: 'chiplet',
    chipletCount: 4,
    ioDieArea: 180,
    defectDensity: 0.12,
    waferStartsPerMonth: 4000,
    packagingCost: 48.00,
    testTimeSeconds: 90,
    testCostPerSecond: 0.25,
    packagingYield: 97.5,
    testYield: 96.0,
    waferCost: 18000,
    nreCost: 260,
    asp: 1250,
    targetVolume: 1.2,
    foundry: 'tsmc',
    packagingType: 'cowos-s',
    interposerArea: 760,
  },
  {
    id: 'arch-mobile',
    name: 'Premium Mobile AP',
    category: 'Mobile AP',
    description: 'Flagship smartphone CPU/GPU and neural engine complex, optimized for thermal envelope bounds and high high-volume cost efficiency.',
    processNode: '3nm',
    dieArea: 110,
    dieWidth: 10.5,
    dieHeight: 10.5,
    transistorCount: 19.5,
    tdp: 9,
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,
    defectDensity: 0.10,
    waferStartsPerMonth: 45000,
    packagingCost: 3.80,
    testTimeSeconds: 20,
    testCostPerSecond: 0.12,
    packagingYield: 99.0,
    testYield: 98.2,
    waferCost: 18000,
    nreCost: 210,
    asp: 115,
    targetVolume: 45.0,
    foundry: 'tsmc',
    packagingType: 'standard',
  },
  {
    id: 'arch-edge',
    name: 'Edge AI IoT Controller',
    category: 'Edge AI',
    description: 'Ultra-low cost, ultra-low power sensor ingestion controller with specialized hardware keyword spotting wake blocks.',
    processNode: '22nm',
    dieArea: 22,
    dieWidth: 4.7,
    dieHeight: 4.7,
    transistorCount: 0.45,
    tdp: 1.2,
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,
    defectDensity: 0.02,
    waferStartsPerMonth: 60000,
    packagingCost: 0.85,
    testTimeSeconds: 8,
    testCostPerSecond: 0.06,
    packagingYield: 99.8,
    testYield: 99.6,
    waferCost: 1900,
    nreCost: 15,
    asp: 18,
    targetVolume: 150.0,
    foundry: 'tsmc',
    packagingType: 'standard',
  }
];

/**
 * Create a blank Draft build from a neutral default DesignModel (5nm monolithic
 * starting point, matching the custom-archetype form defaults). Every parameter
 * is a placeholder to be reviewed in the Build Workspace — nothing here is a
 * validated assumption. This is the first-class "New Build" path promised by
 * docs/02-Product-Blueprint.md (creation not derived from an archetype or clone).
 */
export function createBlankBuild(name: string, creator: string): Build {
  const newId = `build-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  return {
    id: newId,
    name: name || 'Untitled Build',
    description: 'Blank build — every parameter starts from a neutral default and must be configured for the program.',
    creator: creator || 'eagleximpact',
    organization: 'Custom Enterprise',
    parentId: undefined,
    status: 'Draft',
    version: 'v1.0',
    owner: `${creator || 'eagleximpact'} (Silicon Architect)`,
    portfolio: 'Custom Projects',
    createdDate: new Date().toISOString().split('T')[0] ?? '',
    referenceModel: 'Blank Template',
    formulaVersion: 'Murphy-SIA-v4.3',
    designModel: {
      processNode: '5nm',
      dieArea: 250,
      dieWidth: 15.8,
      dieHeight: 15.8,
      transistorCount: 20,
      tdp: 65,
      topology: 'monolithic',
      chipletCount: 1,
      ioDieArea: 0,
      defectDensity: 0.08,
      waferStartsPerMonth: 5000,
      packagingCost: 12.5,
      testTimeSeconds: 40,
      testCostPerSecond: 0.15,
      packagingYield: 99.0,
      testYield: 98.5,
      waferCost: 9500,
      nreCost: 110,
      asp: 250,
      targetVolume: 3.0,
      foundry: 'tsmc',
      packagingType: 'standard',
    },
  };
}

export function convertArchetypeToBuild(archetype: Archetype, name: string, version: string, creator: string): Build {
  const newId = `build-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  return {
    id: newId,
    name: name || archetype.name,
    description: archetype.description,
    creator: creator || 'eagleximpact',
    organization: archetype.isCustom ? 'Custom Enterprise' : 'Siliconomics Manhattan Corp',
    parentId: undefined,
    status: 'Draft',
    version: version || 'v1.0',
    owner: `${creator || 'eagleximpact'} (Silicon Architect)`,
    portfolio: `${archetype.category} Projects`,
    createdDate: new Date().toISOString().split('T')[0] ?? '',
    referenceModel: `${archetype.name} Baseline Template`,
    formulaVersion: 'Murphy-SIA-v4.3',
    designModel: {
      processNode: archetype.processNode,
      dieArea: archetype.dieArea,
      dieWidth: archetype.dieWidth,
      dieHeight: archetype.dieHeight,
      transistorCount: archetype.transistorCount,
      tdp: archetype.tdp,
      topology: archetype.topology,
      chipletCount: archetype.chipletCount,
      ioDieArea: archetype.ioDieArea,
      defectDensity: archetype.defectDensity,
      waferStartsPerMonth: archetype.waferStartsPerMonth,
      packagingCost: archetype.packagingCost,
      testTimeSeconds: archetype.testTimeSeconds,
      testCostPerSecond: archetype.testCostPerSecond,
      packagingYield: archetype.packagingYield,
      testYield: archetype.testYield,
      waferCost: archetype.waferCost,
      nreCost: archetype.nreCost,
      asp: archetype.asp,
      targetVolume: archetype.targetVolume,
      foundry: archetype.foundry ?? 'tsmc',
      packagingType: archetype.packagingType ?? 'standard',
      interposerArea: archetype.interposerArea,
    },
  };
}

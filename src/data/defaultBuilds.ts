/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Build } from '../types';

export const DEFAULT_BUILDS: Build[] = [
  {
    id: 'manhattan-x1',
    name: 'Manhattan-X1 (ADAS SoC)',
    description: 'Advanced driver-assistance systems SoC, optimized for ISO 26262 safety-grade performance.',
    creator: 'Dr. Helen Vance',
    organization: 'Siliconomics Manhattan Corp',
    parentId: undefined,
    status: 'Approved',
    version: 'v2.4',
    owner: 'Dr. Helen Vance (Lead Architect)',
    portfolio: 'Automotive Platforms',
    createdDate: '2026-03-12',
    referenceModel: 'TSMC N4P Reference Model v1.2',
    formulaVersion: 'Murphy-SIA-v4.1',
    
    // Engineering inputs
    processNode: '5nm', // Representing 5nm/4nm class
    dieArea: 260, // mm2 (large automotive SoC)
    dieWidth: 16.1,
    dieHeight: 16.1,
    transistorCount: 22.4, // 22.4 Billion
    tdp: 45, // 45 Watts
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,

    // Manufacturing inputs
    defectDensity: 0.08, // defects/cm2 (excellent mature yield)
    waferStartsPerMonth: 8500, // solid automotive run rate
    packagingCost: 12.50, // high-reliability ball grid array
    testTimeSeconds: 45, // intensive automotive safety testing
    testCostPerSecond: 0.18, // safety-grade test cell
    packagingYield: 99.2, // high quality
    testYield: 98.5,

    // Financial inputs
    waferCost: 9500, // Mature 5nm wafer cost
    nreCost: 110, // $110M NRE (mask sets, IP validation)
    asp: 285, // $285 Average Selling Price
    targetVolume: 4.5, // 4.5 Million units over lifetime
  },
  {
    id: 'manhattan-x2',
    name: 'Manhattan-X2 (AI-Server Ultra)',
    description: 'Extreme-scale multi-chiplet accelerator targeting deep learning training payloads in enterprise datacenters.',
    creator: 'Marc Lemaire',
    organization: 'Siliconomics Manhattan Corp',
    parentId: 'manhattan-x1', // Branched off X1
    status: 'Review',
    version: 'v0.9b',
    owner: 'Marc Lemaire (VP Architecture)',
    portfolio: 'Data Center AI',
    createdDate: '2026-06-01',
    referenceModel: 'TSMC N3E High-Density Platform v2.0',
    formulaVersion: 'Murphy-SIA-v4.1',
    
    // Engineering inputs
    processNode: '3nm', // Leading edge 3nm
    dieArea: 145, // mm2 per Core Chiplet (smaller die keeps yield high)
    dieWidth: 12.0,
    dieHeight: 12.0,
    transistorCount: 92.0, // 92.0 Billion combined
    tdp: 350, // 350 Watts server class
    topology: 'chiplet',
    chipletCount: 4, // 4 Core chiplets
    ioDieArea: 180, // 1 I/O Die in 5nm or 6nm

    // Manufacturing inputs
    defectDensity: 0.12, // early 3nm defect density (higher risk)
    waferStartsPerMonth: 4000, // early production ramp
    packagingCost: 48.00, // CoWoS (Chip-on-Wafer-on-Substrate) advanced packaging
    testTimeSeconds: 90, // massive test suite for 92B transistors
    testCostPerSecond: 0.25, // ultra-high performance tester
    packagingYield: 97.5, // early advanced packaging yield
    testYield: 96.0,

    // Financial inputs
    waferCost: 18000, // Premium 3nm wafer cost
    nreCost: 260, // $260M (extreme leading-edge cost)
    asp: 1250, // $1250 Premium ASP for AI Server silicon
    targetVolume: 1.2, // 1.2 Million units for high-end server
  },
  {
    id: 'brooklyn-a2',
    name: 'Brooklyn-A2 (IoT Gateway)',
    description: 'Ultra-low-power edge communication gateway designed for massive consumer distribution channels.',
    creator: 'Sarah Connor',
    organization: 'Siliconomics Brooklyn IoT Labs',
    parentId: undefined,
    status: 'Draft',
    version: 'v1.1',
    owner: 'Sarah Connor (Senior Program Mgr)',
    portfolio: 'Edge Solutions',
    createdDate: '2026-07-10',
    referenceModel: 'Intel 16 / TSMC N7 Mature Platform v4.0',
    formulaVersion: 'Murphy-SIA-v4.1',
    
    // Engineering inputs
    processNode: '7nm', // mature low-cost node
    dieArea: 65, // mm2 (small MCU die)
    dieWidth: 8.0,
    dieHeight: 8.1,
    transistorCount: 2.1, // 2.1 Billion
    tdp: 4, // ultra low power
    topology: 'monolithic',
    chipletCount: 1,
    ioDieArea: 0,

    // Manufacturing inputs
    defectDensity: 0.04, // mature node with super clean yield
    waferStartsPerMonth: 25000, // high run-rate consumer/IoT
    packagingCost: 1.20, // cheap wirebond QFN package
    testTimeSeconds: 12, // fast simple test flow
    testCostPerSecond: 0.10, // low-cost edge tester
    packagingYield: 99.7, 
    testYield: 99.2,

    // Financial inputs
    waferCost: 5500, // Mature wafer pricing
    nreCost: 35, // Low NRE cost
    asp: 18.50, // Low cost commodity ASP
    targetVolume: 40.0, // Large volume 40 Million units
  }
];

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
  
  // Engineering inputs
  processNode: string; // Node choice
  dieArea: number; // mm2
  dieWidth: number; // mm
  dieHeight: number; // mm
  transistorCount: number; // Billions
  tdp: number; // Watts (Thermal Design Power)
  topology: 'monolithic' | 'chiplet';
  chipletCount: number; // Number of chiplets if chiplet topology
  ioDieArea: number; // Area of I/O die if chiplet

  // Manufacturing inputs
  defectDensity: number; // defects/cm2 (D0)
  waferStartsPerMonth: number; // wafers run per month
  packagingCost: number; // dollars
  testTimeSeconds: number; // seconds
  testCostPerSecond: number; // dollars
  packagingYield: number; // percentage (e.g. 98)
  testYield: number; // percentage (e.g. 97)

  // Financial inputs
  waferCost: number; // dollars
  nreCost: number; // Million dollars
  asp: number; // dollars (Average Selling Price)
  targetVolume: number; // Million units over program lifetime
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

export interface ActivityLog {
  id: string;
  buildId: string;
  buildName: string;
  timestamp: string;
  type: 'modification' | 'commit';
  delta: string;
}

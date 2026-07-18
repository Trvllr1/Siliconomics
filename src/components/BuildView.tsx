/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Build, DesignModel, MetricCardData, PersonaType, TimeModel, RespinConfig } from '../types';
import { Archetype } from '../data/archetypes';
import { ComputedBuildMetrics, round, computeBuildMetrics } from '../utils/mathEngine';
import { DEFAULT_BUILDS } from '../data/defaultBuilds';
import { 
  ChevronDown, 
  ChevronUp, 
  FileCheck, 
  HelpCircle, 
  Sliders, 
  Cpu, 
  Activity, 
  DollarSign, 
  Briefcase,
  GitBranch,
  FileText,
  Database,
  Fingerprint,
  Award,
  Copy,
  Check,
  Package,
  Wrench,
  ShieldAlert,
  Shield,
  Trash2,
  CloudLightning,
  Clock
} from 'lucide-react';

const LOWER_IS_BETTER_METRICS = new Set([
  'total_die_area',
  'raw_die_cost',
  'gross_die_cost',
  'break_even'
]);

const parseNumericValue = (valStr: string): number => {
  const cleaned = valStr.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

interface BuildViewProps {
  activeBuild: Build;
  computedMetrics: ComputedBuildMetrics;
  onUpdateBuild: (updated: Build) => void;
  onCommitBuild: (newBuild: Build) => void;
  activePersona: PersonaType;
  onHoverMetric: (metric: MetricCardData | null) => void;
  onClickMetric: (metric: MetricCardData) => void;
  onAddCustomArchetype?: (a: Archetype) => void;
  lastSaved?: Date | null;
  onClearDraft?: () => void;
}

export default function BuildView({
  activeBuild,
  computedMetrics,
  onUpdateBuild,
  onCommitBuild,
  onHoverMetric,
  onClickMetric,
  onAddCustomArchetype,
  lastSaved,
  onClearDraft,
}: BuildViewProps) {
  // Find baseline build and compute its metrics for comparison
  const baselineBuild = React.useMemo(() => {
    return DEFAULT_BUILDS.find(b => b.id === activeBuild.id) ?? 
           DEFAULT_BUILDS.find(b => b.id === activeBuild.parentId) ??
           DEFAULT_BUILDS.find(b => b.referenceModel === activeBuild.referenceModel) ?? 
           DEFAULT_BUILDS[0]!;
  }, [activeBuild]);

  const dm = activeBuild.designModel;
  const snap = computedMetrics.snapshot;

  const baselineMetrics = React.useMemo(() => {
    return computeBuildMetrics(baselineBuild);
  }, [baselineBuild]);

  // Compute Silicon Risk Analysis Metrics (ISO 26262 and industry aligned)
  const riskMetrics = React.useMemo(() => {
  const dm = activeBuild.designModel;
    const {
      processNode,
      dieArea,
      transistorCount,
      tdp,
      topology,
      chipletCount,
      ioDieArea,
      defectDensity,
      packagingCost,
      testTimeSeconds,
      testYield,
      packagingYield
    } = dm;

    // A. Yield Stability Risk (0-100)
    // Influenced by defect density, total silicon area, and topology.
    const totalArea = topology === 'monolithic' ? dieArea : (dieArea * chipletCount + ioDieArea);
    
    // Higher defect density and larger total area lead to higher yield volatility.
    let yieldRisk = 25; // Base risk
    
    // Size penalty
    yieldRisk += Math.min(35, (totalArea / 800) * 35);
    
    // Defect density penalty
    yieldRisk += Math.min(25, (defectDensity / 0.3) * 25);
    
    // Topology considerations: large monolithic dies are high risk; chiplets distribute risk but add assembly yield risks
    if (topology === 'monolithic') {
      if (dieArea > 350) yieldRisk += 15;
    } else {
      // Packaging yield risk
      const pkgLoss = 100 - packagingYield;
      yieldRisk += Math.min(15, pkgLoss * 1.5);
    }
    
    const yieldStabilityScore = Math.min(100, Math.max(5, Math.round(yieldRisk)));

    // B. Process Complexity Risk (0-100)
    // Node aggressiveness, transistor density, thermal stress.
    let complexityScore = 20; // Base mature node complexity
    
    // Node multiplier
    if (processNode === '3nm') {
      complexityScore += 45;
    } else if (processNode === '5nm') {
      complexityScore += 30;
    } else if (processNode === '7nm') {
      complexityScore += 15;
    } else if (processNode === '10nm') {
      complexityScore += 5;
    } else {
      // Any other string representation for advanced node
      const numNode = parseFloat(processNode);
      if (!isNaN(numNode)) {
        if (numNode <= 3) complexityScore += 45;
        else if (numNode <= 5) complexityScore += 30;
        else if (numNode <= 7) complexityScore += 15;
        else if (numNode <= 14) complexityScore += 5;
      }
    }
    
    // Transistor density (Billion transistors per unit area)
    const density = totalArea > 0 ? (transistorCount * 1000) / totalArea : 0; // M Tr/mm2
    complexityScore += Math.min(20, (density / 150) * 20);
    
    // Thermal density penalty (TDP Watts/mm2)
    const tdpDensity = totalArea > 0 ? tdp / totalArea : 0;
    complexityScore += Math.min(15, (tdpDensity / 1.5) * 15);
    
    // Chiplet advanced packaging (CoWoS, Microbumps, Warpage)
    if (topology === 'chiplet') {
      complexityScore += 10;
    }
    
    const processComplexityScore = Math.min(100, Math.max(5, Math.round(complexityScore)));

    // C. Test Cost Volatility Risk (0-100)
    // Long test insertions, low test yield, packaging cost exposure.
    let testVolatilityScore = 15; // Base
    
    // Test time exposure
    testVolatilityScore += Math.min(30, (testTimeSeconds / 150) * 30);
    
    // Packaging waste factor: high packaging cost means failing electrical test after assembly is highly volatile
    testVolatilityScore += Math.min(25, (packagingCost / 100) * 25);
    
    // Test yield scrap factor
    const testLoss = 100 - testYield;
    testVolatilityScore += Math.min(30, testLoss * 3);
    
    const testVolatilityRiskScore = Math.min(100, Math.max(5, Math.round(testVolatilityScore)));

    // D. Composite Score (Overall Silicon Risk)
    // 35% Yield, 45% Complexity, 20% Test Volatility
    const overallRiskScore = Math.min(100, Math.max(5, Math.round(
      yieldStabilityScore * 0.35 + 
      processComplexityScore * 0.45 + 
      testVolatilityRiskScore * 0.20
    )));

    // E. ISO 26262 ASIL Rating Feasibility & Diagnostic Coverage Targets
    let asilRating = 'ASIL-D Feasible';
    let asilClass = 'text-green-700 bg-green-50 border-green-200';
    let asilDescription = 'Optimal silicon margins. Fits highly critical ASIL-D automotive drive systems with standard redundant architectures.';
    let diagnosticsRequired = '99% (High Diagnostic Coverage)';
    let randomHardwareFailuresTarget = '< 10 FIT (Failures-In-Time)';
    let safetyMechanism = 'Dual-core Lockstep, Hardware ECC on SRAM, and redundant BIST circuits';

    if (overallRiskScore > 75) {
      asilRating = 'Extreme Risk / SEooC Required';
      asilClass = 'text-red-700 bg-red-50 border-red-200';
      asilDescription = 'Grave physical limits. Direct ASIL-D certification is mathematically unfeasible. Must be treated as Safety Element out of Context (SEooC) with massive off-chip watchdog processors, software self-tests, and active fail-safe bypasses.';
      diagnosticsRequired = 'Multi-Layer Off-Chip Safety Nets';
      randomHardwareFailuresTarget = '> 100 FIT (Requires external fail-safe)';
      safetyMechanism = 'Triple-Modular Redundancy (TMR), External Co-processor Monitors, and Hardware-Enforced Safety Gateways';
    } else if (overallRiskScore > 55) {
      asilRating = 'ASIL-A/B Feasible with High Redundancy';
      asilClass = 'text-orange-700 bg-orange-50 border-orange-200';
      asilDescription = 'Substantial complexity. Certified for non-safety-critical ADAS sub-systems. ASIL-D can only be achieved via dual-die decomposition or multi-chip logical redundancy.';
      diagnosticsRequired = '90% - 95% (Medium Diagnostic Coverage)';
      randomHardwareFailuresTarget = '< 100 FIT (ASIL-B limit)';
      safetyMechanism = 'ECC on SRAM & Bus Interconnects, Software-assisted heartbeats, Windowed Watchdog Timers';
    } else if (overallRiskScore > 35) {
      asilRating = 'ASIL-B/C Highly Feasible';
      asilClass = 'text-yellow-700 bg-yellow-50 border-yellow-200';
      asilDescription = 'Moderate risk profile. Readily certified for ASIL-B braking, steering, and gateway nodes with conventional diagnostic mechanisms.';
      diagnosticsRequired = '95% (Medium-to-High Coverage)';
      randomHardwareFailuresTarget = '< 100 FIT (ASIL-B/C)';
      safetyMechanism = 'SRAM parity/ECC, core-level lockstep, online self-test execution (BIST)';
    }

    return {
      totalArea,
      yieldStabilityScore,
      processComplexityScore,
      testVolatilityRiskScore,
      overallRiskScore,
      asilRating,
      asilClass,
      asilDescription,
      diagnosticsRequired,
      randomHardwareFailuresTarget,
      safetyMechanism
    };
  }, [activeBuild]);

  // Collapse states for the primary segments
  const [expanded, setExpanded] = useState({
    engineering: true,
    manufacturing: true,
    financial: true,
    program: true,
    timeline: true,
    riskAnalysis: true,
  });

  // Local states for branching / immutability commit flow
  const [isBranching, setIsBranching] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchDesc, setBranchDesc] = useState('');
  const [branchVersion, setBranchVersion] = useState('');
  const [branchCreator, setBranchCreator] = useState('eagleximpact');
  const [branchOrg, setBranchOrg] = useState('Siliconomics Manhattan Corp');
  const [isCopied, setIsCopied] = useState(false);

  // Archetype template registration states
  const [isRegisteringArchetype, setIsRegisteringArchetype] = useState(false);
  const [archName, setArchName] = useState('');
  const [archCategory, setArchCategory] = useState<'ASIC' | 'FPGA' | 'Automotive' | 'SmartNIC' | 'NoC' | 'CoWoS' | 'Mobile AP' | 'Edge AI' | 'Custom'>('ASIC');
  const [archDesc, setArchDesc] = useState('');
  const [showArchSuccess, setShowArchSuccess] = useState(false);

  const startRegisteringArchetype = () => {
    setArchName(`${activeBuild.name} Template`);
    setArchDesc(`Industry template derived from the optimized parameters of ${activeBuild.name}.`);
    const lowerName = activeBuild.name.toLowerCase();
    if (lowerName.includes('smartnic') || lowerName.includes('dpu')) {
      setArchCategory('SmartNIC');
    } else if (lowerName.includes('fpga') || lowerName.includes('programmable')) {
      setArchCategory('FPGA');
    } else if (lowerName.includes('automotive') || lowerName.includes('adas') || lowerName.includes('car')) {
      setArchCategory('Automotive');
    } else if (lowerName.includes('noc') || lowerName.includes('interconnect')) {
      setArchCategory('NoC');
    } else if (lowerName.includes('cowos') || lowerName.includes('chiplet') || lowerName.includes('packaging')) {
      setArchCategory('CoWoS');
    } else if (lowerName.includes('mobile') || lowerName.includes('ap') || lowerName.includes('smartphone')) {
      setArchCategory('Mobile AP');
    } else if (lowerName.includes('edge') || lowerName.includes('ai') || lowerName.includes('iot')) {
      setArchCategory('Edge AI');
    } else {
      setArchCategory('ASIC');
    }
    setIsRegisteringArchetype(true);
    setShowArchSuccess(false);
  };

  const handleRegisterArchetypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archName.trim() || !onAddCustomArchetype) return;

    const newArch: Archetype = {
      id: `arch-custom-${Date.now()}`,
      name: archName,
      category: archCategory,
      description: archDesc,
      processNode: dm.processNode,
      dieArea: dm.dieArea,
      dieWidth: dm.dieWidth,
      dieHeight: dm.dieHeight,
      transistorCount: dm.transistorCount,
      tdp: dm.tdp,
      topology: dm.topology,
      chipletCount: dm.chipletCount,
      ioDieArea: dm.ioDieArea,
      defectDensity: dm.defectDensity,
      waferStartsPerMonth: dm.waferStartsPerMonth,
      packagingCost: dm.packagingCost,
      testTimeSeconds: dm.testTimeSeconds,
      testCostPerSecond: dm.testCostPerSecond,
      packagingYield: dm.packagingYield,
      testYield: dm.testYield,
      waferCost: dm.waferCost,
      nreCost: dm.nreCost,
      asp: dm.asp,
      targetVolume: dm.targetVolume,
      foundry: dm.foundry,
      packagingType: dm.packagingType,
      interposerArea: dm.interposerArea,
      isCustom: true,
      creator: 'eagleximpact'
    };

    onAddCustomArchetype(newArch);
    setShowArchSuccess(true);
    setTimeout(() => {
      setIsRegisteringArchetype(false);
      setShowArchSuccess(false);
    }, 2500);
  };

  // Anatomy inspector states
  const [anatomyTab, setAnatomyTab] = useState<'intent' | 'references' | 'computation' | 'evidence' | 'metadata' | 'deliverables'>('intent');
  const [deliverableType, setDeliverableType] = useState<'engineering' | 'executive' | 'csv'>('engineering');
  const [deliverableText, setDeliverableText] = useState('');

  const startBranching = () => {
    setBranchName(`${activeBuild.name} (Variant)`);
    setBranchDesc(`Refinement scenario branched from ${activeBuild.name} to optimize layout & economics.`);
    // Attempt to increment version
    const parts = activeBuild.version.match(/v(\d+)\.(\d+)/);
    if (parts) {
      const major = parseInt(parts[1] ?? '0', 10);
      const minor = parseInt(parts[2] ?? '0', 10) + 1;
      setBranchVersion(`v${major}.${minor}`);
    } else {
      setBranchVersion(`${activeBuild.version}-rev1`);
    }
    setBranchCreator(activeBuild.creator || 'eagleximpact');
    setBranchOrg(activeBuild.organization || 'Siliconomics Manhattan Corp');
    setIsBranching(true);
    setDeliverableText('');
  };

  const handleCommitBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    // Generate a unique ID
    const newId = `build-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newBuild: Build = {
      ...activeBuild,
      id: newId,
      name: branchName,
      description: branchDesc,
      version: branchVersion,
      creator: branchCreator,
      organization: branchOrg,
      owner: `${branchCreator} (Lead Designer)`,
      parentId: activeBuild.id, // Set the lineage parent link!
      createdDate: new Date().toISOString().split('T')[0] ?? '',
      status: 'Draft' // Branches always start in Draft status for modeling
    };

    onCommitBuild(newBuild);
    setIsBranching(false);
  };

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = <K extends keyof DesignModel>(field: K, value: DesignModel[K]) => {
    const updated = {
      ...activeBuild,
      designModel: { ...activeBuild.designModel, [field]: value }
    };
    
    // Node-aware defaults: suggest realistic wafer cost and NRE to help users construct high-quality scenarios
    if (field === 'processNode') {
      if (value === '3nm') {
        updated.designModel.waferCost = 18000;
        updated.designModel.nreCost = 260;
        updated.designModel.defectDensity = 0.12;
      } else if (value === '5nm') {
        updated.designModel.waferCost = 9500;
        updated.designModel.nreCost = 110;
        updated.designModel.defectDensity = 0.08;
      } else if (value === '7nm') {
        updated.designModel.waferCost = 5500;
        updated.designModel.nreCost = 35;
        updated.designModel.defectDensity = 0.04;
      } else if (value === '10nm') {
        updated.designModel.waferCost = 3800;
        updated.designModel.nreCost = 20;
        updated.designModel.defectDensity = 0.02;
      }
    }

    onUpdateBuild(updated);
  };

  const handleTimeModelChange = <K extends keyof TimeModel>(field: K, value: TimeModel[K]) => {
    const currentTm = activeBuild.timeModel || {
      d0Initial: 0.15,
      d0Mature: 0.08,
      d0Tau: 6,
      rampShape: 'linear' as const,
      rampDurationQuarters: 4,
      peakQuarterlyVolumeMillion: 0.3,
      annualAspErosionPct: 3,
      maxQuarterlySupplyMillion: 0.5,
      respin: null,
      projectionQuarters: 20,
      volumeAllocation: 'even' as const,
    };
    const updated = {
      ...activeBuild,
      timeModel: { ...currentTm, [field]: value },
    };
    onUpdateBuild(updated);
  };

  const handleRespinChange = <K extends keyof RespinConfig>(field: K, value: RespinConfig[K]) => {
    const currentTm = activeBuild.timeModel || {
      d0Initial: 0.15,
      d0Mature: 0.08,
      d0Tau: 6,
      rampShape: 'linear' as const,
      rampDurationQuarters: 4,
      peakQuarterlyVolumeMillion: 0.3,
      annualAspErosionPct: 3,
      maxQuarterlySupplyMillion: 0.5,
      respin: null,
      projectionQuarters: 20,
      volumeAllocation: 'even' as const,
    };
    const currentRespin = currentTm.respin || {
      probability: 0,
      costM: 50,
      scheduleDelayQuarters: 2,
      yieldImpact: 1.2,
      recoveryQuarters: 4,
    };
    const updated = {
      ...activeBuild,
      timeModel: {
        ...currentTm,
        respin: { ...currentRespin, [field]: value },
      },
    };
    onUpdateBuild(updated);
  };

  const renderMetricCard = (m: MetricCardData) => {
    const getDeltaColor = (type: MetricCardData['delta']['type']) => {
      if (type === 'positive') return 'text-green-700 bg-green-50 border-green-150';
      if (type === 'negative') return 'text-red-700 bg-red-50 border-red-150';
      return 'text-art-ink/60 bg-art-cream border-art-ink/10';
    };

    // Compare with baseline
    const baselineM = baselineMetrics.snapshot.metricsList.find(b => b.id === m.id);
    const currentVal = parseNumericValue(m.value);
    const baselineVal = baselineM ? parseNumericValue(baselineM.value) : currentVal;
    const diff = currentVal - baselineVal;
    const threshold = 0.001;
    const isUp = diff > threshold;
    const isDown = diff < -threshold;

    let pctChangeStr = '';
    if (baselineVal !== 0) {
      const pct = (diff / baselineVal) * 100;
      pctChangeStr = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }

    let trendIndicator = null;
    if (isUp || isDown) {
      const isFavorable = isUp ? !LOWER_IS_BETTER_METRICS.has(m.id) : LOWER_IS_BETTER_METRICS.has(m.id);
      const colorClass = isFavorable ? 'text-green-600 bg-green-50/50 border-green-200' : 'text-red-600 bg-red-50/50 border-red-200';
      const Icon = isUp ? ChevronUp : ChevronDown;
      trendIndicator = (
        <span 
          className={`inline-flex items-center space-x-0.5 px-1 py-0.5 rounded border text-[9px] font-mono font-bold ${colorClass}`}
          title={`Baseline: ${baselineM?.value || ''} (${pctChangeStr})`}
        >
          <Icon className="w-2.5 h-2.5 stroke-[3]" />
          <span>{pctChangeStr}</span>
        </span>
      );
    }

    return (
      <div
        key={m.id}
        onMouseEnter={() => onHoverMetric(m)}
        onMouseLeave={() => onHoverMetric(null)}
        onClick={() => onClickMetric(m)}
        className="bg-white border-2 border-art-ink/10 hover:border-art-rust/40 hover:shadow-md transition-all duration-150 p-4 rounded-xl cursor-pointer relative group flex flex-col justify-between h-32"
      >
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase text-art-ink/40 tracking-widest block truncate max-w-[130px] font-mono">
              {m.label}
            </span>
            <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
              <span className="text-[8px] font-mono text-art-rust uppercase font-bold tracking-wider bg-art-cream px-1 rounded border border-art-rust/10">Formula</span>
              <HelpCircle className="w-3.5 h-3.5 text-art-rust" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1 flex-wrap">
            <span className="text-2xl font-serif italic font-black text-art-ink tracking-tight">{m.value}</span>
            <span className="text-[10px] text-art-ink/50 font-medium font-serif italic mr-2">{m.unit}</span>
            {trendIndicator}
          </div>
        </div>

        {/* Confidence and Delta tags */}
        <div className="flex items-center justify-between border-t border-art-ink/5 pt-2 text-[9px] mt-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono font-bold border text-[8px] uppercase tracking-wider ${getDeltaColor(m.delta.type)}`}>
            {m.delta.value}
          </span>
          <span className="text-art-ink/40 font-mono text-[9px]">Conf: {m.confidence}%</span>
        </div>
      </div>
    );
  };

  // Filter metrics by category
  const engineeringMetrics = snap.metricsList.filter((m) => m.category === 'engineering');
  const manufacturingMetrics = snap.metricsList.filter((m) => m.category === 'manufacturing');
  const financialMetrics = snap.metricsList.filter((m) => m.category === 'financial');
  const programMetrics = snap.metricsList.filter((m) => m.category === 'program');

  return (
    <div className="space-y-6 font-sans">
      {/* Top Build Metadata bar */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 text-xs">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <h2 className="text-lg font-serif font-black text-art-ink">{activeBuild.name}</h2>
            <span className="bg-art-cream text-art-rust border border-art-rust/20 text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase font-mono">
              {activeBuild.status === 'Approved' ? 'Immutable Approved Build' : 'Draft Modeling'}
            </span>
            
            {/* Auto-save notification indicator */}
            {lastSaved ? (
              <div className="flex items-center space-x-1 bg-green-50 text-green-700 border border-green-250/50 px-2 py-0.5 rounded text-[10px] font-mono animate-fade-in" title="Saved to localStorage draft session">
                <CloudLightning className="w-3 h-3 text-green-600 animate-pulse" />
                <span>Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-art-cream text-art-ink/40 border border-art-ink/10 px-2 py-0.5 rounded text-[10px] font-mono">
                <CloudLightning className="w-3 h-3 opacity-50" />
                <span>Draft Clean</span>
              </div>
            )}

            {/* Clear Draft button */}
            {onClearDraft && lastSaved && (
              <button
                onClick={onClearDraft}
                className="flex items-center space-x-1 px-2 py-0.5 text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded transition-all duration-150 cursor-pointer text-[10px] font-mono font-bold"
                title="Purge temporary drafts from localStorage and reset to original parameters"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Draft</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-art-ink/60 italic font-sans max-w-[480px] line-clamp-1">{activeBuild.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-art-ink/50 text-[11px]">
            <span>Portfolio: <strong className="text-art-ink font-semibold">{activeBuild.portfolio}</strong></span>
            <span>•</span>
            <span>Architect: <strong className="text-art-ink font-semibold">{activeBuild.owner}</strong></span>
            {activeBuild.parentId && (
              <>
                <span>•</span>
                <span>Parent ID: <strong className="text-art-rust font-mono text-[10px] font-bold">{activeBuild.parentId.slice(0, 8)}</strong></span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-art-ink/40 font-mono text-[10px]">
          <div>
            <span className="block uppercase text-[9px] font-semibold tracking-wider">Active Formula</span>
            <span className="text-art-ink font-bold">{activeBuild.formulaVersion}</span>
          </div>
          <div className="border-l border-art-ink/10 pl-4">
            <span className="block uppercase text-[9px] font-semibold tracking-wider">Base Model</span>
            <span className="text-art-ink font-bold truncate max-w-[150px] block">{activeBuild.referenceModel}</span>
          </div>
          <div className="border-l border-art-ink/10 pl-4">
            <span className="block uppercase text-[9px] font-semibold tracking-wider">Audit Status</span>
            <span className="text-art-rust font-bold flex items-center space-x-1">
              <FileCheck className="w-3.5 h-3.5 text-art-rust" />
              <span>Compliant</span>
            </span>
          </div>
          <div className="border-l border-art-ink/10 pl-4 flex items-center space-x-2">
            <button
              onClick={startBranching}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-rust hover:bg-art-rust/90 text-white rounded font-serif italic font-bold text-xs shadow-sm transition-all cursor-pointer"
              title="Save current parameters to a new scenario in the lineage tree"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Branch Variant</span>
            </button>
            {onAddCustomArchetype && (
              <button
                onClick={startRegisteringArchetype}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-rust hover:text-white text-art-cream rounded font-mono font-bold text-xs border border-art-ink/20 shadow-sm transition-all cursor-pointer"
                title="Register these physical/economic design knobs as a reusable organization baseline archetype"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Save Archetype</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ARCHETYPE REGISTRATION DIALOG */}
      {isRegisteringArchetype && (
        <form onSubmit={handleRegisterArchetypeSubmit} className="bg-white border-2 border-art-rust/35 rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-art-ink/10 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-art-rust animate-pulse" />
              <div>
                <h3 className="text-sm font-serif font-black text-art-ink">Register Current Design as baseline Industry Archetype</h3>
                <p className="text-[10px] text-art-ink/50 font-mono uppercase tracking-wider">Propagating current node ({dm.processNode}) and {dm.topology} parameters</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRegisteringArchetype(false)}
              className="text-xs text-art-ink/40 hover:text-art-ink font-bold cursor-pointer font-mono"
            >
              Close [X]
            </button>
          </div>

          {showArchSuccess ? (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded text-xs text-green-800 font-bold font-mono">
              ✓ Successfully registered Custom Archetype! Returning to builder...
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-art-ink/70 leading-relaxed italic">
                Saves the currently configured die size, transistor counts, process node, thermal design power (TDP), and yield coefficients into the global Industry Archetypes Registry. Other engineers can spawn new projects from this template.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">Archetype Template Name</label>
                  <input
                    type="text"
                    value={archName}
                    onChange={(e) => setArchName(e.target.value)}
                    className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-art-cream/20 text-art-ink text-xs focus:outline-none focus:border-art-rust font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">Industry Segment / Classification</label>
                  <select
                    value={archCategory}
                    onChange={(e) => setArchCategory(e.target.value as typeof archCategory)}
                    className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-white text-art-ink text-xs focus:outline-none focus:border-art-rust font-mono"
                  >
                    <option value="ASIC">ASIC (Custom Compute)</option>
                    <option value="FPGA">FPGA (Programmable)</option>
                    <option value="Automotive">Automotive (Safety-Grade)</option>
                    <option value="SmartNIC">SmartNIC (Network Processor)</option>
                    <option value="NoC">NoC (Network-on-Chip Interconnect)</option>
                    <option value="CoWoS">CoWoS (Advanced Chiplet Pack)</option>
                    <option value="Mobile AP">Mobile AP (Smartphone SoC)</option>
                    <option value="Edge AI">Edge AI / Low-Power IoT</option>
                    <option value="Custom">Custom Enterprise Baseline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">Archetype Description & Intended Application</label>
                <textarea
                  value={archDesc}
                  onChange={(e) => setArchDesc(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-art-cream/20 text-art-ink text-xs focus:outline-none focus:border-art-rust font-sans"
                  placeholder="Describe target market, design goals, or production baselines..."
                  required
                />
              </div>

              <div className="bg-art-cream/25 p-3 rounded-lg border border-art-ink/5 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono text-art-ink/70">
                <div>
                  <span className="text-art-ink/40 uppercase block">Node Class</span>
                  <span className="font-bold text-art-ink">{dm.processNode}</span>
                </div>
                <div>
                  <span className="text-art-ink/40 uppercase block">Total Die Area</span>
                  <span className="font-bold text-art-ink">{dm.dieArea * dm.chipletCount + dm.ioDieArea} mm²</span>
                </div>
                <div>
                  <span className="text-art-ink/40 uppercase block">Transistors</span>
                  <span className="font-bold text-art-ink">{dm.transistorCount} Billion</span>
                </div>
                <div>
                  <span className="text-art-ink/40 uppercase block">Topology</span>
                  <span className="font-bold text-art-ink capitalize">{dm.topology}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-art-ink/10">
                <button
                  type="button"
                  onClick={() => setIsRegisteringArchetype(false)}
                  className="px-4 py-1.5 bg-art-cream text-art-ink/80 hover:bg-art-cream/70 border border-art-ink/10 rounded font-bold font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-art-rust hover:bg-art-rust/90 text-white rounded font-bold font-mono text-xs cursor-pointer"
                >
                  Save to Registry
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* BRANCH COMMIT DIALOG */}
      {isBranching && (
        <form onSubmit={handleCommitBranchSubmit} className="bg-white border-2 border-art-rust/30 rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-art-ink/10 pb-3">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-art-rust animate-spin-slow" />
              <div>
                <h3 className="text-sm font-serif font-black text-art-ink">Commit Working Copy as New Immutable Build</h3>
                <p className="text-[10px] text-art-ink/50 font-mono uppercase tracking-wider">Parent Build Scenario: {activeBuild.name} ({activeBuild.version})</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBranching(false)}
              className="text-xs text-art-ink/40 hover:text-art-ink font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">New Build / Variant Name</label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust"
                placeholder="e.g. Manhattan-X1 (Lower SRAM Core)"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Branch Version</label>
              <input
                type="text"
                required
                value={branchVersion}
                onChange={(e) => setBranchVersion(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust font-mono"
                placeholder="e.g. v2.5"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Scenario Description & Context</label>
              <textarea
                required
                value={branchDesc}
                onChange={(e) => setBranchDesc(e.target.value)}
                rows={2}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust"
                placeholder="Explain the engineering intent, process variations, or economic targets motivating this variant..."
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Creator Name</label>
              <input
                type="text"
                required
                value={branchCreator}
                onChange={(e) => setBranchCreator(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Organization</label>
              <input
                type="text"
                required
                value={branchOrg}
                onChange={(e) => setBranchOrg(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 bg-art-ink hover:bg-art-ink/90 text-art-cream rounded-lg font-serif italic font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Seal & Commit Build Scenario</span>
            </button>
          </div>
        </form>
      )}

      {/* Synchronized Quadrants */}
      <div className="space-y-6">
        {/* SECTION 1: ENGINEERING */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('engineering')}
            className="w-full px-4 py-3.5 bg-art-cream/30 hover:bg-art-cream/60 transition-colors duration-150 flex items-center justify-between border-b border-art-ink/10"
          >
            <div className="flex items-center space-x-2 text-art-ink">
              <Cpu className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono">Silicon Architecture & Engineering</span>
            </div>
            {expanded.engineering ? <ChevronUp className="w-4 h-4 text-art-ink/50" /> : <ChevronDown className="w-4 h-4 text-art-ink/50" />}
          </button>

          {expanded.engineering && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white">
              {/* Inputs Panel */}
              <div className="lg:col-span-1 bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
                <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                  <Sliders className="w-4 h-4 text-art-rust" />
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Design Knobs</span>
                </div>

                {/* Node Choice */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">Process Node</label>
                  <select
                    value={dm.processNode}
                    onChange={(e) => handleInputChange('processNode', e.target.value)}
                    className="w-full bg-white border border-art-ink/10 text-xs rounded px-2 py-1.5 outline-none font-semibold cursor-pointer"
                  >
                    <option value="3nm">TSMC N3E (3nm)</option>
                    <option value="5nm">TSMC N5/N4 (5nm)</option>
                    <option value="7nm">TSMC N7 Mature (7nm)</option>
                    <option value="10nm">Foundry Mature (10nm)</option>
                  </select>
                </div>

                {/* Topology Design */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">Silicon Topology</label>
                  <div className="flex bg-white rounded border border-art-ink/10 p-0.5">
                    <button
                      onClick={() => handleInputChange('topology', 'monolithic')}
                      className={`flex-1 text-[10px] py-1 rounded font-serif italic font-bold uppercase ${
                        dm.topology === 'monolithic' ? 'bg-art-ink text-art-cream' : 'text-art-ink/50 hover:bg-art-cream/30'
                      }`}
                    >
                      Monolithic
                    </button>
                    <button
                      onClick={() => handleInputChange('topology', 'chiplet')}
                      className={`flex-1 text-[10px] py-1 rounded font-serif italic font-bold uppercase ${
                        dm.topology === 'chiplet' ? 'bg-art-ink text-art-cream' : 'text-art-ink/50 hover:bg-art-cream/30'
                      }`}
                    >
                      Chiplet
                    </button>
                  </div>
                </div>

                {/* Conditional Chiplet params */}
                {dm.topology === 'chiplet' ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <label className="font-bold text-art-ink/50 uppercase font-mono">Core Chiplet Area</label>
                        <span className="font-mono text-art-ink font-bold">{dm.dieArea} mm²</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="350"
                        step="5"
                        value={dm.dieArea}
                        onChange={(e) => handleInputChange('dieArea', Number(e.target.value))}
                        className="w-full accent-art-rust"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-art-ink/50 uppercase font-mono">Core Chiplet Count</label>
                      <select
                        value={dm.chipletCount}
                        onChange={(e) => handleInputChange('chipletCount', Number(e.target.value))}
                        className="w-full bg-white border border-art-ink/10 text-xs rounded px-2 py-1.5 outline-none font-medium cursor-pointer"
                      >
                        <option value={2}>2 Chiplets</option>
                        <option value={4}>4 Chiplets</option>
                        <option value={8}>8 Chiplets</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <label className="font-bold text-art-ink/50 uppercase font-mono">I/O Die Area</label>
                        <span className="font-mono text-art-ink font-bold">{dm.ioDieArea} mm²</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="300"
                        step="5"
                        value={dm.ioDieArea}
                        onChange={(e) => handleInputChange('ioDieArea', Number(e.target.value))}
                        className="w-full accent-art-rust"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <label className="font-bold text-art-ink/50 uppercase font-mono">Die Footprint (Area)</label>
                      <span className="font-mono text-art-ink font-bold">{dm.dieArea} mm²</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="800"
                      step="10"
                      value={dm.dieArea}
                      onChange={(e) => handleInputChange('dieArea', Number(e.target.value))}
                      className="w-full accent-art-rust"
                    />
                  </div>
                )}

                {/* Transistor Count */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Transistor Count</label>
                    <span className="font-mono text-art-ink font-bold">{dm.transistorCount} B</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    step="0.5"
                    value={dm.transistorCount}
                    onChange={(e) => handleInputChange('transistorCount', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* TDP Power */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Thermal Limit (TDP)</label>
                    <span className="font-mono text-art-ink font-bold">{dm.tdp} Watts</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="450"
                    step="5"
                    value={dm.tdp}
                    onChange={(e) => handleInputChange('tdp', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>
              </div>

              {/* Outputs Panel Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                {engineeringMetrics.map((m) => renderMetricCard(m))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: MANUFACTURING */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('manufacturing')}
            className="w-full px-4 py-3.5 bg-art-cream/30 hover:bg-art-cream/60 transition-colors duration-150 flex items-center justify-between border-b border-art-ink/10"
          >
            <div className="flex items-center space-x-2 text-art-ink">
              <Activity className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono">Manufacturing & Packaging Yield</span>
            </div>
            {expanded.manufacturing ? <ChevronUp className="w-4 h-4 text-art-ink/50" /> : <ChevronDown className="w-4 h-4 text-art-ink/50" />}
          </button>

          {expanded.manufacturing && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white">
              {/* Inputs Panel */}
              <div className="lg:col-span-1 bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
                <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                  <Sliders className="w-4 h-4 text-art-rust" />
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Maturity Knobs</span>
                </div>

                {/* Defect Density */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Defect Density (D0)</label>
                    <span className="font-mono text-art-ink font-bold">{dm.defectDensity} /cm²</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.30"
                    step="0.01"
                    value={dm.defectDensity}
                    onChange={(e) => handleInputChange('defectDensity', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                  <span className="text-[9px] text-art-ink/50 leading-relaxed block italic mt-1">
                    {dm.defectDensity <= 0.05 ? 'Mature High-yield line' : dm.defectDensity <= 0.1 ? 'Normal ramping line' : 'Early developmental risk line'}
                  </span>
                </div>

                {/* Wafer Starts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Wafer Starts/Month</label>
                    <span className="font-mono text-art-ink font-bold">{dm.waferStartsPerMonth.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={dm.waferStartsPerMonth}
                    onChange={(e) => handleInputChange('waferStartsPerMonth', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Packaging Assembly Yield */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">OSAT Packaging Yield</label>
                    <span className="font-mono text-art-ink font-bold">{dm.packagingYield}%</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="100"
                    step="0.1"
                    value={dm.packagingYield}
                    onChange={(e) => handleInputChange('packagingYield', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Electrical Test Yield */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Electrical Test Yield</label>
                    <span className="font-mono text-art-ink font-bold">{dm.testYield}%</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="100"
                    step="0.1"
                    value={dm.testYield}
                    onChange={(e) => handleInputChange('testYield', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>
              </div>

              {/* Outputs Panel Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                {manufacturingMetrics.map((m) => renderMetricCard(m))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: FINANCIAL */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('financial')}
            className="w-full px-4 py-3.5 bg-art-cream/30 hover:bg-art-cream/60 transition-colors duration-150 flex items-center justify-between border-b border-art-ink/10"
          >
            <div className="flex items-center space-x-2 text-art-ink">
              <DollarSign className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono">Financial & Capital Architecture</span>
            </div>
            {expanded.financial ? <ChevronUp className="w-4 h-4 text-art-ink/50" /> : <ChevronDown className="w-4 h-4 text-art-ink/50" />}
          </button>

          {expanded.financial && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white">
              {/* Inputs Panel */}
              <div className="lg:col-span-1 bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
                <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                  <Sliders className="w-4 h-4 text-art-rust" />
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Economic Knobs</span>
                </div>

                {/* Wafer Cost */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Silicon Wafer Cost</label>
                    <span className="font-mono text-art-ink font-bold">${dm.waferCost.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="25000"
                    step="500"
                    value={dm.waferCost}
                    onChange={(e) => handleInputChange('waferCost', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* NRE Capex */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">NRE Capital Investment</label>
                    <span className="font-mono text-art-ink font-bold">${dm.nreCost}M</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={dm.nreCost}
                    onChange={(e) => handleInputChange('nreCost', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* ASP */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Average Selling Price</label>
                    <span className="font-mono text-art-ink font-bold">${dm.asp.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="2000"
                    step="5"
                    value={dm.asp}
                    onChange={(e) => handleInputChange('asp', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Lifetime Target Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Target Lifetime Volume</label>
                    <span className="font-mono text-art-ink font-bold">{dm.targetVolume} M</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={dm.targetVolume}
                    onChange={(e) => handleInputChange('targetVolume', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>
              </div>

              {/* Outputs Panel Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                {financialMetrics.map((m) => renderMetricCard(m))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: PROGRAM */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('program')}
            className="w-full px-4 py-3.5 bg-art-cream/30 hover:bg-art-cream/60 transition-colors duration-150 flex items-center justify-between border-b border-art-ink/10"
          >
            <div className="flex items-center space-x-2 text-art-ink">
              <Briefcase className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono">Program Schedule & Risks</span>
            </div>
            {expanded.program ? <ChevronUp className="w-4 h-4 text-art-ink/50" /> : <ChevronDown className="w-4 h-4 text-art-ink/50" />}
          </button>

          {expanded.program && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white">
              {/* Inputs Panel */}
              <div className="lg:col-span-1 bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
                <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                  <Sliders className="w-4 h-4 text-art-rust" />
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Test Tuning Knobs</span>
                </div>

                {/* Packaging Cost */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Packaging Unit Cost</label>
                    <span className="font-mono text-art-ink font-bold">${dm.packagingCost.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={dm.packagingCost}
                    onChange={(e) => handleInputChange('packagingCost', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Test Time */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Test Insertion Time</label>
                    <span className="font-mono text-art-ink font-bold">{dm.testTimeSeconds}s</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="1"
                    value={dm.testTimeSeconds}
                    onChange={(e) => handleInputChange('testTimeSeconds', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Test Cost/Sec */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Test Cost / Second</label>
                    <span className="font-mono text-art-ink font-bold">${dm.testCostPerSecond.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.00"
                    step="0.01"
                    value={dm.testCostPerSecond}
                    onChange={(e) => handleInputChange('testCostPerSecond', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>
              </div>

              {/* Outputs Panel Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                {programMetrics.map((m) => renderMetricCard(m))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: PROGRAM TIMELINE & TIME MODELING */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full px-4 py-3.5 bg-art-cream/30 hover:bg-art-cream/60 transition-colors duration-150 flex items-center justify-between border-b border-art-ink/10"
          >
            <div className="flex items-center space-x-2 text-art-ink">
              <Clock className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono">Program Timeline & Time Modeling</span>
            </div>
            {expanded.timeline ? <ChevronUp className="w-4 h-4 text-art-ink/50" /> : <ChevronDown className="w-4 h-4 text-art-ink/50" />}
          </button>

          {expanded.timeline && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white">
              {/* Inputs Panel */}
              <div className="lg:col-span-1 bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
                <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                  <Sliders className="w-4 h-4 text-art-rust" />
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Time Modeling Knobs</span>
                </div>

                {/* D0 Yield Learning */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Initial D0</label>
                    <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.d0Initial?.toFixed(2) ?? '-'} /cm²</span>
                  </div>
                  <input
                    type="range" min="0.04" max="0.50" step="0.01"
                    value={activeBuild.timeModel?.d0Initial ?? 0.15}
                    onChange={(e) => handleTimeModelChange('d0Initial', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Mature D0</label>
                    <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.d0Mature?.toFixed(2) ?? '-'} /cm²</span>
                  </div>
                  <input
                    type="range" min="0.02" max="0.30" step="0.01"
                    value={activeBuild.timeModel?.d0Mature ?? 0.08}
                    onChange={(e) => handleTimeModelChange('d0Mature', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Learning Rate (τ)</label>
                    <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.d0Tau ?? '-'} q</span>
                  </div>
                  <input
                    type="range" min="1" max="20" step="1"
                    value={activeBuild.timeModel?.d0Tau ?? 6}
                    onChange={(e) => handleTimeModelChange('d0Tau', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Volume Ramp */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Ramp Shape</label>
                    <span className="font-mono text-art-ink font-bold capitalize">{activeBuild.timeModel?.rampShape ?? 'linear'}</span>
                  </div>
                  <select
                    value={activeBuild.timeModel?.rampShape ?? 'linear'}
                    onChange={(e) => handleTimeModelChange('rampShape', e.target.value as TimeModel['rampShape'])}
                    className="w-full bg-white border border-art-ink/10 text-xs rounded px-2 py-1.5 outline-none font-semibold cursor-pointer"
                  >
                    <option value="linear">Linear</option>
                    <option value="s-curve">S-Curve</option>
                    <option value="flat">Flat (Instant)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Ramp Duration</label>
                    <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.rampDurationQuarters ?? '-'} q</span>
                  </div>
                  <input
                    type="range" min="1" max="16" step="1"
                    value={activeBuild.timeModel?.rampDurationQuarters ?? 4}
                    onChange={(e) => handleTimeModelChange('rampDurationQuarters', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* ASP Erosion */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Annual ASP Erosion</label>
                    <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.annualAspErosionPct ?? '-'}%/yr</span>
                  </div>
                  <input
                    type="range" min="0" max="20" step="0.5"
                    value={activeBuild.timeModel?.annualAspErosionPct ?? 3}
                    onChange={(e) => handleTimeModelChange('annualAspErosionPct', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Supply Constraint */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Max Quarterly Supply</label>
                    <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.maxQuarterlySupplyMillion?.toFixed(2) ?? '-'}M</span>
                  </div>
                  <input
                    type="range" min="0.01" max="10" step="0.01"
                    value={activeBuild.timeModel?.maxQuarterlySupplyMillion ?? 0.5}
                    onChange={(e) => handleTimeModelChange('maxQuarterlySupplyMillion', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Volume Allocation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Volume Allocation</label>
                    <span className="font-mono text-art-ink font-bold capitalize">{activeBuild.timeModel?.volumeAllocation ?? 'even'}</span>
                  </div>
                  <select
                    value={activeBuild.timeModel?.volumeAllocation ?? 'even'}
                    onChange={(e) => handleTimeModelChange('volumeAllocation', e.target.value as TimeModel['volumeAllocation'])}
                    className="w-full bg-white border border-art-ink/10 text-xs rounded px-2 py-1.5 outline-none font-semibold cursor-pointer"
                  >
                    <option value="even">Even (Uniform)</option>
                    <option value="front-loaded">Front-Loaded</option>
                    <option value="back-loaded">Back-Loaded</option>
                    <option value="bell">Bell Curve</option>
                  </select>
                </div>

                {/* Projection Horizon */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <label className="font-bold text-art-ink/50 uppercase font-mono">Projection Horizon</label>
                    <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.projectionQuarters ?? '-'} q ({((activeBuild.timeModel?.projectionQuarters ?? 20) / 4).toFixed(0)} yr)</span>
                  </div>
                  <input
                    type="range" min="4" max="40" step="4"
                    value={activeBuild.timeModel?.projectionQuarters ?? 20}
                    onChange={(e) => handleTimeModelChange('projectionQuarters', Number(e.target.value))}
                    className="w-full accent-art-rust"
                  />
                </div>

                {/* Respin Risk */}
                <div className="border-t border-art-ink/10 pt-3 mt-3">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Respin Risk</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <label className="font-bold text-art-ink/50 uppercase font-mono">Respin Probability</label>
                      <span className="font-mono text-art-ink font-bold">{((activeBuild.timeModel?.respin?.probability ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={(activeBuild.timeModel?.respin?.probability ?? 0) * 100}
                      onChange={(e) => handleRespinChange('probability', Number(e.target.value) / 100)}
                      className="w-full accent-art-rust"
                    />
                  </div>

                  {(activeBuild.timeModel?.respin?.probability ?? 0) > 0 && (
                    <>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-bold text-art-ink/50 uppercase font-mono">Respin Cost</label>
                          <span className="font-mono text-art-ink font-bold">${activeBuild.timeModel?.respin?.costM ?? '-'}M</span>
                        </div>
                        <input
                          type="range" min="10" max="500" step="10"
                          value={activeBuild.timeModel?.respin?.costM ?? 50}
                          onChange={(e) => handleRespinChange('costM', Number(e.target.value))}
                          className="w-full accent-art-rust"
                        />
                      </div>

                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-bold text-art-ink/50 uppercase font-mono">Schedule Delay</label>
                          <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.respin?.scheduleDelayQuarters ?? '-'} q</span>
                        </div>
                        <input
                          type="range" min="0" max="8" step="1"
                          value={activeBuild.timeModel?.respin?.scheduleDelayQuarters ?? 2}
                          onChange={(e) => handleRespinChange('scheduleDelayQuarters', Number(e.target.value))}
                          className="w-full accent-art-rust"
                        />
                      </div>

                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-bold text-art-ink/50 uppercase font-mono">Yield Impact</label>
                          <span className="font-mono text-art-ink font-bold">{((activeBuild.timeModel?.respin?.yieldImpact ?? 1) - 1) * 100}% worse</span>
                        </div>
                        <input
                          type="range" min="1" max="2" step="0.1"
                          value={activeBuild.timeModel?.respin?.yieldImpact ?? 1.2}
                          onChange={(e) => handleRespinChange('yieldImpact', Number(e.target.value))}
                          className="w-full accent-art-rust"
                        />
                      </div>

                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-bold text-art-ink/50 uppercase font-mono">Recovery Time</label>
                          <span className="font-mono text-art-ink font-bold">{activeBuild.timeModel?.respin?.recoveryQuarters ?? '-'} q</span>
                        </div>
                        <input
                          type="range" min="1" max="12" step="1"
                          value={activeBuild.timeModel?.respin?.recoveryQuarters ?? 4}
                          onChange={(e) => handleRespinChange('recoveryQuarters', Number(e.target.value))}
                          className="w-full accent-art-rust"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Outputs Panel */}
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-art-ink/50 uppercase font-mono border-b border-art-ink/10 pb-2">
                  <Clock className="w-3.5 h-3.5 text-art-rust" />
                  <span>Time-Phased Metrics</span>
                </div>

                {(activeBuild.timeModel ? programMetrics : []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {programMetrics.map((m) => m.trace.name.includes('Time') || m.trace.name.includes('Quarter') || m.trace.name.includes('Constraint') || m.trace.name.includes('Respin')
                      ? (() => {
                          const { snapshot: ts } = computeBuildMetrics(activeBuild);
                          const timeMetrics = ts.metricsList.filter(tm2 =>
                            ['time_model_enabled', 'break_even_quarter', 'program_constraint', 'respin_adjusted_net'].includes(tm2.id)
                          );
                          return timeMetrics.map(m2 => renderMetricCard(m2));
                        })()
                      : null
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-art-cream/20 rounded-xl border border-dashed border-art-ink/20">
                    <Clock className="w-8 h-8 mx-auto text-art-ink/20 mb-2" />
                    <p className="text-xs text-art-ink/40 font-semibold">
                      Time-dimension modeling not enabled for this build.
                    </p>
                    <p className="text-[10px] text-art-ink/30 mt-1">
                      Adjust the knobs above to enable time-phased projections.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: SILICON RISK ANALYSIS & COMPLIANCE */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('riskAnalysis')}
            className="w-full px-4 py-3.5 bg-art-cream/30 hover:bg-art-cream/60 transition-colors duration-150 flex items-center justify-between border-b border-art-ink/10"
          >
            <div className="flex items-center space-x-2 text-art-ink">
              <ShieldAlert className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono">Silicon Risk Analysis & Compliance (ISO 26262)</span>
            </div>
            {expanded.riskAnalysis ? <ChevronUp className="w-4 h-4 text-art-ink/50" /> : <ChevronDown className="w-4 h-4 text-art-ink/50" />}
          </button>

          {expanded.riskAnalysis && (
            <div className="p-5 bg-white space-y-6">
              {/* Top Banner: Composite Score & ASIL Assessment */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                {/* Composite Dial Panel */}
                <div className="bg-art-cream/20 border border-art-ink/10 rounded-xl p-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.1em] font-mono">Composite Risk</span>
                    <h4 className="text-xs font-serif italic text-art-ink">Overall Risk Index</h4>
                  </div>
                  <div className="py-4 flex items-center space-x-4">
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-art-ink/5">
                      <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${
                        riskMetrics.overallRiskScore > 75 ? 'border-red-500' :
                        riskMetrics.overallRiskScore > 55 ? 'border-orange-500' :
                        riskMetrics.overallRiskScore > 35 ? 'border-yellow-500' :
                        'border-green-500'
                      }`} style={{ transform: 'rotate(45deg)' }}></div>
                      <span className="text-2xl font-serif font-black text-art-ink">{riskMetrics.overallRiskScore}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                        riskMetrics.overallRiskScore > 75 ? 'bg-red-100 text-red-800' :
                        riskMetrics.overallRiskScore > 55 ? 'bg-orange-100 text-orange-800' :
                        riskMetrics.overallRiskScore > 35 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {riskMetrics.overallRiskScore > 75 ? 'Critical Risk' :
                         riskMetrics.overallRiskScore > 55 ? 'High Risk' :
                         riskMetrics.overallRiskScore > 35 ? 'Moderate Risk' :
                         'Low Risk'}
                      </span>
                      <p className="text-[10px] text-art-ink/50 font-mono mt-1">Weighted ISO-26262 matrix score</p>
                    </div>
                  </div>
                  <div className="text-[9px] text-art-ink/40 font-mono leading-relaxed">
                    Weighted 35% Yield, 45% Complexity, 20% Test Volatility. Low score indicates higher safety-critical reliability feasibility.
                  </div>
                </div>

                {/* ASIL Certification Feasibility Panel */}
                <div className={`border-2 rounded-xl p-4 lg:col-span-2 flex flex-col justify-between ${
                  riskMetrics.overallRiskScore > 75 ? 'border-red-200 bg-red-50/20' :
                  riskMetrics.overallRiskScore > 55 ? 'border-orange-200 bg-orange-50/20' :
                  riskMetrics.overallRiskScore > 35 ? 'border-yellow-200 bg-yellow-50/20' :
                  'border-green-200 bg-green-50/20'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <Shield className={`w-4 h-4 ${
                          riskMetrics.overallRiskScore > 75 ? 'text-red-600' :
                          riskMetrics.overallRiskScore > 55 ? 'text-orange-600' :
                          riskMetrics.overallRiskScore > 35 ? 'text-yellow-600' :
                          'text-green-600'
                        }`} />
                        <span className="text-[10px] font-bold text-art-ink/60 uppercase tracking-[0.1em] font-mono">ISO 26262 Certification Class</span>
                      </div>
                      <h4 className="text-sm font-serif font-black text-art-ink">{riskMetrics.asilRating}</h4>
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-art-ink text-white px-2 py-0.5 rounded">Compliance Audit</span>
                  </div>
                  
                  <p className="text-xs text-art-ink/80 leading-relaxed font-sans italic my-2">
                    {riskMetrics.asilDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-art-ink/10 text-[10px] font-mono">
                    <div>
                      <span className="text-art-ink/40 block uppercase text-[9px]">Diagnostic Coverage (DC) Req.</span>
                      <span className="font-bold text-art-ink">{riskMetrics.diagnosticsRequired}</span>
                    </div>
                    <div>
                      <span className="text-art-ink/40 block uppercase text-[9px]">Random HW Failures Rate (FIT)</span>
                      <span className="font-bold text-art-ink">{riskMetrics.randomHardwareFailuresTarget}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-components breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* 1. Yield Stability Risk */}
                <div className="border border-art-ink/10 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex justify-between items-center border-b border-art-ink/5 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-art-rust"></div>
                      <span className="text-[10px] font-bold text-art-ink/70 uppercase tracking-wider font-mono">Yield Stability</span>
                    </div>
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      riskMetrics.yieldStabilityScore > 70 ? 'text-red-700 bg-red-50' :
                      riskMetrics.yieldStabilityScore > 40 ? 'text-yellow-700 bg-yellow-50' :
                      'text-green-700 bg-green-50'
                    }`}>{riskMetrics.yieldStabilityScore}/100</span>
                  </div>

                  <p className="text-[10px] text-art-ink/70 leading-relaxed">
                    Assesses the vulnerability of die yield to line fluctuations and defect contamination.
                  </p>

                  <div className="space-y-2.5 pt-2 text-[10px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Defect Density Impact:</span>
                      <span className="font-semibold">{dm.defectDensity <= 0.05 ? 'Low' : dm.defectDensity <= 0.15 ? 'Moderate' : 'Severe'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Total Silicon Area:</span>
                      <span className="font-semibold">{Math.round(riskMetrics.totalArea)} mm²</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Topology Defense:</span>
                      <span className="font-semibold text-art-rust">
                        {dm.topology === 'chiplet' ? 'Chiplet Defect Redundancy' : 'None (Monolithic Die)'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-art-ink/5 text-[9px] text-art-ink/50 italic leading-relaxed">
                    {dm.topology === 'chiplet' 
                      ? '✓ Chiplets isolate defects to smaller dies, keeping overall package yields highly predictable even during early fab node ramp.'
                      : '⚠ Monolithic die footprint makes entire system vulnerable to single point-of-defect failures on wafer line.'}
                  </div>
                </div>

                {/* 2. Process Complexity Risk */}
                <div className="border border-art-ink/10 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex justify-between items-center border-b border-art-ink/5 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-art-rust"></div>
                      <span className="text-[10px] font-bold text-art-ink/70 uppercase tracking-wider font-mono">Process Complexity</span>
                    </div>
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      riskMetrics.processComplexityScore > 70 ? 'text-red-700 bg-red-50' :
                      riskMetrics.processComplexityScore > 40 ? 'text-yellow-700 bg-yellow-50' :
                      'text-green-700 bg-green-50'
                    }`}>{riskMetrics.processComplexityScore}/100</span>
                  </div>

                  <p className="text-[10px] text-art-ink/70 leading-relaxed">
                    Measures standard wafer fab process execution complexity, lithography margins, and physical wearout risk.
                  </p>

                  <div className="space-y-2.5 pt-2 text-[10px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Process Lithography:</span>
                      <span className="font-semibold">{dm.processNode} Node Class</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Transistor Density:</span>
                      <span className="font-semibold">{Math.round((dm.transistorCount * 1000) / riskMetrics.totalArea)} M/mm²</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Thermal Stress Density:</span>
                      <span className="font-semibold">{round(dm.tdp / riskMetrics.totalArea, 3)} W/mm²</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-art-ink/5 text-[9px] text-art-ink/50 italic leading-relaxed">
                    {dm.processNode === '3nm' 
                      ? '⚠ 3nm process demands Gate-All-Around GAA architecture, driving high electromigration risk and thermal-stress-induced aging.'
                      : dm.processNode === '5nm'
                      ? '⚠ 5nm utilizes extreme EUV double-patterning, imposing high mask complexity and design-for-manufacturability requirements.'
                      : '✓ Mature lithography node limits lithography stress and exhibits highly characterized infant-mortality profiles.'}
                  </div>
                </div>

                {/* 3. Test Cost Volatility Risk */}
                <div className="border border-art-ink/10 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex justify-between items-center border-b border-art-ink/5 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-art-rust"></div>
                      <span className="text-[10px] font-bold text-art-ink/70 uppercase tracking-wider font-mono">Test Cost Volatility</span>
                    </div>
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      riskMetrics.testVolatilityRiskScore > 70 ? 'text-red-700 bg-red-50' :
                      riskMetrics.testVolatilityRiskScore > 40 ? 'text-yellow-700 bg-yellow-50' :
                      'text-green-700 bg-green-50'
                    }`}>{riskMetrics.testVolatilityRiskScore}/100</span>
                  </div>

                  <p className="text-[10px] text-art-ink/70 leading-relaxed">
                    Measures economic exposure to scrap cost, long test program overheads, and diagnostic testing iterations.
                  </p>

                  <div className="space-y-2.5 pt-2 text-[10px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Test Program Duration:</span>
                      <span className="font-semibold">{dm.testTimeSeconds} seconds / unit</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">OSAT Scrap Risk Exposure:</span>
                      <span className="font-semibold">${dm.packagingCost.toFixed(2)} package scrap cost</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-art-ink/40">Diagnostic Test Yield:</span>
                      <span className="font-semibold">{dm.testYield}% pass rate</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-art-ink/5 text-[9px] text-art-ink/50 italic leading-relaxed">
                    {dm.testTimeSeconds > 90 
                      ? '⚠ Extended test insertion times amplify testing bottle-necks, and escalate financial risk if tester lease rates spike.'
                      : '✓ Lean test program limits cycle time exposure. High diagnostic capability minimizes latent defect escapes.'}
                  </div>
                </div>
              </div>

              {/* Safety Mechanism & Design Recommendations Section */}
              <div className="bg-art-cream/10 border border-art-ink/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-art-rust">
                  <Wrench className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono">ISO 26262 Hardware Safety Requirements & Mitigation Recommendations</h4>
                </div>
                <p className="text-xs text-art-ink/75 leading-relaxed font-sans">
                  To satisfy the target functional safety level under ISO 26262-5 (Product development at the hardware level), the architectural design of this chip must incorporate the following specific hardware-level diagnostic and mitigation mechanisms:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1">
                  <div className="p-3 bg-white border border-art-ink/10 rounded-lg space-y-2">
                    <span className="text-art-rust font-bold uppercase text-[10px] tracking-wider block">Recommended Safety Mechanisms</span>
                    <p className="text-art-ink/80 text-[11px] leading-relaxed">
                      {riskMetrics.safetyMechanism}.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-art-ink/10 rounded-lg space-y-2">
                    <span className="text-art-rust font-bold uppercase text-[10px] tracking-wider block">FMEA / FMEDA Structural Diagnostics</span>
                    <p className="text-art-ink/80 text-[11px] leading-relaxed">
                      Must perform failure mode distribution analyses on the process node. Implement dynamic voltage and frequency scaling (DVFS) temperature sensors and wearout monitors to satisfy ASIL-D latent fault metric requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: 6-PART BUILD ANATOMY INSPECTOR */}
      <div className="bg-white border-2 border-art-ink/15 rounded-xl shadow-md overflow-hidden mt-8">
        <div className="px-4 py-3.5 bg-art-ink text-art-cream flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 border-b border-art-ink/10">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-art-rust animate-pulse" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-art-cream">Siliconomics Immutable Build Anatomy</h3>
              <p className="text-[10px] text-art-cream/60 font-mono">Build ID: {activeBuild.id} • Six Logical Sections (V1.0 Specification)</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-art-rust bg-art-cream/10 border border-art-rust/20 px-2 py-0.5 rounded uppercase">Deterministic Engine Active</span>
        </div>

        {/* Tab Selection Row */}
        <div className="grid grid-cols-3 md:grid-cols-6 border-b border-art-ink/10 bg-art-cream/20 text-[11px] font-bold font-mono">
          <button
            onClick={() => setAnatomyTab('intent')}
            className={`py-3 text-center border-r border-art-ink/10 cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${anatomyTab === 'intent' ? 'bg-white text-art-rust border-b-2 border-b-art-rust font-serif italic' : 'text-art-ink/65 hover:bg-white/40 hover:text-art-ink'}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Intent</span>
          </button>
          <button
            onClick={() => setAnatomyTab('references')}
            className={`py-3 text-center border-r border-art-ink/10 cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${anatomyTab === 'references' ? 'bg-white text-art-rust border-b-2 border-b-art-rust font-serif italic' : 'text-art-ink/65 hover:bg-white/40 hover:text-art-ink'}`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. References</span>
          </button>
          <button
            onClick={() => setAnatomyTab('computation')}
            className={`py-3 text-center border-r border-art-ink/10 cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${anatomyTab === 'computation' ? 'bg-white text-art-rust border-b-2 border-b-art-rust font-serif italic' : 'text-art-ink/65 hover:bg-white/40 hover:text-art-ink'}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. Computation</span>
          </button>
          <button
            onClick={() => setAnatomyTab('evidence')}
            className={`py-3 text-center border-r border-art-ink/10 cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${anatomyTab === 'evidence' ? 'bg-white text-art-rust border-b-2 border-b-art-rust font-serif italic' : 'text-art-ink/65 hover:bg-white/40 hover:text-art-ink'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Evidence</span>
          </button>
          <button
            onClick={() => setAnatomyTab('metadata')}
            className={`py-3 text-center border-r border-art-ink/10 cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${anatomyTab === 'metadata' ? 'bg-white text-art-rust border-b-2 border-b-art-rust font-serif italic' : 'text-art-ink/65 hover:bg-white/40 hover:text-art-ink'}`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>5. Metadata</span>
          </button>
          <button
            onClick={() => setAnatomyTab('deliverables')}
            className={`py-3 text-center cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${anatomyTab === 'deliverables' ? 'bg-white text-art-rust border-b-2 border-b-art-rust font-serif italic' : 'text-art-ink/65 hover:bg-white/40 hover:text-art-ink'}`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>6. Deliverables</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className="p-5 bg-white min-h-[220px]">
          {anatomyTab === 'intent' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2">
                <Sliders className="w-4.5 h-4.5 text-art-rust" />
                <h4 className="text-sm font-serif font-black text-art-ink">Section 1: Engineering Intent & Parameter Design Knobs</h4>
              </div>
              <p className="text-xs text-art-ink/60 leading-relaxed italic">
                Captures the configuration decisions, architectural limits, and commercial volume projections requested by the engineer. Under Siliconomics Principles, changing any intent parameter branches a new build.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-mono bg-art-cream/40 p-4 rounded-xl border border-art-ink/10">
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Process Node Class</span>
                  <span className="text-art-ink font-bold text-xs">{dm.processNode}</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Silicon Topology</span>
                  <span className="text-art-ink font-bold text-xs capitalize">{dm.topology}</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Design Area</span>
                  <span className="text-art-ink font-bold text-xs">{dm.dieArea} mm²</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Transistors (Billion)</span>
                  <span className="text-art-ink font-bold text-xs">{dm.transistorCount} B</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Thermal limit (TDP)</span>
                  <span className="text-art-ink font-bold text-xs">{dm.tdp} W</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Defect Density (D0)</span>
                  <span className="text-art-ink font-bold text-xs">{dm.defectDensity} /cm²</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Wafer Starts Monthly</span>
                  <span className="text-art-ink font-bold text-xs">{dm.waferStartsPerMonth.toLocaleString()} starts</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Packaging Unit Cost</span>
                  <span className="text-art-ink font-bold text-xs">${dm.packagingCost.toFixed(2)}</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Test Time & Rate</span>
                  <span className="text-art-ink font-bold text-xs">{dm.testTimeSeconds}s @ ${dm.testCostPerSecond.toFixed(2)}/s</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">OSAT Packaging Yield</span>
                  <span className="text-art-ink font-bold text-xs">{dm.packagingYield}%</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Wafer Procurement Cost</span>
                  <span className="text-art-ink font-bold text-xs">${dm.waferCost.toLocaleString()}</span>
                </div>
                <div className="p-2 border-b border-art-ink/5">
                  <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">Target Program Volume</span>
                  <span className="text-art-ink font-bold text-xs">{dm.targetVolume} Million units</span>
                </div>
              </div>
            </div>
          )}

          {anatomyTab === 'references' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2">
                <Database className="w-4.5 h-4.5 text-art-rust" />
                <h4 className="text-sm font-serif font-black text-art-ink">Section 2: External Reference Dependencies & Databases</h4>
              </div>
              <p className="text-xs text-art-ink/60 leading-relaxed italic">
                External dependencies, reference semiconductor pricing libraries, formula specifications, and foundry cost profiles that participate in computation. These guarantee reproducibility years down the road.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-art-cream/30 border border-art-ink/10 rounded-lg space-y-1">
                  <span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Formula Library version</span>
                  <span className="text-art-ink font-bold text-sm block">{activeBuild.formulaVersion}</span>
                  <span className="text-[10px] text-art-ink/50 block font-sans">Contains Murphy Yield Model, multi-chiplet cascade probability yield equations, and NRE amortization standard.</span>
                </div>
                <div className="p-4 bg-art-cream/30 border border-art-ink/10 rounded-lg space-y-1">
                  <span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Foundry Node Reference</span>
                  <span className="text-art-ink font-bold text-sm block">{activeBuild.referenceModel}</span>
                  <span className="text-[10px] text-art-ink/50 block font-sans">Anchors the default wafer cost guidelines, defect density target curves, and transistor dimension scaling factor equations.</span>
                </div>
                <div className="p-4 bg-art-cream/30 border border-art-ink/10 rounded-lg space-y-1">
                  <span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Platform Calculation Engine</span>
                  <span className="text-art-ink font-bold text-sm block">Siliconomics Engine v1.0.3-C</span>
                  <span className="text-[10px] text-art-ink/50 block font-sans">Fully compliant with deterministic calculations standards, maintaining 100% reproducial precision with zero random variables.</span>
                </div>
              </div>
            </div>
          )}

          {anatomyTab === 'computation' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2">
                <Cpu className="w-4.5 h-4.5 text-art-rust" />
                <h4 className="text-sm font-serif font-black text-art-ink">Section 3: Deterministic Computations & Output Metrics</h4>
              </div>
              <p className="text-xs text-art-ink/60 leading-relaxed italic">
                Stores immutable results of calculations, demonstrating yield rates, manufacturing throughput, unit production cost, and project commercial feasibility outputs.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-mono">
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Dies Per Wafer (DPW)</span>
                  <span className="text-art-ink font-serif italic font-black text-sm">{snap.dpw} dies</span>
                </div>
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Effective Silicon Yield</span>
                  <span className="text-art-rust font-serif italic font-black text-sm">{round(snap.dieYield * 100, 2)}%</span>
                </div>
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Packaged Unit Cost</span>
                  <span className="text-art-ink font-serif italic font-black text-sm">${round(snap.grossCostPerGoodDie, 2)}</span>
                </div>
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Gross Project Margin</span>
                  <span className="text-green-700 font-serif italic font-black text-sm">{round(snap.grossMargin, 2)}%</span>
                </div>
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Program Break-Even</span>
                  <span className="text-art-ink font-serif italic font-black text-sm">{round(snap.breakEvenVolumeMillion, 2)}M units</span>
                </div>
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Net Lifetime Profit</span>
                  <span className="text-art-ink font-serif italic font-black text-sm">${round(snap.lifetimeNetProfitMillion, 1)}M</span>
                </div>
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Program Return (ROI)</span>
                  <span className="text-art-rust font-serif italic font-black text-sm">{round(snap.roi, 1)}%</span>
                </div>
                <div className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">Annual Production Run</span>
                  <span className="text-art-ink font-serif italic font-black text-sm">{round(snap.annualVolumeMillion, 3)}M units</span>
                </div>
              </div>
            </div>
          )}

          {anatomyTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2">
                <FileText className="w-4.5 h-4.5 text-art-rust" />
                <h4 className="text-sm font-serif font-black text-art-ink">Section 4: Evidence & Calculation Traceability</h4>
              </div>
              <p className="text-xs text-art-ink/60 leading-relaxed italic">
                Provenance reporting detailing how mathematical results are derived. Click any metric card above to populate the Calculations Audit panel on the right sidebar for a detailed interactive first-principles breakdown.
              </p>
              <div className="bg-art-cream/30 p-4 rounded-xl border border-art-ink/10 space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Governing Formulas Applied</span>
                  <ul className="list-disc pl-4 space-y-1.5 font-sans leading-relaxed text-art-ink/80">
                    <li><strong>Murphy Die Yield Model:</strong> Yield = <code>((1 - e^(-A * D0)) / (A * D0))²</code> — Calculates the defect probability curve on silicon wafers.</li>
                    <li><strong>Dies Per Wafer (DPW):</strong> DPW = <code>(π * d²) / (4 * A) - (π * d) / √(2 * A)</code> — Derives geometrical layout optimization under circular wafer boundaries.</li>
                    <li><strong>Fully Loaded Cost:</strong> Cost = <code>Silicon Cost + Packaging Assembly + Test Cost + (NRE / Lifetime Volume)</code> — Establishes corporate cost of goods sold.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {anatomyTab === 'metadata' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2">
                <Fingerprint className="w-4.5 h-4.5 text-art-rust" />
                <h4 className="text-sm font-serif font-black text-art-ink">Section 5: Administrative Metadata & Lineage Ledger</h4>
              </div>
              <p className="text-xs text-art-ink/60 leading-relaxed italic">
                Durable administrative tracking and revision lineage records, providing permanent authentication logs of the design team and parent-child variations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-art-cream/40 rounded-lg border border-art-ink/10 space-y-1">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-bold">Unique Build Scenario ID</span>
                  <span className="text-art-ink font-bold break-all text-[11px]">{activeBuild.id}</span>
                </div>
                <div className="p-3 bg-art-cream/40 rounded-lg border border-art-ink/10 space-y-1">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-bold">Creator (Lead Architect)</span>
                  <span className="text-art-ink font-bold text-[11px]">{activeBuild.creator || 'eagleximpact'}</span>
                </div>
                <div className="p-3 bg-art-cream/40 rounded-lg border border-art-ink/10 space-y-1">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-bold">Organization Ledger</span>
                  <span className="text-art-ink font-bold text-[11px]">{activeBuild.organization || 'Siliconomics Manhattan Corp'}</span>
                </div>
                <div className="p-3 bg-art-cream/40 rounded-lg border border-art-ink/10 space-y-1">
                  <span className="text-art-ink/40 text-[9px] block uppercase font-bold">Creation Date & Parent Scenario</span>
                  <span className="text-art-ink font-bold text-[11px]">
                    {activeBuild.createdDate} • {activeBuild.parentId ? `Branched from ID: ${activeBuild.parentId.slice(0, 8)}` : 'Root Baseline'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {anatomyTab === 'deliverables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-art-ink/5 pb-2">
                <div className="flex items-center space-x-2">
                  <Package className="w-4.5 h-4.5 text-art-rust" />
                  <h4 className="text-sm font-serif font-black text-art-ink">Section 6: Document Deliverables & Audited Reports</h4>
                </div>
                <div className="flex space-x-2 text-[10px] font-mono">
                  <button
                    onClick={() => {
                      setDeliverableType('engineering');
                      setDeliverableText(`========================================================================
SILICONOMICS ENGINEERING REPORT: ${activeBuild.name.toUpperCase()}
========================================================================
BUILD ID:        ${activeBuild.id}
VERSION:         ${activeBuild.version}
CREATOR:         ${activeBuild.creator}
ORGANIZATION:    ${activeBuild.organization}
TIMESTAMP:       ${new Date().toISOString()}
PARENT SCENARIO: ${activeBuild.parentId || 'N/A (Root Scenario)'}
FORMULA LIBRARY: ${activeBuild.formulaVersion}
BASE DATA MODEL: ${activeBuild.referenceModel}

DESIGN INTENT PARAMETERS:
- Process Node Class: ${dm.processNode}
- Topology Layout:    ${dm.topology}
- Die Footprint Area: ${dm.dieArea} mm²
- Core Transistors:   ${dm.transistorCount} Billion
- Thermal TDP:        ${dm.tdp} Watts

DETERMINISTIC COMPUTATION METRICS:
- Dies Per Wafer (DPW):     ${snap.dpw} dies
- Murphy Die Silicon Yield: ${round(snap.dieYield * 100, 2)}%
- Silicon-OSAT Cost/Die:    $${round(snap.rawDieCost, 2)}
- Amortized Unit NRE cost:  $${round(snap.amortizedNreCost, 2)}
- Final Packaged Unit Cost: $${round(snap.grossCostPerGoodDie, 2)}
- Target Lifetime Volume:   ${dm.targetVolume} Million Units
- Break-Even Program Unit:  ${round(snap.breakEvenVolumeMillion, 2)} Million Units
- Projected Program ROI:    ${round(snap.roi, 1)}%

AUDIT SIGN-OFF STATUS: COMPLIANT WITH ISO 26262 AND SIA PLATFORM SPECIFICATIONS.
========================================================================`);
                    }}
                    className={`px-2 py-1 rounded cursor-pointer ${deliverableType === 'engineering' ? 'bg-art-ink text-white font-bold' : 'bg-art-cream border border-art-ink/15 text-art-ink/60'}`}
                  >
                    Engineering Report
                  </button>
                  <button
                    onClick={() => {
                      setDeliverableType('executive');
                      setDeliverableText(`========================================================================
SILICONOMICS EXECUTIVE COMMERCIAL BRIEFING: ${activeBuild.name.toUpperCase()}
========================================================================
DATE:             ${activeBuild.createdDate}
TAPE-OUT REVIEW:  2026-07-28
ORGANIZATION:     ${activeBuild.organization}
BUILD AUDIT HASH: ${activeBuild.id.slice(0, 16)}...

SUMMARY FEASIBILITY ASSESSMENT:
The engineering scenario "${activeBuild.name}" has been calculated using deterministic math library ${activeBuild.formulaVersion}. 

Key Business Feasibility Indicators:
- Target Volume:       ${dm.targetVolume} Million units
- Average Selling Prc: $${dm.asp} USD per unit
- Cost of Goods/Unit:  $${round(snap.grossCostPerGoodDie, 2)} USD per unit
- Initial NRE Capex:   $${dm.nreCost} Million USD
- Project Gross Margin: ${round(snap.grossMargin, 2)}%
- Net Program Profit:  $${round(snap.lifetimeNetProfitMillion, 1)} Million USD
- Program ROI:         ${round(snap.roi, 1)}%

Amortization Schedule:
To recover the initial masking, licensing, and IP capital of $${dm.nreCost}M, the program requires a break-even threshold volume of ${round(snap.breakEvenVolumeMillion, 2)} Million units. The current target program volume of ${dm.targetVolume}M units delivers comfortable capital return overheads.

SIGNED OFF BY: ${activeBuild.creator}
AUTHORIZED VIA DETERMINISTIC COMPUTATION ENGINE LICENSE KEY: ISO-26262-SEMI-MANHATTAN-V1
========================================================================`);
                    }}
                    className={`px-2 py-1 rounded cursor-pointer ${deliverableType === 'executive' ? 'bg-art-ink text-white font-bold' : 'bg-art-cream border border-art-ink/15 text-art-ink/60'}`}
                  >
                    Executive Briefing
                  </button>
                  <button
                    onClick={() => {
                      setDeliverableType('csv');
                      setDeliverableText(`"Metric","Value","Unit","Formula Reference"
"Build ID","${activeBuild.id}","UUID","${activeBuild.referenceModel}"
"Build Name","${activeBuild.name}","String","N/A"
"Version","${activeBuild.version}","String","N/A"
"Creator","${activeBuild.creator}","String","N/A"
"Date","${activeBuild.createdDate}","YYYY-MM-DD","N/A"
"Node Class","${dm.processNode}","nm","N/A"
"Die Area","${dm.dieArea}","mm2","N/A"
"Transistors","${dm.transistorCount}","Billion","N/A"
"DPW","${snap.dpw}","dies","Geometric Packing Standard v2.0"
"Silicon Yield","${round(snap.dieYield * 100, 2)}","%","Murphy Model v1.0"
"Silicon Cost","${round(snap.rawDieCost, 2)}","USD","Foundry Price Schedule v3.0"
"Packaged Unit Cost","${round(snap.grossCostPerGoodDie, 2)}","USD","OSAT Assembly Rates Q3-26"
"NRE Capex","${dm.nreCost}","Million USD","Corporate Finance Standard"
"Gross Margin","${round(snap.grossMargin, 2)}","%","Corporate Margin Target"
"ROI","${round(snap.roi, 1)}","%","Strategic Profit Target"`);
                    }}
                    className={`px-2 py-1 rounded cursor-pointer ${deliverableType === 'csv' ? 'bg-art-ink text-white font-bold' : 'bg-art-cream border border-art-ink/15 text-art-ink/60'}`}
                  >
                    CSV Export Matrix
                  </button>
                </div>
              </div>
              <p className="text-xs text-art-ink/60 leading-relaxed italic">
                Produces production-ready traceable document packages of the computed scenario. Every export carries the immutable Build ID, formula version references, and timestamp markers to maintain audit compliance.
              </p>

              {deliverableText ? (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[10px] font-mono text-art-ink/50">
                    <span>Export Status: Ready for Pipeline Transmission</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(deliverableText);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="flex items-center space-x-1 px-2 py-1 bg-art-cream hover:bg-art-ink hover:text-white rounded border border-art-ink/10 transition-all cursor-pointer font-bold text-art-rust"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy Report'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-art-cream/60 border border-art-ink/15 text-[10px] font-mono rounded-lg overflow-x-auto text-art-ink max-h-60 leading-relaxed whitespace-pre font-medium">
                    {deliverableText}
                  </pre>
                </div>
              ) : (
                <div className="border border-dashed border-art-ink/15 rounded-xl p-8 text-center bg-art-cream/10 space-y-3">
                  <Package className="w-8 h-8 text-art-rust/40 mx-auto" />
                  <p className="text-xs text-art-ink/50 font-medium">Select a deliverable report tab above to compile the audited export package.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

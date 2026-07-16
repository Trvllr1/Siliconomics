import React, { useState } from 'react';
import { Build, MetricCardData } from '../types';
import { DEFAULT_BUILDS } from '../data/defaultBuilds';
import { ComputedBuildMetrics, computeBuildMetrics, round } from '../utils/mathEngine';
import ChartsView from './ChartsView';
import SensitivityView from './SensitivityView';
import CostContributorView from './CostContributorView';
import SupplyChainView from './SupplyChainView';
import { ChevronUp, ChevronDown, HelpCircle, ShieldAlert, Shield, Wrench, Cpu, Database, FileText, Fingerprint, Package, Sliders, Activity, DollarSign, Briefcase, Award, Copy, Check, BarChart3, TrendingUp, FileCheck, AlertCircle, Shuffle, Truck } from 'lucide-react';

const LOWER_IS_BETTER_METRICS = new Set(['total_die_area', 'raw_die_cost', 'gross_die_cost', 'break_even']);

const parseNumericValue = (valStr: string): number => {
  const cleaned = valStr.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

interface MetricsLabProps {
  activeBuild: Build;
  computedMetrics: ComputedBuildMetrics;
  onHoverMetric: (metric: MetricCardData | null) => void;
  onClickMetric: (metric: MetricCardData) => void;
}

export default function MetricsLab({
  activeBuild,
  computedMetrics,
  onHoverMetric,
  onClickMetric,
}: MetricsLabProps) {
  const [labTab, setLabTab] = useState<'metrics' | 'charts' | 'sensitivity' | 'risk' | 'anatomy' | 'cost' | 'supply'>('metrics');

  const snap = computedMetrics.snapshot;
  const dm = activeBuild.designModel;
  const archBlocks = activeBuild.architecture?.blocks ?? [];

  const baselineBuild = React.useMemo(() => {
    return DEFAULT_BUILDS.find(b => b.id === activeBuild.id) ??
      DEFAULT_BUILDS.find(b => b.id === activeBuild.parentId) ??
      DEFAULT_BUILDS.find(b => b.referenceModel === activeBuild.referenceModel) ??
      DEFAULT_BUILDS[0]!;
  }, [activeBuild]);
  const baselineMetrics = React.useMemo(() => computeBuildMetrics(baselineBuild), [baselineBuild]);

  const [anatomyTab, setAnatomyTab] = useState<'intent' | 'references' | 'computation' | 'evidence' | 'metadata' | 'deliverables'>('intent');
  const [deliverableType, setDeliverableType] = useState<'engineering' | 'executive' | 'csv'>('engineering');
  const [deliverableText, setDeliverableText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const riskMetrics = React.useMemo(() => {
    const { processNode, dieArea, transistorCount, tdp, topology, chipletCount, ioDieArea, defectDensity, packagingCost, testTimeSeconds, testCostPerSecond, testYield, packagingYield } = dm;
    const totalArea = topology === 'monolithic' ? dieArea : (dieArea * chipletCount + ioDieArea);
    const d0_mm2 = defectDensity / 100;
    const ad0 = dieArea * d0_mm2;
    const coreYield = ad0 > 0 ? Math.pow((1 - Math.exp(-ad0)) / ad0, 2) : 1;

    let yieldRisk = 25 + Math.min(35, (totalArea / 800) * 35) + Math.min(25, (defectDensity / 0.3) * 25);
    if (topology === 'monolithic') { if (dieArea > 350) yieldRisk += 15; }
    else { yieldRisk += Math.min(15, (100 - packagingYield) * 1.5); }
    const yieldStabilityScore = Math.min(100, Math.max(5, Math.round(yieldRisk)));

    let complexityScore = 20;
    if (processNode === '3nm') complexityScore += 45;
    else if (processNode === '5nm') complexityScore += 30;
    else if (processNode === '7nm') complexityScore += 15;
    else if (processNode === '10nm') complexityScore += 5;
    if (dm.foundry === 'intel') complexityScore += 10;  // Intel Foundry premium for early-ramping nodes
    if (dm.packagingType !== 'standard') complexityScore += 8;  // CoWoS/EMIB packaging complexity
    const density = totalArea > 0 ? (transistorCount * 1000) / totalArea : 0;
    complexityScore += Math.min(20, (density / 150) * 20);
    const tdpDensity = totalArea > 0 ? tdp / totalArea : 0;
    complexityScore += Math.min(15, (tdpDensity / 1.5) * 15);
    if (topology === 'chiplet') complexityScore += 10;
    const processComplexityScore = Math.min(100, Math.max(5, Math.round(complexityScore)));

    let testVolatilityScore = 15;
    testVolatilityScore += Math.min(30, (testTimeSeconds / 150) * 30);
    testVolatilityScore += Math.min(25, (packagingCost / 100) * 25);
    testVolatilityScore += Math.min(30, (100 - testYield) * 3);
    const testVolatilityRiskScore = Math.min(100, Math.max(5, Math.round(testVolatilityScore)));

    const overallRiskScore = Math.min(100, Math.max(5, Math.round(yieldStabilityScore * 0.35 + processComplexityScore * 0.45 + testVolatilityRiskScore * 0.20)));

    let asilRating = 'ASIL-D Feasible';
    let asilClass = 'text-green-700 bg-green-50 border-green-200';
    let asilDescription = 'Optimal silicon margins. Fits highly critical ASIL-D automotive drive systems with standard redundant architectures.';
    let diagnosticsRequired = '99% (High Diagnostic Coverage)';
    let randomHardwareFailuresTarget = '< 10 FIT';
    let safetyMechanism = 'Dual-core Lockstep, Hardware ECC on SRAM, and redundant BIST circuits';

    if (overallRiskScore > 75) {
      asilRating = 'Extreme Risk / SEooC Required';
      asilClass = 'text-red-700 bg-red-50 border-red-200';
      asilDescription = 'Grave physical limits. Direct ASIL-D certification is mathematically unfeasible. Must be treated as Safety Element out of Context (SEooC).';
      diagnosticsRequired = 'Multi-Layer Off-Chip Safety Nets';
      randomHardwareFailuresTarget = '> 100 FIT (Requires external fail-safe)';
      safetyMechanism = 'Triple-Modular Redundancy (TMR), External Co-processor Monitors, and Hardware-Enforced Safety Gateways';
    } else if (overallRiskScore > 55) {
      asilRating = 'ASIL-A/B Feasible with High Redundancy';
      asilClass = 'text-orange-700 bg-orange-50 border-orange-200';
      asilDescription = 'Substantial complexity. Certified for non-safety-critical ADAS sub-systems. ASIL-D only via dual-die decomposition.';
      diagnosticsRequired = '90% - 95% (Medium Diagnostic Coverage)';
      randomHardwareFailuresTarget = '< 100 FIT (ASIL-B limit)';
      safetyMechanism = 'ECC on SRAM & Bus Interconnects, Software-assisted heartbeats, Windowed Watchdog Timers';
    } else if (overallRiskScore > 35) {
      asilRating = 'ASIL-B/C Highly Feasible';
      asilClass = 'text-yellow-700 bg-yellow-50 border-yellow-200';
      asilDescription = 'Moderate risk profile. Readily certified for ASIL-B braking, steering, and gateway nodes.';
      diagnosticsRequired = '95% (Medium-to-High Coverage)';
      randomHardwareFailuresTarget = '< 100 FIT (ASIL-B/C)';
      safetyMechanism = 'SRAM parity/ECC, core-level lockstep, online self-test execution (BIST)';
    }

    return {
      totalArea, yieldStabilityScore, processComplexityScore, testVolatilityRiskScore, overallRiskScore,
      asilRating, asilClass, asilDescription, diagnosticsRequired, randomHardwareFailuresTarget, safetyMechanism
    };
  }, [activeBuild]);

  const renderMetricCard = (m: MetricCardData) => {
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
        <span className={`inline-flex items-center space-x-0.5 px-1 py-0.5 rounded border text-[9px] font-mono font-bold ${colorClass}`} title={`Baseline: ${baselineM?.value || ''} (${pctChangeStr})`}>
          <Icon className="w-2.5 h-2.5 stroke-[3]" /> <span>{pctChangeStr}</span>
        </span>
      );
    }

    return (
      <div key={m.id} onMouseEnter={() => onHoverMetric(m)} onMouseLeave={() => onHoverMetric(null)} onClick={() => onClickMetric(m)}
        className="bg-white border-2 border-art-ink/10 hover:border-art-rust/40 hover:shadow-md transition-all duration-150 p-4 rounded-xl cursor-pointer relative group flex flex-col justify-between h-32">
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold uppercase text-art-ink/40 tracking-widest block truncate max-w-[130px] font-mono">{m.label}</span>
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
        <div className="flex items-center justify-between border-t border-art-ink/5 pt-2 text-[9px] mt-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono font-bold border text-[8px] uppercase tracking-wider ${m.delta.type === 'positive' ? 'text-green-700 bg-green-50 border-green-150' : m.delta.type === 'negative' ? 'text-red-700 bg-red-50 border-red-150' : 'text-art-ink/60 bg-art-cream border-art-ink/10'}`}>{m.delta.value}</span>
          <span className="text-art-ink/40 font-mono text-[9px]">Conf: {m.confidence}%</span>
        </div>
      </div>
    );
  };

  const engineeringMetrics = snap.metricsList.filter(m => m.category === 'engineering');
  const manufacturingMetrics = snap.metricsList.filter(m => m.category === 'manufacturing');
  const financialMetrics = snap.metricsList.filter(m => m.category === 'financial');
  const programMetrics = snap.metricsList.filter(m => m.category === 'program');

  const tabButton = (key: typeof labTab, label: string, icon: React.ReactNode) => (
    <button onClick={() => setLabTab(key)}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all ${labTab === key ? 'bg-art-ink text-art-cream shadow-sm' : 'text-art-ink/60 hover:text-art-ink hover:bg-art-cream/60 bg-white border border-art-ink/10'}`}>
      {icon} <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-art-ink/10">
        {tabButton('metrics', 'Metric Cards', <LayoutIcon />)}
        {tabButton('charts', 'Curves & Charts', <BarChart3 className="w-3.5 h-3.5" />)}
        {tabButton('sensitivity', 'Sensitivity', <TrendingUp className="w-3.5 h-3.5" />)}
        {tabButton('cost', 'Cost Breakdown', <DollarSign className="w-3.5 h-3.5" />)}
        {tabButton('supply', 'Supply Chain', <Truck className="w-3.5 h-3.5" />)}
        {tabButton('risk', 'Risk & Compliance', <ShieldAlert className="w-3.5 h-3.5" />)}
        {tabButton('anatomy', 'Build Anatomy', <Award className="w-3.5 h-3.5" />)}
      </div>

      {/* Metrics Cards */}
      {labTab === 'metrics' && (
        <div className="space-y-6">
          <MetricSection title="Silicon Architecture & Engineering" icon={<Cpu className="w-4 h-4 text-art-rust" />} metrics={engineeringMetrics} renderCard={renderMetricCard} />
          <MetricSection title="Manufacturing & Packaging Yield" icon={<Activity className="w-4 h-4 text-art-rust" />} metrics={manufacturingMetrics} renderCard={renderMetricCard} />
          <MetricSection title="Financial & Capital Architecture" icon={<DollarSign className="w-4 h-4 text-art-rust" />} metrics={financialMetrics} renderCard={renderMetricCard} />
          <MetricSection title="Program Schedule & Risks" icon={<Briefcase className="w-4 h-4 text-art-rust" />} metrics={programMetrics} renderCard={renderMetricCard} />
        </div>
      )}

      {/* Charts */}
      {labTab === 'charts' && <ChartsView activeBuild={activeBuild} computedMetrics={computedMetrics} />}

      {/* Sensitivity */}
      {labTab === 'sensitivity' && <SensitivityView activeBuild={activeBuild} />}

      {/* Cost Breakdown */}
      {labTab === 'cost' && (
        <CostContributorView
          contributors={snap.costContributors}
          fullyLoadedCost={snap.fullyLoadedCostPerDie}
        />
      )}

      {/* Supply Chain */}
      {labTab === 'supply' && (
        <SupplyChainView supplyChain={snap.supplyChain} />
      )}

      {/* Risk & Compliance */}
      {labTab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              <div className="bg-art-cream/20 border border-art-ink/10 rounded-xl p-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.1em] font-mono">Composite Risk</span>
                  <h4 className="text-xs font-serif italic text-art-ink">Overall Risk Index</h4>
                </div>
                <div className="py-4 flex items-center space-x-4">
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-art-ink/5">
                    <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${riskMetrics.overallRiskScore > 75 ? 'border-red-500' : riskMetrics.overallRiskScore > 55 ? 'border-orange-500' : riskMetrics.overallRiskScore > 35 ? 'border-yellow-500' : 'border-green-500'}`} style={{ transform: 'rotate(45deg)' }}></div>
                    <span className="text-2xl font-serif font-black text-art-ink">{riskMetrics.overallRiskScore}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${riskMetrics.overallRiskScore > 75 ? 'bg-red-100 text-red-800' : riskMetrics.overallRiskScore > 55 ? 'bg-orange-100 text-orange-800' : riskMetrics.overallRiskScore > 35 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {riskMetrics.overallRiskScore > 75 ? 'Critical Risk' : riskMetrics.overallRiskScore > 55 ? 'High Risk' : riskMetrics.overallRiskScore > 35 ? 'Moderate Risk' : 'Low Risk'}
                    </span>
                    <p className="text-[10px] text-art-ink/50 font-mono mt-1">Weighted ISO-26262 matrix score</p>
                  </div>
                </div>
                <div className="text-[9px] text-art-ink/40 font-mono leading-relaxed">Weighted 35% Yield, 45% Complexity, 20% Test Volatility.</div>
              </div>
              <div className={`border-2 rounded-xl p-4 lg:col-span-2 flex flex-col justify-between ${riskMetrics.overallRiskScore > 75 ? 'border-red-200 bg-red-50/20' : riskMetrics.overallRiskScore > 55 ? 'border-orange-200 bg-orange-50/20' : riskMetrics.overallRiskScore > 35 ? 'border-yellow-200 bg-yellow-50/20' : 'border-green-200 bg-green-50/20'}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Shield className={`w-4 h-4 ${riskMetrics.overallRiskScore > 75 ? 'text-red-600' : riskMetrics.overallRiskScore > 55 ? 'text-orange-600' : riskMetrics.overallRiskScore > 35 ? 'text-yellow-600' : 'text-green-600'}`} />
                      <span className="text-[10px] font-bold text-art-ink/60 uppercase tracking-[0.1em] font-mono">ISO 26262 Certification Class</span>
                    </div>
                    <h4 className="text-sm font-serif font-black text-art-ink">{riskMetrics.asilRating}</h4>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-art-ink text-white px-2 py-0.5 rounded">Compliance Audit</span>
                </div>
                <p className="text-xs text-art-ink/80 leading-relaxed font-sans italic my-2">{riskMetrics.asilDescription}</p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-art-ink/10 text-[10px] font-mono">
                  <div><span className="text-art-ink/40 block uppercase text-[9px]">Diagnostic Coverage (DC) Req.</span><span className="font-bold text-art-ink">{riskMetrics.diagnosticsRequired}</span></div>
                  <div><span className="text-art-ink/40 block uppercase text-[9px]">Random HW Failures Rate (FIT)</span><span className="font-bold text-art-ink">{riskMetrics.randomHardwareFailuresTarget}</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {[
                { title: 'Yield Stability', score: riskMetrics.yieldStabilityScore, desc: 'Assesses vulnerability of die yield to line fluctuations.', items: [`Defect Density: ${dm.defectDensity <= 0.05 ? 'Low' : dm.defectDensity <= 0.15 ? 'Moderate' : 'Severe'}`, `Total Area: ${Math.round(riskMetrics.totalArea)} mm²`, `Topology: ${dm.topology === 'chiplet' ? 'Chiplet Defect Redundancy' : 'None (Monolithic Die)'}`], note: dm.topology === 'chiplet' ? '✓ Chiplets isolate defects to smaller dies.' : '⚠ Monolithic die makes entire system vulnerable to single point-of-defect.' },
                { title: 'Process Complexity', score: riskMetrics.processComplexityScore, desc: 'Measures wafer fab execution complexity.', items: [`Node: ${dm.processNode}`, `Foundry: ${dm.foundry === 'intel' ? 'Intel Foundry Services' : dm.foundry === 'samsung' ? 'Samsung Foundry' : 'TSMC'}`, `Packaging: ${dm.packagingType === 'standard' ? 'Standard Substrate' : dm.packagingType === 'emib' ? 'Intel EMIB' : dm.packagingType?.toUpperCase() ?? 'Standard'}`, `Density: ${Math.round((dm.transistorCount * 1000) / riskMetrics.totalArea)} M/mm²`, `Thermal: ${round(dm.tdp / riskMetrics.totalArea, 3)} W/mm²`], note: dm.foundry === 'intel' ? '⚠ Intel Foundry early-ramping nodes have higher defect density uncertainty.' : dm.processNode === '3nm' ? '⚠ 3nm demands GAA architecture, high electromigration risk.' : dm.processNode === '5nm' ? '⚠ 5nm uses extreme EUV double-patterning.' : '✓ Mature lithography node.' },
                { title: 'Test Cost Volatility', score: riskMetrics.testVolatilityRiskScore, desc: 'Measures economic exposure to scrap and test overhead.', items: [`Test Time: ${dm.testTimeSeconds}s`, `Package Scrap: \$${dm.packagingCost.toFixed(2)}`, `Test Yield: ${dm.testYield}% pass rate`], note: dm.testTimeSeconds > 90 ? '⚠ Extended test insertion amplifies bottlenecks.' : '✓ Lean test program limits cycle time exposure.' },
              ].map((s) => (
                <div key={s.title} className="border border-art-ink/10 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex justify-between items-center border-b border-art-ink/5 pb-2">
                    <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-art-rust"></div><span className="text-[10px] font-bold text-art-ink/70 uppercase tracking-wider font-mono">{s.title}</span></div>
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${s.score > 70 ? 'text-red-700 bg-red-50' : s.score > 40 ? 'text-yellow-700 bg-yellow-50' : 'text-green-700 bg-green-50'}`}>{s.score}/100</span>
                  </div>
                  <p className="text-[10px] text-art-ink/70 leading-relaxed">{s.desc}</p>
                  <div className="space-y-2.5 pt-2 text-[10px] font-mono">
                    {s.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-art-ink/40">{item.split(':')[0]}:</span>
                        <span className="font-semibold">{item.split(':')[1]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-art-ink/5 text-[9px] text-art-ink/50 italic leading-relaxed">{s.note}</div>
                </div>
              ))}
            </div>

            {activeBuild.designModel.mpw?.enabled && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-purple-700">
                  <Shuffle className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono">MPW Shuttle Constraints</h4>
                </div>
                <p className="text-xs text-purple-800/70 leading-relaxed font-sans">
                  This build uses Multi-Project Wafer pricing. Volume is capped at <strong>{round((activeBuild.designModel.mpw.diesPerSlot || 0) * (activeBuild.designModel.mpw.shuttlesPerYear || 0) * riskMetrics.totalArea / 1000000, 3)}M units/yr</strong> by the shuttle schedule. NRE savings versus dedicated mask set may be substantial, but die allocation and shuttle timing are fixed. Validate that the die area ({activeBuild.designModel.dieArea} mm²) does not exceed the reticle slot limit ({activeBuild.designModel.mpw.reticleSlotArea || 100} mm²).
                </p>
              </div>
            )}

            {activeBuild.designModel.packagingType !== 'standard' && (
              <div className="bg-cyan-50 border-2 border-cyan-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-700">
                  <Package className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono">{activeBuild.designModel.packagingType === 'emib' ? 'Intel EMIB' : activeBuild.designModel.packagingType === 'cowos-s' ? 'CoWoS-S' : activeBuild.designModel.packagingType === 'cowos-r' ? 'CoWoS-R' : 'CoWoS-L'} Advanced Packaging Constraints</h4>
                </div>
                <p className="text-xs text-cyan-800/70 leading-relaxed font-sans">
                  This build uses advanced {activeBuild.designModel.packagingType === 'emib' ? 'EMIB bridge' : 'CoWoS interposer'} packaging. Interposer cost adds <strong>${round(activeBuild.designModel.interposerArea ? 
                    (activeBuild.designModel.packagingType === 'cowos-s' ? activeBuild.designModel.interposerArea * 3.50 / 0.96 :
                    activeBuild.designModel.packagingType === 'cowos-r' ? activeBuild.designModel.interposerArea * 1.20 / 0.98 :
                    activeBuild.designModel.packagingType === 'cowos-l' ? activeBuild.designModel.interposerArea * 2.20 / 0.97 :
                    24) : 24, 2)} per unit</strong>. System yield is multiplied by interposer and assembly yield, reducing overall KGD output. Thermal density across {activeBuild.designModel.interposerArea ? `${activeBuild.designModel.interposerArea} mm²` : 'the interposer'} should be validated against the <strong>0.5 W/mm²</strong> threshold for conventional cooling.
                </p>
              </div>
            )}

            {/* Architecture BOM Risk Assessment */}
            {archBlocks.length > 0 && (
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-700">
                  <Cpu className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Architecture BOM Risk Assessment</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <span className="text-[9px] text-indigo-500 font-bold uppercase font-mono block">Total Blocks</span>
                    <span className="text-sm font-serif font-black text-art-ink">{archBlocks.length} blocks</span>
                    <p className="text-[9px] text-art-ink/40 font-mono mt-1">{archBlocks.filter(b => b.implementation === 'licensed').length} licensed</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <span className="text-[9px] text-indigo-500 font-bold uppercase font-mono block">Royalty Exposure</span>
                    <span className="text-sm font-serif font-black text-art-ink">${round(archBlocks.reduce((s, b) => s + (b.royaltyPerUnit ?? 0), 0), 2)}/unit</span>
                    <p className="text-[9px] text-art-ink/40 font-mono mt-1">Recurring cost at volume</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <span className="text-[9px] text-indigo-500 font-bold uppercase font-mono block">Critical Blocks</span>
                    <span className="text-sm font-serif font-black text-art-ink">{archBlocks.filter(b => b.manufacturingCriticality === 'critical').length}</span>
                    <p className="text-[9px] text-art-ink/40 font-mono mt-1">Yield-limiting risk</p>
                  </div>
                </div>
                <p className="text-xs text-indigo-800/70 leading-relaxed font-sans">
                  {archBlocks.filter(b => b.implementation === 'internal').length > 0
                    ? `${archBlocks.filter(b => b.implementation === 'internal').length} internally-built block(s) carry schedule and verification risk. `
                    : ''}
                  {archBlocks.some(b => b.supplyChainRisk === 'high' || b.supplyChainRisk === 'medium')
                    ? `${archBlocks.filter(b => b.supplyChainRisk === 'high' || b.supplyChainRisk === 'medium').length} block(s) have elevated supply chain risk. `
                    : ''}
                  Review block-level estimated vs measured area drift to flag yield exposure before tapeout.
                </p>
              </div>
            )}

            <div className="bg-art-cream/10 border border-art-ink/10 rounded-xl p-4 space-y-3 mt-6">
              <div className="flex items-center space-x-2 text-art-rust"><Wrench className="w-4 h-4" /><h4 className="text-xs font-bold uppercase tracking-wider font-mono">ISO 26262 Hardware Safety Requirements</h4></div>
              <p className="text-xs text-art-ink/75 leading-relaxed font-sans">To satisfy functional safety under ISO 26262-5, incorporate these hardware-level mechanisms:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1">
                <div className="p-3 bg-white border border-art-ink/10 rounded-lg space-y-2">
                  <span className="text-art-rust font-bold uppercase text-[10px] tracking-wider block">Recommended Safety Mechanisms</span>
                  <p className="text-art-ink/80 text-[11px] leading-relaxed">{riskMetrics.safetyMechanism}.</p>
                </div>
                <div className="p-3 bg-white border border-art-ink/10 rounded-lg space-y-2">
                  <span className="text-art-rust font-bold uppercase text-[10px] tracking-wider block">FMEA / FMEDA Diagnostics</span>
                  <p className="text-art-ink/80 text-[11px] leading-relaxed">Perform failure mode distribution analyses. Implement DVFS thermal sensors and wearout monitors to satisfy ASIL-D latent fault metrics.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Build Anatomy */}
      {labTab === 'anatomy' && (
        <div className="bg-white border-2 border-art-ink/15 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3.5 bg-art-ink text-art-cream flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 border-b border-art-ink/10">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-art-rust" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-art-cream">Immutable Build Anatomy</h3>
                <p className="text-[10px] text-art-cream/60 font-mono">Build ID: {activeBuild.id} • Six Logical Sections</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-art-rust bg-art-cream/10 border border-art-rust/20 px-2 py-0.5 rounded uppercase">Deterministic Engine Active</span>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 border-b border-art-ink/10 bg-art-cream/20 text-[11px] font-bold font-mono">
            {[
              { key: 'intent' as const, icon: <Sliders className="w-3.5 h-3.5" />, label: '1. Intent' },
              { key: 'references' as const, icon: <Database className="w-3.5 h-3.5" />, label: '2. References' },
              { key: 'computation' as const, icon: <Cpu className="w-3.5 h-3.5" />, label: '3. Computation' },
              { key: 'evidence' as const, icon: <FileText className="w-3.5 h-3.5" />, label: '4. Evidence' },
              { key: 'metadata' as const, icon: <Fingerprint className="w-3.5 h-3.5" />, label: '5. Metadata' },
              { key: 'deliverables' as const, icon: <Package className="w-3.5 h-3.5" />, label: '6. Deliverables' },
            ].map((t) => (
              <button key={t.key} onClick={() => setAnatomyTab(t.key)}
                className={`py-3 text-center border-r border-art-ink/10 cursor-pointer flex items-center justify-center space-x-1.5 transition-all ${anatomyTab === t.key ? 'bg-white text-art-rust border-b-2 border-b-art-rust font-serif italic' : 'text-art-ink/65 hover:bg-white/40 hover:text-art-ink'}`}>
                {t.icon} <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="p-5 bg-white min-h-[220px]">
            {anatomyTab === 'intent' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2"><Sliders className="w-4.5 h-4.5 text-art-rust" /><h4 className="text-sm font-serif font-black text-art-ink">Section 1: Engineering Intent & Parameter Design Knobs</h4></div>
                <p className="text-xs text-art-ink/60 leading-relaxed italic">Captures configuration decisions, architectural limits, and commercial volume projections. Under Siliconomics Principles, changing any intent parameter branches a new build.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-mono bg-art-cream/40 p-4 rounded-xl border border-art-ink/10">
                  {[['Process Node', dm.processNode], ['Foundry', dm.foundry === 'intel' ? 'Intel Foundry' : dm.foundry === 'samsung' ? 'Samsung' : 'TSMC'], ['Packaging', dm.packagingType === 'standard' ? 'Standard Substrate' : dm.packagingType === 'emib' ? 'Intel EMIB' : (dm.packagingType?.toUpperCase() ?? 'Standard')], ['Topology', dm.topology], ['Die Area', `${dm.dieArea} mm²`], ['Transistors', `${dm.transistorCount} B`], ['TDP', `${dm.tdp} W`], ['Defect Density (D0)', `${dm.defectDensity} /cm²`], ['Wafer Starts', `${dm.waferStartsPerMonth.toLocaleString()}/mo`], ['Packaging Cost', `\$${dm.packagingCost.toFixed(2)}`], ['Test Time', `${dm.testTimeSeconds}s @ \$${dm.testCostPerSecond.toFixed(2)}/s`], ['Packaging Yield', `${dm.packagingYield}%`], ['Wafer Cost', `\$${dm.waferCost.toLocaleString()}`], ['Volume', `${dm.targetVolume}M`]].map(([label, val]) => (
                    <div key={label as string} className="p-2 border-b border-art-ink/5">
                      <span className="text-art-ink/40 block uppercase tracking-wider text-[9px] font-semibold">{label}</span>
                      <span className="text-art-ink font-bold text-xs">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {anatomyTab === 'references' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2"><Database className="w-4.5 h-4.5 text-art-rust" /><h4 className="text-sm font-serif font-black text-art-ink">Section 2: External Reference Dependencies</h4></div>
                <p className="text-xs text-art-ink/60 leading-relaxed italic">External dependencies, reference pricing libraries, and foundry cost profiles that guarantee reproducibility.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-art-cream/30 border border-art-ink/10 rounded-lg space-y-1"><span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Formula Library</span><span className="text-art-ink font-bold text-sm block">{activeBuild.formulaVersion}</span><span className="text-[10px] text-art-ink/50 block font-sans">Murphy Yield Model, chiplet cascade probability, NRE amortization.</span></div>
                  <div className="p-4 bg-art-cream/30 border border-art-ink/10 rounded-lg space-y-1"><span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Foundry Node Reference</span><span className="text-art-ink font-bold text-sm block">{activeBuild.referenceModel}</span><span className="text-[10px] text-art-ink/50 block font-sans">Anchors wafer cost guidelines, defect target curves.</span></div>
                  <div className="p-4 bg-art-cream/30 border border-art-ink/10 rounded-lg space-y-1"><span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Platform Engine</span><span className="text-art-ink font-bold text-sm block">Siliconomics Engine v1.0.3-C</span><span className="text-[10px] text-art-ink/50 block font-sans">Fully deterministic with zero random variables.</span></div>
                </div>
              </div>
            )}
            {anatomyTab === 'computation' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2"><Cpu className="w-4.5 h-4.5 text-art-rust" /><h4 className="text-sm font-serif font-black text-art-ink">Section 3: Deterministic Computation Outputs</h4></div>
                <p className="text-xs text-art-ink/60 leading-relaxed italic">Immutable results demonstrating yield, throughput, cost, and commercial feasibility.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-mono">
                  {[['Dies Per Wafer', `${snap.dpw} dies`], ['Silicon Yield', `${round(snap.dieYield * 100, 2)}%`], ['Unit COGS', `\$${round(snap.grossCostPerGoodDie, 2)}`], ['Gross Margin', `${round(snap.grossMargin, 2)}%`], ['Break-Even', `${round(snap.breakEvenVolumeMillion, 2)}M`], ['Net Profit', `\$${round(snap.lifetimeNetProfitMillion, 1)}M`], ['ROI', `${round(snap.roi, 1)}%`], ['Annual Volume', `${round(snap.annualVolumeMillion, 3)}M`]].map(([label, val]) => (
                    <div key={label as string} className="p-3 bg-art-cream/20 border border-art-ink/5 rounded-lg">
                      <span className="text-art-ink/40 text-[9px] block uppercase font-semibold">{label}</span>
                      <span className="text-art-ink font-serif italic font-black text-sm">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {anatomyTab === 'evidence' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2"><FileText className="w-4.5 h-4.5 text-art-rust" /><h4 className="text-sm font-serif font-black text-art-ink">Section 4: Evidence & Calculation Traceability</h4></div>
                <p className="text-xs text-art-ink/60 leading-relaxed italic">Provenance reporting of mathematical results. Click any metric card to see detailed first-principles breakdown.</p>
                <div className="bg-art-cream/30 p-4 rounded-xl border border-art-ink/10 space-y-3 text-xs">
                  <span className="font-mono text-[9px] font-bold text-art-rust uppercase block">Governing Formulas</span>
                  <ul className="list-disc pl-4 space-y-1.5 font-sans leading-relaxed text-art-ink/80">
                    <li><strong>Murphy Yield:</strong> <code>((1 - e^(-A * D0)) / (A * D0))²</code></li>
                    <li><strong>DPW:</strong> <code>(π * d²) / (4 * A) - (π * d) / √(2 * A)</code></li>
                    <li><strong>COGS:</strong> <code>Silicon + Packaging + Test + (NRE / Volume)</code></li>
                  </ul>
                </div>
              </div>
            )}
            {anatomyTab === 'metadata' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-art-ink/5 pb-2"><Fingerprint className="w-4.5 h-4.5 text-art-rust" /><h4 className="text-sm font-serif font-black text-art-ink">Section 5: Administrative Metadata & Lineage</h4></div>
                <p className="text-xs text-art-ink/60 leading-relaxed italic">Durable administrative tracking and revision lineage records.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {[['Build ID', activeBuild.id], ['Creator', activeBuild.creator || 'eagleximpact'], ['Organization', activeBuild.organization || 'Siliconomics Manhattan Corp'], ['Created', `${activeBuild.createdDate} • ${activeBuild.parentId ? `Branched from ${activeBuild.parentId.slice(0, 8)}` : 'Root Baseline'}`]].map(([label, val]) => (
                    <div key={label as string} className="p-3 bg-art-cream/40 rounded-lg border border-art-ink/10 space-y-1">
                      <span className="text-art-ink/40 text-[9px] block uppercase font-bold">{label}</span>
                      <span className="text-art-ink font-bold break-all text-[11px]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {anatomyTab === 'deliverables' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-art-ink/5 pb-2">
                  <div className="flex items-center space-x-2"><Package className="w-4.5 h-4.5 text-art-rust" /><h4 className="text-sm font-serif font-black text-art-ink">Section 6: Document Deliverables</h4></div>
                  <div className="flex space-x-2 text-[10px] font-mono">
                    {[
                      { key: 'engineering' as const, label: 'Engineering Report' },
                      { key: 'executive' as const, label: 'Executive Briefing' },
                      { key: 'csv' as const, label: 'CSV Export' },
                    ].map((d) => (
                      <button key={d.key} onClick={() => { setDeliverableType(d.key); generateDeliverable(activeBuild, snap, dm, d.key, setDeliverableText); }}
                        className={`px-2 py-1 rounded cursor-pointer ${deliverableType === d.key ? 'bg-art-ink text-white font-bold' : 'bg-art-cream border border-art-ink/15 text-art-ink/60'}`}>{d.label}</button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-art-ink/60 leading-relaxed italic">Produces production-ready traceable document packages with Build ID and formula references.</p>
                {deliverableText ? (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-[10px] font-mono text-art-ink/50">
                      <span>Export Ready</span>
                      <button onClick={() => { navigator.clipboard.writeText(deliverableText); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }}
                        className="flex items-center space-x-1 px-2 py-1 bg-art-cream hover:bg-art-ink hover:text-white rounded border border-art-ink/10 transition-all cursor-pointer font-bold text-art-rust">
                        {isCopied ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy Report'}</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-art-cream/60 border border-art-ink/15 text-[10px] font-mono rounded-lg overflow-x-auto text-art-ink max-h-60 leading-relaxed whitespace-pre font-medium">{deliverableText}</pre>
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
      )}
    </div>
  );
}

function generateDeliverable(activeBuild: Build, snap: any, dm: any, type: string, setter: (t: string) => void) {
  const activeArchBlocks = activeBuild.architecture?.blocks ?? [];
  const ipInfo = activeArchBlocks.length > 0
    ? `\nARCH BLOCKS:     ${activeArchBlocks.length} blocks
IP NRE TOTAL:    $${round(snap.totalIpNreM + snap.totalLicenseFeesM, 1)}M
ROYALTY/UNIT:    $${round(snap.totalRoyaltyBurdenPerUnit, 2)}
EFF. NRE TOTAL:  $${round(activeBuild.designModel.nreCost + snap.totalIpNreM + snap.totalLicenseFeesM, 1)}M`
    : '';

  if (type === 'engineering') {
    setter(`========================================================================
SILICONOMICS ENGINEERING REPORT: ${activeBuild.name.toUpperCase()}
========================================================================
BUILD ID:        ${activeBuild.id}
VERSION:         ${activeBuild.version}
CREATOR:         ${activeBuild.creator}
ORGANIZATION:    ${activeBuild.organization}
TIMESTAMP:       ${new Date().toISOString()}
FORMULA LIBRARY: ${activeBuild.formulaVersion}
FOUNDRY:         ${dm.foundry}
NODE:            ${dm.processNode}
PACKAGING:       ${dm.packagingType}
TOPOLOGY:        ${dm.topology}  |  DIE AREA: ${dm.dieArea} mm²
TRANSISTORS:     ${dm.transistorCount} B  |  TDP: ${dm.tdp}W
DPW:             ${snap.dpw} dies
SILICON YIELD:   ${round(snap.dieYield * 100, 2)}%
COGS/UNIT:       $${round(snap.grossCostPerGoodDie, 2)}
GROSS MARGIN:    ${round(snap.grossMargin, 2)}%
BREAK-EVEN:      ${round(snap.breakEvenVolumeMillion, 2)}M units
ROI:             ${round(snap.roi, 1)}%${ipInfo}
========================================================================`);
  } else if (type === 'executive') {
    setter(`========================================================================
EXECUTIVE BRIEFING: ${activeBuild.name.toUpperCase()}
========================================================================
FOUNDRY:         ${dm.foundry}
NODE:            ${dm.processNode}
PACKAGING:       ${dm.packagingType}
VOLUME:          ${dm.targetVolume}M units
ASP:             $${dm.asp}
COGS/UNIT:       $${round(snap.grossCostPerGoodDie, 2)}
NRE CAPEX:       $${dm.nreCost}M
GROSS MARGIN:    ${round(snap.grossMargin, 2)}%
NET PROFIT:      $${round(snap.lifetimeNetProfitMillion, 1)}M
ROI:             ${round(snap.roi, 1)}%
BREAK-EVEN:      ${round(snap.breakEvenVolumeMillion, 2)}M units${ipInfo}
========================================================================`);
  } else {
    setter(`"Metric","Value","Unit"
"Build ID","${activeBuild.id}","UUID"
"Name","${activeBuild.name}","String"
"Foundry","${dm.foundry}","enum"
"Node","${dm.processNode}","nm"
"Packaging","${dm.packagingType}","enum"
"Die Area","${dm.dieArea}","mm2"
"DPW","${snap.dpw}","dies"
"Yield","${round(snap.dieYield * 100, 2)}","%"
"COGS","${round(snap.grossCostPerGoodDie, 2)}","USD"
"Margin","${round(snap.grossMargin, 2)}","%"
"ROI","${round(snap.roi, 1)}","%"
"Break-Even","${round(snap.breakEvenVolumeMillion, 2)}","M"
${(activeBuild.architecture?.blocks ?? []).length > 0 ? `"Arch Blocks","${(activeBuild.architecture?.blocks ?? []).length}","count"
"Arch NRE","${round(snap.totalIpNreM + snap.totalLicenseFeesM, 1)}","$M"
"Arch Royalty/Unit","${round(snap.totalRoyaltyBurdenPerUnit, 2)}","$"` : ''}`);
  }
}

function LayoutIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function MetricSection({ title, icon, metrics, renderCard }: { title: string; icon: React.ReactNode; metrics: MetricCardData[]; renderCard: (m: MetricCardData) => React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-art-cream/30 border-b border-art-ink/10 flex items-center space-x-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono text-art-ink">{title}</span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">{metrics.map((m) => renderCard(m))}</div>
    </div>
  );
}

import React, { useEffect, useCallback, useState } from 'react';
import { Build, Snapshot, Decision, DecisionOutcome } from '../types';
import { computeBuildMetrics } from '../utils/mathEngine';
import { computeBusinessImpact, BusinessImpact } from '../utils/BusinessImpact';
import { evaluateBuild, RecommendationDetail } from '../utils/ExecutiveRecommendation';
import { TrendingUp, ShieldAlert, AlertTriangle, FileCheck, ArrowRight, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface MeetingModeProps {
  builds: Build[];
  decisions: Decision[];
  onClose: () => void;
  activeBuildId: string;
  onRecordDecision?: (decision: Decision) => void;
}

type Slide = 'overview' | 'comparison' | 'impact' | 'recommendation' | 'scorecard' | 'risk' | 'decisions';

const SLIDES: Slide[] = ['overview', 'comparison', 'impact', 'scorecard', 'risk', 'recommendation', 'decisions'];

function SlideNav({
  slideIndex,
  goPrev,
  goNext,
  onSelect,
}: {
  slideIndex: number;
  goPrev: () => void;
  goNext: () => void;
  onSelect: (s: Slide) => void;
}) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4">
      <button onClick={goPrev} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex space-x-2">
        {SLIDES.map((s, i) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${i === slideIndex ? 'bg-art-rust scale-125' : 'bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
      <button onClick={goNext} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer">
        <ChevronRight className="w-5 h-5" />
      </button>
      <span className="text-white/30 text-xs font-mono ml-4">{slideIndex + 1} / {SLIDES.length}</span>
    </div>
  );
}

const outcomeColor: Record<string, string> = {
  'Proceed': 'text-green-400',
  'Proceed with Risk': 'text-yellow-400',
  'Requires Investigation': 'text-orange-400',
  'Hold': 'text-red-400',
  'Reject': 'text-red-500',
};

const outcomeBg: Record<string, string> = {
  'Proceed': 'bg-green-900/30 border-green-700',
  'Proceed with Risk': 'bg-yellow-900/30 border-yellow-700',
  'Requires Investigation': 'bg-orange-900/30 border-orange-700',
  'Hold': 'bg-red-900/30 border-red-700',
  'Reject': 'bg-red-950/40 border-red-800',
};

export default function MeetingMode({ builds, decisions, onClose, activeBuildId, onRecordDecision }: MeetingModeProps) {
  const [slide, setSlide] = useState<Slide>('overview');
  const activeIdx = builds.findIndex(b => b.id === activeBuildId);
  const [buildAIdx, setBuildAIdx] = useState(activeIdx >= 0 ? activeIdx : 0);
  const [buildBIdx, setBuildBIdx] = useState(() => {
    const otherIdx = builds.findIndex(b => b.id !== activeBuildId && builds[activeIdx]?.parentId !== b.id);
    return otherIdx >= 0 ? otherIdx : Math.min(1, builds.length - 1);
  });

  const buildA = builds[buildAIdx] ?? builds[0]!;
  const buildB = builds[buildBIdx] ?? builds[0]!;
  const snapA = computeBuildMetrics(buildA).snapshot;
  const snapB = computeBuildMetrics(buildB).snapshot;
  const impacts = computeBusinessImpact(buildA, snapA, buildB, snapB);
  const recA = evaluateBuild(snapA, buildA.designModel);
  const recB = evaluateBuild(snapB, buildB.designModel);

  const slideIndex = SLIDES.indexOf(slide);

  const goNext = useCallback(() => {
    setSlide((prev) => {
      const idx = SLIDES.indexOf(prev);
      return SLIDES[Math.min(idx + 1, SLIDES.length - 1)]!;
    });
  }, []);

  const goPrev = useCallback(() => {
    setSlide((prev) => {
      const idx = SLIDES.indexOf(prev);
      return SLIDES[Math.max(idx - 1, 0)]!;
    });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded bg-art-rust flex items-center justify-center font-serif font-black text-xs text-white italic">S</div>
          <span className="text-sm font-serif font-black text-white tracking-widest uppercase">Siliconomics</span>
          <span className="text-[10px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">Meeting Mode</span>
          {builds.length > 1 && (
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-white/10">
              <span className="text-[10px] text-white/40 font-mono">A:</span>
              <select value={buildAIdx} onChange={(e) => setBuildAIdx(Number(e.target.value))}
                className="text-[10px] bg-white/10 border border-white/20 rounded px-2 py-1 text-white font-mono outline-none cursor-pointer">
                {builds.map((b, i) => <option key={b.id} value={i}>{b.name}</option>)}
              </select>
              <span className="text-[10px] text-white/40 font-mono">B:</span>
              <select value={buildBIdx} onChange={(e) => setBuildBIdx(Number(e.target.value))}
                className="text-[10px] bg-white/10 border border-white/20 rounded px-2 py-1 text-white font-mono outline-none cursor-pointer">
                {builds.map((b, i) => <option key={b.id} value={i}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {slide === 'overview' && <OverviewSlide builds={builds} />}
        {slide === 'comparison' && (
          <ComparisonSlide buildA={buildA} snapA={snapA} buildB={buildB} snapB={snapB} />
        )}
        {slide === 'impact' && <ImpactSlide impacts={impacts} />}
        {slide === 'scorecard' && (
          <ScorecardSlide buildA={buildA} snapA={snapA} buildB={buildB} snapB={snapB} buildAId={buildA.id} buildBId={buildB.id} />
        )}
        {slide === 'risk' && (
          <RiskSlide buildA={buildA} snapA={snapA} recA={recA} />
        )}
        {slide === 'recommendation' && (
          <RecommendationSlide recA={recA} recB={recB} buildA={buildA} buildB={buildB} />
        )}
        {slide === 'decisions' && (
          <DecisionsSlide decisions={decisions} builds={builds} buildA={buildA} buildB={buildB} onRecordDecision={onRecordDecision} />
        )}
      </div>

      <SlideNav slideIndex={slideIndex} goPrev={goPrev} goNext={goNext} onSelect={setSlide} />
    </div>
  );
}

function ScorecardSlide({ buildA, snapA, buildB, snapB, buildAId: _buildAId, buildBId: _buildBId }: { buildA: Build; snapA: Snapshot; buildB: Build; snapB: Snapshot; buildAId: string; buildBId: string }) {
  const dims = [
    { key: 'technical', label: 'Technical Feasibility', a: Math.round(Math.min(10, (snapA.dieYield / 0.95) * 3 + (snapA.transistorDensity > 50 ? 4 : 2) + (snapA.dpw > 200 ? 3 : 1))), b: Math.round(Math.min(10, (snapB.dieYield / 0.95) * 3 + (snapB.transistorDensity > 50 ? 4 : 2) + (snapB.dpw > 200 ? 3 : 1))) },
    { key: 'manufacturing', label: 'Manufacturing Readiness', a: Math.round(Math.min(10, (buildA.designModel.packagingYield / 99) * 4 + (buildA.designModel.testYield / 99) * 3 + (snapA.dieYield > 0.6 ? 3 : 0))), b: Math.round(Math.min(10, (buildB.designModel.packagingYield / 99) * 4 + (buildB.designModel.testYield / 99) * 3 + (snapB.dieYield > 0.6 ? 3 : 0))) },
    { key: 'capital', label: 'Capital Efficiency', a: Math.round(Math.min(10, (snapA.roi > 50 ? 5 : snapA.roi > 20 ? 3 : 1) + (snapA.breakEvenVolumeMillion < 2 ? 3 : snapA.breakEvenVolumeMillion < 5 ? 2 : 0) + (buildA.designModel.nreCost < 50 ? 2 : 0))), b: Math.round(Math.min(10, (snapB.roi > 50 ? 5 : snapB.roi > 20 ? 3 : 1) + (snapB.breakEvenVolumeMillion < 2 ? 3 : snapB.breakEvenVolumeMillion < 5 ? 2 : 0) + (buildB.designModel.nreCost < 50 ? 2 : 0))) },
    { key: 'commercial', label: 'Commercial Attractiveness', a: Math.round(Math.min(10, (snapA.grossMargin > 60 ? 5 : snapA.grossMargin > 35 ? 3 : 1) + (snapA.lifetimeNetProfitMillion > 200 ? 3 : snapA.lifetimeNetProfitMillion > 0 ? 1 : 0) + (buildA.designModel.asp > 500 ? 2 : 0))), b: Math.round(Math.min(10, (snapB.grossMargin > 60 ? 5 : snapB.grossMargin > 35 ? 3 : 1) + (snapB.lifetimeNetProfitMillion > 200 ? 3 : snapB.lifetimeNetProfitMillion > 0 ? 1 : 0) + (buildB.designModel.asp > 500 ? 2 : 0))) },
    { key: 'program', label: 'Program Confidence', a: Math.round(Math.min(10, (snapA.grossMargin > 40 ? 3 : 1) + (snapA.roi > 30 ? 3 : 1) + (snapA.breakEvenVolumeMillion < 3 ? 4 : 2))), b: Math.round(Math.min(10, (snapB.grossMargin > 40 ? 3 : 1) + (snapB.roi > 30 ? 3 : 1) + (snapB.breakEvenVolumeMillion < 3 ? 4 : 2))) },
    { key: 'supplyChain', label: 'Supply Chain Resilience', a: Math.round(Math.min(10, 10 - Math.round(snapA.supplyChain.compositeRiskScore / 10))), b: Math.round(Math.min(10, 10 - Math.round(snapB.supplyChain.compositeRiskScore / 10))) },
    { key: 'schedule', label: 'Schedule Confidence', a: Math.round(Math.min(10, (buildA.designModel.packagingYield > 97 ? 3 : 1) + (buildA.designModel.testYield > 97 ? 3 : 1) + (snapA.breakEvenVolumeMillion < 4 ? 4 : 2))), b: Math.round(Math.min(10, (buildB.designModel.packagingYield > 97 ? 3 : 1) + (buildB.designModel.testYield > 97 ? 3 : 1) + (snapB.breakEvenVolumeMillion < 4 ? 4 : 2))) },
  ];
  const max = 10;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif font-black text-white tracking-tight">Executive Decision Scorecard</h1>
        <p className="text-sm text-white/50 italic">Side-by-side dimensional comparison</p>
      </div>
      <div className="flex items-center justify-center space-x-6 text-sm font-mono text-white/50 mb-4">
        <span className="flex items-center space-x-2"><div className="w-3 h-3 rounded bg-art-rust/60" /><span>{buildA.name}</span></span>
        <span className="text-white/20">vs</span>
        <span className="flex items-center space-x-2"><div className="w-3 h-3 rounded bg-blue-400/60" /><span>{buildB.name}</span></span>
      </div>
      <div className="space-y-4">
        {dims.map(dim => {
          const winner = dim.a > dim.b ? 'a' : dim.b > dim.a ? 'b' : 'none';
          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono uppercase text-white/60">{dim.label}</span>
                <span className="text-[9px] font-mono text-white/30">/ {max}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
                  <div className={`h-full rounded-full transition-all ${dim.a >= 7 ? 'bg-green-500/60' : dim.a >= 4 ? 'bg-yellow-500/60' : 'bg-red-500/60'}`} style={{ width: `${(dim.a / max) * 100}%` }} />
                  {winner === 'a' && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">WIN</span>}
                </div>
                <span className={`text-sm font-mono font-bold w-8 text-center ${winner === 'a' ? 'text-green-400' : 'text-white/50'}`}>{dim.a}</span>
                <ChevronRight className="w-4 h-4 text-white/20" />
                <span className={`text-sm font-mono font-bold w-8 text-center ${winner === 'b' ? 'text-green-400' : 'text-white/50'}`}>{dim.b}</span>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
                  <div className={`h-full rounded-full transition-all ${dim.b >= 7 ? 'bg-green-500/60' : dim.b >= 4 ? 'bg-yellow-500/60' : 'bg-red-500/60'}`} style={{ width: `${(dim.b / max) * 100}%` }} />
                  {winner === 'b' && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">WIN</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskSlide({ buildA, snapA, recA }: { buildA: Build; snapA: Snapshot; recA: RecommendationDetail }) {
  const risks = [
    { label: 'Manufacturing Risk', score: Math.round((100 - snapA.dieYield * 100) / 10), max: 10, detail: `Die yield ${(snapA.dieYield * 100).toFixed(1)}%` },
    { label: 'Financial Risk', score: Math.round(Math.max(0, 10 - (snapA.grossMargin > 40 ? 5 : snapA.grossMargin > 20 ? 3 : 0) - (snapA.roi > 30 ? 3 : 0) - (snapA.breakEvenVolumeMillion < 3 ? 2 : 0))), max: 10, detail: `${snapA.grossMargin.toFixed(1)}% margin` },
    { label: 'Supply Chain Risk', score: Math.round(snapA.supplyChain.compositeRiskScore / 10), max: 10, detail: snapA.supplyChain.riskLevel },
    { label: 'Technology Risk', score: buildA.designModel.topology === 'chiplet' ? 5 : buildA.designModel.defectDensity > 0.3 ? 7 : 3, max: 10, detail: `${buildA.designModel.processNode}` },
    { label: 'Packaging Risk', score: buildA.designModel.packagingType !== 'standard' ? Math.round((100 - buildA.designModel.packagingYield) / 5) : Math.round((100 - buildA.designModel.packagingYield) / 10), max: 10, detail: `${buildA.designModel.packagingType}` },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif font-black text-white tracking-tight">Risk Dashboard</h1>
        <p className="text-sm text-white/50 italic">{buildA.name} — Risk assessment across all categories</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {risks.map(r => {
          const pct = r.max > 0 ? (r.score / r.max) * 100 : 0;
          const color = pct >= 70 ? 'border-red-500/40 bg-red-900/20' : pct >= 40 ? 'border-yellow-500/40 bg-yellow-900/20' : 'border-green-500/40 bg-green-900/20';
          const textColor = pct >= 70 ? 'text-red-400' : pct >= 40 ? 'text-yellow-400' : 'text-green-400';
          return (
            <div key={r.label} className={`border rounded-xl p-5 ${color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{r.label}</span>
                <span className={`text-lg font-mono font-bold ${textColor}`}>{r.score}<span className="text-xs text-white/40">/{r.max}</span></span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-white/50 font-mono">{r.detail}</p>
            </div>
          );
        })}
      </div>
      {recA.riskFactors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold font-mono uppercase text-white/40 tracking-wider">Key Risk Factors</h3>
          {recA.riskFactors.map((rf, i) => (
            <div key={i} className="flex items-start space-x-2 text-sm text-yellow-300/80 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span>{rf}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewSlide({ builds }: { builds: Build[] }) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-serif font-black text-white tracking-tight">Program Portfolio Review</h1>
        <p className="text-lg text-white/50 font-sans italic">Board-Level Engineering & Financial Assessment</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {builds.map((b) => {
          const snap = computeBuildMetrics(b).snapshot;
          return (
            <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-serif font-black text-white">{b.name}</h3>
              <div className="text-[11px] font-mono text-white/40 space-y-1">
                <span>{b.designModel.processNode} • v{b.version}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-2xl font-serif font-black text-art-rust">{(snap.dieYield * 100).toFixed(0)}%</div>
                  <div className="text-[8px] text-white/30 uppercase font-mono tracking-wider">Die Yield</div>
                </div>
                <div>
                  <div className="text-2xl font-serif font-black text-green-400">{snap.grossMargin.toFixed(0)}%</div>
                  <div className="text-[8px] text-white/30 uppercase font-mono tracking-wider">Margin</div>
                </div>
                <div>
                  <div className="text-lg font-serif font-black text-white">${snap.lifetimeNetProfitMillion.toFixed(0)}M</div>
                  <div className="text-[8px] text-white/30 uppercase font-mono tracking-wider">Net Profit</div>
                </div>
                <div>
                  <div className="text-lg font-serif font-black text-art-rust">{snap.roi.toFixed(0)}%</div>
                  <div className="text-[8px] text-white/30 uppercase font-mono tracking-wider">ROI</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonSlide({ buildA, snapA, buildB, snapB }: { buildA: Build; snapA: Snapshot; buildB: Build; snapB: Snapshot }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-3xl font-serif font-black text-white tracking-tight">Side-by-Side Comparison</h2>
      <div className="grid grid-cols-2 gap-6">
        <BuildCard build={buildA} snap={snapA} title="Build A" />
        <BuildCard build={buildB} snap={snapB} title="Build B" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <DeltaCard label="Die Yield" a={snapA.dieYield * 100} b={snapB.dieYield * 100} unit="%" />
        <DeltaCard label="Gross Margin" a={snapA.grossMargin} b={snapB.grossMargin} unit="%" />
        <DeltaCard label="ROI" a={snapA.roi} b={snapB.roi} unit="%" />
        <DeltaCard label="Break-Even Volume" a={snapA.breakEvenVolumeMillion} b={snapB.breakEvenVolumeMillion} unit="M" />
        <DeltaCard label="Net Profit" a={snapA.lifetimeNetProfitMillion} b={snapB.lifetimeNetProfitMillion} unit="$M" />
        <DeltaCard label="Unit COGS" a={snapA.grossCostPerGoodDie} b={snapB.grossCostPerGoodDie} unit="$" />
      </div>
    </div>
  );
}

function BuildCard({ build, snap, title }: { build: Build; snap: Snapshot; title: string }) {
  const dm = build.designModel;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif font-black text-white">{title}: {build.name}</h3>
        <span className="text-[10px] font-mono text-white/30">{build.version}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <MetricRow label="Process Node" value={dm.processNode} />
        <MetricRow label="Die Yield" value={`${(snap.dieYield * 100).toFixed(1)}%`} />
        <MetricRow label="Topology" value={dm.topology} />
        <MetricRow label="Gross Margin" value={`${snap.grossMargin.toFixed(1)}%`} />
        <MetricRow label="Defect Density" value={`${dm.defectDensity} /cm²`} />
        <MetricRow label="ROI" value={`${snap.roi.toFixed(1)}%`} />
        <MetricRow label="Wafer Cost" value={`$${dm.waferCost.toLocaleString()}`} />
        <MetricRow label="Break-Even" value={`${snap.breakEvenVolumeMillion.toFixed(2)}M units`} />
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40 font-mono text-[11px] uppercase tracking-wider">{label}</span>
      <span className="text-white font-mono font-bold">{value}</span>
    </div>
  );
}

function DeltaCard({ label, a, b, unit }: { label: string; a: number; b: number; unit: string }) {
  const diff = b - a;
  const isBetter = (label === 'Unit COGS' || label === 'Break-Even Volume') ? diff < 0 : diff > 0;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center space-y-1">
      <div className="text-[10px] text-white/30 uppercase font-mono tracking-wider">{label}</div>
      <div className="flex items-center justify-center space-x-3 text-lg">
        <span className="text-white/60 font-mono">{a.toFixed(1)}{unit}</span>
        <ArrowRight className="w-4 h-4 text-white/30" />
        <span className="text-white font-mono font-bold">{b.toFixed(1)}{unit}</span>
      </div>
      <div className={`text-sm font-mono font-bold ${isBetter ? 'text-green-400' : 'text-red-400'}`}>
        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{unit}
      </div>
    </div>
  );
}

function ImpactSlide({ impacts }: { impacts: BusinessImpact[] }) {
  const getIcon = (s: string) => {
    if (s === 'positive') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (s === 'negative') return <ShieldAlert className="w-5 h-5 text-red-400" />;
    return <ArrowRight className="w-5 h-5 text-white/40" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-3xl font-serif font-black text-white tracking-tight">Business Impact Analysis</h2>
      <div className="space-y-3">
        {impacts.length === 0 && (
          <p className="text-white/40 text-lg italic">No material differences detected between the selected builds.</p>
        )}
        {impacts.map((imp, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getIcon(imp.severity)}
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/30">{imp.category}</span>
                <span className="text-white font-serif font-black text-sm">{imp.metric}</span>
              </div>
              <span className="text-[11px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{imp.delta}</span>
            </div>
            <p className="text-white/70 leading-relaxed text-sm font-sans">{imp.narrative}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationSlide({ recA, recB, buildA, buildB }: { recA: RecommendationDetail; recB: RecommendationDetail; buildA: Build; buildB: Build }) {
  const best = recA.confidence >= recB.confidence ? recA : recB;
  const bestBuild = recA.confidence >= recB.confidence ? buildA : buildB;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h2 className="text-3xl font-serif font-black text-white tracking-tight">Executive Recommendation</h2>

      <div className={`rounded-xl border-2 p-8 text-center space-y-4 ${outcomeBg[best.outcome] ?? 'bg-white/5 border-white/10'}`}>
        <div className={`text-5xl font-serif font-black ${outcomeColor[best.outcome] ?? 'text-white'}`}>
          {best.outcome}
        </div>
        <div className="text-2xl font-serif font-black text-white">{bestBuild.name}</div>
        <div className="inline-block bg-white/10 rounded-full px-4 py-1 text-sm font-mono text-white/60">
          Confidence: {best.confidence}%
        </div>
        <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">{best.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-serif font-black text-white">Supporting Evidence</h3>
          {best.supportingEvidence.length === 0 && <p className="text-white/40 text-xs italic">No automated evidence flags.</p>}
          {best.supportingEvidence.map((e, i) => (
            <div key={i} className="flex items-start space-x-2 text-sm text-white/70">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{e}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-serif font-black text-white">Risk Factors</h3>
          {best.riskFactors.length === 0 && <p className="text-white/40 text-xs italic">No material risk factors detected.</p>}
          {best.riskFactors.map((r, i) => (
            <div key={i} className="flex items-start space-x-2 text-sm text-white/70">
              <span className="text-red-400 mt-0.5">▲</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionsSlide({ decisions, builds, buildA, buildB, onRecordDecision }: {
  decisions: Decision[]; builds: Build[]; buildA: Build; buildB: Build; onRecordDecision?: (d: Decision) => void;
}) {
  const getBuildName = (id: string) => builds.find((b) => b.id === id)?.name ?? id;
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState<DecisionOutcome>('Proceed');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionApprover, setDecisionApprover] = useState('eagleximpact');
  const [decisionFollowUp, setDecisionFollowUp] = useState('');

  const handleRecord = () => {
    if (!onRecordDecision) return;
    const decision: Decision = {
      id: `dec-meeting-${Date.now()}`,
      buildIds: [buildA.id, buildB.id],
      outcome: decisionOutcome,
      approver: decisionApprover,
      rationale: decisionRationale,
      followUpActions: decisionFollowUp ? [decisionFollowUp] : [],
      timestamp: new Date().toISOString(),
    };
    onRecordDecision(decision);
    setShowDecisionModal(false);
    setDecisionOutcome('Proceed');
    setDecisionRationale('');
    setDecisionFollowUp('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-black text-white tracking-tight">Decision Log</h2>
        {onRecordDecision && (
          <button
            onClick={() => setShowDecisionModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-art-rust hover:bg-art-rust/80 rounded-lg text-white text-xs font-bold cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Decision</span>
          </button>
        )}
      </div>

      {showDecisionModal && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-serif font-black text-white">New Decision</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Builds Under Review</label>
              <p className="text-white font-mono font-bold">{buildA.name} vs {buildB.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Decision Outcome</label>
              <select value={decisionOutcome} onChange={(e) => setDecisionOutcome(e.target.value as DecisionOutcome)}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-xs font-semibold outline-none focus:border-art-rust cursor-pointer">
                <option value="Proceed">Proceed</option>
                <option value="Proceed with Risk">Proceed with Risk</option>
                <option value="Requires Investigation">Requires Investigation</option>
                <option value="Hold">Hold</option>
                <option value="Reject">Reject</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Approver</label>
              <input type="text" value={decisionApprover} onChange={(e) => setDecisionApprover(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-xs font-semibold outline-none focus:border-art-rust" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Follow-Up Action</label>
              <input type="text" value={decisionFollowUp} onChange={(e) => setDecisionFollowUp(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-xs font-semibold outline-none focus:border-art-rust" placeholder="Optional" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Rationale</label>
              <textarea value={decisionRationale} onChange={(e) => setDecisionRationale(e.target.value)} rows={2}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-xs font-semibold outline-none focus:border-art-rust" />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setShowDecisionModal(false)} className="px-4 py-2 text-white/60 hover:text-white text-xs font-bold cursor-pointer">Cancel</button>
            <button onClick={handleRecord} disabled={!decisionRationale.trim()}
              className="px-4 py-2 bg-art-rust hover:bg-art-rust/80 rounded-lg text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Record Decision
            </button>
          </div>
        </div>
      )}
      {decisions.length === 0 ? (
        <p className="text-white/40 text-lg italic">No decisions have been recorded for this portfolio.</p>
      ) : (
        <div className="space-y-4">
          {decisions.map((d) => (
            <div key={d.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-mono font-bold uppercase ${outcomeColor[d.outcome] ?? 'text-white/60'} flex items-center space-x-2`}>
                  <FileCheck className="w-4 h-4" />
                  <span>{d.outcome}</span>
                </span>
                <span className="text-[11px] font-mono text-white/30">
                  {new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-white/50 font-mono">
                <span>{d.approver}</span>
                <span className="text-white/20">|</span>
                <span>{getBuildName(d.buildIds[0] ?? '')}</span>
                {d.buildIds[1] && (
                  <>
                    <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                    <span>{getBuildName(d.buildIds[1])}</span>
                  </>
                )}
              </div>
              {d.rationale && <p className="text-white/70 text-sm italic">{d.rationale}</p>}
              {d.followUpActions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/30">Follow-Up</span>
                  {d.followUpActions.map((a, i) => (
                    <div key={i} className="text-sm text-white/60 font-mono flex items-start space-x-2">
                      <span className="text-art-rust">→</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

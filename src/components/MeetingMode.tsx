import React, { useEffect, useCallback, useState } from 'react';
import { Build, Snapshot, Decision } from '../types';
import { computeBuildMetrics } from '../utils/mathEngine';
import { computeBusinessImpact, BusinessImpact } from '../utils/BusinessImpact';
import { evaluateBuild, RecommendationDetail } from '../utils/ExecutiveRecommendation';
import { round } from '../utils/mathEngine';
import { TrendingUp, ShieldAlert, XCircle, FileCheck, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MeetingModeProps {
  builds: Build[];
  decisions: Decision[];
  onClose: () => void;
}

type Slide = 'overview' | 'comparison' | 'impact' | 'recommendation' | 'decisions';

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

export default function MeetingMode({ builds, decisions, onClose }: MeetingModeProps) {
  const [slide, setSlide] = useState<Slide>('overview');
  const [buildAIdx, setBuildAIdx] = useState(0);
  const [buildBIdx, setBuildBIdx] = useState(Math.min(1, builds.length - 1));

  const buildA = builds[buildAIdx] ?? builds[0]!;
  const buildB = builds[buildBIdx] ?? builds[0]!;
  const snapA = computeBuildMetrics(buildA).snapshot;
  const snapB = computeBuildMetrics(buildB).snapshot;
  const impacts = computeBusinessImpact(buildA, snapA, buildB, snapB);
  const recA = evaluateBuild(snapA, buildA.designModel);
  const recB = evaluateBuild(snapB, buildB.designModel);

  const slides: Slide[] = ['overview', 'comparison', 'impact', 'recommendation', 'decisions'];
  const slideIndex = slides.indexOf(slide);

  const goNext = useCallback(() => {
    setSlide((prev) => {
      const idx = slides.indexOf(prev);
      return slides[Math.min(idx + 1, slides.length - 1)]!;
    });
  }, []);

  const goPrev = useCallback(() => {
    setSlide((prev) => {
      const idx = slides.indexOf(prev);
      return slides[Math.max(idx - 1, 0)]!;
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

  const SlideNav = () => (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4">
      <button onClick={goPrev} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex space-x-2">
        {slides.map((s, i) => (
          <button
            key={s}
            onClick={() => setSlide(s)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${i === slideIndex ? 'bg-art-rust scale-125' : 'bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
      <button onClick={goNext} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer">
        <ChevronRight className="w-5 h-5" />
      </button>
      <span className="text-white/30 text-xs font-mono ml-4">{slideIndex + 1} / {slides.length}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded bg-art-rust flex items-center justify-center font-serif font-black text-xs text-white italic">S</div>
          <span className="text-sm font-serif font-black text-white tracking-widest uppercase">Siliconomics</span>
          <span className="text-[10px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">Meeting Mode</span>
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
        {slide === 'recommendation' && (
          <RecommendationSlide recA={recA} recB={recA} buildA={buildA} buildB={buildB} />
        )}
        {slide === 'decisions' && <DecisionsSlide decisions={decisions} builds={builds} />}
      </div>

      <SlideNav />
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
  const dmA = buildA.designModel;
  const dmB = buildB.designModel;

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

function DecisionsSlide({ decisions, builds }: { decisions: Decision[]; builds: Build[] }) {
  const getBuildName = (id: string) => builds.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-3xl font-serif font-black text-white tracking-tight">Decision Log</h2>
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

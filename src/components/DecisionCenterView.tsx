import React, { useState, useMemo } from 'react';
import { Build, Decision, DecisionOutcome, Alert, AlertSeverity, MetricCardData, CalculationTrace, BuildStatus } from '../types';
import { computeBuildMetrics } from '../utils/mathEngine';
import { computeBusinessImpact, BusinessImpact } from '../utils/BusinessImpact';
import { evaluateBuild } from '../utils/ExecutiveRecommendation';
import { generateBriefing } from '../utils/ExecutiveBriefing';
import {
  FileCheck, ShieldAlert, TrendingUp, AlertTriangle, XCircle,
  Clock, User, ArrowRight, Bell, BellRing, CheckCircle, Info,
  Cpu, DollarSign, Wrench, Activity, BarChart3, Scale, Eye, AlertCircle,
  GitBranch, ChevronRight, Sparkles, Loader2
} from 'lucide-react';

interface DecisionCenterViewProps {
  decisions: Decision[];
  builds: Build[];
  alerts: Alert[];
  onAcknowledgeAlert?: (alertId: string) => void;
  onHoverMetric?: (trace: CalculationTrace | null) => void;
  onClickMetric?: (metric: MetricCardData) => void;
  onNavigate?: (tab: string) => void;
}

const outcomeConfig: Record<DecisionOutcome, { icon: React.ReactNode; color: string; bg: string }> = {
  'Proceed': { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  'Proceed with Risk': { icon: <ShieldAlert className="w-4 h-4" />, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  'Requires Investigation': { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  'Hold': { icon: <XCircle className="w-4 h-4" />, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  'Reject': { icon: <XCircle className="w-4 h-4" />, color: 'text-red-800', bg: 'bg-red-100 border-red-300' },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ReactNode; border: string; bg: string; label: string }> = {
  critical: { icon: <BellRing className="w-4 h-4" />, border: 'border-red-300', bg: 'bg-red-50', label: 'CRITICAL' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, border: 'border-orange-300', bg: 'bg-orange-50', label: 'WARNING' },
  info: { icon: <Info className="w-4 h-4" />, border: 'border-blue-300', bg: 'bg-blue-50', label: 'INFO' },
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  engineering: <Cpu className="w-3.5 h-3.5" />,
  financial: <DollarSign className="w-3.5 h-3.5" />,
  manufacturing: <Wrench className="w-3.5 h-3.5" />,
  program: <Activity className="w-3.5 h-3.5" />,
  commercial: <BarChart3 className="w-3.5 h-3.5" />,
};

const CATEGORY_COLOR: Record<string, string> = {
  engineering: 'text-blue-700 bg-blue-50 border-blue-200',
  financial: 'text-green-700 bg-green-50 border-green-200',
  manufacturing: 'text-orange-700 bg-orange-50 border-orange-200',
  program: 'text-purple-700 bg-purple-50 border-purple-200',
  commercial: 'text-teal-700 bg-teal-50 border-teal-200',
};

function ImpactBadge({ impact }: { impact: BusinessImpact }) {
  const color = impact.severity === 'positive' ? 'text-green-700 bg-green-50 border-green-200'
    : impact.severity === 'negative' ? 'text-red-700 bg-red-50 border-red-200'
    : 'text-gray-600 bg-gray-50 border-gray-200';
  return (
    <div className="border border-art-ink/10 rounded-lg p-3 bg-white hover:border-art-rust/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border ${color}`}>
            {impact.severity}
          </span>
          <div>
            <span className="text-xs font-bold text-art-ink">{impact.metric}</span>
            <p className="text-[10px] text-art-ink/70 mt-0.5 leading-relaxed max-w-xl">{impact.narrative}</p>
          </div>
        </div>
      </div>
      <div className="text-[9px] font-mono text-art-ink/40 mt-1.5">{impact.delta}</div>
    </div>
  );
}

function MetricCard({ metric, onHover, onClick }: { metric: MetricCardData; onHover?: (t: CalculationTrace | null) => void; onClick?: (m: MetricCardData) => void }) {
  const catColor = CATEGORY_COLOR[metric.category] ?? 'text-art-ink bg-art-cream border-art-ink/10';
  return (
    <div
      className="border border-art-ink/10 rounded-lg p-3 bg-white hover:border-art-rust/30 transition-all cursor-pointer"
      onMouseEnter={() => onHover?.(metric.trace)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(metric)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span>{CATEGORY_ICON[metric.category]}</span>
          <span className="text-[10px] font-bold text-art-ink">{metric.label}</span>
        </div>
        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${catColor}`}>
          {metric.category}
        </span>
      </div>
      <div className="mt-2 flex items-baseline space-x-1.5">
        <span className="text-sm font-bold font-mono text-art-ink">{metric.value}</span>
        <span className="text-[9px] font-mono text-art-ink/40">{metric.unit}</span>
        {metric.delta && (
          <span className={`text-[9px] font-mono font-bold ${metric.delta.type === 'positive' ? 'text-green-600' : metric.delta.type === 'negative' ? 'text-red-600' : 'text-art-ink/40'}`}>
            {metric.delta.value}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[8px] font-mono text-art-ink/30">{metric.reference}</span>
        <Eye className="w-3 h-3 text-art-ink/30" />
      </div>
    </div>
  );
}

function RiskBadge({ label, score, maxScore, detail }: { label: string; score: number; maxScore: number; detail: string }) {
  const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  const color = pct >= 70 ? 'text-red-700 border-red-200 bg-red-50'
    : pct >= 40 ? 'text-yellow-700 border-yellow-200 bg-yellow-50'
    : 'text-green-700 border-green-200 bg-green-50';
  return (
    <div className={`border rounded-lg px-3 py-2 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold">{label}</span>
        <span className="text-[10px] font-mono font-bold">{score}/{maxScore}</span>
      </div>
      <p className="text-[9px] opacity-70 mt-0.5">{detail}</p>
    </div>
  );
}

const STATUS_COLORS: Record<BuildStatus, string> = {
  Draft: 'text-gray-600 bg-gray-100 border-gray-200',
  TechnicalReview: 'text-blue-700 bg-blue-50 border-blue-200',
  FinancialReview: 'text-green-700 bg-green-50 border-green-200',
  ProgramReview: 'text-purple-700 bg-purple-50 border-purple-200',
  Approved: 'text-green-800 bg-green-100 border-green-300',
  Alert: 'text-red-700 bg-red-50 border-red-200',
};

function BuildLineage({ builds, currentBuildId }: { builds: Build[]; currentBuildId: string }) {
  const chain = useMemo(() => {
    const buildMap = new Map(builds.map(b => [b.id, b]));
    const result: Build[] = [];
    let current = buildMap.get(currentBuildId);
    while (current) {
      result.unshift(current);
      current = current.parentId ? buildMap.get(current.parentId) : undefined;
    }
    return result;
  }, [builds, currentBuildId]);

  if (chain.length <= 1) return null;

  return (
    <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3">
        <GitBranch className="w-4 h-4 text-art-rust" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Build Lineage</h2>
        <span className="text-[9px] font-mono text-art-ink/40 ml-auto">{chain.length} revisions</span>
      </div>
      <div className="space-y-0">
        {chain.map((b, i) => (
          <React.Fragment key={b.id}>
            <div className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${b.id === currentBuildId ? 'bg-art-cream/40 border border-art-rust/20' : 'hover:bg-art-cream/20'}`}>
              <div className="flex flex-col items-center pt-1">
                <div className={`w-3 h-3 rounded-full border-2 ${b.id === currentBuildId ? 'bg-art-rust border-art-rust' : 'bg-white border-art-ink/30'}`} />
                {i < chain.length - 1 && <div className="w-0.5 h-8 bg-art-ink/10" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-art-ink">{b.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono text-art-ink/40">v{b.version}</span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                  </div>
                </div>
                {b.description && (
                  <p className="text-[10px] text-art-ink/60 mt-0.5 leading-relaxed line-clamp-2">{b.description}</p>
                )}
                <div className="text-[9px] font-mono text-art-ink/30 mt-1 flex items-center space-x-3">
                  <span>{b.designModel.processNode}</span>
                  <span>{b.designModel.topology}</span>
                  <span>{new Date(b.createdDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function compareScorecardRows(aScores: { score: number; max: number }[], bScores: { score: number; max: number }[], dims: readonly { key: string; label: string }[]) {
  return dims.map((dim, i) => ({
    ...dim,
    aScore: aScores[i]?.score ?? 0,
    bScore: bScores[i]?.score ?? 0,
    max: aScores[i]?.max ?? 10,
  }));
}

const SCORE_DIMENSIONS = [
  { key: 'technical', label: 'Technical Feasibility' },
  { key: 'manufacturing', label: 'Manufacturing Readiness' },
  { key: 'capital', label: 'Capital Efficiency' },
  { key: 'commercial', label: 'Commercial Attractiveness' },
  { key: 'program', label: 'Program Confidence' },
  { key: 'supplyChain', label: 'Supply Chain Resilience' },
  { key: 'schedule', label: 'Schedule Confidence' },
] as const;

function computeScorecard(snap: ReturnType<typeof computeBuildMetrics>['snapshot'], dm: Build['designModel']): { key: string; label: string; score: number; max: number }[] {
  const s = snap;
  return [
    { key: 'technical', label: 'Technical Feasibility', score: Math.round(Math.min(10, (s.dieYield / 0.95) * 3 + (snap.transistorDensity > 50 ? 4 : 2) + (snap.dpw > 200 ? 3 : 1))), max: 10 },
    { key: 'manufacturing', label: 'Manufacturing Readiness', score: Math.round(Math.min(10, (dm.packagingYield / 99) * 4 + (dm.testYield / 99) * 3 + (s.dieYield > 0.6 ? 3 : 0))), max: 10 },
    { key: 'capital', label: 'Capital Efficiency', score: Math.round(Math.min(10, (s.roi > 50 ? 5 : s.roi > 20 ? 3 : 1) + (s.breakEvenVolumeMillion < 2 ? 3 : s.breakEvenVolumeMillion < 5 ? 2 : 0) + (dm.nreCost < 50 ? 2 : 0))), max: 10 },
    { key: 'commercial', label: 'Commercial Attractiveness', score: Math.round(Math.min(10, (s.grossMargin > 60 ? 5 : s.grossMargin > 35 ? 3 : 1) + (s.lifetimeNetProfitMillion > 200 ? 3 : s.lifetimeNetProfitMillion > 0 ? 1 : 0) + (dm.asp > 500 ? 2 : 0))), max: 10 },
    { key: 'program', label: 'Program Confidence', score: Math.round(Math.min(10, (s.grossMargin > 40 ? 3 : 1) + (s.roi > 30 ? 3 : 1) + (s.breakEvenVolumeMillion < 3 ? 4 : 2))), max: 10 },
    { key: 'supplyChain', label: 'Supply Chain Resilience', score: Math.round(Math.min(10, 10 - Math.round(s.supplyChain.compositeRiskScore / 10))), max: 10 },
    { key: 'schedule', label: 'Schedule Confidence', score: Math.round(Math.min(10, (dm.packagingYield > 97 ? 3 : 1) + (dm.testYield > 97 ? 3 : 1) + (s.breakEvenVolumeMillion < 4 ? 4 : 2))), max: 10 },
  ];
}

export default function DecisionCenterView({ decisions, builds, alerts, onAcknowledgeAlert, onHoverMetric, onClickMetric, onNavigate }: DecisionCenterViewProps) {
  const [buildAId, setBuildAId] = useState(builds[0]?.id ?? '');
  const [buildBId, setBuildBId] = useState(builds[1]?.id ?? builds[0]?.id ?? '');

  const buildA = builds.find(b => b.id === buildAId) ?? builds[0];
  const buildB = builds.find(b => b.id === buildBId) ?? builds[0];

  const analysis = useMemo(() => {
    if (!buildA || !buildB) return null;
    const snapA = computeBuildMetrics(buildA).snapshot;
    const snapB = computeBuildMetrics(buildB).snapshot;
    const recA = evaluateBuild(snapA, buildA.designModel);
    const recB = buildAId !== buildBId ? evaluateBuild(snapB, buildB.designModel) : null;
    const impacts = buildAId !== buildBId ? computeBusinessImpact(buildA, snapA, buildB, snapB) : [];
    const scorecardA = computeScorecard(snapA, buildA.designModel);
    const scorecardB = buildAId !== buildBId ? computeScorecard(snapB, buildB.designModel) : null;
    return { snapA, snapB, recA, recB, impacts, scorecardA, scorecardB };
  }, [buildA, buildB, buildAId, buildBId]);

  const getBuildName = (id: string) => builds.find(b => b.id === id)?.name ?? id;

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  const metricsByCategory = useMemo(() => {
    if (!analysis) return {};
    const map: Record<string, MetricCardData[]> = {};
    for (const m of analysis.snapA.metricsList) {
      (map[m.category] ??= []).push(m);
    }
    return map;
  }, [analysis]);

  const briefing = useMemo(() => {
    if (!buildA || !analysis) return null;
    return generateBriefing(buildA, analysis.snapA);
  }, [buildA, analysis]);

  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAiBriefing = async () => {
    if (!buildA || !analysis) return;
    setAiLoading(true);
    setAiError(null);
    setAiBriefing(null);
    try {
      const res = await fetch('/api/chippie-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'analyze',
          build: buildA,
          computed: { snapshot: analysis.snapA },
        }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setAiBriefing(data.content);
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI briefing');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-black text-art-ink">Decision Center</h1>
          <p className="text-xs text-art-ink/60 mt-1 italic">Executive workspace for build review and decision recording.</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeAlerts.length > 0 && (
            <span className="flex items-center space-x-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-mono">
              <BellRing className="w-3 h-3" />
              <span>{activeAlerts.length} active</span>
            </span>
          )}
          <span className="text-[10px] font-mono text-art-ink/40 bg-art-cream px-3 py-1 rounded-full border border-art-ink/10">
            {decisions.length} decisions
          </span>
        </div>
      </div>

      {/* Build Pair Selector */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm">
        <div className="flex items-center flex-wrap gap-3">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-art-ink/60">Builds Under Review</span>
          <select
            value={buildAId}
            onChange={e => setBuildAId(e.target.value)}
            className="flex-1 min-w-[200px] bg-art-cream border border-art-ink/15 rounded-lg px-3 py-2 text-xs font-semibold font-mono text-art-ink outline-none focus:border-art-rust cursor-pointer"
          >
            {builds.map(b => <option key={b.id} value={b.id}>{b.name} (v{b.version})</option>)}
          </select>
          <span className="text-[10px] font-mono text-art-ink/40">vs</span>
          <select
            value={buildBId}
            onChange={e => setBuildBId(e.target.value)}
            className="flex-1 min-w-[200px] bg-art-cream border border-art-ink/15 rounded-lg px-3 py-2 text-xs font-semibold font-mono text-art-ink outline-none focus:border-art-rust cursor-pointer"
          >
            {builds.map(b => <option key={b.id} value={b.id}>{b.name} (v{b.version})</option>)}
          </select>
        </div>
      </div>

      {/* Upcoming Decisions */}
      {(() => {
        const reviewStatuses = ['TechnicalReview', 'FinancialReview', 'ProgramReview'];
        const upcoming = builds.filter(b => reviewStatuses.includes(b.status) || alerts.some(a => a.buildId === b.id && !a.acknowledged));
        if (upcoming.length === 0) return null;
        return (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-amber-800">Upcoming Decisions Needed</h2>
              <span className="text-[10px] font-mono text-amber-600 ml-auto">{upcoming.length} build{upcoming.length > 1 ? 's' : ''} pending</span>
            </div>
            <div className="space-y-2">
              {upcoming.map(b => {
                const isAlerted = alerts.some(a => a.buildId === b.id && !a.acknowledged);
                return (
                  <div key={b.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      {isAlerted && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span className="font-semibold text-art-ink">{b.name} v{b.version}</span>
                      <span className="text-art-ink/40">—</span>
                      <span className={`font-bold ${isAlerted ? 'text-red-600' : 'text-amber-600'}`}>{isAlerted ? 'Alert' : b.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setBuildAId(b.id);
                          const other = builds.find(x => x.id !== b.id);
                          if (other) setBuildBId(other.id);
                        }}
                        className="text-[10px] font-bold text-art-rust hover:text-art-ink bg-transparent border border-art-rust/30 rounded px-2 py-0.5 hover:bg-art-rust/5 transition-colors"
                      >
                        Compare
                      </button>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('build')}
                          className="text-[10px] font-bold text-art-ink/60 hover:text-art-ink bg-transparent border border-art-ink/20 rounded px-2 py-0.5 hover:bg-art-ink/5 transition-colors"
                        >
                          Open Build
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {analysis && buildA && buildB && (
        <>
          {/* Executive Summary */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3">
              <FileCheck className="w-4 h-4 text-art-rust" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Executive Summary</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold font-mono uppercase text-art-ink/40 tracking-wider">What decision?</span>
                <p className="text-sm font-bold text-art-ink leading-snug">
                  {buildAId === buildBId
                    ? `Review of ${buildA.name} — ${buildA.designModel.processNode} ${buildA.designModel.topology}`
                    : `Compare ${buildA.name} vs ${buildB.name}`}
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold font-mono uppercase text-art-ink/40 tracking-wider">What changed?</span>
                <p className="text-sm text-art-ink/80 leading-snug">
                  {buildAId === buildBId
                    ? `${buildA.name} v${buildA.version} — ${buildA.status} status`
                    : `${analysis.impacts.length} business impact changes identified across ${[...new Set(analysis.impacts.map(i => i.category))].join(', ')} categories`}
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold font-mono uppercase text-art-ink/40 tracking-wider">What should leadership do?</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${outcomeConfig[analysis.recA.outcome].bg} ${outcomeConfig[analysis.recA.outcome].color}`}>
                    {outcomeConfig[analysis.recA.outcome].icon}
                    <span className="ml-1">{analysis.recA.outcome}</span>
                  </span>
                  <span className="text-[10px] font-mono text-art-ink/50">{analysis.recA.confidence}% confidence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Impact */}
          {analysis.impacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-art-rust" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Business Impact Analysis</h2>
                <span className="text-[9px] font-mono text-art-ink/40">{analysis.impacts.length} impacts</span>
              </div>
              <div className="space-y-2">
                {analysis.impacts.map((impact, i) => (
                  <ImpactBadge key={i} impact={impact} />
                ))}
              </div>
            </div>
          )}

          {/* Executive Briefing */}
          {briefing && (
            <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3">
                <FileCheck className="w-4 h-4 text-art-rust" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Executive Briefing</h2>
                <span className="text-[9px] font-mono text-art-ink/40 ml-auto">{buildA.name}</span>
              </div>
              <p className="text-xs text-art-ink/80 leading-relaxed">{briefing.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold font-mono uppercase text-art-ink/40 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Key Findings</span>
                  </span>
                  {briefing.keyFindings.map((f, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-[10px] text-art-ink/70">
                      <span className="text-art-rust mt-0.5">•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold font-mono uppercase text-art-ink/40 flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span>Opportunities</span>
                  </span>
                  {briefing.opportunities.length > 0 ? briefing.opportunities.map((o, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-[10px] text-green-700">
                      <span className="text-green-500 mt-0.5">↑</span>
                      <span>{o}</span>
                    </div>
                  )) : <p className="text-[10px] text-art-ink/40 italic">No significant opportunities identified.</p>}
                </div>
              </div>
              {briefing.risks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold font-mono uppercase text-art-ink/40 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    <span>Risks</span>
                  </span>
                  {briefing.risks.map((r, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-[10px] text-yellow-700 bg-yellow-50/50 border border-yellow-100 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-art-ink/5 pt-3">
                <span className="text-[9px] font-bold font-mono uppercase text-art-ink/40">Recommendation</span>
                <p className="text-xs text-art-ink/80 mt-1 italic">{briefing.recommendation}</p>
              </div>
            </div>
          )}

          {/* AI Executive Briefing */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-art-ink/10 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-art-rust" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">AI Executive Briefing</h2>
              </div>
              <button
                onClick={handleGenerateAiBriefing}
                disabled={aiLoading}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-[10px] font-bold text-art-ink/60 hover:text-art-ink hover:bg-art-cream border border-art-ink/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>{aiLoading ? 'Generating...' : aiBriefing ? 'Regenerate' : 'Generate Briefing'}</span>
              </button>
            </div>
            {aiError && (
              <div className="flex items-start space-x-2 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}
            {aiLoading && (
              <div className="flex items-center justify-center py-8 text-art-ink/40">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-xs font-semibold">Consulting AI Advisor...</span>
              </div>
            )}
            {aiBriefing && (
              <div className="prose prose-xs max-w-none">
                <div className="text-xs text-art-ink/80 leading-relaxed space-y-3">
                  {aiBriefing.split('\n').map((line, i) => {
                    const t = line.trim();
                    if (t.startsWith('###')) {
                      const content = t.replace(/^###\s*\*?\*?/, '').replace(/\*?\*?$/, '');
                      return <h3 key={i} className="text-xs font-serif italic font-bold text-art-ink border-b border-art-ink/10 pb-1 pt-3 uppercase tracking-wider first:pt-0">{content}</h3>;
                    }
                    if (t.startsWith('-') || t.startsWith('*')) {
                      const c = t.replace(/^[-*]\s*/, '');
                      const bm = c.match(/^\*\*(.*?)\*\*:(.*)$/);
                      if (bm) return <div key={i} className="flex items-start space-x-1.5 pl-2 text-[10px]"><span className="text-art-rust mt-1">•</span><p className="text-art-ink/80"><strong className="text-art-ink">{bm[1]}:</strong>{bm[2]}</p></div>;
                      return <div key={i} className="flex items-start space-x-1.5 pl-2 text-[10px]"><span className="text-art-rust mt-1">•</span><p className="text-art-ink/80">{c}</p></div>;
                    }
                    if (t.length > 0) return <p key={i} className="text-[10px] text-art-ink/80">{t}</p>;
                    return <div key={i} className="h-1" />;
                  })}
                </div>
              </div>
            )}
            {!aiBriefing && !aiLoading && !aiError && (
              <p className="text-[10px] text-art-ink/40 italic text-center py-6">
                Generate an AI-powered executive briefing with strategic analysis, risk interpretation, and actionable recommendations.
              </p>
            )}
          </div>

          {/* Metrics by Category */}
          {(['engineering', 'financial', 'manufacturing', 'program'] as const).map(cat => {
            const metrics = metricsByCategory[cat] ?? [];
            if (metrics.length === 0) return null;
            const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center space-x-2">
                  {CATEGORY_ICON[cat]}
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">{catLabel} Metrics</h2>
                  {buildAId !== buildBId && (
                    <span className="text-[9px] font-mono text-art-ink/40">{buildA.name}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {metrics.map(m => (
                    <MetricCard key={m.id} metric={m} onHover={onHoverMetric} onClick={onClickMetric} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Scorecard */}
          {analysis.scorecardA && (
            <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3">
                <BarChart3 className="w-4 h-4 text-art-rust" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Executive Decision Scorecard</h2>
                {analysis.scorecardB ? (
                  <span className="text-[9px] font-mono text-art-ink/40 ml-auto">Side-by-side comparison</span>
                ) : (
                  <span className="text-[9px] font-mono text-art-ink/40 ml-auto">{buildA.name}</span>
                )}
              </div>
              {analysis.scorecardB ? (
                <div className="space-y-2">
                  <div className="flex items-center text-[9px] font-mono font-bold text-art-ink/50 mb-1">
                    <span className="w-1/2 pl-2">{buildA.name}</span>
                    <span className="w-1/2 pl-2">{buildB.name}</span>
                  </div>
                  {compareScorecardRows(analysis.scorecardA, analysis.scorecardB, SCORE_DIMENSIONS).map((row) => {
                    const winner = row.aScore > row.bScore ? 'a' : row.bScore > row.aScore ? 'b' : 'none';
                    return (
                      <div key={row.key} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-art-ink/60 uppercase">{row.label}</span>
                          <span className="text-[8px] font-mono text-art-ink/40">/ {row.max}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-4 bg-art-cream rounded-full overflow-hidden relative">
                            <div className={`h-full rounded-full transition-all ${row.aScore >= 7 ? 'bg-green-500' : row.aScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${(row.aScore / row.max) * 100}%` }} />
                            {winner === 'a' && <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">WIN</span>}
                          </div>
                          <span className={`text-[10px] font-mono font-bold w-6 text-center ${winner === 'a' ? 'text-green-600' : 'text-art-ink/50'}`}>{row.aScore}</span>
                          <ChevronRight className="w-3 h-3 text-art-ink/30" />
                          <span className={`text-[10px] font-mono font-bold w-6 text-center ${winner === 'b' ? 'text-green-600' : 'text-art-ink/50'}`}>{row.bScore}</span>
                          <div className="flex-1 h-4 bg-art-cream rounded-full overflow-hidden relative">
                            <div className={`h-full rounded-full transition-all ${row.bScore >= 7 ? 'bg-green-500' : row.bScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${(row.bScore / row.max) * 100}%` }} />
                            {winner === 'b' && <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">WIN</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {analysis.scorecardA.map(dim => {
                    const pct = dim.max > 0 ? (dim.score / dim.max) * 100 : 0;
                    const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div key={dim.key} className="text-center space-y-1.5 p-2 bg-art-cream/30 rounded-lg border border-art-ink/5">
                        <div className="text-[8px] font-mono font-bold text-art-ink/50 uppercase leading-tight">{dim.label}</div>
                        <div className="text-lg font-bold font-mono text-art-ink">{dim.score}<span className="text-[9px] text-art-ink/40">/{dim.max}</span></div>
                        <div className="w-full h-1.5 bg-art-ink/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Risk Dashboard */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3">
              <ShieldAlert className="w-4 h-4 text-art-rust" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Risk Dashboard</h2>
              <span className="text-[9px] font-mono text-art-ink/40 ml-auto">
                Overall: {analysis.recA.riskFactors.length > 2 ? 'Elevated' : analysis.recA.riskFactors.length === 0 ? 'Low' : 'Moderate'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <RiskBadge
                label="Manufacturing Risk"
                score={Math.round((100 - analysis.snapA.dieYield * 100) / 10)}
                maxScore={10}
                detail={`Die yield ${(analysis.snapA.dieYield * 100).toFixed(1)}%, packaging ${buildA.designModel.packagingYield}%`}
              />
              <RiskBadge
                label="Financial Risk"
                score={Math.round(Math.max(0, 10 - (analysis.snapA.grossMargin > 40 ? 5 : analysis.snapA.grossMargin > 20 ? 3 : 0) - (analysis.snapA.roi > 30 ? 3 : 0) - (analysis.snapA.breakEvenVolumeMillion < 3 ? 2 : 0)))}
                maxScore={10}
                detail={`Gross margin ${analysis.snapA.grossMargin.toFixed(1)}%, ROI ${analysis.snapA.roi.toFixed(1)}%`}
              />
              <RiskBadge
                label="Program Risk"
                score={Math.round(Math.max(0, 10 - (analysis.snapA.grossMargin > 35 ? 3 : 1) - (analysis.snapA.roi > 25 ? 3 : 1) - (analysis.snapA.breakEvenVolumeMillion < 4 ? 4 : 2)))}
                maxScore={10}
                detail={`Break-even at ${analysis.snapA.breakEvenVolumeMillion.toFixed(2)}M units`}
              />
              <RiskBadge
                label="Supply Chain Risk"
                score={analysis.snapA.supplyChain.compositeRiskScore}
                maxScore={100}
                detail={`Level: ${analysis.snapA.supplyChain.riskLevel}, ${analysis.snapA.supplyChain.highRiskBlockCount} high-risk blocks`}
              />
              <RiskBadge
                label="Technology Risk"
                score={buildA.designModel.topology === 'chiplet' ? 5 : buildA.designModel.defectDensity > 0.3 ? 7 : 3}
                maxScore={10}
                detail={`${buildA.designModel.processNode} ${buildA.designModel.topology}, D0=${buildA.designModel.defectDensity}`}
              />
              <RiskBadge
                label="Packaging Risk"
                score={buildA.designModel.packagingType !== 'standard' ? Math.round((100 - buildA.designModel.packagingYield) / 5) : Math.round((100 - buildA.designModel.packagingYield) / 10)}
                maxScore={10}
                detail={`${buildA.designModel.packagingType} packaging, yield ${buildA.designModel.packagingYield}%`}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center p-1.5 bg-art-cream/50 rounded border border-art-ink/5">
                <span className="text-[8px] font-mono font-bold text-art-ink/50 uppercase">Evidence</span>
                <p className="text-[9px] text-art-ink/70 font-mono mt-0.5">{analysis.recA.supportingEvidence.length} points</p>
              </div>
              <div className="text-center p-1.5 bg-art-cream/50 rounded border border-art-ink/5">
                <span className="text-[8px] font-mono font-bold text-art-ink/50 uppercase">Risk Factors</span>
                <p className="text-[9px] text-art-ink/70 font-mono mt-0.5">{analysis.recA.riskFactors.length} identified</p>
              </div>
              <div className="text-center p-1.5 bg-art-cream/50 rounded border border-art-ink/5">
                <span className="text-[8px] font-mono font-bold text-art-ink/50 uppercase">Supply Chain</span>
                <p className="text-[9px] text-art-ink/70 font-mono mt-0.5">{analysis.snapA.supplyChain.riskLevel}</p>
              </div>
            </div>
            {analysis.recA.riskFactors.length > 0 && (
              <div className="border-t border-art-ink/5 pt-3 space-y-1.5">
                <span className="text-[9px] font-bold font-mono uppercase text-art-ink/40 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  <span>Key Risk Factors</span>
                </span>
                {analysis.recA.riskFactors.map((rf, i) => (
                  <div key={i} className="flex items-start space-x-1.5 text-[10px] text-art-ink/70 bg-yellow-50/50 border border-yellow-100 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>{rf}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3">
              <TrendingUp className="w-4 h-4 text-art-rust" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Executive Recommendation</h2>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-mono font-bold px-3 py-1.5 rounded-full border ${outcomeConfig[analysis.recA.outcome].bg} ${outcomeConfig[analysis.recA.outcome].color} flex items-center space-x-1.5`}>
                {outcomeConfig[analysis.recA.outcome].icon}
                <span>{analysis.recA.outcome}</span>
              </span>
              <span className="text-[10px] font-mono text-art-ink/50">{analysis.recA.confidence}% confidence</span>
            </div>
            <p className="text-xs text-art-ink/80 leading-relaxed">{analysis.recA.summary}</p>
            {analysis.recA.supportingEvidence.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold font-mono uppercase text-art-ink/40">Supporting Evidence</span>
                {analysis.recA.supportingEvidence.map((ev, i) => (
                  <div key={i} className="flex items-start space-x-1.5 text-[10px] text-green-700">
                    <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Build Lineage */}
          <BuildLineage builds={builds} currentBuildId={buildAId} />
        </>
      )}

      {/* Live Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-art-rust" />
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Live Alerts</h2>
          </div>
          <div className="space-y-2">
            {activeAlerts.map((alert) => {
              const sc = SEVERITY_CONFIG[alert.severity];
              return (
                <div key={alert.id} className={`bg-white border-2 ${sc.border} rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-1.5 rounded-lg ${sc.bg}`}>{sc.icon}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-art-ink">{alert.ruleName}</h3>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${sc.bg} ${sc.border} border`}>{sc.label}</span>
                        </div>
                        <p className="text-xs text-art-ink/80 mt-1 max-w-xl">{alert.message}</p>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-mono text-art-ink/50">
                          <span>{alert.buildName}</span>
                          <span>{alert.category}</span>
                          <span>Value: {alert.triggeredValue} (threshold: {alert.threshold})</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {onAcknowledgeAlert && (
                      <button onClick={() => onAcknowledgeAlert(alert.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-[10px] font-semibold text-art-ink/60 hover:text-art-ink hover:bg-art-cream border border-art-ink/10 transition-all cursor-pointer"
                        title="Acknowledge and dismiss">
                        <CheckCircle className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <details className="group">
          <summary className="text-[10px] font-bold font-mono text-art-ink/40 hover:text-art-ink/60 cursor-pointer list-none flex items-center space-x-2">
            <span>{acknowledgedAlerts.length} acknowledged alerts</span>
          </summary>
          <div className="space-y-1.5 mt-2">
            {acknowledgedAlerts.map((alert) => (
              <div key={alert.id} className="bg-art-cream/30 border border-art-ink/10 rounded-lg px-4 py-2 flex items-center justify-between text-xs text-art-ink/50">
                <span>{alert.ruleName} — {alert.buildName}</span>
                <span className="text-[10px] font-mono">{new Date(alert.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Decision Log */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-art-rust" />
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Decision Log</h2>
        </div>
        {decisions.length === 0 ? (
          <div className="border-2 border-dashed border-art-ink/10 rounded-xl p-12 text-center bg-white">
            <FileCheck className="w-10 h-10 text-art-rust/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-art-ink/50">No decisions recorded yet.</p>
            <p className="text-xs text-art-ink/40 mt-1">Use the Comparisons Desk to compare builds and record decisions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((d, i) => {
              const oc = outcomeConfig[d.outcome];
              const buildNames = d.buildIds.map(getBuildName).join(', ');
              return (
                <div key={d.id || i} className="bg-white border-2 border-art-ink/10 rounded-xl p-5 hover:border-art-ink/20 transition-all shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg border ${oc.bg}`}>{oc.icon}</div>
                      <div>
                        <h3 className="text-sm font-bold text-art-ink">Decision on {buildNames}</h3>
                        <p className="text-xs text-art-ink/70 mt-1 max-w-lg leading-relaxed">{d.rationale}</p>
                        {d.followUpActions.length > 0 && (
                          <p className="text-[10px] text-art-ink/50 mt-1 italic">Follow-up: {d.followUpActions.join('; ')}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${oc.bg} ${oc.color}`}>
                      {d.outcome}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-4 text-[10px] font-mono text-art-ink/50 border-t border-art-ink/5 pt-3">
                    <span className="flex items-center space-x-1.5"><User className="w-3 h-3" /><span>{d.approver}</span></span>
                    <span className="flex items-center space-x-1.5"><Clock className="w-3 h-3" /><span>{new Date(d.timestamp).toLocaleDateString()}</span></span>
                    <span className="flex items-center space-x-1.5">
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-semibold text-art-ink">{buildNames}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

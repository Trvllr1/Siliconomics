/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Build, Decision, DecisionOutcome } from '../types';
import { computeBuildMetrics, round } from '../utils/mathEngine';
import { computeBusinessImpact } from '../utils/BusinessImpact';
import { evaluateBuild } from '../utils/ExecutiveRecommendation';
import { Sparkles, Loader2, ArrowRightLeft, ShieldAlert, CheckCircle, TrendingUp, FileText, Pin, Trash2, FileCheck } from 'lucide-react';

interface ComparisonViewProps {
  builds: Build[];
  initialBuildAId?: string;
  initialBuildBId?: string;
  onRecordDecision?: (decision: Decision) => void;
}

interface ComparisonSnapshot {
  id: string;
  name: string;
  buildAId: string;
  buildBId: string;
  timestamp: string;
}

// Custom renderer for comparison markdown (module-scope so it isn't recreated per render)
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-4 font-sans text-xs text-art-ink/80 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('###')) {
          const heading = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '');
          return (
            <h4 key={idx} className="text-xs font-serif italic font-bold text-art-rust border-b border-art-ink/10 pb-1.5 pt-4 uppercase tracking-wider first:pt-0 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-art-rust" />
              <span>{heading}</span>
            </h4>
          );
        }

        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const listContent = trimmed.replace(/^[-*]\s*/, '');
          const boldMatch = listContent.match(/^\*\*(.*?)\*\*:(.*)$/);
          if (boldMatch) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-3">
                <span className="text-art-rust mt-1">•</span>
                <p className="text-art-ink/80">
                  <strong className="text-art-ink font-bold">{boldMatch[1]}:</strong>
                  {boldMatch[2]}
                </p>
              </div>
            );
          }
          return (
            <div key={idx} className="flex items-start space-x-2 pl-3">
              <span className="text-art-rust mt-1">•</span>
              <p className="text-art-ink/80">{listContent}</p>
            </div>
          );
        }

        if (trimmed.length > 0) {
          const parts = trimmed.split('**');
          return (
            <p className="text-art-ink/85" key={idx}>
              {parts.map((part, pIdx) => (
                pIdx % 2 === 1 ? <strong key={pIdx} className="text-art-ink font-bold">{part}</strong> : part
              ))}
            </p>
          );
        }

        return <div key={idx} className="h-1" />;
      })}
    </div>
  );
}

export default function ComparisonView({ builds, initialBuildAId, initialBuildBId, onRecordDecision }: ComparisonViewProps) {
  const [buildAId, setBuildAId] = useState(initialBuildAId || builds[0]?.id || '');
  const [buildBId, setBuildBId] = useState(initialBuildBId || builds[1]?.id || builds[0]?.id || '');
  
  const [snapshots, setSnapshots] = useState<ComparisonSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_comparison_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [justPinned, setJustPinned] = useState(false);

  // Auto-reset "Pinned!" confirmation
  useEffect(() => {
    if (justPinned) {
      const timer = setTimeout(() => {
        setJustPinned(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [justPinned]);

  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decision recording modal state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState<DecisionOutcome>('Proceed');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionApprover, setDecisionApprover] = useState('eagleximpact');
  const [decisionFollowUp, setDecisionFollowUp] = useState('');

  const buildA = builds.find((b) => b.id === buildAId) ?? builds[0]!;
  const buildB = builds.find((b) => b.id === buildBId) ?? builds[1] ?? builds[0]!;

  const metricsA = computeBuildMetrics(buildA);
  const metricsB = computeBuildMetrics(buildB);

  const dmA = buildA.designModel;
  const dmB = buildB.designModel;
  const snapA = metricsA.snapshot;
  const snapB = metricsB.snapshot;

  const impacts = useMemo(() => computeBusinessImpact(buildA, snapA, buildB, snapB), [buildA, buildB, snapA, snapB]);
  const recommendation = useMemo(() => {
    const recA = evaluateBuild(snapA, buildA.designModel);
    const recB = evaluateBuild(snapB, buildB.designModel);
    return recA.confidence >= recB.confidence ? recA : recB;
  }, [snapA, snapB, buildA, buildB]);

  // Clear AI comparison when builds change
  useEffect(() => {
    setAiComparison(null);
    setError(null);
  }, [buildAId, buildBId]);

  const handleTakeSnapshot = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const snapshotName = `${buildA.name} vs ${buildB.name} (${timestamp})`;
    const newSnapshot: ComparisonSnapshot = {
      id: `snap_${Date.now()}`,
      name: snapshotName,
      buildAId: buildA.id,
      buildBId: buildB.id,
      timestamp: new Date().toISOString(),
    };

    setSnapshots(prev => {
      // Avoid exact duplicate builds combination in list
      const filtered = prev.filter(s => !(s.buildAId === buildA.id && s.buildBId === buildB.id));
      const updated = [newSnapshot, ...filtered];
      try {
        localStorage.setItem('siliconomics_comparison_snapshots', JSON.stringify(updated));
      } catch (err) {
        console.warn('Siliconomics: failed to persist comparison snapshots.', err);
      }
      return updated;
    });

    setJustPinned(true);
  };

  const handleSelectSnapshot = (snapshotId: string) => {
    if (!snapshotId) return;
    const found = snapshots.find(s => s.id === snapshotId);
    if (found) {
      // Verify that both builds in the snapshot still exist in the workspace builds list
      const hasA = builds.some(b => b.id === found.buildAId);
      const hasB = builds.some(b => b.id === found.buildBId);
      if (hasA) setBuildAId(found.buildAId);
      if (hasB) setBuildBId(found.buildBId);
    }
  };

  const handleClearSnapshots = () => {
    setSnapshots([]);
    try {
      localStorage.removeItem('siliconomics_comparison_snapshots');
    } catch (err) {
      console.warn('Siliconomics: failed to clear comparison snapshots.', err);
    }
  };

  const handleAiCompare = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chippie-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'compare',
          buildA: buildA,
          computedA: metricsA,
          buildB: buildB,
          computedB: metricsB,
        }),
      });

      if (!response.ok) {
        throw new Error('Comparison failed. Verify server is online and key is valid.');
      }

      const data = await response.json();
      setAiComparison(data.content);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error executing AI comparison.');
    } finally {
      setLoading(false);
    }
  };

  const formatDelta = (valA: number, valB: number, unit: string = '', isBetterLower: boolean = false) => {
    const diff = valB - valA;
    if (diff === 0) return <span className="text-art-ink/30 font-mono">-</span>;
    
    const isPositiveChange = diff > 0;
    const isGood = isBetterLower ? !isPositiveChange : isPositiveChange;
    
    const prefix = isPositiveChange ? '+' : '';
    const color = isGood ? 'text-green-700 bg-green-50 border-green-150' : 'text-red-700 bg-red-50 border-red-150';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border tracking-wider uppercase ${color}`}>
        {prefix}{round(diff, 2)}{unit}
      </span>
    );
  };

  const highlightDifference = (valA: string | number, valB: string | number) => {
    if (valA === valB) return "text-art-ink/50";
    return "text-art-ink font-bold";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title block */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-art-ink/10 gap-4">
        <div>
          <h2 className="text-xl font-serif font-black text-art-ink">Side-by-Side Comparison Desk</h2>
          <p className="text-xs text-art-ink/50 mt-1">
            Isolate and analyze key engineering and financial trade-offs between two program builds.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center space-x-3 bg-art-cream/40 p-2.5 rounded-xl border border-art-ink/10">
            {/* Dropdown Build A */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-[9px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">Build A</span>
              <select
                value={buildAId}
                onChange={(e) => setBuildAId(e.target.value)}
                className="bg-white border border-art-ink/10 text-xs rounded-lg px-2.5 py-1 outline-none font-semibold cursor-pointer"
              >
                {builds.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            
            <ArrowRightLeft className="w-4 h-4 text-art-rust mt-3" />

            {/* Dropdown Build B */}
            <div className="flex flex-col space-y-0.5">
              <span className="text-[9px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">Build B</span>
              <select
                value={buildBId}
                onChange={(e) => setBuildBId(e.target.value)}
                className="bg-white border border-art-ink/10 text-xs rounded-lg px-2.5 py-1 outline-none font-semibold cursor-pointer"
              >
                {builds.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Snapshot & Pinned Control */}
          <div className="flex items-center space-x-2 bg-art-cream/40 p-2.5 rounded-xl border border-art-ink/10">
            <button
              onClick={handleTakeSnapshot}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 select-none cursor-pointer border shadow-sm ${
                justPinned 
                  ? 'bg-green-600 border-green-600 text-white animate-pulse'
                  : 'bg-white hover:bg-art-rust/10 text-art-ink hover:text-art-rust border-art-ink/10 hover:border-art-rust/20'
              }`}
              title="Pin the current side-by-side comparison state as a temporary snapshot"
            >
              <Pin className={`w-3.5 h-3.5 ${justPinned ? 'rotate-45' : ''}`} />
              <span>{justPinned ? 'Pinned!' : 'Snapshot'}</span>
            </button>

            <div className="flex items-center space-x-1">
              <select
                value=""
                onChange={(e) => handleSelectSnapshot(e.target.value)}
                disabled={snapshots.length === 0}
                className="bg-white border border-art-ink/10 text-xs rounded-lg px-2.5 py-1.5 outline-none font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed max-w-[180px] font-mono"
              >
                <option value="" disabled>📌 Pinned ({snapshots.length})</option>
                {snapshots.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {snap.name}
                  </option>
                ))}
              </select>

              {snapshots.length > 0 && (
                <button
                  onClick={handleClearSnapshots}
                  className="p-1.5 text-art-ink/40 hover:text-art-rust bg-white hover:bg-red-50 border border-art-ink/10 rounded-lg transition-colors cursor-pointer shadow-sm"
                  title="Clear all pinned snapshots"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={async () => {
              const { generateComparisonPdf } = await import('../utils/pdfGenerator');
              generateComparisonPdf(buildA, snapA, buildB, snapB, aiComparison);
            }}
            className="flex items-center justify-center space-x-2 bg-art-rust hover:bg-art-rust/90 text-white rounded-lg px-4 py-3 text-xs font-bold font-serif italic transition-all duration-150 cursor-pointer shadow-md border-none h-fit whitespace-nowrap self-stretch sm:self-center"
            title="Download high-fidelity, board-ready comparative PDF summary with full compliance markers"
          >
            <FileText className="w-4 h-4" />
            <span>Generate PDF Executive Summary</span>
          </button>
          <button
            onClick={() => setShowDecisionModal(true)}
            className="flex items-center justify-center space-x-2 bg-art-ink hover:bg-art-rust text-art-cream hover:text-white rounded-lg px-4 py-3 text-xs font-bold font-serif italic transition-all duration-150 cursor-pointer shadow-md border-none h-fit whitespace-nowrap self-stretch sm:self-center"
            title="Record an executive decision against this comparison"
          >
            <FileCheck className="w-4 h-4" />
            <span>Record Decision</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-art-cream/30 border-b border-art-ink/10 text-[9px] font-mono font-bold uppercase tracking-widest text-art-ink/60">
              <th className="px-4 py-3.5">Parameter Lens</th>
              <th className="px-4 py-3.5 bg-art-cream/40 text-art-ink border-x border-art-ink/5 font-serif italic">Build A: {buildA.name}</th>
              <th className="px-4 py-3.5 bg-art-cream/70 text-art-ink border-x border-art-ink/5 font-serif italic">Build B: {buildB.name}</th>
              <th className="px-4 py-3.5 text-center">Delta (B vs. A)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-art-ink/5 text-xs">
            {/* 1. ENGINEERING ZONE */}
            <tr className="bg-art-cream/15 border-y border-art-ink/5">
              <td colSpan={4} className="px-4 py-2 font-bold text-[9px] uppercase text-art-ink/40 tracking-[0.15em] font-mono">
                Engineering Metrics
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Process Node</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.processNode, dmB.processNode)}`}>
                {dmA.processNode}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.processNode, dmB.processNode)}`}>
                {dmB.processNode}
              </td>
              <td className="px-4 py-2.5 text-center font-mono text-art-ink/30">-</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Silicon Area</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.totalDieArea, snapB.totalDieArea)}`}>
                {round(snapA.totalDieArea, 1)} mm²
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.totalDieArea, snapB.totalDieArea)}`}>
                {round(snapB.totalDieArea, 1)} mm²
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.totalDieArea, snapB.totalDieArea, ' mm²', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Transistor Count</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.transistorCount, dmB.transistorCount)}`}>
                {dmA.transistorCount} B
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.transistorCount, dmB.transistorCount)}`}>
                {dmB.transistorCount} B
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(dmA.transistorCount, dmB.transistorCount, ' B')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Topology Design</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic uppercase ${highlightDifference(dmA.topology, dmB.topology)}`}>
                {dmA.topology}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic uppercase ${highlightDifference(dmA.topology, dmB.topology)}`}>
                {dmB.topology}
              </td>
              <td className="px-4 py-2.5 text-center font-mono text-art-ink/30">-</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Silicon Yield</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.dieYield, snapB.dieYield)}`}>
                {round(snapA.dieYield * 100, 1)}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.dieYield, snapB.dieYield)}`}>
                {round(snapB.dieYield * 100, 1)}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.dieYield * 100, snapB.dieYield * 100, '%')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Dies Per Wafer (DPW)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.dpw, snapB.dpw)}`}>
                {snapA.dpw} dies
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.dpw, snapB.dpw)}`}>
                {snapB.dpw} dies
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.dpw, snapB.dpw, ' dies')}
              </td>
            </tr>

            {/* 2. MANUFACTURING ZONE */}
            <tr className="bg-art-cream/15 border-y border-art-ink/5">
              <td colSpan={4} className="px-4 py-2 font-bold text-[9px] uppercase text-art-ink/40 tracking-[0.15em] font-mono">
                Manufacturing Yield & Assembly
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Defect Density (D0)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.defectDensity, dmB.defectDensity)}`}>
                {dmA.defectDensity} /cm²
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.defectDensity, dmB.defectDensity)}`}>
                {dmB.defectDensity} /cm²
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(dmA.defectDensity, dmB.defectDensity, '/cm²', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Packaging Yield</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.packagingYield, dmB.packagingYield)}`}>
                {dmA.packagingYield}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.packagingYield, dmB.packagingYield)}`}>
                {dmB.packagingYield}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(dmA.packagingYield, dmB.packagingYield, '%')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Electrical Test Yield</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.testYield, dmB.testYield)}`}>
                {dmA.testYield}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.testYield, dmB.testYield)}`}>
                {dmB.testYield}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(dmA.testYield, dmB.testYield, '%')}
              </td>
            </tr>

            {/* 3. FINANCIAL ZONE */}
            <tr className="bg-art-cream/15 border-y border-art-ink/5">
              <td colSpan={4} className="px-4 py-2 font-bold text-[9px] uppercase text-art-ink/40 tracking-[0.15em] font-mono">
                Financial Architecture
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Silicon Wafer Cost</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.waferCost, dmB.waferCost)}`}>
                ${dmA.waferCost.toLocaleString()}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.waferCost, dmB.waferCost)}`}>
                ${dmB.waferCost.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(dmA.waferCost, dmB.waferCost, '', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Silicon Die Cost</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.rawDieCost, snapB.rawDieCost)}`}>
                ${round(snapA.rawDieCost, 2)}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.rawDieCost, snapB.rawDieCost)}`}>
                ${round(snapB.rawDieCost, 2)}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.rawDieCost, snapB.rawDieCost, '', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Packaged Unit Cost (COGS)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.grossCostPerGoodDie, snapB.grossCostPerGoodDie)}`}>
                ${round(snapA.grossCostPerGoodDie, 2)}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.grossCostPerGoodDie, snapB.grossCostPerGoodDie)}`}>
                ${round(snapB.grossCostPerGoodDie, 2)}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.grossCostPerGoodDie, snapB.grossCostPerGoodDie, '', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Average Selling Price (ASP)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.asp, dmB.asp)}`}>
                ${dmA.asp.toLocaleString()}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.asp, dmB.asp)}`}>
                ${dmB.asp.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(dmA.asp, dmB.asp, '')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Gross Margin</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.grossMargin, snapB.grossMargin)}`}>
                {round(snapA.grossMargin, 1)}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.grossMargin, snapB.grossMargin)}`}>
                {round(snapB.grossMargin, 1)}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.grossMargin, snapB.grossMargin, '%')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Non-Recurring Eng (NRE)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(dmA.nreCost, dmB.nreCost)}`}>
                ${dmA.nreCost} M
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(dmA.nreCost, dmB.nreCost)}`}>
                ${dmB.nreCost} M
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(dmA.nreCost, dmB.nreCost, ' M', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Net Lifetime Profit</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.lifetimeNetProfitMillion, snapB.lifetimeNetProfitMillion)}`}>
                ${round(snapA.lifetimeNetProfitMillion, 1)} M
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.lifetimeNetProfitMillion, snapB.lifetimeNetProfitMillion)}`}>
                ${round(snapB.lifetimeNetProfitMillion, 1)} M
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.lifetimeNetProfitMillion, snapB.lifetimeNetProfitMillion, ' M')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Return on Investment (ROI)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(snapA.roi, snapB.roi)}`}>
                {round(snapA.roi, 1)}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(snapA.roi, snapB.roi)}`}>
                {round(snapB.roi, 1)}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(snapA.roi, snapB.roi, '%')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Business Impact Analysis */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-art-rust" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-art-ink/80 font-mono">Business Impact Analysis</h3>
        </div>
        {impacts.length === 0 ? (
          <p className="text-[11px] text-art-ink/50 italic">No material differences detected.</p>
        ) : (
          <div className="space-y-2">
            {impacts.map((imp, i) => (
              <div key={i} className="border border-art-ink/5 rounded-lg p-3 bg-art-cream/20 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      imp.severity === 'positive' ? 'bg-green-50 text-green-700 border-green-200' :
                      imp.severity === 'negative' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {imp.severity === 'positive' ? '✓ Positive' : imp.severity === 'negative' ? '⚠ Risk' : '○ Neutral'}
                    </span>
                    <span className="text-[10px] font-mono text-art-ink/40 uppercase">{imp.category}</span>
                  </div>
                  <span className="text-[9px] font-mono text-art-ink/40">{imp.delta}</span>
                </div>
                <p className="text-[11px] text-art-ink/70 leading-relaxed font-sans">{imp.narrative}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Executive Recommendation */}
      <div className={`bg-white border-2 rounded-xl p-5 shadow-sm space-y-3 ${
        recommendation.outcome === 'Proceed' ? 'border-green-300' :
        recommendation.outcome === 'Proceed with Risk' ? 'border-yellow-300' :
        recommendation.outcome === 'Requires Investigation' ? 'border-orange-300' :
        recommendation.outcome === 'Hold' ? 'border-red-300' :
        'border-red-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-art-ink/80 font-mono">Executive Recommendation</h3>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            recommendation.outcome === 'Proceed' ? 'bg-green-50 text-green-700 border-green-200' :
            recommendation.outcome === 'Proceed with Risk' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            recommendation.outcome === 'Requires Investigation' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            {recommendation.outcome}
          </span>
        </div>
        <p className="text-xs text-art-ink/70">{recommendation.summary}</p>
        <div className="flex items-center space-x-4 text-[10px] text-art-ink/50 font-mono">
          <span>Confidence: {recommendation.confidence}%</span>
          {recommendation.riskFactors.length > 0 && (
            <span className="flex items-center space-x-1 text-red-600">
              <ShieldAlert className="w-3 h-3" />
              <span>{recommendation.riskFactors.length} risk factor{recommendation.riskFactors.length > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      </div>

      {/* AI Scenario Analysis Action Card */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-art-rust/10 border border-art-rust/20 p-2 rounded-lg text-art-rust">
              <Sparkles className="w-5 h-5 fill-art-rust/10" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold tracking-wide text-art-ink">AI Scenario Modeling & Recommendation</h3>
              <p className="text-[11px] text-art-ink/70">
                Execute a Board-Ready comparative audit on technology risk, operational bottlenecking, and margin optimization.
              </p>
            </div>
          </div>
          <button
            onClick={handleAiCompare}
            disabled={loading}
            className="flex items-center space-x-2 bg-art-rust hover:bg-art-rust/95 disabled:bg-art-cream/10 text-white disabled:text-art-cream/30 border-none px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-art-cream/50" />
                <span>Auditing Models...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Run Expert AI Comparison</span>
              </>
            )}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/50 p-3 rounded-lg text-xs text-red-300 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AI Output Result */}
        {aiComparison && (
          <div className="bg-art-cream/50 border border-art-ink/10 rounded-lg p-5 max-h-[35vh] overflow-y-auto text-art-ink">
            <div className="flex items-center justify-between mb-3 border-b border-art-ink/10 pb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-art-rust font-mono">
                Consultant Report: Build A vs. Build B
              </span>
              <div className="flex items-center space-x-1.5 bg-green-950/45 text-green-400 px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-wider border border-green-900/50 uppercase">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span>Compliance Verified</span>
              </div>
            </div>
            <RenderMarkdown text={aiComparison} />
          </div>
        )}
      </div>

      {/* Decision Recording Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-art-ink/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-art-ink/10 flex items-center justify-between">
              <h3 className="text-sm font-serif font-black text-art-ink">Record Executive Decision</h3>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-art-ink/40 hover:text-art-ink cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-art-ink/60 font-mono mb-1">Decision Outcome</label>
                <select
                  value={decisionOutcome}
                  onChange={(e) => setDecisionOutcome(e.target.value as DecisionOutcome)}
                  className="w-full px-3 py-2 border border-art-ink/15 rounded text-xs font-mono bg-white"
                >
                  <option value="Proceed">Proceed</option>
                  <option value="Proceed with Risk">Proceed with Risk</option>
                  <option value="Requires Investigation">Requires Investigation</option>
                  <option value="Hold">Hold</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-art-ink/60 font-mono mb-1">Builds Under Review</label>
                <div className="text-xs font-mono text-art-ink/80 bg-art-cream/30 px-3 py-2 rounded border border-art-ink/10">
                  {buildA.name} vs {buildB.name}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-art-ink/60 font-mono mb-1">Approver</label>
                <input
                  type="text"
                  value={decisionApprover}
                  onChange={(e) => setDecisionApprover(e.target.value)}
                  className="w-full px-3 py-2 border border-art-ink/15 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-art-ink/60 font-mono mb-1">Rationale</label>
                <textarea
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-art-ink/15 rounded text-xs font-sans"
                  placeholder="Explain the reasoning behind this decision..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-art-ink/60 font-mono mb-1">Follow-Up Actions</label>
                <input
                  type="text"
                  value={decisionFollowUp}
                  onChange={(e) => setDecisionFollowUp(e.target.value)}
                  className="w-full px-3 py-2 border border-art-ink/15 rounded text-xs font-mono"
                  placeholder="e.g., Schedule yield review, Re-run with lower D0"
                />
              </div>
            </div>

            <div className="p-5 border-t border-art-ink/10 flex justify-end space-x-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 text-xs font-bold text-art-ink/60 bg-art-cream hover:bg-art-cream/60 rounded border border-art-ink/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const decision: Decision = {
                    id: `dec-${Date.now()}`,
                    buildIds: [buildA.id, buildB.id],
                    outcome: decisionOutcome,
                    approver: decisionApprover,
                    rationale: decisionRationale,
                    followUpActions: decisionFollowUp ? [decisionFollowUp] : [],
                    timestamp: new Date().toISOString(),
                  };
                  onRecordDecision?.(decision);
                  setShowDecisionModal(false);
                  setDecisionOutcome('Proceed');
                  setDecisionRationale('');
                  setDecisionApprover('eagleximpact');
                  setDecisionFollowUp('');
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-art-rust hover:bg-art-rust/90 rounded border-none cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 inline mr-1" />
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

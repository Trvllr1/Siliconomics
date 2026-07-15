/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Build } from '../types';
import { computeBuildMetrics, round } from '../utils/mathEngine';
import { Sparkles, Loader2, ArrowRightLeft, ShieldAlert, CheckCircle, TrendingUp, DollarSign, FileText, Pin, Trash2 } from 'lucide-react';
import { generateComparisonPdf } from '../utils/pdfGenerator';

interface ComparisonViewProps {
  builds: Build[];
  initialBuildAId?: string;
  initialBuildBId?: string;
}

interface ComparisonSnapshot {
  id: string;
  name: string;
  buildAId: string;
  buildBId: string;
  timestamp: string;
}

export default function ComparisonView({ builds, initialBuildAId, initialBuildBId }: ComparisonViewProps) {
  const [buildAId, setBuildAId] = useState(initialBuildAId || builds[0]?.id || '');
  const [buildBId, setBuildBId] = useState(initialBuildBId || builds[1]?.id || builds[0]?.id || '');
  
  const [snapshots, setSnapshots] = useState<ComparisonSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_comparison_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
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

  const buildA = builds.find((b) => b.id === buildAId) || builds[0];
  const buildB = builds.find((b) => b.id === buildBId) || builds[1] || builds[0];

  const metricsA = computeBuildMetrics(buildA);
  const metricsB = computeBuildMetrics(buildB);

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
      } catch (e) {}
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
    } catch (e) {}
  };

  const handleAiCompare = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      setAiComparison(data.comparison);
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

  // Custom renderer for comparison markdown
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
            onClick={() => generateComparisonPdf(buildA, metricsA, buildB, metricsB, aiComparison)}
            className="flex items-center justify-center space-x-2 bg-art-rust hover:bg-art-rust/90 text-white rounded-lg px-4 py-3 text-xs font-bold font-serif italic transition-all duration-150 cursor-pointer shadow-md border-none h-fit whitespace-nowrap self-stretch sm:self-center"
            title="Download high-fidelity, board-ready comparative PDF summary with full compliance markers"
          >
            <FileText className="w-4 h-4" />
            <span>Generate PDF Executive Summary</span>
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
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.processNode, buildB.processNode)}`}>
                {buildA.processNode}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.processNode, buildB.processNode)}`}>
                {buildB.processNode}
              </td>
              <td className="px-4 py-2.5 text-center font-mono text-art-ink/30">-</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Silicon Area</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.totalDieArea, metricsB.totalDieArea)}`}>
                {round(metricsA.totalDieArea, 1)} mm²
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.totalDieArea, metricsB.totalDieArea)}`}>
                {round(metricsB.totalDieArea, 1)} mm²
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.totalDieArea, metricsB.totalDieArea, ' mm²', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Transistor Count</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.transistorCount, buildB.transistorCount)}`}>
                {buildA.transistorCount} B
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.transistorCount, buildB.transistorCount)}`}>
                {buildB.transistorCount} B
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(buildA.transistorCount, buildB.transistorCount, ' B')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Topology Design</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic uppercase ${highlightDifference(buildA.topology, buildB.topology)}`}>
                {buildA.topology}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic uppercase ${highlightDifference(buildA.topology, buildB.topology)}`}>
                {buildB.topology}
              </td>
              <td className="px-4 py-2.5 text-center font-mono text-art-ink/30">-</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Silicon Yield</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.dieYield, metricsB.dieYield)}`}>
                {round(metricsA.dieYield * 100, 1)}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.dieYield, metricsB.dieYield)}`}>
                {round(metricsB.dieYield * 100, 1)}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.dieYield * 100, metricsB.dieYield * 100, '%')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Dies Per Wafer (DPW)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.dpw, metricsB.dpw)}`}>
                {metricsA.dpw} dies
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.dpw, metricsB.dpw)}`}>
                {metricsB.dpw} dies
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.dpw, metricsB.dpw, ' dies')}
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
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.defectDensity, buildB.defectDensity)}`}>
                {buildA.defectDensity} /cm²
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.defectDensity, buildB.defectDensity)}`}>
                {buildB.defectDensity} /cm²
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(buildA.defectDensity, buildB.defectDensity, '/cm²', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Packaging Yield</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.packagingYield, buildB.packagingYield)}`}>
                {buildA.packagingYield}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.packagingYield, buildB.packagingYield)}`}>
                {buildB.packagingYield}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(buildA.packagingYield, buildB.packagingYield, '%')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Electrical Test Yield</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.testYield, buildB.testYield)}`}>
                {buildA.testYield}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.testYield, buildB.testYield)}`}>
                {buildB.testYield}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(buildA.testYield, buildB.testYield, '%')}
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
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.waferCost, buildB.waferCost)}`}>
                ${buildA.waferCost.toLocaleString()}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.waferCost, buildB.waferCost)}`}>
                ${buildB.waferCost.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(buildA.waferCost, buildB.waferCost, '', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Silicon Die Cost</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.rawDieCost, metricsB.rawDieCost)}`}>
                ${round(metricsA.rawDieCost, 2)}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.rawDieCost, metricsB.rawDieCost)}`}>
                ${round(metricsB.rawDieCost, 2)}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.rawDieCost, metricsB.rawDieCost, '', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Packaged Unit Cost (COGS)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.grossCostPerGoodDie, metricsB.grossCostPerGoodDie)}`}>
                ${round(metricsA.grossCostPerGoodDie, 2)}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.grossCostPerGoodDie, metricsB.grossCostPerGoodDie)}`}>
                ${round(metricsB.grossCostPerGoodDie, 2)}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.grossCostPerGoodDie, metricsB.grossCostPerGoodDie, '', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Average Selling Price (ASP)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.asp, buildB.asp)}`}>
                ${buildA.asp.toLocaleString()}
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.asp, buildB.asp)}`}>
                ${buildB.asp.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(buildA.asp, buildB.asp, '')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Gross Margin</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.grossMargin, metricsB.grossMargin)}`}>
                {round(metricsA.grossMargin, 1)}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.grossMargin, metricsB.grossMargin)}`}>
                {round(metricsB.grossMargin, 1)}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.grossMargin, metricsB.grossMargin, '%')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Non-Recurring Eng (NRE)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(buildA.nreCost, buildB.nreCost)}`}>
                ${buildA.nreCost} M
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(buildA.nreCost, buildB.nreCost)}`}>
                ${buildB.nreCost} M
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(buildA.nreCost, buildB.nreCost, ' M', true)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Net Lifetime Profit</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.lifetimeNetProfitMillion, metricsB.lifetimeNetProfitMillion)}`}>
                ${round(metricsA.lifetimeNetProfitMillion, 1)} M
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.lifetimeNetProfitMillion, metricsB.lifetimeNetProfitMillion)}`}>
                ${round(metricsB.lifetimeNetProfitMillion, 1)} M
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.lifetimeNetProfitMillion, metricsB.lifetimeNetProfitMillion, ' M')}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium text-art-ink/60 font-mono">Return on Investment (ROI)</td>
              <td className={`px-4 py-2.5 bg-art-cream/5 font-serif italic ${highlightDifference(metricsA.roi, metricsB.roi)}`}>
                {round(metricsA.roi, 1)}%
              </td>
              <td className={`px-4 py-2.5 bg-art-cream/10 font-serif italic ${highlightDifference(metricsA.roi, metricsB.roi)}`}>
                {round(metricsB.roi, 1)}%
              </td>
              <td className="px-4 py-2.5 text-center">
                {formatDelta(metricsA.roi, metricsB.roi, '%')}
              </td>
            </tr>
          </tbody>
        </table>
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
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Build, PersonaType, ActivityLog } from '../types';
import { Archetype, PRECONFIG_ARCHETYPES, convertArchetypeToBuild, createBlankBuild } from '../data/archetypes';
import { computeBuildMetrics, round } from '../utils/mathEngine';
import { 
  Shield, 
  LayoutGrid, 
  Clock, 
  Users, 
  Flame, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  GitBranch, 
  List,
  Plus,
  Database,
  Sparkles
} from 'lucide-react';

const formatActivityTime = (timestampStr: string): string => {
  try {
    const date = new Date(timestampStr);
    const now = new Date('2026-07-15T13:59:30-07:00'); // Consistent reference local time
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recent';
  }
};

interface DashboardViewProps {
  builds: Build[];
  activities: ActivityLog[];
  customArchetypes: Archetype[];
  onAddCustomArchetype: (archetype: Archetype) => void;
  onCommitBuild: (newBuild: Build) => void;
  onSelectBuild: (id: string) => void;
  onNavigate: (tab: string) => void;
  activePersona: PersonaType;
  onChangePersona: (persona: PersonaType) => void;
}

export default function DashboardView({
  builds,
  activities,
  customArchetypes,
  onAddCustomArchetype,
  onCommitBuild,
  onSelectBuild,
  onNavigate,
  activePersona,
  onChangePersona,
}: DashboardViewProps) {
  const [listMode, setListMode] = React.useState<'list' | 'tree'>('tree');

  // Blank "New Build" creation form state
  const [isNamingBuild, setIsNamingBuild] = useState(false);
  const [newBuildName, setNewBuildName] = useState('Untitled Build');
  
  // Custom archetype creation form states
  const [isAddingCustomArch, setIsAddingCustomArch] = useState(false);
  const [newArchName, setNewArchName] = useState('My-Custom-SoC');
  const [newArchCategory, setNewArchCategory] = useState<Archetype['category']>('ASIC');
  const [newArchDesc, setNewArchDesc] = useState('Custom microarchitecture designed for company-specific hardware acceleration.');
  const [newArchNode, setNewArchNode] = useState('5nm');
  const [newArchDieArea, setNewArchDieArea] = useState(250);
  const [newArchTransistors, setNewArchTransistors] = useState(20);
  const [newArchTdp, setNewArchTdp] = useState(65);
  const [newArchTopology, setNewArchTopology] = useState<'monolithic' | 'chiplet'>('monolithic');
  const [newArchChiplets, setNewArchChiplets] = useState(1);
  const [newArchIoDieArea, setNewArchIoDieArea] = useState(0);
  const [newArchDefectDensity, setNewArchDefectDensity] = useState(0.08);
  const [newArchWaferStarts] = useState(5000);
  const [newArchPackagingCost, setNewArchPackagingCost] = useState(12.50);
  const [newArchTestTime] = useState(40);
  const [newArchTestCostRate] = useState(0.15);
  const [newArchWaferCost, setNewArchWaferCost] = useState(9500);
  const [newArchNreCost, setNewArchNreCost] = useState(110);
  const [newArchAsp, setNewArchAsp] = useState(250);
  const [newArchVolume, setNewArchVolume] = useState(3.0);

  const handleSubmitCustomArchetype = (e: React.FormEvent) => {
    e.preventDefault();
    const newArch: Archetype = {
      id: `arch-custom-${Date.now()}`,
      name: newArchName,
      category: newArchCategory,
      description: newArchDesc,
      processNode: newArchNode,
      dieArea: Number(newArchDieArea),
      dieWidth: Number(round(Math.sqrt(Number(newArchDieArea)), 1)),
      dieHeight: Number(round(Math.sqrt(Number(newArchDieArea)), 1)),
      transistorCount: Number(newArchTransistors),
      tdp: Number(newArchTdp),
      topology: newArchTopology,
      chipletCount: Number(newArchChiplets),
      ioDieArea: Number(newArchIoDieArea),
      defectDensity: Number(newArchDefectDensity),
      waferStartsPerMonth: Number(newArchWaferStarts),
      packagingCost: Number(newArchPackagingCost),
      testTimeSeconds: Number(newArchTestTime),
      testCostPerSecond: Number(newArchTestCostRate),
      packagingYield: 99.0,
      testYield: 98.5,
      waferCost: Number(newArchWaferCost),
      nreCost: Number(newArchNreCost),
      asp: Number(newArchAsp),
      targetVolume: Number(newArchVolume),
      foundry: 'tsmc',
      packagingType: 'standard',
      isCustom: true,
      creator: 'eagleximpact'
    };

    onAddCustomArchetype(newArch);
    setIsAddingCustomArch(false);
  };

  const handleSpawnFromArchetype = (arch: Archetype) => {
    const defaultName = `${arch.name} (${arch.isCustom ? 'Custom' : 'Preset'} v1.0)`;
    const newBuild = convertArchetypeToBuild(arch, defaultName, 'v1.0', 'eagleximpact');
    onCommitBuild(newBuild);
    onSelectBuild(newBuild.id);
    onNavigate('build');
  };

  // First-class "New Build" path: blank Draft from neutral defaults, then straight
  // to the Build Workspace where every parameter is configured.
  const handleCreateBlankBuild = (e: React.FormEvent) => {
    e.preventDefault();
    const newBuild = createBlankBuild(newBuildName.trim(), 'eagleximpact');
    onCommitBuild(newBuild);
    onSelectBuild(newBuild.id);
    onNavigate('build');
    setIsNamingBuild(false);
    setNewBuildName('Untitled Build');
  };

  const allArchetypes = [...PRECONFIG_ARCHETYPES, ...customArchetypes];
  
  // Compute global summary metrics
  const analyzedBuilds = builds.map((b) => computeBuildMetrics(b));
  
  const totalVolumeMillion = analyzedBuilds.reduce((acc, curr) => acc + curr.build.designModel.targetVolume, 0);
  const averageMargin = analyzedBuilds.reduce((acc, curr) => acc + curr.snapshot.grossMargin, 0) / builds.length;
  const totalNetProfitMillion = analyzedBuilds.reduce((acc, curr) => acc + curr.snapshot.lifetimeNetProfitMillion, 0);
  const averageROI = analyzedBuilds.reduce((acc, curr) => acc + curr.snapshot.roi, 0) / builds.length;

  const getStatusColor = (status: Build['status']) => {
    switch (status) {
      case 'Approved':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'TechnicalReview':
      case 'FinancialReview':
      case 'ProgramReview':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Alert':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getPersonaHeader = () => {
    switch (activePersona) {
      case 'architect':
        return {
          title: "Silicon Architecture Operations",
          subtitle: "Auditing silicon area density, transistor scaling models, and power limits.",
        };
      case 'manufacturing':
        return {
          title: "OSAT & Foundry Operations",
          subtitle: "Auditing wafer defect susceptibility, test time bottlenecks, and packaging throughput.",
        };
      case 'finance':
        return {
          title: "Corporate Capital Allocation",
          subtitle: "Auditing non-recurring engineering amortization, gross margins, and break-even targets.",
        };
      case 'program':
        return {
          title: "Program Delivery Operations",
          subtitle: "Auditing milestones, risk matrices, resource loads, and tape-out schedules.",
        };
      case 'executive':
        return {
          title: "Corporate Executive Board Room",
          subtitle: "Providing progressive disclosure of multi-billion dollar semiconductor capital decisions.",
        };
    }
  };

  const personaLabel = (p: PersonaType): string => {
    switch (p) {
      case 'architect': return 'Silicon Architect';
      case 'manufacturing': return 'Foundry Engineer';
      case 'finance': return 'Financial Analyst';
      case 'program': return 'Program Director';
      case 'executive': return 'Executive Board';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Executive Command Header */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between shadow-xl relative overflow-hidden">
        {/* Subtle decorative elements for artistic touch */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-art-rust opacity-15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-art-rust uppercase tracking-[0.25em] mb-2 font-mono">
            <Shield className="w-3.5 h-3.5 text-art-rust animate-pulse" />
            <span>Siliconomics Manhattan Terminal</span>
          </div>
          <h2 className="text-2xl font-serif italic font-black tracking-tight text-white leading-tight">{getPersonaHeader().title}</h2>
          <p className="text-xs text-art-ink/70 mt-1.5 font-sans leading-relaxed">{getPersonaHeader().subtitle}</p>
        </div>

        {/* Quick Lens Switcher */}
        <div className="mt-4 md:mt-0 flex flex-wrap gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-white/10 relative z-10">
          {(['architect', 'manufacturing', 'finance', 'program', 'executive'] as PersonaType[]).map((p) => (
            <button
              key={p}
              onClick={() => onChangePersona(p)}
              className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                p === activePersona
                  ? 'bg-art-rust text-white font-serif italic'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {personaLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Global Portfolio Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Program Volume */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:border-art-rust/35 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-art-ink"></div>
          <div className="pl-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-art-ink/40 font-mono block">Total Lifetime Volume</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-3xl font-serif italic font-black text-art-ink tracking-tight">{round(totalVolumeMillion, 1)}M</span>
              <span className="text-[10px] text-art-ink/50 font-medium font-serif italic">units</span>
            </div>
          </div>
          <span className="text-[9px] text-art-ink/40 block border-t border-art-ink/5 pt-1.5 pl-2 font-mono">Consolidated Portfolio Starts</span>
        </div>

        {/* Average Gross Margin */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:border-art-rust/35 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-art-rust"></div>
          <div className="pl-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-art-ink/40 font-mono block">Average Gross Margin</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-3xl font-serif italic font-black text-art-rust tracking-tight">{round(averageMargin, 1)}%</span>
            </div>
          </div>
          <span className="text-[9px] text-art-rust font-bold block border-t border-art-ink/5 pt-1.5 pl-2 font-mono uppercase tracking-wider text-[8px]">Target: &gt; 55% Corporate</span>
        </div>

        {/* Total Net Profit */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:border-art-rust/35 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-art-ink"></div>
          <div className="pl-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-art-ink/40 font-mono block">Net Lifetime Profit</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-3xl font-serif italic font-black text-art-ink tracking-tight">${round(totalNetProfitMillion, 1)}M</span>
              <span className="text-[10px] text-art-ink/50 font-medium font-serif italic">USD</span>
            </div>
          </div>
          <span className="text-[9px] text-art-ink/40 block border-t border-art-ink/5 pt-1.5 pl-2 font-mono">Net of Amortized Capex</span>
        </div>

        {/* Average ROI */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:border-art-rust/35 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-art-rust"></div>
          <div className="pl-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-art-ink/40 font-mono block">Average Return (ROI)</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-3xl font-serif italic font-black text-art-rust tracking-tight">{round(averageROI, 1)}%</span>
            </div>
          </div>
          <span className="text-[9px] text-art-ink/40 block border-t border-art-ink/5 pt-1.5 pl-2 font-mono">Calculated ROI across NRE</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Builds & Archetypes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Builds List */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-art-ink/10 bg-art-cream/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LayoutGrid className="w-4 h-4 text-art-rust" />
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-art-ink/80 font-mono">Active Semiconductor Builds</h3>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex bg-white rounded border border-art-ink/10 p-0.5 text-[10px] font-mono">
                  <button
                    onClick={() => setListMode('list')}
                    className={`px-2.5 py-1 rounded cursor-pointer flex items-center space-x-1 ${listMode === 'list' ? 'bg-art-ink text-art-cream font-bold' : 'text-art-ink/50 hover:text-art-ink'}`}
                  >
                    <List className="w-3 h-3" />
                    <span>Flat List</span>
                  </button>
                  <button
                    onClick={() => setListMode('tree')}
                    className={`px-2.5 py-1 rounded cursor-pointer flex items-center space-x-1 ${listMode === 'tree' ? 'bg-art-ink text-art-cream font-bold' : 'text-art-ink/50 hover:text-art-ink'}`}
                  >
                    <GitBranch className="w-3 h-3" />
                    <span>Lineage Tree</span>
                  </button>
                </div>
                <span className="text-[10px] font-mono text-art-ink/50 bg-white border border-art-ink/5 px-2 py-0.5 rounded-full">{builds.length} builds</span>
                <button
                  onClick={() => setIsNamingBuild(!isNamingBuild)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold text-white bg-art-rust hover:bg-art-rust/90 rounded font-mono transition-colors cursor-pointer select-none"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isNamingBuild ? 'Cancel' : 'New Build'}</span>
                </button>
              </div>
            </div>

            {/* Blank Build Creation Form */}
            {isNamingBuild && (
              <form onSubmit={handleCreateBlankBuild} className="p-4 bg-art-cream/15 border-b border-art-ink/10 flex items-end space-x-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">New Build Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newBuildName}
                    onChange={(e) => setNewBuildName(e.target.value)}
                    className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-white text-art-ink focus:outline-none focus:border-art-rust font-sans text-xs"
                    required
                  />
                  <span className="text-[9px] text-art-ink/40 font-mono">Starts from a neutral default 5nm monolithic DesignModel — configure every parameter in the Build Workspace.</span>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-[10px] font-bold text-white bg-art-ink hover:bg-art-ink/90 rounded font-mono transition-colors cursor-pointer select-none"
                >
                  Create Build
                </button>
              </form>
            )}

            {listMode === 'list' ? (
              <div className="divide-y divide-art-ink/5">
                {analyzedBuilds.map((metrics) => {
                  const { build, snapshot: snap } = metrics;
                  return (
                    <div
                      key={build.id}
                      onClick={() => {
                        onSelectBuild(build.id);
                        onNavigate('build');
                      }}
                      className="p-4 hover:bg-art-cream/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-serif font-black text-art-ink">{build.name}</span>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border tracking-wide uppercase ${getStatusColor(build.status)}`}>
                            {build.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-art-ink/75 italic line-clamp-1 max-w-[420px] font-sans">{build.description}</p>
                        <div className="flex items-center space-x-3 text-[10px] text-art-ink/60 font-mono">
                          <span>Node: {build.designModel.processNode}</span>
                          <span>•</span>
                          <span>Area: {round(snap.totalDieArea, 1)} mm²</span>
                          <span>•</span>
                          <span>Creator: {build.creator}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <span className="text-[9px] text-art-ink/40 block uppercase font-mono">Die Yield</span>
                          <span className="text-xs font-bold text-art-rust font-mono">{round(snap.dieYield * 100, 1)}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-art-ink/40 block uppercase font-mono">Margin</span>
                          <span className="text-xs font-bold text-green-700 font-mono">{round(snap.grossMargin, 1)}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-art-ink/40 block uppercase font-mono">NRE</span>
                          <span className="text-xs font-bold text-art-ink/80 font-mono">${build.designModel.nreCost}M</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-art-ink/30" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 space-y-4 bg-art-cream/10">
                {/* Recursive Lineage Tree Render */}
                {(() => {
                  const rootBuilds = builds.filter(b => !b.parentId || !builds.some(pb => pb.id === b.parentId));
                  
                  const renderTreeNodes = (parentId: string | undefined, depth: number = 0): React.ReactNode => {
                    const children = builds.filter(b => b.parentId === parentId);
                    if (children.length === 0) return null;
                    
                    return (
                      <div className={`space-y-3 ${depth > 0 ? 'ml-6 border-l-2 border-dashed border-art-rust/20 pl-4 mt-2' : ''}`}>
                        {children.map(build => {
                          const metrics = computeBuildMetrics(build);
                          const snap = metrics.snapshot;
                          
                          return (
                            <div key={build.id} className="space-y-1">
                              <div
                                onClick={() => {
                                  onSelectBuild(build.id);
                                  onNavigate('build');
                                }}
                                className="p-3 bg-white hover:bg-art-cream/30 border border-art-ink/10 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer group transition-all"
                              >
                                <div className="flex items-start space-x-2">
                                  {depth > 0 && <span className="text-art-rust font-bold mt-0.5 font-mono">↳</span>}
                                  <div className="space-y-0.5">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-serif font-black text-art-ink group-hover:text-art-rust transition-colors">{build.name}</span>
                                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${getStatusColor(build.status)}`}>
                                        {build.status}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-art-ink/75 line-clamp-1 max-w-[320px] italic font-sans">{build.description}</p>
                                    <div className="text-[9px] text-art-ink/50 font-mono">
                                      v{build.version} • {build.designModel.processNode} • Creator: {build.creator}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-right">
                                  <div className="hidden sm:block">
                                    <span className="text-[8px] text-art-ink/40 uppercase block font-mono">Die Yield</span>
                                    <span className="text-[10px] font-bold text-art-rust font-mono">{round(snap.dieYield * 100, 1)}%</span>
                                  </div>
                                  <div className="hidden sm:block">
                                    <span className="text-[8px] text-art-ink/40 uppercase block font-mono">Margin</span>
                                    <span className="text-[10px] font-bold text-green-700 font-mono">{round(snap.grossMargin, 1)}%</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-art-ink/30 group-hover:text-art-rust group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </div>
                              {/* Recurse for children */}
                              {renderTreeNodes(build.id, depth + 1)}
                            </div>
                          );
                        })}
                      </div>
                    );
                  };

                  return rootBuilds.map(root => {
                    const metrics = computeBuildMetrics(root);
                    const snap = metrics.snapshot;
                    const dieYield = snap.dieYield;
                    const grossMargin = snap.grossMargin;
                    
                    return (
                      <div key={root.id} className="space-y-2 border-b border-art-ink/5 pb-4 last:border-0 last:pb-0">
                        <div
                          onClick={() => {
                            onSelectBuild(root.id);
                            onNavigate('build');
                          }}
                          className="p-3 bg-white hover:bg-art-cream/30 border border-art-ink/15 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer group transition-all"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-serif font-black text-art-ink group-hover:text-art-rust transition-colors">{root.name}</span>
                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${getStatusColor(root.status)}`}>
                                {root.status}
                              </span>
                              <span className="text-[8px] bg-art-rust/15 text-art-rust font-mono font-bold px-1 rounded">ROOT</span>
                            </div>
                            <p className="text-[10px] text-art-ink/75 line-clamp-1 max-w-[320px] italic font-sans">{root.description}</p>
                            <div className="text-[9px] text-art-ink/50 font-mono">
                              v{root.version} • {root.designModel.processNode} • Creator: {root.creator}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-right">
                            <div className="hidden sm:block">
                              <span className="text-[8px] text-art-ink/40 uppercase block font-mono">Die Yield</span>
                              <span className="text-[10px] font-bold text-art-rust font-mono">{round(dieYield * 100, 1)}%</span>
                            </div>
                            <div className="hidden sm:block">
                              <span className="text-[8px] text-art-ink/40 uppercase block font-mono">Margin</span>
                              <span className="text-[10px] font-bold text-green-700 font-mono">{round(grossMargin, 1)}%</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-art-ink/30 group-hover:text-art-rust group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                        {renderTreeNodes(root.id, 1)}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-art-cream/20 border-t border-art-ink/10 flex justify-end">
            <button
              onClick={() => onNavigate('build')}
              className="text-xs font-bold text-art-rust hover:text-art-rust/80 flex items-center space-x-1 cursor-pointer font-serif italic"
            >
              <span>Access Build Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Industry Archetypes Registry */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-art-ink/10 bg-art-cream/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-art-rust" />
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-art-ink/80 font-mono">Industry Archetypes Registry</h3>
            </div>
            <button
              onClick={() => setIsAddingCustomArch(!isAddingCustomArch)}
              className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold text-white bg-art-rust hover:bg-art-rust/90 rounded font-mono transition-colors cursor-pointer select-none"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingCustomArch ? 'Cancel Registration' : 'Register Custom Archetype'}</span>
            </button>
          </div>

          {/* Custom Archetype Registration Form */}
          {isAddingCustomArch && (
            <form onSubmit={handleSubmitCustomArchetype} className="p-4 bg-art-cream/15 border-b border-art-ink/10 space-y-4">
              <div className="bg-white p-4 border border-art-ink/10 rounded-lg space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-art-rust font-mono">Define Custom Semiconductor Reference Baseline</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">Archetype Name</label>
                    <input
                      type="text"
                      value={newArchName}
                      onChange={(e) => setNewArchName(e.target.value)}
                      className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-art-cream/20 text-art-ink focus:outline-none focus:border-art-rust font-sans"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">Industry Segment / Category</label>
                    <select
                      value={newArchCategory}
                      onChange={(e) => setNewArchCategory(e.target.value as Archetype['category'])}
                      className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-white text-art-ink focus:outline-none focus:border-art-rust font-mono"
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
                  <div>
                    <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">Process Node Class</label>
                    <select
                      value={newArchNode}
                      onChange={(e) => setNewArchNode(e.target.value)}
                      className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-white text-art-ink focus:outline-none focus:border-art-rust font-mono"
                    >
                      <option value="3nm">3nm (Gate-All-Around / FinFET)</option>
                      <option value="5nm">5nm / 4nm Class</option>
                      <option value="7nm">7nm DUV/EUV Class</option>
                      <option value="12nm">12nm / 14nm FinFET Class</option>
                      <option value="16nm">16nm Mature Node</option>
                      <option value="22nm">22nm FD-SOI / Low-leakage</option>
                      <option value="28nm">28nm Planar HKMG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-art-ink/60 uppercase font-mono mb-1">Target Description</label>
                  <textarea
                    value={newArchDesc}
                    onChange={(e) => setNewArchDesc(e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1.5 border border-art-ink/15 rounded bg-art-cream/20 text-art-ink focus:outline-none focus:border-art-rust font-sans text-xs"
                    required
                  />
                </div>

                <div className="border-t border-art-ink/5 pt-3">
                  <h5 className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wider mb-2">Physical Design Parameters</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Die Area (mm²)</label>
                      <input
                        type="number"
                        value={newArchDieArea}
                        onChange={(e) => setNewArchDieArea(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        min="5"
                        max="1000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Transistor Count (Billion)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newArchTransistors}
                        onChange={(e) => setNewArchTransistors(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Design TDP (Watts)</label>
                      <input
                        type="number"
                        value={newArchTdp}
                        onChange={(e) => setNewArchTdp(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Silicon Topology</label>
                      <select
                        value={newArchTopology}
                        onChange={(e) => setNewArchTopology(e.target.value as 'monolithic' | 'chiplet')}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded bg-white text-art-ink font-mono"
                      >
                        <option value="monolithic">Monolithic Die</option>
                        <option value="chiplet">Chiplet Multi-Die</option>
                      </select>
                    </div>
                  </div>
                </div>

                {newArchTopology === 'chiplet' && (
                  <div className="bg-art-cream/20 p-2.5 rounded border border-art-ink/5 grid grid-cols-2 gap-3 text-xs animate-fadeIn">
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Compute Chiplet Count</label>
                      <input
                        type="number"
                        value={newArchChiplets}
                        onChange={(e) => setNewArchChiplets(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        min="1"
                        max="64"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">I/O Die Area (mm²)</label>
                      <input
                        type="number"
                        value={newArchIoDieArea}
                        onChange={(e) => setNewArchIoDieArea(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        min="0"
                        max="1000"
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-art-ink/5 pt-3">
                  <h5 className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wider mb-2">Manufacturing & Economics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Wafer Cost ($)</label>
                      <input
                        type="number"
                        value={newArchWaferCost}
                        onChange={(e) => setNewArchWaferCost(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Packaging Cost ($/unit)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={newArchPackagingCost}
                        onChange={(e) => setNewArchPackagingCost(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Defect Density (D₀)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newArchDefectDensity}
                        onChange={(e) => setNewArchDefectDensity(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Target ASP ($)</label>
                      <input
                        type="number"
                        value={newArchAsp}
                        onChange={(e) => setNewArchAsp(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Amortized NRE ($ Millions)</label>
                    <input
                      type="number"
                      value={newArchNreCost}
                      onChange={(e) => setNewArchNreCost(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-art-ink/60 uppercase font-mono mb-1">Target Lifetime Volume (Millions)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newArchVolume}
                      onChange={(e) => setNewArchVolume(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-art-ink/15 rounded font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-art-ink/10">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomArch(false)}
                    className="px-4 py-1.5 bg-art-cream text-art-ink/80 hover:bg-art-cream/70 border border-art-ink/10 rounded font-bold font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-art-rust hover:bg-art-rust/90 text-white rounded font-bold font-mono cursor-pointer"
                  >
                    Save Archetype Reference
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Archetypes Grid catalog */}
          <div className="p-4 bg-white space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allArchetypes.map((arch) => {
                const waferArea = 70685;
                const diesPerWafer = Math.floor((waferArea / arch.dieArea) - (3.1415 * 300 / Math.sqrt(2 * arch.dieArea)));
                const totalDieArea = arch.dieArea * arch.chipletCount + arch.ioDieArea;
                const densityD0 = arch.defectDensity;
                const siliconYield = Math.pow(1 + (densityD0 * (arch.dieArea / 100) / 1.5), -1.5);
                const siliconCost = arch.waferCost / (diesPerWafer * siliconYield);
                const finalCost = siliconCost + arch.packagingCost + (arch.testTimeSeconds * arch.testCostPerSecond);
                const baseMargin = ((arch.asp - finalCost) / arch.asp) * 100;

                return (
                  <div 
                    key={arch.id} 
                    className={`border p-4 rounded-xl flex flex-col justify-between transition-all duration-200 group relative ${
                      arch.isCustom 
                        ? 'border-dashed border-art-rust/45 bg-art-cream/10 hover:border-art-rust/70' 
                        : 'border-art-ink/10 bg-white hover:border-art-rust/30 hover:shadow-md'
                    }`}
                  >
                    {arch.isCustom && (
                      <span className="absolute top-2.5 right-2.5 text-[8px] bg-art-rust text-white font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Custom
                      </span>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                          arch.category === 'CoWoS' ? 'bg-red-50 text-red-700 border border-red-200' :
                          arch.category === 'Automotive' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          arch.category === 'FPGA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          arch.category === 'Mobile AP' ? 'bg-green-50 text-green-700 border border-green-200' :
                          arch.category === 'SmartNIC' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {arch.category}
                        </span>
                        <span className="text-[11px] text-art-ink/50 font-mono">{arch.processNode} Node</span>
                      </div>

                      <div>
                        <h4 className="font-serif font-black text-sm text-art-ink group-hover:text-art-rust transition-colors">{arch.name}</h4>
                        <p className="text-[10px] text-art-ink/70 italic font-sans leading-relaxed mt-0.5 min-h-[30px] line-clamp-2">
                          {arch.description}
                        </p>
                      </div>

                      {/* Stats block */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-art-cream/25 border border-art-ink/5 p-2 rounded text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-art-ink/40">Die Area:</span>
                          <span className="font-bold text-art-ink/80">{totalDieArea} mm²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-art-ink/40">Density:</span>
                          <span className="font-bold text-art-ink/80">{arch.transistorCount}B Xtrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-art-ink/40">TDP Class:</span>
                          <span className="font-bold text-art-ink/80">{arch.tdp}W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-art-ink/40">Topology:</span>
                          <span className="font-bold text-art-ink/80 truncate max-w-[50px]">
                            {arch.topology === 'chiplet' ? 'Chiplet' : 'Mono'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-art-ink/5">
                        <div>
                          <span className="text-art-ink/40 block text-[9px] uppercase">Est. ASP</span>
                          <span className="font-bold text-green-700">${arch.asp}</span>
                        </div>
                        <div>
                          <span className="text-art-ink/40 block text-[9px] uppercase">Life Volume</span>
                          <span className="font-bold text-art-ink/80">{arch.targetVolume}M units</span>
                        </div>
                        <div className="text-right">
                          <span className="text-art-ink/40 block text-[9px] uppercase">Est. Margin</span>
                          <span className={`font-bold ${baseMargin > 50 ? 'text-green-700' : 'text-yellow-600'}`}>
                            {isNaN(baseMargin) || baseMargin < 0 ? 'TBD' : `${round(baseMargin, 1)}%`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-art-ink/5 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-art-ink/40">
                        {arch.isCustom ? 'User Registered' : 'System Reference'}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => handleSpawnFromArchetype(arch)}
                        className="flex items-center space-x-1 px-3 py-1 bg-art-ink hover:bg-art-rust text-art-cream hover:text-white text-[10px] font-bold font-mono rounded transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Spawn Project</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

        {/* Sidebar Alerts / Decisions */}
        <div className="space-y-6">
          {/* Portfolio Alerts */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-art-ink/10 bg-art-cream/30 flex items-center space-x-2">
              <Flame className="w-4 h-4 text-art-rust animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-art-ink/80 font-mono">Operations Center Alerts</h3>
            </div>
            
            <div className="p-4 space-y-4 bg-white">
              {/* Alert 1 */}
              <div className="flex items-start space-x-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider font-mono">Severe 3nm Packaging Headwinds</span>
                  <p className="text-[10px] text-red-700 leading-relaxed">
                    Manhattan-X2 early advanced assembly packaging yield dropped to 97.5%. High manufacturing cost risk detected.
                  </p>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-yellow-200 uppercase tracking-wider font-mono">Tape-Out Review Approaching</span>
                  <p className="text-[10px] text-yellow-700 leading-relaxed">
                    Manhattan-X2 v0.9b sign-off scheduled for 2026-07-28. Financial and Yield audit checks must pass baseline targets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-art-ink/10 bg-art-cream/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-art-rust" />
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-art-ink/80 font-mono">Recent Activity</h3>
              </div>
              <span className="text-[10px] font-mono text-art-ink/40">Audit Trail</span>
            </div>

            <div className="p-4 space-y-3 bg-white divide-y divide-art-ink/5 max-h-[350px] overflow-y-auto">
              {activities.slice(0, 5).map((act) => (
                <div 
                  key={act.id} 
                  className="pt-3 first:pt-0 flex items-start space-x-2.5 transition-colors duration-150 group"
                >
                  <div className="mt-1 flex-shrink-0">
                    {act.type === 'commit' ? (
                      <div className="w-5 h-5 rounded bg-green-50 border border-green-200 flex items-center justify-center" title="Commit Event">
                        <GitBranch className="w-3 h-3 text-green-700" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center" title="Modification Event">
                        <Clock className="w-3 h-3 text-blue-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          onSelectBuild(act.buildId);
                          onNavigate('build');
                        }}
                        className="text-[11px] font-serif font-black text-art-ink hover:text-art-rust transition-colors text-left truncate cursor-pointer hover:underline"
                        title={`View ${act.buildName}`}
                      >
                        {act.buildName}
                      </button>
                      <span className="text-[9px] text-art-ink/40 font-mono whitespace-nowrap ml-2">
                        {formatActivityTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-[10px] text-art-ink/75 leading-relaxed font-sans font-medium break-words">
                      {act.delta}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-4 text-xs text-art-ink/40 italic font-mono">
                  No modifications recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Decisions */}
          <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-art-ink/80 font-mono">Upcoming Decisions</h3>
            {(() => {
              const reviewBuilds = builds.filter(b => b.status === 'TechnicalReview' || b.status === 'FinancialReview' || b.status === 'ProgramReview');
              const display = reviewBuilds.length > 0 ? reviewBuilds : builds.slice(0, 3);
              const statusColor: Record<string, string> = {
                TechnicalReview: 'text-blue-700 bg-blue-50 border-blue-200',
                FinancialReview: 'text-green-700 bg-green-50 border-green-200',
                ProgramReview: 'text-purple-700 bg-purple-50 border-purple-200',
                Approved: 'text-green-800 bg-green-100 border-green-300',
                Draft: 'text-gray-600 bg-gray-100 border-gray-200',
                Alert: 'text-red-700 bg-red-50 border-red-200',
              };
              const statusIcon: Record<string, React.ReactNode> = {
                TechnicalReview: <Clock className="w-4 h-4 text-blue-700" />,
                FinancialReview: <TrendingUp className="w-4 h-4 text-green-700" />,
                ProgramReview: <Users className="w-4 h-4 text-purple-700" />,
                Approved: <CheckCircle2 className="w-4 h-4 text-green-700" />,
                Draft: <Clock className="w-4 h-4 text-gray-500" />,
                Alert: <AlertTriangle className="w-4 h-4 text-red-700" />,
              };
              return (
                <div className="space-y-2">
                  {display.map(b => {
                    const snap = computeBuildMetrics(b).snapshot;
                    return (
                      <button
                        key={b.id}
                        onClick={() => { onSelectBuild(b.id); onNavigate('build'); }}
                        className="w-full flex items-center justify-between text-xs p-2.5 rounded hover:bg-art-cream/30 transition-all border border-art-ink/10 bg-white text-left cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {statusIcon[b.status] ?? <Clock className="w-4 h-4 text-art-ink/40" />}
                          <div className="min-w-0">
                            <span className="font-semibold text-art-ink block truncate">{b.name}</span>
                            <span className="text-[9px] font-mono text-art-ink/40 block truncate">{b.designModel.processNode} · v{b.version} · {(snap.grossMargin).toFixed(0)}% margin</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ml-2 ${statusColor[b.status] ?? 'text-art-ink/40 bg-art-cream border-art-ink/10'}`}>
                          {b.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

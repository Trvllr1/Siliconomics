/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Build, PersonaType, MetricCardData, CalculationTrace, ActivityLog } from './types';
import { DEFAULT_BUILDS } from './data/defaultBuilds';
import { Archetype, PRECONFIG_ARCHETYPES } from './data/archetypes';
import { computeBuildMetrics } from './utils/mathEngine';
import DashboardView from './components/DashboardView';
import BuildView from './components/BuildView';
import ComparisonView from './components/ComparisonView';
import ChartsView from './components/ChartsView';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import AiAdvisor from './components/AiAdvisor';
import CommandPalette from './components/CommandPalette';

import { 
  Monitor, 
  Cpu, 
  ArrowRightLeft, 
  Search, 
  Sparkles, 
  Database, 
  HelpCircle, 
  Command,
  Layout,
  BarChart3,
  BookOpen,
  ChevronRight,
  Menu,
  CheckCircle,
  FileCheck,
  RotateCcw
} from 'lucide-react';

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    buildId: 'manhattan-x2',
    buildName: 'Manhattan-X2 (AI-Server Ultra)',
    timestamp: '2026-07-15T13:45:00-07:00',
    type: 'modification',
    delta: 'Process Node upgraded from 5nm to 3nm class'
  },
  {
    id: 'act-2',
    buildId: 'manhattan-x1',
    buildName: 'Manhattan-X1 (ADAS SoC)',
    timestamp: '2026-07-15T13:12:00-07:00',
    type: 'modification',
    delta: 'Die Area adjusted to 260 mm² (automotive safe-density validation)'
  },
  {
    id: 'act-3',
    buildId: 'manhattan-x2',
    buildName: 'Manhattan-X2 (AI-Server Ultra)',
    timestamp: '2026-07-15T11:20:00-07:00',
    type: 'modification',
    delta: 'Adjusted advanced packaging assembly cost for CoWoS line'
  },
  {
    id: 'act-4',
    buildId: 'brooklyn-a2',
    buildName: 'Brooklyn-A2 (IoT Gateway)',
    timestamp: '2026-07-14T16:30:00-07:00',
    type: 'commit',
    delta: 'Committed initial Brooklyn-A2 (IoT Gateway) Draft'
  },
  {
    id: 'act-5',
    buildId: 'manhattan-x1',
    buildName: 'Manhattan-X1 (ADAS SoC)',
    timestamp: '2026-07-14T14:15:00-07:00',
    type: 'commit',
    delta: 'Committed Manhattan-X1 v2.4 (Lead Architect certified)'
  }
];

const getBuildDeltaDescription = (prev: Build, next: Build): string => {
  const changes: string[] = [];
  
  if (prev.processNode !== next.processNode) {
    changes.push(`Process Node changed from ${prev.processNode} to ${next.processNode}`);
  }
  if (prev.dieArea !== next.dieArea) {
    changes.push(`Die Area adjusted to ${next.dieArea} mm²`);
  }
  if (prev.dieWidth !== next.dieWidth || prev.dieHeight !== next.dieHeight) {
    changes.push(`Dimensions adjusted to ${next.dieWidth}x${next.dieHeight} mm`);
  }
  if (prev.transistorCount !== next.transistorCount) {
    changes.push(`Transistor Count updated to ${next.transistorCount}B`);
  }
  if (prev.tdp !== next.tdp) {
    changes.push(`TDP adjusted to ${next.tdp}W`);
  }
  if (prev.topology !== next.topology) {
    changes.push(`Topology changed to ${next.topology}`);
  }
  if (prev.chipletCount !== next.chipletCount) {
    changes.push(`Chiplet Count updated to ${next.chipletCount}`);
  }
  if (prev.ioDieArea !== next.ioDieArea) {
    changes.push(`I/O Die Area set to ${next.ioDieArea} mm²`);
  }
  if (prev.defectDensity !== next.defectDensity) {
    changes.push(`Defect Density adjusted to ${next.defectDensity}`);
  }
  if (prev.waferStartsPerMonth !== next.waferStartsPerMonth) {
    changes.push(`Wafer Starts updated to ${next.waferStartsPerMonth}/mo`);
  }
  if (prev.packagingCost !== next.packagingCost) {
    changes.push(`Packaging Cost adjusted to $${next.packagingCost}`);
  }
  if (prev.testTimeSeconds !== next.testTimeSeconds) {
    changes.push(`Test Time updated to ${next.testTimeSeconds}s`);
  }
  if (prev.testCostPerSecond !== next.testCostPerSecond) {
    changes.push(`Test Cost adjusted to $${next.testCostPerSecond}/s`);
  }
  if (prev.packagingYield !== next.packagingYield) {
    changes.push(`Packaging Yield set to ${next.packagingYield}%`);
  }
  if (prev.testYield !== next.testYield) {
    changes.push(`Test Yield adjusted to ${next.testYield}%`);
  }
  if (prev.waferCost !== next.waferCost) {
    changes.push(`Wafer Cost adjusted to $${next.waferCost}`);
  }
  if (prev.nreCost !== next.nreCost) {
    changes.push(`NRE Cost set to $${next.nreCost}M`);
  }
  if (prev.asp !== next.asp) {
    changes.push(`ASP adjusted to $${next.asp}`);
  }
  if (prev.targetVolume !== next.targetVolume) {
    changes.push(`Target Volume updated to ${next.targetVolume}M units`);
  }
  if (prev.status !== next.status) {
    changes.push(`Status changed from ${prev.status} to ${next.status}`);
  }

  if (changes.length === 0) {
    return 'Re-calibrated build parameters';
  }
  if (changes.length > 2) {
    return `Modified ${changes.length} design parameters (e.g., ${changes[0]})`;
  }
  return changes.join(', ');
};

export default function App() {
  // Master states
  const [builds, setBuilds] = useState<Build[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_builds');
      return saved ? JSON.parse(saved) : DEFAULT_BUILDS;
    } catch (e) {
      return DEFAULT_BUILDS;
    }
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_builds');
      return saved ? new Date() : null;
    } catch (e) {
      return null;
    }
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_activities');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch (e) {
      return INITIAL_ACTIVITIES;
    }
  });

  const [customArchetypes, setCustomArchetypes] = useState<Archetype[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_custom_archetypes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleAddCustomArchetype = (newArch: Archetype) => {
    setCustomArchetypes((prev) => {
      const updated = [...prev, newArch];
      try {
        localStorage.setItem('siliconomics_custom_archetypes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      buildId: 'archetype',
      buildName: `${newArch.name} Archetype`,
      timestamp: new Date().toISOString(),
      type: 'commit',
      delta: `Registered new custom industry archetype template: ${newArch.name} (${newArch.category})`,
    };
    setActivities((act) => [newLog, ...act]);
  };

  useEffect(() => {
    try {
      localStorage.setItem('siliconomics_activities', JSON.stringify(activities));
    } catch (e) {}
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem('siliconomics_builds', JSON.stringify(builds));
      // Only set lastSaved if the builds are actually different from DEFAULT_BUILDS
      if (JSON.stringify(builds) !== JSON.stringify(DEFAULT_BUILDS)) {
        setLastSaved(new Date());
      } else {
        setLastSaved(null);
      }
    } catch (e) {}
  }, [builds]);

  const [activeBuildId, setActiveBuildId] = useState<string>(DEFAULT_BUILDS[0].id);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard' | 'build' | 'compare'
  const [activePersona, setActivePersona] = useState<PersonaType>('executive');
  
  // Design View within BuildTab: 'metrics' | 'charts'
  const [buildViewTab, setBuildViewTab] = useState<'metrics' | 'charts'>('metrics');

  // Detail tracing states for Explainability panel
  const [hoveredTrace, setHoveredTrace] = useState<CalculationTrace | null>(null);
  const [clickedTrace, setClickedTrace] = useState<CalculationTrace | null>(null);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Context sidebar mode: 'explain' | 'consult'
  const [contextTab, setContextTab] = useState<'explain' | 'consult'>('explain');

  // Reset to Baseline confirmation state
  const [resetConfirm, setResetConfirm] = useState(false);

  // Auto-reset confirmation timer
  useEffect(() => {
    if (resetConfirm) {
      const timer = setTimeout(() => {
        setResetConfirm(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resetConfirm]);

  const activeBuild = builds.find((b) => b.id === activeBuildId) || builds[0];
  const computedMetrics = computeBuildMetrics(activeBuild);

  const handleResetToBaseline = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    
    setResetConfirm(false);

    // Trace back the nearest baseline configuration
    const baseline = DEFAULT_BUILDS.find(b => b.id === activeBuild.id) || 
                     DEFAULT_BUILDS.find(b => b.id === activeBuild.parentId) ||
                     DEFAULT_BUILDS.find(b => b.referenceModel === activeBuild.referenceModel) || 
                     DEFAULT_BUILDS[0];

    const resetBuild: Build = {
      ...activeBuild,
      processNode: baseline.processNode,
      dieArea: baseline.dieArea,
      dieWidth: baseline.dieWidth,
      dieHeight: baseline.dieHeight,
      transistorCount: baseline.transistorCount,
      tdp: baseline.tdp,
      topology: baseline.topology,
      chipletCount: baseline.chipletCount,
      ioDieArea: baseline.ioDieArea,
      defectDensity: baseline.defectDensity,
      waferStartsPerMonth: baseline.waferStartsPerMonth,
      packagingCost: baseline.packagingCost,
      testTimeSeconds: baseline.testTimeSeconds,
      testCostPerSecond: baseline.testCostPerSecond,
      packagingYield: baseline.packagingYield,
      testYield: baseline.testYield,
      waferCost: baseline.waferCost,
      nreCost: baseline.nreCost,
      asp: baseline.asp,
      targetVolume: baseline.targetVolume,
    };

    handleUpdateBuild(resetBuild);
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem('siliconomics_builds');
    } catch (e) {}
    setBuilds(DEFAULT_BUILDS);
    setLastSaved(null);

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      buildId: activeBuildId,
      buildName: activeBuild.name,
      timestamp: new Date().toISOString(),
      type: 'modification',
      delta: 'Purged temporary modeling session and restored factory baseline configurations'
    };
    setActivities((act) => [newLog, ...act]);
  };

  // Keyboard shortcut listener (Ctrl+K or Cmd+K) for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update active build within local state array to preserve modifications
  const handleUpdateBuild = (updated: Build) => {
    setBuilds((prev) => {
      const prevBuild = prev.find((b) => b.id === updated.id);
      if (prevBuild) {
        const deltaDesc = getBuildDeltaDescription(prevBuild, updated);
        if (deltaDesc !== 'Re-calibrated build parameters') {
          const newLog: ActivityLog = {
            id: `act-${Date.now()}`,
            buildId: updated.id,
            buildName: updated.name,
            timestamp: new Date().toISOString(),
            type: 'modification',
            delta: deltaDesc,
          };
          setActivities((act) => [newLog, ...act]);
        }
      }
      return prev.map((b) => (b.id === updated.id ? updated : b));
    });
  };

  const handleCommitBuild = (newBuild: Build) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      buildId: newBuild.id,
      buildName: newBuild.name,
      timestamp: new Date().toISOString(),
      type: 'commit',
      delta: `Committed new build version v${newBuild.version}`,
    };
    setActivities((act) => [newLog, ...act]);
    setBuilds((prev) => [...prev, newBuild]);
    setActiveBuildId(newBuild.id);
  };

  const handleSelectMetric = (m: MetricCardData) => {
    setClickedTrace(m.trace);
    setContextTab('explain');
  };

  const activeTrace = hoveredTrace || clickedTrace;

  const handleQuickCompare = (idA: string, idB: string) => {
    setActiveTab('compare');
  };

  return (
    <div className="min-h-screen bg-art-cream flex flex-col font-sans text-art-ink antialiased overflow-x-hidden">
      
      {/* Top micro navbar */}
      <header className="h-11 bg-white border-b border-art-ink/10 flex items-center justify-between px-4 select-none z-10 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-art-rust flex items-center justify-center font-serif font-black text-xs text-white italic">
            S
          </div>
          <span className="text-xs font-serif font-black tracking-widest text-art-ink uppercase">Siliconomics</span>
          <span className="text-[9px] text-art-ink/70 bg-art-cream border border-art-ink/10 px-1 rounded font-mono">
            Manhattan v1.0
          </span>
        </div>

        {/* Global search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center justify-between w-64 px-2.5 py-1 text-left bg-art-cream hover:bg-white border border-art-ink/10 rounded text-[11px] text-art-ink/50 font-medium transition-colors duration-150 cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-art-rust" />
            <span>Search builds, commands...</span>
          </div>
          <span className="text-[8px] bg-white border border-art-ink/10 text-art-ink/50 font-mono px-1 rounded">
            ⌘K
          </span>
        </button>

        <div className="flex items-center space-x-3 text-[11px] font-mono text-art-ink/70">
          <span className="flex items-center text-art-rust space-x-1 font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-art-rust" />
            <span>F100 Audits Active</span>
          </span>
        </div>
      </header>

      {/* Main Container: 3 Zones Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ZONE 1: Global Navigation Sidebar (Left, 16%) */}
        <nav className="w-56 bg-white border-r border-art-ink/10 flex flex-col justify-between select-none p-4 flex-shrink-0">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-[0.25em] block px-2 font-mono">
                Operational Lenses
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('build')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'build'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>Build Workspace</span>
                </button>

                <button
                  onClick={() => setActiveTab('compare')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'compare'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Comparisons Desk</span>
                </button>
              </div>
            </div>

            {/* Build Quick Selector (Sidebar nested) */}
            <div className="space-y-2 border-t border-art-ink/5 pt-4">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-[0.25em] block px-2 font-mono">
                Active Scenario
              </span>
              <div className="space-y-1">
                {builds.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBuildId(b.id);
                      if (activeTab !== 'build' && activeTab !== 'compare') {
                        setActiveTab('build');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-all duration-150 border cursor-pointer ${
                      b.id === activeBuildId
                        ? 'bg-art-ink text-art-cream border-art-ink font-serif italic'
                        : 'bg-white hover:bg-art-cream border-art-ink/10 text-art-ink/80'
                    }`}
                  >
                    <div className="font-bold truncate">{b.name}</div>
                    <div className={`text-[10px] mt-0.5 font-mono ${b.id === activeBuildId ? 'text-art-cream/70' : 'text-art-ink/40'}`}>
                      {b.processNode} • {b.version}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile footer and role tracker */}
          <div className="border-t border-art-ink/10 pt-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 bg-art-cream p-2 rounded border border-art-ink/10">
              <div className="w-7 h-7 rounded-full bg-art-rust flex items-center justify-center font-serif italic font-bold text-[10px] text-white">
                EX
              </div>
              <div className="truncate">
                <span className="font-bold text-art-ink block truncate leading-none">eagleximpact</span>
                <span className="text-[9px] text-art-ink/50 font-mono">eagleximpact@gmail.com</span>
              </div>
            </div>
            <div className="text-[9px] text-art-ink/40 font-mono text-center block">
              Time: 2026-07-15 UTC
            </div>
          </div>
        </nav>

        {/* ZONE 2: Primary Content Workspace (Center, ~56%) */}
        <main className="flex-1 p-6 overflow-y-auto bg-art-cream">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <DashboardView
              builds={builds}
              activities={activities}
              customArchetypes={customArchetypes}
              onAddCustomArchetype={handleAddCustomArchetype}
              onCommitBuild={handleCommitBuild}
              onSelectBuild={setActiveBuildId}
              onNavigate={setActiveTab}
              activePersona={activePersona}
              onChangePersona={setActivePersona}
            />
          )}

          {/* Build Tab */}
          {activeTab === 'build' && (
            <div className="space-y-4">
              {/* Internal toggle for Build Tab (Metrics vs. Charts) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-art-ink/10 gap-4">
                <div>
                  <h1 className="text-xl font-serif font-black tracking-tight text-art-ink">Build Design Board</h1>
                  <p className="text-xs text-art-ink/60 mt-1 italic">Adjust design knobs and analyze live silicon performance metrics.</p>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <button
                    onClick={handleResetToBaseline}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm select-none ${
                      resetConfirm
                        ? 'bg-art-rust/20 text-art-rust border-art-rust/40 animate-pulse'
                        : 'bg-white hover:bg-art-rust/10 text-art-ink hover:text-art-rust border-art-ink/15 hover:border-art-rust/30'
                    }`}
                    title="Revert current design knobs to their factory baseline configuration"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resetConfirm ? 'animate-spin' : ''}`} />
                    <span>{resetConfirm ? 'Confirm Reset?' : 'Reset to Baseline'}</span>
                  </button>

                  <div className="flex bg-white rounded border border-art-ink/15 p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => setBuildViewTab('metrics')}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded cursor-pointer transition-all ${
                        buildViewTab === 'metrics' ? 'bg-art-cream text-art-rust font-bold' : 'text-art-ink/60 hover:text-art-ink'
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>Metric Cards</span>
                    </button>
                    <button
                      onClick={() => setBuildViewTab('charts')}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded cursor-pointer transition-all ${
                        buildViewTab === 'charts' ? 'bg-art-cream text-art-rust font-bold' : 'text-art-ink/60 hover:text-art-ink'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Curves & Charts</span>
                    </button>
                  </div>
                </div>
              </div>

              {buildViewTab === 'metrics' ? (
                <BuildView
                  activeBuild={activeBuild}
                  computedMetrics={computedMetrics}
                  onUpdateBuild={handleUpdateBuild}
                  onCommitBuild={handleCommitBuild}
                  activePersona={activePersona}
                  onHoverMetric={setHoveredTrace}
                  onClickMetric={handleSelectMetric}
                  onAddCustomArchetype={handleAddCustomArchetype}
                  lastSaved={lastSaved}
                  onClearDraft={handleClearDraft}
                />
              ) : (
                <ChartsView
                  activeBuild={activeBuild}
                  computedMetrics={computedMetrics}
                />
              )}
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <ComparisonView
              builds={builds}
              initialBuildAId="manhattan-x1"
              initialBuildBId="manhattan-x2"
            />
          )}
        </main>

        {/* ZONE 3: Context Panel (Right, ~28%) */}
        <aside className="w-80 bg-white border-l border-art-ink/10 flex flex-col justify-between flex-shrink-0 overflow-hidden">
          
          {/* Header tabs */}
          <div className="border-b border-art-ink/10 flex text-xs select-none bg-art-cream/40">
            <button
              onClick={() => setContextTab('explain')}
              className={`flex-1 py-3 text-center font-bold tracking-tight border-b-2 flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                contextTab === 'explain'
                  ? 'border-art-rust text-art-rust bg-white font-serif italic'
                  : 'border-transparent text-art-ink/55 hover:text-art-ink hover:bg-art-cream/20'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Calculations Audit</span>
            </button>
            <button
              onClick={() => setContextTab('consult')}
              className={`flex-1 py-3 text-center font-bold tracking-tight border-b-2 flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                contextTab === 'consult'
                  ? 'border-art-rust text-art-rust bg-white font-serif italic'
                  : 'border-transparent text-art-ink/55 hover:text-art-ink hover:bg-art-cream/20'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse text-art-rust" />
              <span>AI Board Advisor</span>
            </button>
          </div>

          {/* Active Context Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            {contextTab === 'explain' ? (
              <ExplainabilityPanel 
                trace={activeTrace} 
                metricsList={computedMetrics?.metricsList}
                onSelectTrace={(trace) => setClickedTrace(trace)}
              />
            ) : (
              <AiAdvisor 
                activeBuild={activeBuild} 
                computedMetrics={computedMetrics} 
              />
            )}
          </div>

          {/* Quick Context panel helper footer */}
          <div className="p-3 bg-art-cream/50 border-t border-art-ink/10 text-[10px] text-art-ink/40 font-semibold flex items-center justify-between font-mono">
            <span>Audit Standard: ISO 26262</span>
            <span>Deterministic: 100%</span>
          </div>
        </aside>
      </div>

      {/* COMMAND PALETTE MODAL LAYER */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        builds={builds}
        activeBuildId={activeBuildId}
        onSelectBuild={setActiveBuildId}
        activePersona={activePersona}
        onChangePersona={setActivePersona}
        onNavigate={setActiveTab}
        onQuickCompare={handleQuickCompare}
      />
    </div>
  );
}

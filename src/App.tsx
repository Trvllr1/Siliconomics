/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Build, PersonaType, MetricCardData, CalculationTrace, ActivityLog, Decision, Portfolio, ReferenceModel, FormulaEntry } from './types';
import { DEFAULT_BUILDS } from './data/defaultBuilds';
import { DEFAULT_REFERENCE_MODELS } from './data/defaultReferenceModels';
import { DEFAULT_FORMULA_LIBRARY } from './data/defaultFormulaLibrary';
import { Archetype } from './data/archetypes';
import { computeBuildMetrics } from './utils/mathEngine';
import DashboardView from './components/DashboardView';
import DesignBoard from './components/DesignBoard';
import MetricsLab from './components/MetricsLab';
import ComparisonView from './components/ComparisonView';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import AiAdvisor from './components/AiAdvisor';
import DecisionCenterView from './components/DecisionCenterView';
import ReportsView from './components/ReportsView';
import PortfolioView from './components/PortfolioView';
import ArchitectureBomView from './components/ArchitectureBomView';
import ReferenceModelsView from './components/ReferenceModelsView';
import FormulaLibraryView from './components/FormulaLibraryView';
import MeetingMode from './components/MeetingMode';
import CommandPalette from './components/CommandPalette';

import {
  Monitor,
  Cpu,
  ArrowRightLeft,
  Search,
  Sparkles,
  Database,
  CheckCircle,
  FileCheck,
  FileText,
  FolderOpen,
  BookOpen,
  CircuitBoard,
  Copy,
  GitBranch,
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
  const p = prev.designModel;
  const n = next.designModel;
  
  if (p.processNode !== n.processNode) {
    changes.push(`Process Node changed from ${p.processNode} to ${n.processNode}`);
  }
  if (p.dieArea !== n.dieArea) {
    changes.push(`Die Area adjusted to ${n.dieArea} mm²`);
  }
  if (p.dieWidth !== n.dieWidth || p.dieHeight !== n.dieHeight) {
    changes.push(`Dimensions adjusted to ${n.dieWidth}x${n.dieHeight} mm`);
  }
  if (p.transistorCount !== n.transistorCount) {
    changes.push(`Transistor Count updated to ${n.transistorCount}B`);
  }
  if (p.tdp !== n.tdp) {
    changes.push(`TDP adjusted to ${n.tdp}W`);
  }
  if (p.topology !== n.topology) {
    changes.push(`Topology changed to ${n.topology}`);
  }
  if (p.chipletCount !== n.chipletCount) {
    changes.push(`Chiplet Count updated to ${n.chipletCount}`);
  }
  if (p.ioDieArea !== n.ioDieArea) {
    changes.push(`I/O Die Area set to ${n.ioDieArea} mm²`);
  }
  if (p.defectDensity !== n.defectDensity) {
    changes.push(`Defect Density adjusted to ${n.defectDensity}`);
  }
  if (p.waferStartsPerMonth !== n.waferStartsPerMonth) {
    changes.push(`Wafer Starts updated to ${n.waferStartsPerMonth}/mo`);
  }
  if (p.packagingCost !== n.packagingCost) {
    changes.push(`Packaging Cost adjusted to $${n.packagingCost}`);
  }
  if (p.testTimeSeconds !== n.testTimeSeconds) {
    changes.push(`Test Time updated to ${n.testTimeSeconds}s`);
  }
  if (p.testCostPerSecond !== n.testCostPerSecond) {
    changes.push(`Test Cost adjusted to $${n.testCostPerSecond}/s`);
  }
  if (p.packagingYield !== n.packagingYield) {
    changes.push(`Packaging Yield set to ${n.packagingYield}%`);
  }
  if (p.testYield !== n.testYield) {
    changes.push(`Test Yield adjusted to ${n.testYield}%`);
  }
  if (p.waferCost !== n.waferCost) {
    changes.push(`Wafer Cost adjusted to $${n.waferCost}`);
  }
  if (p.nreCost !== n.nreCost) {
    changes.push(`NRE Cost set to $${n.nreCost}M`);
  }
  if (p.asp !== n.asp) {
    changes.push(`ASP adjusted to $${n.asp}`);
  }
  if (p.targetVolume !== n.targetVolume) {
    changes.push(`Target Volume updated to ${n.targetVolume}M units`);
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

  const [decisions, setDecisions] = useState<Decision[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_decisions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const defaultPortfolios = (): Portfolio[] => {
    const names = [...new Set(DEFAULT_BUILDS.map(b => b.portfolio).filter(Boolean))];
    return names.map((name, i) => ({
      id: `portfolio-default-${i}`,
      name: name!,
      description: `Auto-created portfolio for ${name} builds.`,
      buildIds: DEFAULT_BUILDS.filter(b => b.portfolio === name).map(b => b.id),
      tags: [],
      createdDate: '2026-07-01',
    }));
  };

  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_portfolios');
      return saved ? JSON.parse(saved) : defaultPortfolios();
    } catch (e) {
      return defaultPortfolios();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('siliconomics_portfolios', JSON.stringify(portfolios));
    } catch (e) {}
  }, [portfolios]);

  const [referenceModels] = useState<ReferenceModel[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_reference_models');
      return saved ? JSON.parse(saved) : DEFAULT_REFERENCE_MODELS;
    } catch (e) {
      return DEFAULT_REFERENCE_MODELS;
    }
  });

  const [formulaLibrary] = useState<FormulaEntry[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_formula_library');
      return saved ? JSON.parse(saved) : DEFAULT_FORMULA_LIBRARY;
    } catch (e) {
      return DEFAULT_FORMULA_LIBRARY;
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
      localStorage.setItem('siliconomics_decisions', JSON.stringify(decisions));
    } catch (e) {}
  }, [decisions]);

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

  const [activeBuildId, setActiveBuildId] = useState<string>(DEFAULT_BUILDS[0]!.id);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard' | 'build' | 'compare' | 'decisions' | 'reports'
  const [activePersona, setActivePersona] = useState<PersonaType>('executive');

  // Detail tracing states for Explainability panel
  const [hoveredTrace, setHoveredTrace] = useState<CalculationTrace | null>(null);
  const [clickedTrace, setClickedTrace] = useState<CalculationTrace | null>(null);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Meeting mode state
  const [meetingModeOpen, setMeetingModeOpen] = useState(false);

  // Context sidebar mode: 'explain' | 'consult'
  const [contextTab, setContextTab] = useState<'explain' | 'consult'>('explain');

  const activeBuild = builds.find((b) => b.id === activeBuildId) ?? builds[0]!;
  const computedMetrics = computeBuildMetrics(activeBuild);

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

  const handleCreatePortfolio = (p: Portfolio) => {
    setPortfolios((prev) => [...prev, p]);
  };

  const handleDeletePortfolio = (id: string) => {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePortfolio = (p: Portfolio) => {
    setPortfolios((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  };

  // Keyboard shortcut listener (Ctrl+K or Cmd+K) for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        setMeetingModeOpen((prev) => !prev);
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

  const handleDuplicateScenario = (sourceBuild: Build) => {
    const dupId = `build-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const verParts = sourceBuild.version.match(/^v?(\d+)\.(\d+)$/);
    const newVersion = verParts && verParts[1] && verParts[2]
      ? `v${verParts[1]}.${parseInt(verParts[2]) + 1}`
      : `v1.1`;
    const newBuild: Build = {
      ...sourceBuild,
      id: dupId,
      name: `Copy of ${sourceBuild.name}`,
      version: newVersion,
      description: `Derived from ${sourceBuild.name} v${sourceBuild.version}`,
      parentId: sourceBuild.id,
      status: 'Draft',
    };
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      buildId: newBuild.id,
      buildName: newBuild.name,
      timestamp: new Date().toISOString(),
      type: 'commit',
      delta: `Duplicated from ${sourceBuild.name} as ${newBuild.name} v${newVersion}`,
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

  const handleRecordDecision = (decision: Decision) => {
    setDecisions((prev) => [decision, ...prev]);
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
          <button
            onClick={() => setMeetingModeOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-art-ink/10 hover:bg-art-cream text-art-ink/60 hover:text-art-ink transition-all cursor-pointer text-[10px]"
            title="Enter Meeting Mode (F11)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Present</span>
          </button>
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
                  onClick={() => setActiveTab('archbom')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'archbom'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <CircuitBoard className="w-4 h-4" />
                  <span>Architecture BOM</span>
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

                <button
                  onClick={() => setActiveTab('decisions')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'decisions'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Decision Center</span>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Reports</span>
                </button>

                <button
                  onClick={() => setActiveTab('portfolios')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'portfolios'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Portfolios</span>
                </button>

                <button
                  onClick={() => setActiveTab('refmodels')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'refmodels'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Reference Models</span>
                </button>

                <button
                  onClick={() => setActiveTab('formulas')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'formulas'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Formula Library</span>
                </button>
              </div>
            </div>

            {/* Build Quick Selector (Sidebar nested) */}
            <div className="space-y-2 border-t border-art-ink/5 pt-4">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-[0.25em] block px-2 font-mono">
                Active Scenario
              </span>
              <div className="flex items-center gap-1 px-2">
                <button
                  onClick={() => handleDuplicateScenario(activeBuild)}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-art-ink/5 hover:bg-art-ink/10 border border-art-ink/10 rounded text-[10px] font-semibold text-art-ink/70 hover:text-art-ink transition-all cursor-pointer"
                  title="One-click duplicate of active scenario"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>
                {activeBuild.parentId && builds.find(b => b.id === activeBuild.parentId) && (
                  <button
                    onClick={() => { const pid = activeBuild.parentId; if (pid) { handleQuickCompare(pid, activeBuild.id); setActiveTab('compare'); } }}
                    className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-art-ink/5 hover:bg-art-ink/10 border border-art-ink/10 rounded text-[10px] font-semibold text-art-ink/70 hover:text-art-ink transition-all cursor-pointer"
                    title="Compare with parent scenario"
                  >
                    <GitBranch className="w-3 h-3" />
                    <span>Diff Parent</span>
                  </button>
                )}
              </div>
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
                      {b.designModel.processNode} • {b.version}
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

          {/* Build Tab — Design Board + Metrics Lab split */}
          {activeTab === 'build' && (
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="lg:w-1/2 xl:w-2/5 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <DesignBoard
                  activeBuild={activeBuild}
                  onUpdateBuild={handleUpdateBuild}
                  onCommitBuild={handleCommitBuild}
                  activePersona={activePersona}
                  onAddCustomArchetype={handleAddCustomArchetype}
                  lastSaved={lastSaved}
                  onClearDraft={handleClearDraft}
                  models={referenceModels}
                />
              </div>
              <div className="lg:w-1/2 xl:w-3/5 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <MetricsLab
                  activeBuild={activeBuild}
                  computedMetrics={computedMetrics}
                  onHoverMetric={(m) => setHoveredTrace(m?.trace ?? null)}
                  onClickMetric={handleSelectMetric}
                />
              </div>
            </div>
          )}

          {/* Decision Center Tab */}
          {activeTab === 'decisions' && (
            <DecisionCenterView decisions={decisions} builds={builds} />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <ReportsView builds={builds} decisions={decisions} />
          )}

          {/* Portfolios Tab */}
          {activeTab === 'portfolios' && (
            <PortfolioView
              portfolios={portfolios}
              builds={builds}
              onCreatePortfolio={handleCreatePortfolio}
              onDeletePortfolio={handleDeletePortfolio}
              onUpdatePortfolio={handleUpdatePortfolio}
            />
          )}

          {/* Reference Models Tab */}
          {activeTab === 'refmodels' && (
            <ReferenceModelsView models={referenceModels} />
          )}

          {/* Formula Library Tab */}
          {activeTab === 'formulas' && (
            <FormulaLibraryView formulas={formulaLibrary} />
          )}

          {/* Architecture BOM Tab */}
          {activeTab === 'archbom' && (
            <ArchitectureBomView
              activeBuild={activeBuild}
              onUpdateBuild={handleUpdateBuild}
            />
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <ComparisonView
              builds={builds}
              initialBuildAId="manhattan-x1"
              initialBuildBId="manhattan-x2"
              onRecordDecision={handleRecordDecision}
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
              <span>Audit</span>
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
              <span>AI Advisor</span>
            </button>
          </div>

          {/* Active Context Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            {contextTab === 'explain' ? (
              <ExplainabilityPanel 
                trace={activeTrace} 
                metricsList={computedMetrics?.snapshot.metricsList}
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

      {/* MEETING MODE OVERLAY */}
      {meetingModeOpen && (
        <MeetingMode
          builds={builds}
          decisions={decisions}
          onClose={() => setMeetingModeOpen(false)}
        />
      )}

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

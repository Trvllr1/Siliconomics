/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Build, PersonaType, MetricCardData, CalculationTrace, ActivityLog, Decision, Portfolio, ReferenceModel, FormulaEntry, Alert, Comment, STATUS_TRANSITIONS } from './types';
import { DEFAULT_BUILDS } from './data/defaultBuilds';
import { DEFAULT_REFERENCE_MODELS } from './data/defaultReferenceModels';
import { DEFAULT_FORMULA_LIBRARY } from './data/defaultFormulaLibrary';
import { DEFAULT_ALERT_RULES } from './data/defaultAlertRules';
import { Archetype } from './data/archetypes';
import { PERSONA_CONFIG } from './data/personaConfig';
import { computeBuildMetrics, checkAlerts } from './utils/mathEngine';
import { summarizeDatasetFreshness } from './utils/dataFreshness';
import { decodeBuildFromHash, clearShareHash } from './utils/buildShare';
import { PACKAGING_MODEL_PROVENANCE } from './data/packagingCostModel';
import { useStorageAdapter } from './data/adapters/useAdapter';
import { useAuthUser } from './utils/auth';
import DashboardView from './components/DashboardView';
import DesignBoard from './components/DesignBoard';
import MetricsLab from './components/MetricsLab';
import ComparisonView from './components/ComparisonView';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import Chippie from './components/Chippie';
import DecisionCenterView from './components/DecisionCenterView';
import ReportsView from './components/ReportsView';
import PortfolioView from './components/PortfolioView';
import ArchitectureBomView from './components/ArchitectureBomView';
import ReviewBoardView from './components/ReviewBoardView';
import ReferenceModelsView from './components/ReferenceModelsView';
import FormulaLibraryView from './components/FormulaLibraryView';
import MeetingMode from './components/MeetingMode';
import CommandPalette from './components/CommandPalette';
import TrustModal from './components/TrustModal';
import { createBlankBuild } from './data/archetypes';

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
  ChevronDown,
  Wrench,
  DollarSign,
  Clock,
  Award,
  Activity,
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

/** Persist to localStorage, warning instead of silently swallowing quota/permission errors. */
function persistToStorage(key: string, serialize: () => string): boolean {
  try {
    localStorage.setItem(key, serialize());
    return true;
  } catch (err) {
    console.warn(`Siliconomics: failed to persist "${key}" — changes may be lost on reload.`, err);
    return false;
  }
}

export default function App() {
  const adapter = useStorageAdapter();
  const authUser = useAuthUser();
  const isDemoMode = authUser.id === 'demo-user';

  // Master states
  const [builds, setBuilds] = useState<Build[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_builds_v2');
      if (!saved) return DEFAULT_BUILDS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return DEFAULT_BUILDS;
      const valid = parsed.filter((b: any) => b && b.designModel);
      return valid.length > 0 ? valid : DEFAULT_BUILDS;
    } catch {
      return DEFAULT_BUILDS;
    }
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_builds_v2');
      return saved ? new Date() : null;
    } catch {
      return null;
    }
  });

  // Non-blocking banner shown when localStorage writes fail (quota exceeded, private mode, etc.)
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_activities_v2');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [customArchetypes, setCustomArchetypes] = useState<Archetype[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_custom_archetypes_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [decisions, setDecisions] = useState<Decision[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_decisions_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
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
      const saved = localStorage.getItem('siliconomics_portfolios_v2');
      return saved ? JSON.parse(saved) : defaultPortfolios();
    } catch {
      return defaultPortfolios();
    }
  });

  useEffect(() => {
    if (!persistToStorage('siliconomics_portfolios_v2', () => JSON.stringify(portfolios))) {
      setStorageWarning('Your browser blocked saving portfolios — recent changes may be lost on reload.');
    }
  }, [portfolios]);

  const [referenceModels] = useState<ReferenceModel[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_reference_models_v2');
      return saved ? JSON.parse(saved) : DEFAULT_REFERENCE_MODELS;
    } catch {
      return DEFAULT_REFERENCE_MODELS;
    }
  });

  const [customReferenceModels, setCustomReferenceModels] = useState<ReferenceModel[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_custom_reference_models_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDuplicateReferenceModel = (source: ReferenceModel) => {
    const clone: ReferenceModel = {
      ...source,
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Custom)`,
      version: `v1.0-custom`,
      createdDate: new Date().toISOString().split('T')[0]!,
      updatedDate: new Date().toISOString().split('T')[0]!,
      isCustom: true,
      sourceModelId: source.id,
    };
    setCustomReferenceModels((prev) => {
      const updated = [...prev, clone];
      persistToStorage('siliconomics_custom_reference_models_v2', () => JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateCustomReferenceModel = (updated: ReferenceModel) => {
    setCustomReferenceModels((prev) => {
      const idx = prev.findIndex((m) => m.id === updated.id);
      if (idx === -1) return prev;
      const result = [...prev];
      result[idx] = { ...updated, updatedDate: new Date().toISOString().split('T')[0]! };
      persistToStorage('siliconomics_custom_reference_models_v2', () => JSON.stringify(result));
      return result;
    });
  };

  const handleDeleteCustomReferenceModel = (id: string) => {
    setCustomReferenceModels((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      persistToStorage('siliconomics_custom_reference_models_v2', () => JSON.stringify(updated));
      return updated;
    });
  };

  const handleApplyCustomModel = (model: ReferenceModel, build: Build) => {
    const designModel = { ...build.designModel };

    // Map reference model parameters to designModel fields by category
    switch (model.category) {
      case 'foundry':
        if (typeof model.parameters.waferCost === 'number') designModel.waferCost = model.parameters.waferCost;
        if (typeof model.parameters.defectDensityPerCm2 === 'number') designModel.defectDensity = model.parameters.defectDensityPerCm2;
        break;
      case 'packaging':
        if (typeof model.parameters.baseCostPerUnit === 'number') designModel.packagingCost = model.parameters.baseCostPerUnit;
        break;
      case 'labor':
        if (typeof model.parameters.hourlyRateDesign === 'number') designModel.resolvedLaborRateDesign = model.parameters.hourlyRateDesign;
        if (typeof model.parameters.hourlyRateVerification === 'number') designModel.resolvedLaborRateVerification = model.parameters.hourlyRateVerification;
        designModel.laborReferenceModelId = model.id;
        break;
    }

    const dv = build.dataVintage;
    const updated: Build = {
      ...build,
      designModel,
      referenceModel: model.name,
      dataVintage: {
        referenceModelVersion: model.version,
        referenceModelVerified: model.updatedDate || model.createdDate,
        packagingModelVersion: (dv && dv.packagingModelVersion) || 'v1.1',
        commodityPriceDate: (dv && dv.commodityPriceDate) || '2026-01-15',
      },
    };
    handleUpdateBuild(updated);
  };

  const [formulaLibrary] = useState<FormulaEntry[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_formula_library_v2');
      return saved ? JSON.parse(saved) : DEFAULT_FORMULA_LIBRARY;
    } catch {
      return DEFAULT_FORMULA_LIBRARY;
    }
  });

  const handleAddCustomArchetype = (newArch: Archetype) => {
    setCustomArchetypes((prev) => {
      const updated = [...prev, newArch];
      if (!persistToStorage('siliconomics_custom_archetypes_v2', () => JSON.stringify(updated))) {
        setStorageWarning('Your browser blocked saving archetypes — recent changes may be lost on reload.');
      }
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
    if (!persistToStorage('siliconomics_activities_v2', () => JSON.stringify(activities))) {
      setStorageWarning('Your browser blocked saving activity history — recent changes may be lost on reload.');
    }
  }, [activities]);

  useEffect(() => {
    if (!persistToStorage('siliconomics_decisions_v2', () => JSON.stringify(decisions))) {
      setStorageWarning('Your browser blocked saving decisions — recent changes may be lost on reload.');
    }
  }, [decisions]);

  useEffect(() => {
    if (isDemoMode) {
      if (!persistToStorage('siliconomics_builds_v2', () => JSON.stringify(builds))) {
        setStorageWarning('Your browser blocked saving builds — recent changes may be lost on reload.');
        return;
      }
      if (JSON.stringify(builds) !== JSON.stringify(DEFAULT_BUILDS)) {
        setLastSaved(new Date());
      } else {
        setLastSaved(null);
      }
    } else {
      setLastSaved(new Date());
    }
  }, [builds, isDemoMode]);

  const [activeBuildId, setActiveBuildId] = useState<string>(DEFAULT_BUILDS[0]!.id);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard' | 'build' | 'compare' | 'decisions' | 'reports'
  const [activePersona, setActivePersona] = useState<PersonaType>('executive');

  // Load shared build from URL hash on mount (demo mode only)
  const [sharedBuildLoaded, setSharedBuildLoaded] = useState(false);
  useEffect(() => {
    if (sharedBuildLoaded) return;
    if (!isDemoMode) { clearShareHash(); setSharedBuildLoaded(true); return; }

    const { build, error } = decodeBuildFromHash();
    if (build) {
      const shared: Build = {
        ...build,
        id: `shared-${Date.now()}`,
        status: 'Draft',
        name: `[Shared] ${build.name}`,
        creator: 'Shared via link',
        createdDate: new Date().toISOString(),
      };
      setBuilds((prev) => {
        if (prev.some((b) => b.id === shared.id)) return prev;
        return [shared, ...prev];
      });
      setActiveBuildId(shared.id);
    }
    if (error) {
      console.warn('Siliconomics: shared build error:', error);
    }
    clearShareHash();
    setSharedBuildLoaded(true);
  }, [isDemoMode, sharedBuildLoaded]);

  // Detail tracing states for Explainability panel
  const [hoveredTrace, setHoveredTrace] = useState<CalculationTrace | null>(null);
  const [clickedTrace, setClickedTrace] = useState<CalculationTrace | null>(null);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showTrustDialog, setShowTrustDialog] = useState(false);

  // Meeting mode state
  const [meetingModeOpen, setMeetingModeOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const pc = PERSONA_CONFIG[activePersona];

  // Context sidebar mode: 'explain' | 'consult'
  const [contextTab, setContextTab] = useState<'explain' | 'consult'>('explain');

  const activeBuild = builds.find((b) => b.id === activeBuildId) ?? builds[0]!;
  let computedMetrics: ReturnType<typeof computeBuildMetrics>;
  try {
    computedMetrics = computeBuildMetrics(activeBuild);
  } catch {
    computedMetrics = computeBuildMetrics(DEFAULT_BUILDS[0]!);
  }

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_alerts_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const freshAlerts = checkAlerts(activeBuild, computedMetrics.snapshot, DEFAULT_ALERT_RULES);
    setAlerts((prev) => {
      const merged = [...freshAlerts];
      for (const a of prev) {
        if (!freshAlerts.some(f => f.ruleId === a.ruleId && f.buildId === a.buildId)) {
          merged.push(a);
        }
      }
      return merged;
    });
  }, [activeBuild.id, computedMetrics.snapshot.fullyLoadedCostPerDie]);

  useEffect(() => {
    localStorage.setItem('siliconomics_alerts_v2', JSON.stringify(alerts));
  }, [alerts]);

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      const saved = localStorage.getItem('siliconomics_comments_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('siliconomics_comments_v2', JSON.stringify(comments));
  }, [comments]);

  const [commentTarget, setCommentTarget] = useState<{ elementId: string; label: string } | null>(null);

  const handleAddComment = (buildId: string, elementId: string, content: string) => {
    const newComment: Comment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      buildId,
      elementId,
      author: 'eagleximpact',
      role: activePersona,
      content,
      timestamp: new Date().toISOString(),
      versionStamp: activeBuild.version,
    };
    setComments((prev) => [...prev, newComment]);
  };

  const handleStatusTransition = async () => {
    const transition = STATUS_TRANSITIONS[activeBuild.status];
    if (!transition) return;
    if (transition.requiredPersona !== activePersona) return;

    if (!isDemoMode) {
      try {
        const updated = await adapter.transitionStatus(activeBuild.id);
        setBuilds((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      } catch (err: any) {
        setStorageWarning(`Status transition failed: ${err.message}`);
        return;
      }
    } else {
      const updated: Build = { ...activeBuild, status: transition.next };
      handleUpdateBuild(updated);
    }

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      buildId: activeBuild.id,
      buildName: activeBuild.name,
      timestamp: new Date().toISOString(),
      type: 'modification',
      delta: `Status changed: ${activeBuild.status} → ${transition.next} by ${PERSONA_CONFIG[activePersona].label}`,
    };
    setActivities((act) => [newLog, ...act]);
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem('siliconomics_builds_v2');
    } catch (err) {
      console.warn('Siliconomics: failed to clear saved builds from localStorage.', err);
    }
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

  // Persona auto-navigation
  useEffect(() => {
    const targetTab = pc.defaultTab;
    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }
  }, [activePersona]);

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

  const handleCommitBuild = async (newBuild: Build) => {
    const buildWithVintage = newBuild.dataVintage ? newBuild : {
      ...newBuild,
      creator: newBuild.creator || authUser.name,
      dataVintage: {
        referenceModelVersion: referenceModels.reduce((latest, m) => m.updatedDate > latest.updatedDate ? m : latest).version,
        referenceModelVerified: referenceModels.reduce((latest, m) => m.updatedDate > latest.updatedDate ? m : latest).provenance.lastVerified,
        packagingModelVersion: 'v1.1',
        commodityPriceDate: '2026-01-15',
      },
    };

    if (!isDemoMode) {
      try {
        const created = await adapter.createBuild(buildWithVintage);
        setBuilds((prev) => [...prev, created]);
        setActiveBuildId(created.id);
        return;
      } catch (err: any) {
        setStorageWarning(`Failed to save build: ${err.message}`);
        return;
      }
    }

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      buildId: buildWithVintage.id,
      buildName: buildWithVintage.name,
      timestamp: new Date().toISOString(),
      type: 'commit',
      delta: `Committed new build version ${buildWithVintage.version}`,
    };
    setActivities((act) => [newLog, ...act]);
    setBuilds((prev) => [...prev, buildWithVintage]);
    setActiveBuildId(buildWithVintage.id);
  };

  const handleDuplicateScenario = async (sourceBuild: Build) => {
    if (!isDemoMode) {
      try {
        const newBuild = await adapter.newVersion(sourceBuild.id, `Copy of ${sourceBuild.name}`, {
          dataVintage: sourceBuild.dataVintage ?? {
            referenceModelVersion: referenceModels.reduce((latest, m) => m.updatedDate > latest.updatedDate ? m : latest).version,
            referenceModelVerified: referenceModels.reduce((latest, m) => m.updatedDate > latest.updatedDate ? m : latest).provenance.lastVerified,
            packagingModelVersion: 'v1.1',
            commodityPriceDate: '2026-01-15',
          },
        });
        setBuilds((prev) => [...prev, newBuild]);
        setActiveBuildId(newBuild.id);
        return;
      } catch (err: any) {
        setStorageWarning(`Failed to create new version: ${err.message}`);
        return;
      }
    }

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
      dataVintage: sourceBuild.dataVintage ?? {
        referenceModelVersion: referenceModels.reduce((latest, m) => m.updatedDate > latest.updatedDate ? m : latest).version,
        referenceModelVerified: referenceModels.reduce((latest, m) => m.updatedDate > latest.updatedDate ? m : latest).provenance.lastVerified,
        packagingModelVersion: 'v1.1',
        commodityPriceDate: '2026-01-15',
      },
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

  // First-class "New Build" path (⌘K): blank Draft from neutral defaults,
  // straight into the Build Workspace. handleCommitBuild stamps the vintage
  // and selects it.
  const handleNewBuild = (name?: string) => {
    const finalName = name?.trim() || `Untitled Build ${builds.filter((b) => b.name.startsWith('Untitled Build')).length + 1}`;
    handleCommitBuild(createBlankBuild(finalName, authUser.name));
    setActiveTab('build');
  };

  // Chippie proposal → new Draft branch of the active build (never mutates it).
  const handleApplyChippieProposal = (proposal: { field: string; proposedValue: number; rationale: string }) => {
    if (!activeBuild) return;
    const verParts = activeBuild.version.match(/^v?(\d+)\.(\d+)$/);
    const newVersion = verParts && verParts[1] && verParts[2]
      ? `v${verParts[1]}.${parseInt(verParts[2]) + 1}`
      : 'v1.1';
    const branch: Build = {
      ...activeBuild,
      designModel: { ...activeBuild.designModel, [proposal.field]: proposal.proposedValue },
      id: `build-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: `${activeBuild.name} — Chippie proposal`,
      version: newVersion,
      description: `Branched from ${activeBuild.name} ${activeBuild.version} via Chippie proposal: ${proposal.field} → ${proposal.proposedValue}. Rationale: ${proposal.rationale}`,
      parentId: activeBuild.id,
      status: 'Draft',
    };
    void handleCommitBuild(branch);
  };

  const activeTrace = hoveredTrace || clickedTrace;

  const freshnessSummary = summarizeDatasetFreshness(
    referenceModels,
    formulaLibrary,
    [], // commodity prices — loaded but not wired into engine; provenance tracked for audit
    PACKAGING_MODEL_PROVENANCE.lastVerified,
  );
  const [freshnessBannerDismissed, setFreshnessBannerDismissed] = useState(false);
  const showFreshnessBanner = freshnessSummary.overallLevel !== 'fresh' && !freshnessBannerDismissed;

  const handleQuickCompare = (_idA: string, _idB: string) => {
    setActiveTab('compare');
  };

  const handleNavigateCompare = (idA: string, idB: string) => {
    setActiveBuildId(idA);
    setTimeout(() => {
      setActiveBuildId(idB);
      setActiveTab('compare');
    }, 0);
  };

  const handleRecordDecision = async (decision: Decision) => {
    if (!isDemoMode) {
      try {
        const created = await adapter.recordDecision({
          buildIds: decision.buildIds,
          outcome: decision.outcome,
          approver: decision.approver,
          rationale: decision.rationale,
          followUpActions: decision.followUpActions,
        });
        setDecisions((prev) => [created, ...prev]);
        return;
      } catch (err: any) {
        setStorageWarning(`Failed to record decision: ${err.message}`);
        return;
      }
    }
    setDecisions((prev) => [decision, ...prev]);
  };

  return (
    <div className="min-h-screen bg-art-cream flex flex-col font-sans text-art-ink antialiased overflow-x-hidden">

      {storageWarning && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-[11px] px-4 py-1.5 flex items-center justify-between flex-shrink-0">
          <span>{storageWarning}</span>
          <button
            onClick={() => setStorageWarning(null)}
            className="font-bold ml-4 cursor-pointer hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {showFreshnessBanner && (
        <div className={`border-b text-[11px] px-4 py-1.5 flex items-center justify-between flex-shrink-0 ${
          freshnessSummary.overallLevel === 'stale' ? 'bg-red-100 border-red-300 text-red-900' : 'bg-amber-100 border-amber-300 text-amber-900'
        }`}>
          <span>
            {freshnessSummary.overallLevel === 'stale' ? '⚠' : '⚡'} Reference data freshness: {freshnessSummary.referenceModels.stale + freshnessSummary.referenceModels.aging} of {freshnessSummary.referenceModels.total} reference models, {freshnessSummary.formulas.stale + freshnessSummary.formulas.aging} of {freshnessSummary.formulas.total} formulas require review.
          </span>
          <button
            onClick={() => setFreshnessBannerDismissed(true)}
            className="font-bold ml-4 cursor-pointer hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

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

        {/* Persona badge + dropdown */}
        <div className="relative" onMouseLeave={() => setPersonaDropdownOpen(false)}>
          <button
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-art-ink/10 hover:bg-art-cream transition-all cursor-pointer text-[10px] font-mono"
            style={{ color: pc.color }}
          >
            <Cpu className="w-3.5 h-3.5" style={{ color: pc.color }} />
            <span className="font-bold whitespace-nowrap">{pc.label}</span>
            <ChevronDown className="w-3 h-3" />
            {pc.designFields.length > 0 && comments.filter(c =>
              c.buildId === activeBuild.id && pc.designFields.includes(c.elementId ?? '')
            ).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[7px] font-bold flex items-center justify-center">
                {comments.filter(c => c.buildId === activeBuild.id && pc.designFields.includes(c.elementId ?? '')).length}
              </span>
            )}
          </button>

          {personaDropdownOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-72 bg-white border border-art-ink/10 rounded-xl shadow-lg z-[100] py-1 space-y-0.5 overflow-visible">
              {([['architect', <Cpu className="w-3.5 h-3.5" />],
                ['manufacturing', <Wrench className="w-3.5 h-3.5" />],
                ['finance', <DollarSign className="w-3.5 h-3.5" />],
                ['program', <Clock className="w-3.5 h-3.5" />],
                ['executive', <Award className="w-3.5 h-3.5" />]] as const).map(([key, icon]) => {
                const cfg = PERSONA_CONFIG[key];
                return (
                  <button
                    key={key}
                    onMouseDown={() => { setActivePersona(key); setPersonaDropdownOpen(false); }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-xs transition-all cursor-pointer ${
                      key === activePersona
                        ? 'bg-art-cream font-bold'
                        : 'hover:bg-art-cream/50 text-art-ink/70'
                    }`}
                    style={key === activePersona ? { color: cfg.color, borderLeft: `3px solid ${cfg.color}` } : {}}
                  >
                    {icon}
                    <span className="whitespace-nowrap">{cfg.label}</span>
                    {key === activePersona && <span className="ml-auto text-[8px] font-mono opacity-50 whitespace-nowrap">Active</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
                  onClick={() => setActiveTab('review')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    activeTab === 'review'
                      ? 'bg-art-cream text-art-rust border-l-2 border-art-rust pl-2'
                      : 'text-art-ink/70 hover:text-art-ink hover:bg-art-cream/30'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Review Board</span>
                  {(() => {
                    const c = comments.filter(cm => cm.buildId === activeBuild.id && !cm.content.startsWith('system:'));
                    return c.length > 0 ? (
                      <span className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-art-rust text-white text-[8px] font-bold font-mono">{c.length}</span>
                    ) : null;
                  })()}
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
                  {alerts.filter(a => !a.acknowledged).length > 0 && (
                    <span className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold font-mono">
                      {alerts.filter(a => !a.acknowledged).length}
                    </span>
                  )}
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
            <button onClick={() => setShowTrustDialog(true)}
              className="w-full text-[9px] font-mono text-art-ink/30 hover:text-art-rust transition-all cursor-pointer text-center py-1">
              Trust & Data Handling
            </button>
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
                    onStatusTransition={handleStatusTransition}
                    isDemoMode={isDemoMode}
                  />
              </div>
              <div className="lg:w-1/2 xl:w-3/5 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <MetricsLab
                  activeBuild={activeBuild}
                  computedMetrics={computedMetrics}
                  onHoverMetric={(m) => setHoveredTrace(m?.trace ?? null)}
                  onClickMetric={handleSelectMetric}
                  activePersona={activePersona}
                  comments={comments}
                  onCommentMetric={(metricId, label) => setCommentTarget({ elementId: metricId, label })}
                  commentTarget={commentTarget}
                  onAddComment={handleAddComment}
                  onCloseComments={() => setCommentTarget(null)}
                />
              </div>
            </div>
          )}

          {/* Decision Center Tab */}
          {activeTab === 'decisions' && (
            <DecisionCenterView
              decisions={decisions}
              builds={builds}
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onHoverMetric={setHoveredTrace}
              onClickMetric={handleSelectMetric}
              onNavigate={setActiveTab}
            />
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
            <ReferenceModelsView
              models={referenceModels}
              customModels={customReferenceModels}
              onDuplicateModel={handleDuplicateReferenceModel}
              onUpdateCustomModel={handleUpdateCustomReferenceModel}
              onDeleteCustomModel={handleDeleteCustomReferenceModel}
              onApplyModel={handleApplyCustomModel}
              activeBuild={activeBuild}
            />
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
              activePersona={activePersona}
            />
          )}

          {/* Review Board Tab */}
          {activeTab === 'review' && (
            <ReviewBoardView
              activeBuild={activeBuild}
              comments={comments}
              activePersona={activePersona}
              onStatusTransition={handleStatusTransition}
              onNavigateCompare={handleNavigateCompare}
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
              <span>Chippie</span>
            </button>
          </div>

          {/* Active Context Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            {contextTab === 'explain' ? (
              <ExplainabilityPanel 
                trace={activeTrace} 
                metricsList={computedMetrics?.snapshot.metricsList}
                onSelectTrace={(trace) => setClickedTrace(trace)}
                provenance={activeTrace ? referenceModels.find(m => m.name === activeTrace.referenceModel || m.id === activeTrace.referenceModel)?.provenance : undefined}
                dataVintage={activeBuild.dataVintage}
              />
            ) : (
              <Chippie 
                activeBuild={activeBuild} 
                computedMetrics={computedMetrics} 
                activePersona={activePersona}
                builds={builds}
                decisions={decisions}
                onNavigate={setActiveTab}
                onApplyProposal={handleApplyChippieProposal}
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
          activeBuildId={activeBuildId}
          onRecordDecision={handleRecordDecision}
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
        onOpenTrust={() => { setCommandPaletteOpen(false); setShowTrustDialog(true); }}
        onNewBuild={handleNewBuild}
      />
      <TrustModal isOpen={showTrustDialog} onClose={() => setShowTrustDialog(false)} />
    </div>
  );
}

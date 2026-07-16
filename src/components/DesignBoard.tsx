import React, { useState, useMemo } from 'react';
import { Build, PersonaType, ReferenceModel, BuildStatus, STATUS_TRANSITIONS } from '../types';
import { Archetype } from '../data/archetypes';
import { DEFAULT_BUILDS } from '../data/defaultBuilds';
import { round } from '../utils/mathEngine';
import { PERSONA_CONFIG, FIELD_OWNER } from '../data/personaConfig';
import {
  Cpu, Activity, DollarSign, Briefcase, Sliders, GitBranch, FileCheck, RotateCcw,
  ChevronUp, ChevronDown, CheckCircle, BookOpen, Save, Shuffle, AlertCircle, ShieldCheck, MessageSquare, Wrench
} from 'lucide-react';

interface DesignBoardProps {
  activeBuild: Build;
  onUpdateBuild: (updated: Build) => void;
  onCommitBuild: (newBuild: Build) => void;
  activePersona: PersonaType;
  onAddCustomArchetype?: (a: Archetype) => void;
  lastSaved?: Date | null;
  onClearDraft?: () => void;
  models?: ReferenceModel[];
  onStatusTransition?: () => void;
}

export default function DesignBoard({
  activeBuild,
  onUpdateBuild,
  onCommitBuild,
  activePersona,
  onAddCustomArchetype,
  lastSaved,
  onClearDraft,
  models,
  onStatusTransition,
}: DesignBoardProps) {
  const dm = activeBuild.designModel;
  const canEditField = (field: string) => {
    const owner = FIELD_OWNER[field];
    if (!owner) return activePersona === 'architect';
    return activePersona === owner;
  };

  const [expanded, setExpanded] = useState({ engineering: true, manufacturing: false, financial: false, program: false });
  const toggleSection = (s: keyof typeof expanded) => setExpanded((p) => ({ ...p, [s]: !p[s] }));

  const handleInputChange = (field: string, value: string | number) => {
    if (!canEditField(field)) return;
    onUpdateBuild({ ...activeBuild, designModel: { ...dm, [field]: value } });
  };

  const handleMpwToggle = () => {
    if (!canEditField('mpw')) return;
    const enabled = !dm.mpw?.enabled;
    onUpdateBuild({
      ...activeBuild,
      designModel: {
        ...dm,
        mpw: enabled
          ? { enabled: true, participants: 6, shuttleCostPerSlot: 150000, diesPerSlot: 200, shuttlesPerYear: 4, reticleSlotArea: 100 }
          : { enabled: false, participants: 6, shuttleCostPerSlot: 150000, diesPerSlot: 200, shuttlesPerYear: 4, reticleSlotArea: 100 },
      },
    });
  };

  const handleMpwChange = (field: string, value: number) => {
    const mpw = dm.mpw ?? { enabled: true, participants: 6, shuttleCostPerSlot: 150000, diesPerSlot: 200, shuttlesPerYear: 4, reticleSlotArea: 100 };
    onUpdateBuild({ ...activeBuild, designModel: { ...dm, mpw: { ...mpw, [field]: value } } });
  };

  const laborModels = useMemo(() => (models ?? []).filter(m => m.category === 'labor'), [models]);

  const handleLaborRegionChange = (modelId: string) => {
    if (!canEditField('laborReferenceModelId')) return;
    const model = laborModels.find(m => m.id === modelId);
    const rate = typeof model?.parameters?.hourlyRateDesign === 'number' ? model.parameters.hourlyRateDesign : 185;
    onUpdateBuild({
      ...activeBuild,
      designModel: {
        ...dm,
        laborReferenceModelId: modelId,
        resolvedLaborRateDesign: rate,
        designEffortPersonMonths: dm.designEffortPersonMonths ?? 48,
      },
    });
  };

  const handleLaborEffortChange = (months: number) => {
    if (!canEditField('designEffortPersonMonths')) return;
    onUpdateBuild({
      ...activeBuild,
      designModel: {
        ...dm,
        designEffortPersonMonths: months,
        laborReferenceModelId: dm.laborReferenceModelId ?? 'ref-labor-northamerica',
        resolvedLaborRateDesign: dm.resolvedLaborRateDesign ?? 185,
      },
    });
  };

  const archBlocks = activeBuild.architecture?.blocks ?? [];
  const totalBlockVerifPm = archBlocks.reduce((s, b) => s + (b.verificationEffortPersonMonths ?? 0), 0);

  const handleVerifRegionChange = (modelId: string) => {
    if (!canEditField('verificationReferenceModelId')) return;
    const model = laborModels.find(m => m.id === modelId);
    const rate = typeof model?.parameters?.hourlyRateVerification === 'number' ? model.parameters.hourlyRateVerification : 145;
    onUpdateBuild({
      ...activeBuild,
      designModel: {
        ...dm,
        verificationReferenceModelId: modelId,
        resolvedLaborRateVerification: rate,
      },
    });
  };

  const [resetConfirm, setResetConfirm] = useState(false);
  const [isBranching, setIsBranching] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchDesc, setBranchDesc] = useState('');
  const [branchVersion, setBranchVersion] = useState('');
  const [branchCreator, setBranchCreator] = useState('eagleximpact');
  const [branchOrg, setBranchOrg] = useState('Siliconomics Manhattan Corp');

  const handleResetToBaseline = () => {
    if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 3000); return; }
    setResetConfirm(false);
    const baseline = DEFAULT_BUILDS.find(b => b.id === activeBuild.id) ??
      DEFAULT_BUILDS.find(b => b.id === activeBuild.parentId) ??
      DEFAULT_BUILDS.find(b => b.referenceModel === activeBuild.referenceModel) ??
      DEFAULT_BUILDS[0]!;
    onUpdateBuild({ ...activeBuild, designModel: { ...baseline.designModel } });
  };

  const handleCommitBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBuild: Build = {
      ...activeBuild,
      id: `build-${Date.now()}`,
      name: branchName || `${activeBuild.name} Variant`,
      description: branchDesc || activeBuild.description,
      version: branchVersion || activeBuild.version,
      parentId: activeBuild.id,
      status: 'Draft',
    };
    onCommitBuild(newBuild);
    setIsBranching(false);
    setBranchName('');
    setBranchDesc('');
    setBranchVersion('');
  };

  const isDirty = JSON.stringify(activeBuild) !== JSON.stringify(DEFAULT_BUILDS.find(b => b.id === activeBuild.id) ?? activeBuild);

  const inputField = (
    label: string,
    field: string,
    value: number | string,
    min: number,
    max: number,
    step: number,
    fmt?: (v: number) => string,
    customHandler?: (field: string, value: number) => void,
  ) => {
    const editable = canEditField(field);
    return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <label className="font-bold text-art-ink/50 uppercase font-mono">{label}</label>
        <span className="font-mono text-art-ink font-bold">{fmt ? fmt(Number(value)) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={!editable}
        onChange={(e) => customHandler ? customHandler(field, Number(e.target.value)) : handleInputChange(field, Number(e.target.value))}
        className={`w-full accent-art-rust ${!editable ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
    );
  };

  const selectField = (label: string, field: string, value: string, options: { v: string; l: string }[]) => {
    const editable = canEditField(field);
    return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">{label}</label>
      <select
        value={value}
        disabled={!editable}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={`w-full bg-white border border-art-ink/10 text-xs rounded px-2 py-1.5 outline-none font-semibold cursor-pointer ${!editable ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
    );
  };

  const toggleField = (label: string, field: string, value: string, optA: string, optB: string) => {
    const editable = canEditField(field);
    return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">{label}</label>
      <div className="flex bg-white rounded border border-art-ink/10 p-0.5">
        <button
          onClick={() => editable && handleInputChange(field, optA)}
          className={`flex-1 text-[10px] py-1 rounded font-serif italic font-bold uppercase ${value === optA ? 'bg-art-ink text-art-cream' : 'text-art-ink/50 hover:bg-art-cream/30'} ${!editable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {optA}
        </button>
        <button
          onClick={() => editable && handleInputChange(field, optB)}
          className={`flex-1 text-[10px] py-1 rounded font-serif italic font-bold uppercase ${value === optB ? 'bg-art-ink text-art-cream' : 'text-art-ink/50 hover:bg-art-cream/30'} ${!editable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {optB}
        </button>
      </div>
    </div>
    );
  };

  const knobSection = (
    title: string,
    icon: React.ReactNode,
    sectionKey: keyof typeof expanded,
    children: React.ReactNode,
  ) => (
    <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 bg-art-cream/30 hover:bg-art-cream/60 transition-colors flex items-center justify-between border-b border-art-ink/10"
      >
        <div className="flex items-center space-x-2 text-art-ink">
          {icon}
          <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono">{title}</span>
        </div>
        {expanded[sectionKey] ? <ChevronUp className="w-4 h-4 text-art-ink/50" /> : <ChevronDown className="w-4 h-4 text-art-ink/50" />}
      </button>
      {expanded[sectionKey] && (
        <div className="p-5 bg-white">
          <div className="bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
            <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
              <Sliders className="w-4 h-4 text-art-rust" />
              <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Design Knobs</span>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );

  const editableLabels: Record<string, string> = {
    architect: 'Silicon Engineering',
    manufacturing: 'Manufacturing & Yield',
    finance: 'Financial',
    program: 'Program Scheduling',
  };

  return (
    <div className="space-y-4">
      {/* Persona-aware banner */}
      {activePersona !== 'architect' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-2.5 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-[10px] font-bold text-blue-700 font-mono">
            {PERSONA_CONFIG[activePersona].designFields.length > 0
              ? `Editing: ${editableLabels[activePersona] || activePersona} fields. Contact Architect for design changes.`
              : 'Read-only view. No editable fields for this role. Contact Architect for design changes.'}
          </span>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 text-xs">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-serif font-black text-art-ink">{activeBuild.name}</h2>
              <span className={`text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase font-mono ${
                activeBuild.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                activeBuild.status === 'Alert' ? 'bg-red-100 text-red-700 border border-red-200' :
                activeBuild.status === 'Draft' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {activeBuild.status}
              </span>
              {isDirty && (
                <span className="text-[9px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  Modified
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 text-[10px] text-art-ink/50 font-mono mt-1">
              <span>{activeBuild.designModel.processNode}</span>
              <span>v{activeBuild.version}</span>
              <span>{activeBuild.owner}</span>
              <span>{activeBuild.portfolio}</span>
              {lastSaved && <span className="flex items-center space-x-1 text-green-600"><CheckCircle className="w-3 h-3" /><span>Saved {lastSaved.toLocaleTimeString()}</span></span>}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end md:self-center">
          {/* Status transition button */}
          {(() => {
            const transition = STATUS_TRANSITIONS[activeBuild.status];
            if (!transition) return null;
            const canAct = activePersona === transition.requiredPersona;
            return (
              <button
                onClick={onStatusTransition}
                disabled={!canAct || !onStatusTransition}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer shadow-sm border-none ${
                  canAct
                    ? 'bg-art-ink text-art-cream hover:bg-art-rust'
                    : 'bg-art-cream text-art-ink/30 cursor-not-allowed'
                }`}
                title={canAct ? transition.label : `Requires ${transition.requiredPersona} role`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{transition.label}</span>
              </button>
            );
          })()}

          <button
            onClick={handleResetToBaseline}
            className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              resetConfirm ? 'bg-art-rust/20 text-art-rust border-art-rust/40 animate-pulse' : 'bg-white hover:bg-art-rust/10 text-art-ink hover:text-art-rust border-art-ink/15'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetConfirm ? 'animate-spin' : ''}`} />
            <span>{resetConfirm ? 'Confirm Reset?' : 'Reset to Baseline'}</span>
          </button>
          <button
            onClick={() => setIsBranching(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-ink/90 text-art-cream rounded-lg text-xs font-serif italic font-bold transition-all cursor-pointer shadow-sm border-none"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Branch Variant</span>
          </button>
        </div>
      </div>

      {/* Branch dialog */}
      {isBranching && (
        <form onSubmit={handleCommitBranchSubmit} className="bg-white border-2 border-art-rust/30 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-art-ink/10 pb-3">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-art-rust" />
              <div>
                <h3 className="text-sm font-serif font-black text-art-ink">Commit as New Immutable Build</h3>
                <p className="text-[10px] text-art-ink/50 font-mono uppercase tracking-wider">Parent: {activeBuild.name} ({activeBuild.version})</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsBranching(false)} className="text-xs text-art-ink/40 hover:text-art-ink font-bold cursor-pointer">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Build Name</label>
              <input type="text" required value={branchName} onChange={(e) => setBranchName(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust" placeholder="e.g. Manhattan-X1 (Lower SRAM Core)" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Version</label>
              <input type="text" required value={branchVersion} onChange={(e) => setBranchVersion(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust font-mono" placeholder="e.g. v2.5" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Description</label>
              <textarea required value={branchDesc} onChange={(e) => setBranchDesc(e.target.value)} rows={2}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust"
                placeholder="Explain the engineering intent..." />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="flex items-center space-x-1.5 px-4 py-2 bg-art-ink hover:bg-art-ink/90 text-art-cream rounded-lg font-serif italic font-bold text-xs shadow-md transition-all cursor-pointer">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Seal & Commit Build</span>
            </button>
          </div>
        </form>
      )}

      {/* Knob sections */}
      <div className="space-y-4">
        {knobSection('Silicon Architecture & Engineering', <Cpu className="w-4.5 h-4.5 text-art-rust" />, 'engineering',
          <>
            {selectField('Foundry', 'foundry', dm.foundry, [
              { v: 'tsmc', l: 'TSMC' }, { v: 'intel', l: 'Intel Foundry' }, { v: 'samsung', l: 'Samsung Foundry' },
            ])}
            {selectField('Process Node', 'processNode', dm.processNode, [
              { v: '3nm', l: 'TSMC N3E (3nm)' }, { v: '5nm', l: 'TSMC N5/N4 (5nm)' },
              { v: '7nm', l: 'TSMC N7 Mature (7nm)' }, { v: '10nm', l: 'Foundry Mature (10nm)' },
            ])}
            {toggleField('Silicon Topology', 'topology', dm.topology, 'monolithic', 'chiplet')}
            {dm.topology === 'chiplet' ? (
              <>
                {inputField('Core Chiplet Area', 'dieArea', dm.dieArea, 50, 350, 5, (v) => `${v} mm²`)}
                {selectField('Core Chiplet Count', 'chipletCount', String(dm.chipletCount), [
                  { v: '2', l: '2 Chiplets' }, { v: '4', l: '4 Chiplets' }, { v: '8', l: '8 Chiplets' },
                ])}
                {inputField('I/O Die Area', 'ioDieArea', dm.ioDieArea, 50, 300, 5, (v) => `${v} mm²`)}
              </>
            ) : (
              inputField('Die Footprint (Area)', 'dieArea', dm.dieArea, 50, 800, 10, (v) => `${v} mm²`)
            )}
            {inputField('Transistor Count', 'transistorCount', dm.transistorCount, 1, 150, 0.5, (v) => `${v} B`)}
            {inputField('Thermal Limit (TDP)', 'tdp', dm.tdp, 1, 450, 5, (v) => `${v} Watts`)}
            {selectField('Packaging Type', 'packagingType', dm.packagingType, [
              { v: 'standard', l: 'Standard Organic Substrate' },
              { v: 'cowos-s', l: 'CoWoS-S (Silicon Interposer)' },
              { v: 'cowos-r', l: 'CoWoS-R (RDL Interposer)' },
              { v: 'cowos-l', l: 'CoWoS-L (Local SI + RDL)' },
              { v: 'emib', l: 'Intel EMIB' },
            ])}
            {(dm.packagingType === 'cowos-s' || dm.packagingType === 'cowos-r' || dm.packagingType === 'cowos-l') && (
              inputField('Interposer Area', 'interposerArea', dm.interposerArea ?? dm.dieArea * 1.2, 100, 3000, 10, (v) => `${v} mm²`)
            )}
          </>
        )}

        {knobSection('Manufacturing, Packaging & Test', <Wrench className="w-4.5 h-4.5 text-art-rust" />, 'manufacturing',
          <>
            {inputField('Defect Density (D0)', 'defectDensity', dm.defectDensity, 0.02, 0.30, 0.01, (v) => `${v} /cm²`)}
            {inputField('Wafer Starts/Month', 'waferStartsPerMonth', dm.waferStartsPerMonth, 1000, 50000, 1000, (v) => v.toLocaleString())}
            {inputField('OSAT Packaging Yield', 'packagingYield', dm.packagingYield, 90, 100, 0.1, (v) => `${v}%`)}
            {inputField('Electrical Test Yield', 'testYield', dm.testYield, 90, 100, 0.1, (v) => `${v}%`)}
            {inputField('Silicon Wafer Cost', 'waferCost', dm.waferCost, 1000, 25000, 500, (v) => `$${v.toLocaleString()}`)}
            {inputField('Base Assembly Cost', 'packagingCost', dm.packagingCost, 0.5, 100, 0.5, (v) => `$${v.toFixed(2)}`)}
            {inputField('Test Insertion Time', 'testTimeSeconds', dm.testTimeSeconds, 5, 150, 1, (v) => `${v}s`)}
            {inputField('Test Cost / Second', 'testCostPerSecond', dm.testCostPerSecond, 0.01, 1, 0.01, (v) => `$${v.toFixed(2)}`)}
          </>
        )}

        {knobSection('Financial & Capital Architecture', <DollarSign className="w-4.5 h-4.5 text-art-rust" />, 'financial',
          <>
            {inputField('NRE Capital Investment', 'nreCost', dm.nreCost, 5, 500, 5, (v) => `$${v}M`)}
            {inputField('Average Selling Price', 'asp', dm.asp, 5, 2000, 5, (v) => `$${v.toLocaleString()}`)}
            {inputField('Target Lifetime Volume', 'targetVolume', dm.targetVolume, 0.5, 100, 0.5, (v) => `${v} M`)}
          </>
        )}

        {/* Program Schedule & Staffing (formerly Engineering Labor) */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-art-cream/30 border-b border-art-ink/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono text-art-ink">Program Schedule & Staffing</span>
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
              <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                <Sliders className="w-4 h-4 text-art-rust" />
                <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Labor & Staffing</span>
              </div>
              {/* Labor region dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">Labor Region</label>
                <select
                  value={dm.laborReferenceModelId ?? 'ref-labor-northamerica'}
                  onChange={(e) => handleLaborRegionChange(e.target.value)}
                  className="w-full bg-white border border-art-ink/10 text-xs rounded px-2 py-1.5 outline-none font-semibold cursor-pointer"
                >
                  {laborModels.map((m) => {
                    const rate = typeof m.parameters.hourlyRateDesign === 'number' ? m.parameters.hourlyRateDesign : 0;
                    return <option key={m.id} value={m.id}>{m.name} — ${rate}/hr</option>;
                  })}
                </select>
              </div>
              {/* Design effort slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <label className="font-bold text-art-ink/50 uppercase font-mono">Design Effort</label>
                  <span className="font-mono text-art-ink font-bold">{dm.designEffortPersonMonths ?? 48} person-months</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={360}
                  step={3}
                  value={dm.designEffortPersonMonths ?? 48}
                  onChange={(e) => handleLaborEffortChange(Number(e.target.value))}
                  className="w-full accent-art-rust"
                />
              </div>
              {(dm.designEffortPersonMonths ?? 0) > 0 && dm.resolvedLaborRateDesign ? (
                <div className="bg-white border border-art-ink/10 rounded-lg p-3 text-[10px] font-mono mt-2">
                  <div className="flex justify-between items-center text-art-ink/60">
                    <span>Labor Rate (Design)</span>
                    <span className="text-art-ink font-bold">${dm.resolvedLaborRateDesign}/hr</span>
                  </div>
                  <div className="flex justify-between items-center text-art-ink/60 mt-1">
                    <span>Monthly Burn Rate</span>
                    <span className="text-art-ink font-bold">${(dm.resolvedLaborRateDesign * 160).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between items-center text-art-ink/60 mt-1 border-t border-art-ink/5 pt-1">
                    <span>Total Labor NRE</span>
                    <span className="text-art-rust font-bold">${round((dm.resolvedLaborRateDesign * 160 * (dm.designEffortPersonMonths ?? 0)) / 1_000_000, 1)}M</span>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[10px] text-yellow-700 font-mono font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span>Effort set to zero — labor NRE contribution will be $0.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Resources (formerly Verification Labor) */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-art-cream/30 border-b border-art-ink/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono text-art-ink">Verification Resources</span>
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
              <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                <Sliders className="w-4 h-4 text-art-rust" />
                <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Verification Staffing</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-art-ink/50 uppercase font-mono tracking-wide">Verification Labor Region</label>
                <select
                  value={dm.verificationReferenceModelId ?? 'ref-labor-northamerica'}
                  onChange={(e) => handleVerifRegionChange(e.target.value)}
                  className="w-full bg-white border border-art-ink/10 text-xs rounded px-2 py-1.5 outline-none font-semibold cursor-pointer"
                >
                  {laborModels.map((m) => {
                    const rate = typeof m.parameters.hourlyRateVerification === 'number' ? m.parameters.hourlyRateVerification : 0;
                    return <option key={m.id} value={m.id}>{m.name} — ${rate}/hr</option>;
                  })}
                </select>
              </div>
              <div className="bg-white border border-art-ink/10 rounded-lg p-3 text-[10px] font-mono mt-2">
                <div className="flex justify-between items-center text-art-ink/60">
                  <span>Verification Rate</span>
                  <span className="text-art-ink font-bold">${(dm.resolvedLaborRateVerification ?? 145)}/hr</span>
                </div>
                <div className="flex justify-between items-center text-art-ink/60 mt-1">
                  <span>Block Verification Effort</span>
                  <span className="text-art-ink font-bold">{totalBlockVerifPm} person-months</span>
                </div>
                <div className="flex justify-between items-center text-art-ink/60 mt-1 border-t border-art-ink/5 pt-1">
                  <span>Total Verification NRE</span>
                  <span className="text-art-rust font-bold">${round((dm.resolvedLaborRateVerification ?? 145) * 160 * totalBlockVerifPm / 1_000_000, 1)}M</span>
                </div>
              </div>
              <p className="text-[9px] text-art-ink/40 font-mono italic">Verification effort is defined per architecture block in the Architecture BOM.</p>
            </div>
          </div>
        </div>

        {/* MPW Section */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-art-cream/30 border-b border-art-ink/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shuffle className="w-4.5 h-4.5 text-art-rust" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono text-art-ink">Multi-Project Wafer</span>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded border border-art-ink/10 p-0.5">
              <button onClick={handleMpwToggle}
                className={`text-[10px] py-1 px-3 rounded font-mono font-bold uppercase cursor-pointer transition-all ${dm.mpw?.enabled ? 'bg-art-ink text-art-cream' : 'bg-art-cream text-art-ink/50'}`}>
                On
              </button>
              <button onClick={handleMpwToggle}
                className={`text-[10px] py-1 px-3 rounded font-mono font-bold uppercase cursor-pointer transition-all ${!dm.mpw?.enabled ? 'bg-art-ink text-art-cream' : 'bg-art-cream text-art-ink/50'}`}>
                Off
              </button>
            </div>
          </div>
          {dm.mpw?.enabled && (
            <div className="p-5 bg-white">
              <div className="bg-art-cream/40 p-4 rounded-xl border border-art-ink/10 space-y-4">
                <div className="flex items-center space-x-1.5 border-b border-art-ink/10 pb-2">
                  <Sliders className="w-4 h-4 text-art-rust" />
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Shuttle Configuration</span>
                </div>
                {inputField('Shuttle Participants', 'participants', dm.mpw.participants, 2, 24, 1, (v) => `${v} designs`, handleMpwChange)}
                {inputField('Cost per Slot', 'shuttleCostPerSlot', dm.mpw.shuttleCostPerSlot, 25000, 500000, 5000, (v) => `$${v.toLocaleString()}`, handleMpwChange)}
                {inputField('Gross Dies per Slot', 'diesPerSlot', dm.mpw.diesPerSlot, 25, 2000, 25, (v) => `${v} dies`, handleMpwChange)}
                {inputField('Shuttle Runs / Year', 'shuttlesPerYear', dm.mpw.shuttlesPerYear, 1, 12, 1, (v) => `${v} runs`, handleMpwChange)}
                {inputField('Max Die Area (Slot)', 'reticleSlotArea', dm.mpw.reticleSlotArea, 10, 400, 5, (v) => `${v} mm²`, handleMpwChange)}
                {dm.dieArea > (dm.mpw.reticleSlotArea || 100) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[10px] text-red-700 font-mono font-bold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>Die area ({dm.dieArea} mm²) exceeds reticle slot limit ({dm.mpw.reticleSlotArea} mm²). Reduce die area or select a larger slot.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

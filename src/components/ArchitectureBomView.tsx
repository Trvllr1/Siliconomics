import React, { useState } from 'react';
import { Build, ArchitectureBlock, BlockCategory, PersonaType } from '../types';
import { round } from '../utils/mathEngine';
import { BLOCK_FIELD_OWNER } from '../data/personaConfig';
import {
  Cpu, Plus, Trash2, Edit3, DollarSign, Save, AlertCircle,
  Sliders, Clock, ShieldAlert, Truck, Wrench, ArrowRight,
  CheckCircle, BookOpen
} from 'lucide-react';

interface ArchitectureBomViewProps {
  activeBuild: Build;
  onUpdateBuild: (updated: Build) => void;
  activePersona: PersonaType;
}

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  cpu: 'CPU / Processor',
  memory: 'Memory / Cache',
  security: 'Security / Crypto',
  interconnect: 'Interconnect / NoC',
  accelerator: 'AI / Accelerator',
  io: 'I/O Interface',
  power: 'Power Management',
  packaging: 'Packaging / Interposer',
  networking: 'Networking / Ethernet',
  rf: 'RF / Analog',
  clocking: 'Clocking / PLL',
  other: 'Custom / Other',
};

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  cpu: 'bg-blue-50 border-blue-200 text-blue-700',
  memory: 'bg-amber-50 border-amber-200 text-amber-700',
  security: 'bg-red-50 border-red-200 text-red-700',
  interconnect: 'bg-purple-50 border-purple-200 text-purple-700',
  accelerator: 'bg-green-50 border-green-200 text-green-700',
  io: 'bg-cyan-50 border-cyan-200 text-cyan-700',
  power: 'bg-orange-50 border-orange-200 text-orange-700',
  packaging: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  networking: 'bg-teal-50 border-teal-200 text-teal-700',
  rf: 'bg-rose-50 border-rose-200 text-rose-700',
  clocking: 'bg-slate-50 border-slate-200 text-slate-700',
  other: 'bg-gray-50 border-gray-200 text-gray-700',
};

const CATEGORY_DEFECT: Record<BlockCategory, number> = {
  cpu: 1.0, memory: 1.5, security: 1.0, interconnect: 1.0,
  accelerator: 1.0, io: 1.0, power: 0.8, packaging: 0,
  networking: 1.0, rf: 0.7, clocking: 0.9, other: 1.0,
};

export default function ArchitectureBomView({ activeBuild, onUpdateBuild, activePersona }: ArchitectureBomViewProps) {
  const arch = activeBuild.architecture;
  const blocks = arch?.blocks ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<ArchitectureBlock>(emptyBlock());

  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  const canEditBlockField = (field: string) => {
    const owner = BLOCK_FIELD_OWNER[field];
    if (!owner) return activePersona === 'architect';
    return activePersona === owner;
  };

  function emptyBlock(): ArchitectureBlock {
    return {
      name: '',
      category: 'cpu',
      purpose: '',
      implementation: 'internal',
      estimatedAreaMm2: 0,
      manufacturingCriticality: 'medium',
      supplyChainRisk: 'none',
    };
  }

  const setBlockForm = (field: string, value: any) => {
    if (!canEditBlockField(field)) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const inputDisabled = (field: string) => {
    const editable = canEditBlockField(field);
    return `${!editable ? 'opacity-50 cursor-not-allowed pointer-events-none bg-art-cream/30' : 'bg-art-cream cursor-pointer'}`;
  };

  const reset = () => {
    setForm(emptyBlock());
    setShowForm(false);
    setEditIdx(null);
  };

  const dm = activeBuild.designModel;

  const saveBlock = () => {
    if (!form.name.trim() || form.estimatedAreaMm2 <= 0) return;
    const next = editIdx !== null
      ? blocks.map((b, i) => (i === editIdx ? { ...form } : b))
      : [...blocks, { ...form }];

    onUpdateBuild({
      ...activeBuild,
      architecture: {
        blocks: next,
        version: arch?.version ?? 'v1.0',
        rationale: arch?.rationale ?? '',
      },
    });
    reset();
  };

  const deleteBlock = (idx: number) => {
    const next = blocks.filter((_, i) => i !== idx);
    onUpdateBuild({
      ...activeBuild,
      architecture: {
        blocks: next,
        version: arch?.version ?? 'v1.0',
        rationale: arch?.rationale ?? '',
      },
    });
  };

  const editBlock = (idx: number) => {
    setForm({ ...blocks[idx]! });
    setEditIdx(idx);
    setShowForm(true);
  };

  const totalArea = blocks.reduce((s, b) => s + b.estimatedAreaMm2, 0);
  const areaWarn = blocks.length > 0 && Math.abs(totalArea - dm.dieArea) > dm.dieArea * 0.05;

  // Cost waterfall
  const totalNre = blocks.reduce((s, b) => s + (b.nreImpactM ?? 0), 0);
  const totalLicense = blocks.reduce((s, b) => s + (b.licensingCostM ?? 0), 0);
  const totalRoyalty = blocks.reduce((s, b) => s + (b.royaltyPerUnit ?? 0), 0);
  const totalSchedule = blocks.reduce((s, b) => s + (b.scheduleImpactWeeks ?? 0), 0);
  const totalVerif = blocks.reduce((s, b) => s + (b.verificationEffortPersonMonths ?? 0), 0);
  const criticalBlocks = blocks.filter(b => b.manufacturingCriticality === 'critical');
  const decisionTrace = blocks.filter(b => b.replaces);

  const catBadge = (cat: BlockCategory) => (
    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[cat]}`}>
      {CATEGORY_LABELS[cat]}
    </span>
  );

  const implBadge = (impl: ArchitectureBlock['implementation']) => {
    const m: Record<string, string> = {
      internal: 'bg-blue-50 text-blue-700 border-blue-200',
      licensed: 'bg-purple-50 text-purple-700 border-purple-200',
      'open-source': 'bg-green-50 text-green-700 border-green-200',
      custom: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return (
      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${m[impl] ?? ''}`}>
        {impl}
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sliders className="w-5 h-5 text-art-rust" />
          <div>
            <h2 className="text-sm font-serif font-black text-art-ink">Architecture Composition</h2>
            <p className="text-[10px] text-art-ink/50 font-mono">
              {activeBuild.name} • {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              {blocks.length > 0 && ` · ${round(totalArea, 1)} / ${dm.dieArea} mm²`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { reset(); setShowForm(true); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-ink/90 text-art-cream rounded-lg text-xs font-serif italic font-bold transition-all cursor-pointer shadow-sm border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white border-2 border-art-rust/30 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-art-ink/10 pb-3">
            <h3 className="text-sm font-serif font-black text-art-ink">
              {editIdx !== null ? 'Edit Block' : 'New Architecture Block'}
            </h3>
            <button onClick={reset} className="text-xs text-art-ink/40 hover:text-art-ink font-bold cursor-pointer">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Block Name</label>
              <input type="text" value={form.name} onChange={(e) => setBlockForm('name', e.target.value)}
                className={`w-full ${inputDisabled('name')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} placeholder="e.g. CPU Cluster, PQC Engine" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Category</label>
              <select value={form.category} onChange={(e) => setBlockForm('category', e.target.value)}
                className={`w-full ${inputDisabled('category')} border border-art-ink/15 rounded px-2 py-2 text-xs font-semibold outline-none focus:border-art-rust`}>
                {(Object.entries(CATEGORY_LABELS) as [BlockCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Implementation</label>
              <select value={form.implementation} onChange={(e) => setBlockForm('implementation', e.target.value)}
                className={`w-full ${inputDisabled('implementation')} border border-art-ink/15 rounded px-2 py-2 text-xs font-semibold outline-none focus:border-art-rust`}>
                <option value="internal">Internal (Build)</option>
                <option value="licensed">Licensed (3rd Party)</option>
                <option value="open-source">Open Source</option>
                <option value="custom">Custom (Contract)</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Purpose / Rationale</label>
              <input type="text" value={form.purpose} onChange={(e) => setBlockForm('purpose', e.target.value)}
                className={`w-full ${inputDisabled('purpose')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} placeholder="e.g. Post-quantum crypto migration, AI inference acceleration" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Est. Area (mm²)</label>
              <input type="number" min={0} step={0.1} value={form.estimatedAreaMm2} onChange={(e) => setBlockForm('estimatedAreaMm2', Number(e.target.value))}
                className={`w-full ${inputDisabled('estimatedAreaMm2')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Measured Area (mm²)</label>
              <input type="number" min={0} step={0.1} value={form.measuredAreaMm2 ?? ''} onChange={(e) => setBlockForm('measuredAreaMm2', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full ${inputDisabled('measuredAreaMm2')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Est. Power (W)</label>
              <input type="number" min={0} step={0.1} value={form.estimatedPowerW ?? ''} onChange={(e) => setBlockForm('estimatedPowerW', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full ${inputDisabled('estimatedPowerW')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Measured Power (W)</label>
              <input type="number" min={0} step={0.1} value={form.measuredPowerW ?? ''} onChange={(e) => setBlockForm('measuredPowerW', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full ${inputDisabled('measuredPowerW')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Internal NRE ($M)</label>
              <input type="number" min={0} step={0.1} value={form.nreImpactM ?? ''} onChange={(e) => setBlockForm('nreImpactM', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full ${inputDisabled('nreImpactM')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">License Fee ($M)</label>
              <input type="number" min={0} step={0.1} value={form.licensingCostM ?? ''} onChange={(e) => setBlockForm('licensingCostM', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full ${inputDisabled('licensingCostM')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Royalty ($/unit)</label>
              <input type="number" min={0} step={0.01} value={form.royaltyPerUnit ?? ''} onChange={(e) => setBlockForm('royaltyPerUnit', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full ${inputDisabled('royaltyPerUnit')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Schedule Impact (weeks)</label>
              <div className="flex items-center space-x-2">
                <input type="range" min={0} max={52} step={1} value={form.scheduleImpactWeeks ?? 0}
                  onChange={(e) => setBlockForm('scheduleImpactWeeks', Number(e.target.value))}
                  className={`flex-1 accent-art-rust ${!canEditBlockField('scheduleImpactWeeks') ? 'opacity-50 cursor-not-allowed' : ''}`} />
                <span className="font-mono text-xs font-bold w-8 text-right">{form.scheduleImpactWeeks ?? 0}w</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Verification Effort (person-months)</label>
              <input type="number" min={0} step={0.5} value={form.verificationEffortPersonMonths ?? ''} onChange={(e) => setBlockForm('verificationEffortPersonMonths', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full ${inputDisabled('verificationEffortPersonMonths')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Manufacturing Criticality</label>
              <select value={form.manufacturingCriticality} onChange={(e) => setBlockForm('manufacturingCriticality', e.target.value)}
                className={`w-full ${inputDisabled('manufacturingCriticality')} border border-art-ink/15 rounded px-2 py-2 text-xs font-semibold outline-none focus:border-art-rust`}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Supply Chain Risk</label>
              <select value={form.supplyChainRisk} onChange={(e) => setBlockForm('supplyChainRisk', e.target.value)}
                className={`w-full ${inputDisabled('supplyChainRisk')} border border-art-ink/15 rounded px-2 py-2 text-xs font-semibold outline-none focus:border-art-rust`}>
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Replaces (decision trace)</label>
              <input type="text" value={form.replaces ?? ''} onChange={(e) => setBlockForm('replaces', e.target.value)}
                className={`w-full ${inputDisabled('replaces')} border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust`} placeholder="e.g. ECC-256" />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            {form.estimatedAreaMm2 > 0 && form.replaces && (
              <span className="text-[9px] text-art-ink/40 font-mono self-center italic">
                Decision trace: replaces &quot;{form.replaces}&quot; · area impact: +{form.estimatedAreaMm2} mm²
              </span>
            )}
            <div className="flex space-x-2 ml-auto">
              <button onClick={reset} className="px-3 py-1.5 text-xs text-art-ink/50 hover:text-art-ink font-semibold cursor-pointer">Cancel</button>
              <button onClick={saveBlock}
                className="flex items-center space-x-1.5 px-4 py-2 bg-art-ink hover:bg-art-ink/90 text-art-cream rounded-lg font-serif italic font-bold text-xs shadow-md transition-all cursor-pointer">
                <Save className="w-3.5 h-3.5" />
                <span>{editIdx !== null ? 'Update' : 'Add Block'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area warning */}
      {blocks.length > 0 && areaWarn && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 font-sans">
            <strong className="font-bold">Area mismatch:</strong> Sum of block areas ({round(totalArea, 1)} mm²) differs from die area ({dm.dieArea} mm²) by {round(Math.abs(totalArea - dm.dieArea), 1)} mm² ({round(Math.abs(Math.abs(totalArea - dm.dieArea) / dm.dieArea) * 100, 1)}%). Adjust block sizes or die area for accurate yield modeling.
          </div>
        </div>
      )}

      {/* Block list */}
      <div className="space-y-3">
        {blocks.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-art-ink/15 rounded-xl p-12 text-center">
            <Cpu className="w-10 h-10 text-art-ink/20 mx-auto mb-3" />
            <p className="text-sm text-art-ink/50 font-medium">No architecture blocks defined</p>
            <p className="text-xs text-art-ink/40 mt-1 max-w-md mx-auto">
              Decompose this build into its architectural building blocks. Each block captures estimated area, power, cost, schedule, and risk — the same language executives, program managers, and architects use.
            </p>
          </div>
        ) : (
          blocks.map((block, idx) => {
            const isExpanded = expandedBlock === idx;
            const hasMeasuredDiff = block.measuredAreaMm2 !== undefined && Math.abs((block.measuredAreaMm2 - block.estimatedAreaMm2) / block.estimatedAreaMm2) > 0.05;
            return (
              <div key={idx} className="bg-white border-2 border-art-ink/10 hover:border-art-ink/20 rounded-xl shadow-sm transition-all overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => setExpandedBlock(isExpanded ? null : idx)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="text-sm font-serif font-black text-art-ink">{block.name}</h4>
                        {catBadge(block.category)}
                        {implBadge(block.implementation)}
                        {block.manufacturingCriticality === 'critical' && (
                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">Critical</span>
                        )}
                      </div>
                      {block.purpose && (
                        <p className="text-[10px] text-art-ink/60 font-sans italic">{block.purpose}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-3">
                      <button onClick={(e) => { e.stopPropagation(); editBlock(idx); }} className="p-1.5 rounded hover:bg-art-cream text-art-ink/40 hover:text-art-ink transition-all cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteBlock(idx); }} className="p-1.5 rounded hover:bg-red-50 text-art-ink/40 hover:text-red-600 transition-all cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-3 pt-3 border-t border-art-ink/5 text-[10px] font-mono">
                    <div>
                      <span className="text-art-ink/40 block text-[9px]">Area</span>
                      <span className="font-bold">
                        {block.estimatedAreaMm2} mm²
                        {hasMeasuredDiff && <span className="text-amber-600 ml-1">(Δ{round((block.measuredAreaMm2! - block.estimatedAreaMm2) / block.estimatedAreaMm2 * 100, 1)}%)</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-art-ink/40 block text-[9px]">Est. Power</span>
                      <span className="font-bold">{block.estimatedPowerW ? `${block.estimatedPowerW}W` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-art-ink/40 block text-[9px]">NRE</span>
                      <span className="font-bold">{block.nreImpactM || block.licensingCostM ? `$${(block.nreImpactM ?? 0) + (block.licensingCostM ?? 0)}M` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-art-ink/40 block text-[9px]">Royalty</span>
                      <span className="font-bold">{block.royaltyPerUnit ? `$${block.royaltyPerUnit}/u` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-art-ink/40 block text-[9px]">Schedule</span>
                      <span className="font-bold">{block.scheduleImpactWeeks ? `${block.scheduleImpactWeeks}w` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-art-ink/40 block text-[9px]">Verification</span>
                      <span className="font-bold">{block.verificationEffortPersonMonths ? `${block.verificationEffortPersonMonths} pm` : '—'}</span>
                    </div>
                  </div>

                  {block.replaces && (
                    <div className="mt-2 flex items-center space-x-1.5 text-[9px] text-art-ink/40 font-mono">
                      <ArrowRight className="w-3 h-3 text-art-rust" />
                      <span>Replaces <strong className="text-art-ink/60">{block.replaces}</strong></span>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-art-ink/5 bg-art-cream/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-[10px] font-mono">
                      <div className="bg-white rounded-lg p-3 border border-art-ink/10">
                        <span className="text-art-ink/40 block text-[9px] uppercase">Manufacturing Criticality</span>
                        <span className={`font-bold text-sm ${block.manufacturingCriticality === 'critical' ? 'text-red-600' : block.manufacturingCriticality === 'high' ? 'text-orange-600' : 'text-art-ink'}`}>
                          {block.manufacturingCriticality.toUpperCase()}
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-art-ink/10">
                        <span className="text-art-ink/40 block text-[9px] uppercase">Supply Chain Risk</span>
                        <span className="font-bold text-sm">{block.supplyChainRisk.toUpperCase()}</span>
                      </div>
                      {block.measuredAreaMm2 !== undefined && (
                        <div className="bg-white rounded-lg p-3 border border-art-ink/10">
                          <span className="text-art-ink/40 block text-[9px] uppercase">Measured Area</span>
                          <span className="font-bold text-sm">{block.measuredAreaMm2} mm²</span>
                        </div>
                      )}
                      {block.measuredPowerW !== undefined && (
                        <div className="bg-white rounded-lg p-3 border border-art-ink/10">
                          <span className="text-art-ink/40 block text-[9px] uppercase">Measured Power</span>
                          <span className="font-bold text-sm">{block.measuredPowerW}W</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cost waterfall summary */}
      {blocks.length > 0 && (
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3">
            <Sliders className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] font-mono text-art-ink">Portfolio Impact Summary</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-art-cream/40 rounded-xl p-3 border border-art-ink/10">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-wider font-mono block">Total NRE</span>
              <span className="text-base font-serif font-black text-art-ink">${round(totalNre, 1)}M</span>
            </div>
            <div className="bg-art-cream/40 rounded-xl p-3 border border-art-ink/10">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-wider font-mono block">License Fees</span>
              <span className="text-base font-serif font-black text-art-ink">${round(totalLicense, 1)}M</span>
            </div>
            <div className="bg-art-cream/40 rounded-xl p-3 border border-art-ink/10">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-wider font-mono block">Royalty/Unit</span>
              <span className="text-base font-serif font-black text-art-ink">${round(totalRoyalty, 2)}</span>
            </div>
            <div className="bg-art-cream/40 rounded-xl p-3 border border-art-ink/10">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-wider font-mono block">Schedule</span>
              <span className="text-base font-serif font-black text-art-ink">{totalSchedule}w</span>
            </div>
            <div className="bg-art-cream/40 rounded-xl p-3 border border-art-ink/10">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-wider font-mono block">Verification</span>
              <span className="text-base font-serif font-black text-art-ink">{round(totalVerif, 0)} pm</span>
            </div>
            <div className="bg-art-cream/40 rounded-xl p-3 border border-art-ink/10">
              <span className="text-[9px] font-bold text-art-ink/40 uppercase tracking-wider font-mono block">Critical Blocks</span>
              <span className="text-base font-serif font-black text-art-ink">{criticalBlocks.length}</span>
            </div>
          </div>

          {/* Effective NRE combo with Design Board NRE */}
          <div className="bg-art-cream/20 rounded-xl p-4 border border-art-ink/10 text-[10px] font-mono space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-art-ink/60">Design Board NRE (mask)</span>
              <span className="font-bold text-art-ink">${dm.nreCost}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-art-ink/60">Architecture IP NRE (internal + license)</span>
              <span className="font-bold text-art-ink">${round(totalNre + totalLicense, 1)}M</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-art-ink/10">
              <span className="text-art-ink font-bold">Effective Total NRE</span>
              <span className="font-serif font-black text-art-rust text-sm">${round(dm.nreCost + totalNre + totalLicense, 1)}M</span>
            </div>
          </div>

          {/* Decision trace */}
          {decisionTrace.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-art-ink/10 space-y-2">
              <div className="flex items-center space-x-1.5 text-art-rust">
                <ArrowRight className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono">Decision Trace — {decisionTrace.length} Block{decisionTrace.length > 1 ? 's' : ''} Replaced</h4>
              </div>
              {decisionTrace.map((b, i) => (
                <div key={i} className="text-[10px] font-mono bg-art-cream/30 rounded-lg p-3 border border-art-ink/5 flex items-center justify-between">
                  <div>
                    <span className="text-art-ink/60 line-through mr-2">{b.replaces}</span>
                    <ArrowRight className="w-3 h-3 inline text-art-rust mx-1" />
                    <span className="font-bold text-art-ink">{b.name}</span>
                  </div>
                  <span className="text-art-ink/40">
                    +{b.estimatedAreaMm2} mm² · ${((b.nreImpactM ?? 0) + (b.licensingCostM ?? 0)).toFixed(1)}M · {(b.scheduleImpactWeeks ?? 0) > 0 ? `+${b.scheduleImpactWeeks}w` : ''}
                  </span>
                </div>
              ))}
              <p className="text-[9px] text-art-ink/40 italic">
                These replacement decisions are automatically surfaced in the Decision Center and Meeting Mode presentations.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

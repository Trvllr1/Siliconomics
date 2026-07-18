import React, { useState, useMemo, useCallback } from 'react';
import { ReferenceModel, ReferenceModelCategory, Build } from '../types';
import { getFreshness } from '../utils/dataFreshness';
import { Database, ChevronDown, ChevronRight, Clock, Hash, Search, Sliders, ShieldCheck, AlertTriangle, Copy, Edit3, Trash2, X, Save, RotateCcw, Sparkles } from 'lucide-react';

interface ReferenceModelsViewProps {
  models: ReferenceModel[];
  customModels: ReferenceModel[];
  onDuplicateModel: (source: ReferenceModel) => void;
  onUpdateCustomModel: (model: ReferenceModel) => void;
  onDeleteCustomModel: (id: string) => void;
  onApplyModel: (model: ReferenceModel, build: Build) => void;
  activeBuild: Build;
}

const CATEGORY_COLORS: Record<ReferenceModelCategory, { bg: string; text: string; border: string }> = {
  foundry: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  packaging: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  labor: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  mask: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  certification: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  cloud: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  commodity: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function ReferenceModelsView({ models, customModels, onDuplicateModel, onUpdateCustomModel, onDeleteCustomModel, onApplyModel, activeBuild }: ReferenceModelsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ReferenceModelCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});
  const [editingName, setEditingName] = useState<Record<string, string>>({});
  const [editingDescription, setEditingDescription] = useState<Record<string, string>>({});

  const allModels = useMemo(() => [...models, ...customModels], [models, customModels]);

  const filtered = useMemo(() => {
    return allModels.filter((m) => {
      if (filterCategory !== 'all' && m.category !== filterCategory) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !m.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allModels, filterCategory, searchQuery]);

  const categories: { key: ReferenceModelCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'foundry', label: 'Foundry Nodes' },
    { key: 'packaging', label: 'Packaging' },
    { key: 'labor', label: 'Labor' },
    { key: 'mask', label: 'Mask Sets' },
    { key: 'certification', label: 'Certification' },
    { key: 'cloud', label: 'Cloud' },
  ];

  const startEditing = useCallback((model: ReferenceModel) => {
    setEditingModelId(model.id);
    const strValues: Record<string, string> = {};
    for (const [k, v] of Object.entries(model.parameters)) {
      strValues[k] = String(v);
    }
    setEditValues((prev) => ({ ...prev, [model.id]: strValues }));
    setEditingName((prev) => ({ ...prev, [model.id]: model.name }));
    setEditingDescription((prev) => ({ ...prev, [model.id]: model.description }));
    setExpandedId(model.id);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingModelId(null);
  }, []);

  const saveEditing = useCallback((model: ReferenceModel) => {
    const raw = editValues[model.id];
    if (!raw) return;
    const parsed: Record<string, number | string | boolean> = {};
    for (const [k, v] of Object.entries(raw)) {
      const num = Number(v);
      parsed[k] = Number.isFinite(num) && v.trim() !== '' ? num : v;
    }
    const updated: ReferenceModel = {
      ...model,
      name: editingName[model.id] || model.name,
      description: editingDescription[model.id] || model.description,
      parameters: parsed,
      updatedDate: new Date().toISOString().split('T')[0]!,
    };
    onUpdateCustomModel(updated);
    setEditingModelId(null);
  }, [editValues, editingName, editingDescription, onUpdateCustomModel]);

  const handleParamChange = useCallback((modelId: string, paramKey: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [modelId]: { ...prev[modelId], [paramKey]: value },
    }));
  }, []);

  const renderParameterEdit = (model: ReferenceModel, key: string, value: number | string | boolean) => {
    const isEditing = editingModelId === model.id;
    const strVal = isEditing ? (editValues[model.id]?.[key] ?? String(value)) : String(value);
    return (
      <div key={key} className={`p-2.5 rounded-lg border transition-all ${isEditing ? 'border-art-rust/30 bg-art-rust/5' : 'bg-white border-art-ink/10'}`}>
        <span className="text-[9px] font-mono text-art-ink/40 uppercase block tracking-wider">{formatParamName(key)}</span>
        {isEditing ? (
          <input
            type="text" value={strVal}
            onChange={(e) => handleParamChange(model.id, key, e.target.value)}
            className="w-full mt-0.5 text-xs font-bold font-mono text-art-ink bg-white border border-art-ink/20 rounded px-1.5 py-0.5 outline-none focus:border-art-rust focus:ring-1 focus:ring-art-rust/20"
          />
        ) : (
          <span className="text-xs font-bold text-art-ink font-mono">{formatParamValue(value)}</span>
        )}
      </div>
    );
  };

  const isCustom = (m: ReferenceModel) => m.isCustom === true;

  const renderModelCard = (m: ReferenceModel, showDuplicate: boolean) => {
    const isExpanded = expandedId === m.id;
    const cc = CATEGORY_COLORS[m.category];
    const isEditing = editingModelId === m.id;

    return (
      <div key={m.id} className={`bg-white border-2 rounded-xl shadow-sm overflow-hidden transition-all ${isCustom(m) ? 'border-art-rust/20' : 'border-art-ink/10'}`}>
        <div onClick={() => setExpandedId(isExpanded ? null : m.id)}
          className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-art-cream/20 transition-colors">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-art-rust shrink-0" /> : <ChevronRight className="w-4 h-4 text-art-ink/30 shrink-0" />}
            <div className={`p-1.5 rounded-lg border ${cc.bg} ${cc.border} shrink-0`}>
              <Database className={`w-4 h-4 ${cc.text}`} />
            </div>
            <div className="min-w-0">
              {isEditing ? (
                <input type="text" value={editingName[m.id] || m.name}
                  onChange={(e) => setEditingName((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  className="text-sm font-bold text-art-ink bg-white border border-art-ink/20 rounded px-1.5 py-0.5 w-full outline-none focus:border-art-rust"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-art-ink truncate">{m.name}</h3>
                  {isCustom(m) && (
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-art-rust bg-art-rust/10 px-1.5 py-0.5 rounded-full border border-art-rust/20 shrink-0">Custom</span>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2 text-[9px] font-mono text-art-ink/40 mt-0.5 flex-wrap">
                <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${cc.bg} ${cc.text}`}>{m.category}</span>
                <span>v{m.version}</span>
                <span className="flex items-center space-x-0.5"><Clock className="w-2.5 h-2.5" /><span>Updated {m.updatedDate}</span></span>
                {!isCustom(m) && (() => { const f = getFreshness(m.provenance.lastVerified); return (
                  <span className={`flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full font-bold ${
                    f.level === 'fresh' ? 'bg-green-100 text-green-700' :
                    f.level === 'aging' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>{f.level === 'fresh' ? <ShieldCheck className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}<span>{f.label.split('—')[1]?.trim() ?? f.level}</span></span>
                ); })()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            {isCustom(m) ? (
              <div className="flex items-center space-x-1">
                <button onClick={(e) => { e.stopPropagation(); startEditing(m); }}
                  className="p-1.5 rounded-lg text-art-ink/40 hover:text-art-rust hover:bg-art-rust/10 transition-all cursor-pointer" title="Edit custom model">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteCustomModel(m.id); }}
                  className="p-1.5 rounded-lg text-art-ink/40 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer" title="Delete custom model">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : showDuplicate && (
              <button onClick={(e) => { e.stopPropagation(); onDuplicateModel(m); }}
                className="flex items-center space-x-1 text-[9px] font-mono font-bold text-art-rust hover:text-art-rust/80 bg-art-rust/5 hover:bg-art-rust/10 px-2 py-1 rounded-lg border border-art-rust/20 transition-all cursor-pointer">
                <Copy className="w-3 h-3" />
                <span>Duplicate & Customize</span>
              </button>
            )}
            {!isCustom(m) && (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                m.provenance.confidence === 'high' ? 'bg-green-100 text-green-700' :
                m.provenance.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>{m.provenance.confidence.charAt(0).toUpperCase() + m.provenance.confidence.slice(1)} Confidence</span>
            )}
            <span className="text-[9px] font-mono text-art-ink/40">{Object.keys(m.parameters).length} parameters</span>
          </div>
        </div>

        {isExpanded && (
          <div className="px-5 pb-5 border-t border-art-ink/5 pt-4 space-y-4">
            {isEditing ? (
              <textarea value={editingDescription[m.id] || m.description}
                onChange={(e) => setEditingDescription((prev) => ({ ...prev, [m.id]: e.target.value }))}
                className="w-full text-xs text-art-ink/60 italic leading-relaxed bg-white border border-art-ink/20 rounded px-2 py-1.5 outline-none focus:border-art-rust resize-none"
                rows={2}
              />
            ) : (
              <p className="text-xs text-art-ink/60 italic leading-relaxed">{m.description}</p>
            )}

            <div className="bg-art-cream/20 border border-art-ink/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 border-b border-art-ink/5 pb-2">
                <div className="flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-art-rust" />
                  <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Parameters</span>
                </div>
                {isEditing && (
                  <button onClick={() => {
                    const original = isCustom(m) ? models.find(ref => ref.id === m.sourceModelId) : null;
                    if (original) {
                      const strValues: Record<string, string> = {};
                      for (const [k, v] of Object.entries(original.parameters)) {
                        strValues[k] = String(v);
                      }
                      setEditValues((prev) => ({ ...prev, [m.id]: strValues }));
                    }
                  }}
                    className="flex items-center space-x-1 text-[9px] font-mono font-bold text-art-ink/40 hover:text-art-rust transition-all cursor-pointer">
                    <RotateCcw className="w-3 h-3" />
                    <span>Revert to Defaults</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(m.parameters).map(([key, value]) => renderParameterEdit(m, key, value))}
              </div>
            </div>

            {/* Edit/Save controls for custom models */}
            {isCustom(m) && (
              <div className="flex items-center justify-between border-t border-art-ink/5 pt-3">
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEditing(m)}
                        className="flex items-center space-x-1 bg-art-rust hover:bg-art-rust/90 text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-art-rust transition-all cursor-pointer">
                        <Save className="w-3 h-3" />
                        <span>Save Changes</span>
                      </button>
                      <button onClick={cancelEditing}
                        className="flex items-center space-x-1 bg-white text-art-ink/60 hover:text-art-ink text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-art-ink/20 hover:border-art-ink/40 transition-all cursor-pointer">
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEditing(m)}
                      className="flex items-center space-x-1 bg-art-cream hover:bg-art-rust/10 text-art-ink/60 hover:text-art-rust text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-art-ink/10 hover:border-art-rust/30 transition-all cursor-pointer">
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Parameters</span>
                    </button>
                  )}
                </div>
                <button onClick={() => onApplyModel(m, activeBuild)}
                  className="flex items-center space-x-1 bg-art-rust/10 hover:bg-art-rust/20 text-art-rust hover:text-art-rust/90 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-art-rust/30 transition-all cursor-pointer">
                  <Sparkles className="w-3 h-3" />
                  <span>Apply to Build</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-art-ink/40 border-t border-art-ink/5 pt-3">
              <span className="flex items-center space-x-1.5"><Hash className="w-3 h-3" />ID: {m.id}</span>
              <span className="flex items-center space-x-1.5"><Clock className="w-3 h-3" />Created: {m.createdDate}</span>
            </div>
            {!isCustom(m) && (
              <div className="bg-art-cream/30 border border-art-ink/10 rounded-lg p-3 text-[10px] font-mono">
                <span className="font-bold text-art-ink/60 uppercase tracking-wider text-[9px]">Provenance</span>
                <p className="text-art-ink/70 mt-1">{m.provenance.source}</p>
                <p className="text-art-ink/40 mt-0.5">Type: {m.provenance.sourceType.replace(/-/g, ' ')} • Last verified: {m.provenance.lastVerified}{m.provenance.notes ? ` • ${m.provenance.notes}` : ''}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-black text-art-ink">Reference Models</h1>
          <p className="text-xs text-art-ink/60 mt-1 italic">Version-controlled engineering assumptions and cost parameters. Default models are read-only; use <strong>Duplicate & Customize</strong> to create your own.</p>
        </div>
        <span className="text-[10px] font-mono text-art-ink/40 bg-art-cream px-3 py-1 rounded-full border border-art-ink/10">{allModels.length} models ({customModels.length} custom)</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-art-ink/30" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference models..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-art-ink/10 rounded-lg text-xs font-medium outline-none focus:border-art-rust transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button key={c.key} onClick={() => setFilterCategory(c.key)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-all ${
                filterCategory === c.key
                  ? 'bg-art-ink text-art-cream border-art-ink'
                  : 'bg-white text-art-ink/60 border-art-ink/10 hover:border-art-ink/30'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom models section */}
      {customModels.length > 0 && filterCategory === 'all' && !searchQuery && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-1 h-5 bg-art-rust rounded-full" />
            <span className="text-xs font-mono font-bold text-art-ink/50 uppercase tracking-wider">Your Custom Models</span>
          </div>
          <div className="space-y-3">
            {customModels.filter((m) => {
              if (filterCategory !== 'all' && m.category !== filterCategory) return false;
              return true;
            }).map((m) => renderModelCard(m, false))}
          </div>
        </div>
      )}

      {/* Default models section */}
      <div>
        {customModels.length > 0 && filterCategory === 'all' && !searchQuery && (
          <div className="flex items-center space-x-2 mb-3 mt-6">
            <div className="w-1 h-5 bg-art-ink/30 rounded-full" />
            <span className="text-xs font-mono font-bold text-art-ink/30 uppercase tracking-wider">Platform Defaults</span>
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="border-2 border-dashed border-art-ink/10 rounded-xl p-12 text-center bg-white">
            <Database className="w-10 h-10 text-art-rust/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-art-ink/50">No reference models found.</p>
            <p className="text-xs text-art-ink/40 mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => renderModelCard(m, true))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatParamName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function formatParamValue(value: number | string | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return String(value);
  }
  return value;
}

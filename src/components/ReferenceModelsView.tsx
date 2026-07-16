import React, { useState, useMemo } from 'react';
import { ReferenceModel, ReferenceModelCategory } from '../types';
import { Database, ChevronDown, ChevronRight, Clock, Hash, Tag, Search, Sliders, FileText, BookOpen } from 'lucide-react';

interface ReferenceModelsViewProps {
  models: ReferenceModel[];
}

const CATEGORY_COLORS: Record<ReferenceModelCategory, { bg: string; text: string; border: string }> = {
  foundry: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  packaging: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  labor: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  mask: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  certification: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  cloud: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
};

export default function ReferenceModelsView({ models }: ReferenceModelsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ReferenceModelCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (filterCategory !== 'all' && m.category !== filterCategory) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !m.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [models, filterCategory, searchQuery]);

  const categories: { key: ReferenceModelCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'foundry', label: 'Foundry Nodes' },
    { key: 'packaging', label: 'Packaging' },
    { key: 'labor', label: 'Labor' },
    { key: 'mask', label: 'Mask Sets' },
    { key: 'certification', label: 'Certification' },
    { key: 'cloud', label: 'Cloud' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-black text-art-ink">Reference Models</h1>
          <p className="text-xs text-art-ink/60 mt-1 italic">Version-controlled engineering assumptions and cost parameters.</p>
        </div>
        <span className="text-[10px] font-mono text-art-ink/40 bg-art-cream px-3 py-1 rounded-full border border-art-ink/10">{models.length} models</span>
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

      {/* Model list */}
      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-art-ink/10 rounded-xl p-12 text-center bg-white">
          <Database className="w-10 h-10 text-art-rust/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-art-ink/50">No reference models found.</p>
          <p className="text-xs text-art-ink/40 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id;
            const cc = CATEGORY_COLORS[m.category];
            return (
              <div key={m.id} className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
                <div onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-art-cream/20 transition-colors">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-art-rust" /> : <ChevronRight className="w-4 h-4 text-art-ink/30" />}
                    <div className={`p-1.5 rounded-lg border ${cc.bg} ${cc.border}`}>
                      <Database className={`w-4 h-4 ${cc.text}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-art-ink">{m.name}</h3>
                      <div className="flex items-center space-x-2 text-[9px] font-mono text-art-ink/40 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${cc.bg} ${cc.text}`}>{m.category}</span>
                        <span>v{m.version}</span>
                        <span className="flex items-center space-x-0.5"><Clock className="w-2.5 h-2.5" /><span>Updated {m.updatedDate}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono text-art-ink/40">{Object.keys(m.parameters).length} parameters</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-art-ink/5 pt-4 space-y-4">
                    <p className="text-xs text-art-ink/60 italic leading-relaxed">{m.description}</p>

                    <div className="bg-art-cream/20 border border-art-ink/10 rounded-lg p-4">
                      <div className="flex items-center space-x-1.5 mb-3 border-b border-art-ink/5 pb-2">
                        <Sliders className="w-3.5 h-3.5 text-art-rust" />
                        <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Parameters</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(m.parameters).map(([key, value]) => (
                          <div key={key} className="p-2.5 bg-white border border-art-ink/10 rounded-lg">
                            <span className="text-[9px] font-mono text-art-ink/40 uppercase block tracking-wider">{formatParamName(key)}</span>
                            <span className="text-xs font-bold text-art-ink font-mono">{formatParamValue(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-art-ink/40 border-t border-art-ink/5 pt-3">
                      <span className="flex items-center space-x-1.5"><Hash className="w-3 h-3" />ID: {m.id}</span>
                      <span className="flex items-center space-x-1.5"><Clock className="w-3 h-3" />Created: {m.createdDate}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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

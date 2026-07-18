import React, { useState, useMemo } from 'react';
import { FormulaEntry } from '../types';
import { getFreshness } from '../utils/dataFreshness';
import { BookOpen, ChevronDown, ChevronRight, Search, Cpu, Activity, DollarSign, Briefcase, Hash, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

interface FormulaLibraryViewProps {
  formulas: FormulaEntry[];
}

const CATEGORIES: { key: FormulaEntry['category']; label: string; icon: React.ReactNode }[] = [
  { key: 'engineering', label: 'Engineering', icon: <Cpu className="w-3.5 h-3.5" /> },
  { key: 'manufacturing', label: 'Manufacturing', icon: <Activity className="w-3.5 h-3.5" /> },
  { key: 'financial', label: 'Financial', icon: <DollarSign className="w-3.5 h-3.5" /> },
  { key: 'program', label: 'Program', icon: <Briefcase className="w-3.5 h-3.5" /> },
];

export default function FormulaLibraryView({ formulas }: FormulaLibraryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<FormulaEntry['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return formulas.filter((f) => {
      if (filterCat !== 'all' && f.category !== filterCat) return false;
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !f.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !f.equation.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [formulas, filterCat, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-black text-art-ink">Formula Library</h1>
          <p className="text-xs text-art-ink/60 mt-1 italic">Every deterministic equation used by the Siliconomics computation engine.</p>
        </div>
        <span className="text-[10px] font-mono text-art-ink/40 bg-art-cream px-3 py-1 rounded-full border border-art-ink/10">{formulas.length} formulas</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-art-ink/30" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formulas by name, description, or equation..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-art-ink/10 rounded-lg text-xs font-medium outline-none focus:border-art-rust transition-all" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button key="all" onClick={() => setFilterCat('all')}
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-all ${filterCat === 'all' ? 'bg-art-ink text-art-cream border-art-ink' : 'bg-white text-art-ink/60 border-art-ink/10 hover:border-art-ink/30'}`}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setFilterCat(c.key)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-all flex items-center space-x-1 ${filterCat === c.key ? 'bg-art-ink text-art-cream border-art-ink' : 'bg-white text-art-ink/60 border-art-ink/10 hover:border-art-ink/30'}`}>
              {c.icon} <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-art-ink/10 rounded-xl p-12 text-center bg-white">
          <BookOpen className="w-10 h-10 text-art-rust/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-art-ink/50">No formulas found.</p>
          <p className="text-xs text-art-ink/40 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const isExpanded = expandedId === f.id;
            return (
              <div key={f.id} className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
                <div onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-art-cream/20 transition-colors">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-art-rust" /> : <ChevronRight className="w-4 h-4 text-art-ink/30" />}
                    <div className={`p-1.5 rounded-lg border ${
                      f.category === 'engineering' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      f.category === 'manufacturing' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                      f.category === 'financial' ? 'bg-green-50 border-green-200 text-green-700' :
                      'bg-orange-50 border-orange-200 text-orange-700'
                    }`}>
                      {f.category === 'engineering' ? <Cpu className="w-4 h-4" /> :
                       f.category === 'manufacturing' ? <Activity className="w-4 h-4" /> :
                       f.category === 'financial' ? <DollarSign className="w-4 h-4" /> :
                       <Briefcase className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-art-ink">{f.name}</h3>
                      <div className="flex items-center space-x-2 text-[9px] font-mono text-art-ink/40 mt-0.5">
                        <span className="uppercase font-bold text-art-ink/50">{f.category}</span>
                        <span>v{f.version}</span>
                        <span>•</span>
                        <span>{f.affectedMetrics.length} metrics</span>
                      </div>
                    </div>
                  </div>
                  <code className="hidden md:block text-[10px] font-mono bg-art-cream px-2.5 py-1 rounded border border-art-ink/10 text-art-ink/70 max-w-[360px] truncate">
                    {f.equation.split('\n')[0]}
                  </code>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-art-ink/5 pt-4 space-y-5">
                    <p className="text-xs text-art-ink/60 italic leading-relaxed">{f.description}</p>

                    {/* Equation */}
                    <div className="bg-art-ink text-art-cream rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {f.equation}
                    </div>

                    {/* Inputs */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-art-ink mb-2">Inputs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {f.inputs.map((inp) => (
                          <div key={inp.name} className="p-2.5 bg-art-cream/30 border border-art-ink/10 rounded-lg">
                            <span className="text-[11px] font-bold text-art-ink font-mono">{inp.name}</span>
                            <span className="text-[9px] font-mono text-art-ink/40 ml-1">({inp.unit})</span>
                            <p className="text-[10px] text-art-ink/60 mt-0.5">{inp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Output */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-3">
                      <ArrowRight className="w-4 h-4 text-green-600" />
                      <div>
                        <span className="text-[11px] font-bold text-green-800 font-mono">{f.output.name}</span>
                        <span className="text-[9px] font-mono text-green-600 ml-1">({f.output.unit})</span>
                        <p className="text-[10px] text-green-700/70">{f.output.description}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono text-art-ink/40 border-t border-art-ink/5 pt-3">
                      <span className="flex items-center space-x-1"><Hash className="w-3 h-3" /><span>v{f.version}</span></span>
                      {(() => { const fr = getFreshness(f.lastValidated); return (
                        <span className={`flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full font-bold text-[9px] ${
                          fr.level === 'fresh' ? 'bg-green-100 text-green-700' :
                          fr.level === 'aging' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{fr.level === 'fresh' ? <ShieldCheck className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}<span>Validated {f.lastValidated}</span></span>
                      ); })()}
                      {f.references.map((r, i) => (
                        <span key={i} className="flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{r}</span>
                        </span>
                      ))}
                      <span className="text-art-ink/30">|</span>
                      <span className="text-art-rust">Affects: {f.affectedMetrics.join(', ')}</span>
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

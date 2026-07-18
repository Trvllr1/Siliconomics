import React, { useState } from 'react';
import { Build, Portfolio } from '../types';
import { computeBuildMetrics, round } from '../utils/mathEngine';
import {
  FolderOpen, Plus, Trash2, ChevronDown, ChevronRight, X,
  TrendingUp, DollarSign, Percent, Layers, GitBranch, Clock, Tag
} from 'lucide-react';

interface PortfolioViewProps {
  portfolios: Portfolio[];
  builds: Build[];
  onCreatePortfolio: (p: Portfolio) => void;
  onDeletePortfolio: (id: string) => void;
  onUpdatePortfolio: (p: Portfolio) => void;
}

export default function PortfolioView({
  portfolios, builds, onCreatePortfolio, onDeletePortfolio, onUpdatePortfolio,
}: PortfolioViewProps) {
  const [expandedPortfolio, setExpandedPortfolio] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [addingToPortfolio, setAddingToPortfolio] = useState<string | null>(null);

  const togglePortfolio = (id: string) => {
    setExpandedPortfolio(expandedPortfolio === id ? null : id);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const portfolio: Portfolio = {
      id: `portfolio-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
      buildIds: [],
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      createdDate: new Date().toISOString().split('T')[0]!,
    };
    onCreatePortfolio(portfolio);
    setNewName('');
    setNewDesc('');
    setNewTags('');
    setShowCreate(false);
  };

  const addBuildToPortfolio = (portfolioId: string, buildId: string) => {
    const p = portfolios.find(p => p.id === portfolioId);
    if (!p || p.buildIds.includes(buildId)) return;
    onUpdatePortfolio({ ...p, buildIds: [...p.buildIds, buildId] });
  };

  const removeBuildFromPortfolio = (portfolioId: string, buildId: string) => {
    const p = portfolios.find(p => p.id === portfolioId);
    if (!p) return;
    onUpdatePortfolio({ ...p, buildIds: p.buildIds.filter(id => id !== buildId) });
  };

  const availableBuilds = (portfolioId: string) =>
    builds.filter(b => !portfolios.find(p => p.id === portfolioId)?.buildIds.includes(b.id));

  const portfolioMetrics = (p: Portfolio) => {
    const pBuilds = builds.filter(b => p.buildIds.includes(b.id));
    const metrics = pBuilds.map(b => computeBuildMetrics(b));
    const avgMargin = metrics.length > 0 ? metrics.reduce((s, m) => s + m.snapshot.grossMargin, 0) / metrics.length : 0;
    const totalNRE = pBuilds.reduce((s, b) => s + b.designModel.nreCost, 0);
    const totalProfit = metrics.reduce((s, m) => s + m.snapshot.lifetimeNetProfitMillion, 0);
    const avgROI = metrics.length > 0 ? metrics.reduce((s, m) => s + m.snapshot.roi, 0) / metrics.length : 0;
    const approvedCount = pBuilds.filter(b => b.status === 'Approved').length;
    return { totalBuilds: pBuilds.length, avgMargin, totalNRE, totalProfit, avgROI, approvedCount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-black text-art-ink">Portfolios</h1>
          <p className="text-xs text-art-ink/60 mt-1 italic">Organize Builds into product families, customer programs, or research projects.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-rust text-art-cream rounded-lg text-xs font-bold transition-all cursor-pointer border-none shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Portfolio</span>
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border-2 border-art-rust/30 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-art-ink/10 pb-3">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-art-rust" />
              <h3 className="text-sm font-serif font-black text-art-ink">Create Portfolio</h3>
            </div>
            <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-art-ink/40 hover:text-art-ink font-bold cursor-pointer">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Name</label>
              <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust" placeholder="e.g. Automotive ADAS Program" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Tags (comma-separated)</label>
              <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust" placeholder="automotive, safety, ADAS" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[9px] font-bold text-art-ink/50 uppercase tracking-wider font-mono">Description</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2}
                className="w-full bg-art-cream border border-art-ink/15 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-art-rust" placeholder="Describe the program or product family..." />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="flex items-center space-x-1.5 px-4 py-2 bg-art-ink hover:bg-art-ink/90 text-art-cream rounded-lg font-serif italic font-bold text-xs shadow-md transition-all cursor-pointer">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Create Portfolio</span>
            </button>
          </div>
        </form>
      )}

      {/* Portfolio list */}
      {portfolios.length === 0 ? (
        <div className="border-2 border-dashed border-art-ink/10 rounded-xl p-12 text-center bg-white">
          <FolderOpen className="w-10 h-10 text-art-rust/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-art-ink/50">No portfolios yet.</p>
          <p className="text-xs text-art-ink/40 mt-1">Create a portfolio to start organizing your builds.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {portfolios.map((p) => {
            const isExpanded = expandedPortfolio === p.id;
            const pBuilds = builds.filter(b => p.buildIds.includes(b.id));
            const pMetrics = portfolioMetrics(p);

            return (
              <div key={p.id} className="bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden">
                {/* Portfolio header */}
                <div
                  onClick={() => togglePortfolio(p.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-art-cream/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-art-rust" /> : <ChevronRight className="w-4 h-4 text-art-ink/30" />}
                    <FolderOpen className={`w-5 h-5 ${isExpanded ? 'text-art-rust' : 'text-art-ink/30'}`} />
                    <div>
                      <h3 className="text-sm font-bold text-art-ink">{p.name}</h3>
                      <div className="flex items-center space-x-2 text-[9px] font-mono text-art-ink/40 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{p.createdDate}</span>
                        <span>•</span>
                        <span>{pMetrics.totalBuilds} builds</span>
                        {p.tags.length > 0 && (
                          <span className="flex items-center space-x-1"><Tag className="w-2.5 h-2.5" /><span>{p.tags.join(', ')}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    {/* Aggregate metric pills */}
                    <span className="text-[9px] font-mono bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                      {pMetrics.approvedCount} approved
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeletePortfolio(p.id); }}
                      className="p-1 hover:bg-red-50 rounded text-art-ink/30 hover:text-red-600 transition-all cursor-pointer"
                      title="Delete portfolio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-art-ink/5 pt-4 space-y-5">
                    <p className="text-xs text-art-ink/60 italic leading-relaxed">{p.description}</p>

                    {/* Aggregate stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: <Layers className="w-3.5 h-3.5" />, label: 'Total Builds', value: String(pMetrics.totalBuilds), color: 'text-art-ink' },
                        { icon: <Percent className="w-3.5 h-3.5" />, label: 'Avg Margin', value: `${round(pMetrics.avgMargin, 1)}%`, color: pMetrics.avgMargin > 30 ? 'text-green-600' : 'text-yellow-600' },
                        { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Total NRE', value: `$${pMetrics.totalNRE}M`, color: 'text-art-ink' },
                        { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Total Profit', value: `$${round(pMetrics.totalProfit, 1)}M`, color: pMetrics.totalProfit > 0 ? 'text-green-600' : 'text-red-600' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-art-cream/30 border border-art-ink/10 rounded-lg p-3 flex items-center space-x-2">
                          <div className="text-art-rust">{stat.icon}</div>
                          <div>
                            <span className="text-[9px] font-mono text-art-ink/40 uppercase block">{stat.label}</span>
                            <span className={`text-sm font-bold font-serif italic ${stat.color}`}>{stat.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Member builds */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Builds in Portfolio</h4>
                        <button
                          onClick={() => setAddingToPortfolio(p.id)}
                          className="flex items-center space-x-1 text-[9px] font-mono font-bold text-art-rust hover:text-art-rust/80 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Build</span>
                        </button>
                      </div>

                      {pBuilds.length === 0 ? (
                        <div className="border border-dashed border-art-ink/10 rounded-lg p-6 text-center text-xs text-art-ink/40">
                          No builds in this portfolio yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pBuilds.map((b, _i) => {
                            const m = computeBuildMetrics(b);
                            return (
                              <div key={b.id} className="flex items-center justify-between p-3 bg-art-cream/20 rounded-lg border border-art-ink/5 hover:border-art-ink/15 transition-all">
                                <div className="flex items-center space-x-3">
                                  {/* Lineage indicator */}
                                  {b.parentId && <div className="flex items-center text-art-ink/20"><GitBranch className="w-3 h-3" /></div>}
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-bold text-art-ink">{b.name}</span>
                                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                        b.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                                        b.status === 'TechnicalReview' || b.status === 'FinancialReview' || b.status === 'ProgramReview' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                        b.status === 'Alert' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-art-cream text-art-ink/50 border border-art-ink/10'
                                      }`}>{b.status}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-art-ink/40 mt-0.5">
                                      {b.designModel.processNode} • v{b.version} • {b.designModel.topology}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4 text-[10px] font-mono">
                                  <span className={m.snapshot.grossMargin > 30 ? 'text-green-600' : 'text-yellow-600'}>{round(m.snapshot.grossMargin, 1)}% margin</span>
                                  <span className="text-art-ink/60">${round(m.snapshot.grossCostPerGoodDie, 1)} COGS</span>
                                  <button
                                    onClick={() => removeBuildFromPortfolio(p.id, b.id)}
                                    className="p-1 hover:bg-red-50 rounded text-art-ink/20 hover:text-red-500 transition-all cursor-pointer"
                                    title="Remove from portfolio"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Lineage tree */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink mb-3">Lineage</h4>
                      <div className="bg-art-cream/20 border border-art-ink/10 rounded-lg p-4">
                        <LineageTree builds={pBuilds} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add build dialog */}
      {addingToPortfolio && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setAddingToPortfolio(null)}>
          <div className="bg-white rounded-xl shadow-2xl border-2 border-art-ink/10 p-5 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-art-ink/10 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-art-rust" />
                <h3 className="text-sm font-serif font-black text-art-ink">Add Build to Portfolio</h3>
              </div>
              <button onClick={() => setAddingToPortfolio(null)} className="text-xs text-art-ink/40 hover:text-art-ink font-bold cursor-pointer">Close</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableBuilds(addingToPortfolio).length === 0 ? (
                <p className="text-xs text-art-ink/40 py-4 text-center">All builds are already in this portfolio.</p>
              ) : (
                availableBuilds(addingToPortfolio).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { addBuildToPortfolio(addingToPortfolio, b.id); setAddingToPortfolio(null); }}
                    className="w-full text-left p-3 hover:bg-art-cream rounded-lg border border-art-ink/10 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>{b.name}</span>
                    <span className="text-[9px] font-mono text-art-ink/40">{b.designModel.processNode} • {b.status}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LineageTree({ builds }: { builds: Build[] }) {
  const roots = builds.filter(b => !b.parentId);
  if (roots.length === 0) {
    return <p className="text-xs text-art-ink/40 italic">No lineage data available for this portfolio.</p>;
  }

  const renderNode = (build: Build, depth: number = 0) => {
    const children = builds.filter(b => b.parentId === build.id);
    return (
      <div key={build.id}>
        <div className="flex items-center space-x-2 py-1.5" style={{ paddingLeft: `${depth * 24}px` }}>
          {depth > 0 && <div className="w-4 h-px bg-art-rust/30" />}
          <div className={`w-2 h-2 rounded-full ${build.status === 'Approved' ? 'bg-green-500' : build.status === 'TechnicalReview' || build.status === 'FinancialReview' || build.status === 'ProgramReview' ? 'bg-yellow-500' : 'bg-art-ink/30'}`} />
          <span className="text-[11px] font-semibold text-art-ink">{build.name}</span>
          <span className="text-[9px] font-mono text-art-ink/40">v{build.version}</span>
        </div>
        {children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return <div className="space-y-1">{roots.map(root => renderNode(root))}</div>;
}

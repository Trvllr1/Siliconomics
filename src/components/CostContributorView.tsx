import React, { useState } from 'react';
import { CostContributor } from '../types';
import { DollarSign, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';

interface CostContributorViewProps {
  contributors: CostContributor[];
  fullyLoadedCost: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'silicon': '#3B82F6',
  'packaging': '#8B5CF6',
  'test': '#06B6D4',
  'ip-license': '#F59E0B',
  'ip-royalty': '#EAB308',
  'labor': '#10B981',
  'mask': '#EF4444',
  'architecture-block': '#EC4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  'silicon': 'Silicon',
  'packaging': 'Packaging',
  'test': 'Test',
  'ip-license': 'IP Licensing',
  'ip-royalty': 'Royalties',
  'labor': 'Labor',
  'mask': 'Mask NRE',
  'architecture-block': 'Architecture',
};

export default function CostContributorView({ contributors, fullyLoadedCost }: CostContributorViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const totalPct = contributors.reduce((s, c) => s + c.percentageOfTotal, 0);

  if (contributors.length === 0) {
    return (
      <div className="border-2 border-dashed border-art-ink/10 rounded-xl p-12 text-center bg-white">
        <BarChart3 className="w-10 h-10 text-art-rust/30 mx-auto mb-3" />
        <p className="text-sm font-semibold text-art-ink/50">No cost contributor data available.</p>
        <p className="text-xs text-art-ink/40 mt-1">Configure build parameters to generate a cost breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-serif font-black text-art-ink">Cost Contributor Waterfall</h2>
          <p className="text-[10px] text-art-ink/50 font-mono mt-0.5">
            Fully loaded unit cost: <span className="text-art-ink font-bold">${fullyLoadedCost.toFixed(2)}</span>
            {' '}· {contributors.length} contributors
          </p>
        </div>
      </div>

      {/* Stacked horizontal bar */}
      <div className="bg-white rounded-xl border-2 border-art-ink/10 overflow-hidden">
        <div className="p-5 pb-3">
          <div className="flex items-center space-x-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-art-rust" />
            <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Cost Stack</span>
          </div>
          <svg width="100%" height="40" className="block">
            <rect x="0" y="0" width="100%" height="36" rx="6" fill="#F3F4F6" />
            {contributors.map((c, i) => {
              const xOffset = contributors.slice(0, i).reduce((s, c2) => s + (c2.percentageOfTotal / totalPct) * 100, 0);
              const width = (c.percentageOfTotal / totalPct) * 100;
              const isHovered = hoveredIdx === i;
              return (
                <rect
                  key={c.name}
                  x={`${xOffset}%`}
                  y="0"
                  width={`${width}%`}
                  height="36"
                  rx={i === 0 ? '6' : i === contributors.length - 1 ? '0 6 6 0' : '0'}
                  fill={CATEGORY_COLORS[c.category] || '#6B7280'}
                  opacity={isHovered ? 1 : 0.85}
                  stroke={isHovered ? '#1F2937' : 'none'}
                  strokeWidth={isHovered ? 2 : 0}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ transition: 'opacity 0.15s, stroke 0.15s', cursor: 'pointer' }}
                />
              );
            })}
          </svg>
          {/* Mini legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {contributors.map((c, i) => (
              <div
                key={c.name}
                className="flex items-center space-x-1 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#6B7280' }} />
                <span className="text-[9px] font-mono text-art-ink/60">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranked contributor list */}
      <div className="bg-white rounded-xl border-2 border-art-ink/10 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center space-x-1.5 mb-4">
            <TrendingUp className="w-4 h-4 text-art-rust" />
            <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">Ranked Contributors</span>
          </div>
          <div className="space-y-2">
            {contributors.map((c, i) => {
              const isHovered = hoveredIdx === i;
              const barWidth = totalPct > 0 ? (c.percentageOfTotal / totalPct) * 100 : 0;
              return (
                <div
                  key={c.name}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isHovered ? 'border-art-ink/30 bg-art-cream/40' : 'border-art-ink/5 bg-white'
                  }`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] font-mono font-bold text-art-ink/30 w-5">#{i + 1}</span>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#6B7280' }} />
                      <div>
                        <span className="text-xs font-bold text-art-ink">{c.name}</span>
                        <span className="text-[9px] font-mono text-art-ink/40 ml-2 uppercase">{CATEGORY_LABELS[c.category] || c.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-art-ink">${c.costPerUnit.toFixed(2)}</span>
                      <span className="text-[10px] font-mono text-art-ink/50 ml-2">{c.percentageOfTotal.toFixed(1)}%</span>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: CATEGORY_COLORS[c.category] || '#6B7280',
                      }}
                    />
                  </div>
                  {isHovered && (
                    <p className="text-[10px] text-art-ink/50 mt-2 italic leading-relaxed border-t border-art-ink/5 pt-2">{c.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-art-cream/30 border-2 border-art-ink/10 rounded-xl p-4">
        <div className="flex items-center space-x-1.5 mb-2">
          <HelpCircle className="w-4 h-4 text-art-rust" />
          <span className="text-[10px] font-bold text-art-ink/50 uppercase tracking-[0.15em] font-mono">What drives this cost?</span>
        </div>
        <p className="text-xs text-art-ink/60 leading-relaxed">
          The largest cost contributor is <strong className="text-art-ink">{contributors[0]?.name}</strong> at{' '}
          <strong className="text-art-ink">{contributors[0]?.percentageOfTotal.toFixed(1)}%</strong> of fully loaded unit cost
          (${contributors[0]?.costPerUnit.toFixed(2)}/unit).{' '}
          {contributors[0] && contributors[0].costPerUnit > fullyLoadedCost * 0.5
            ? 'This single component accounts for over half the total cost — any savings here have outsized impact.'
            : contributors[0] && contributors[0].costPerUnit > fullyLoadedCost * 0.3
            ? 'Reducing this contributor offers the highest leverage for margin improvement.'
            : 'Cost is distributed across multiple contributors, suggesting a portfolio approach to cost reduction.'}
        </p>
      </div>
    </div>
  );
}

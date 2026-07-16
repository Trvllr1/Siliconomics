import React from 'react';
import { SupplyChainSnapshot, CommodityPrice } from '../types';
import { DEFAULT_COMMODITY_PRICES } from '../data/defaultCommodityPrices';
import { ShieldAlert, Truck, Globe, Clock, DollarSign, AlertTriangle, BarChart3, Package, Cpu, Wrench } from 'lucide-react';

interface SupplyChainViewProps {
  supplyChain: SupplyChainSnapshot;
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-50 border-green-200 text-green-700',
  moderate: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  elevated: 'bg-orange-50 border-orange-200 text-orange-700',
  high: 'bg-red-50 border-red-200 text-red-700',
  critical: 'bg-rose-100 border-rose-300 text-rose-800',
};

const RISK_GLYPH: Record<string, string> = {
  low: '\u25B2',
  moderate: '\u25B6',
  elevated: '\u25B6',
  high: '\u25BC',
  critical: '\u2620',
};

export default function SupplyChainView({ supplyChain }: SupplyChainViewProps) {
  const sc = supplyChain;

  const riskBarWidth = Math.min(sc.compositeRiskScore, 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Composite Risk Score card */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-art-rust" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-art-ink">Composite Risk</h4>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${RISK_COLORS[sc.riskLevel]}`}>
              {RISK_GLYPH[sc.riskLevel]} {sc.riskLevel.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-art-ink/60 font-mono">Score</span>
              <span className="font-bold font-mono">{sc.compositeRiskScore}%</span>
            </div>
            <div className="w-full h-2 bg-art-cream rounded-full overflow-hidden border border-art-ink/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sc.compositeRiskScore >= 70 ? 'bg-rose-500'
                  : sc.compositeRiskScore >= 50 ? 'bg-red-500'
                  : sc.compositeRiskScore >= 30 ? 'bg-orange-500'
                  : sc.compositeRiskScore >= 15 ? 'bg-yellow-500'
                  : 'bg-green-500'
                }`}
                style={{ width: `${riskBarWidth}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-art-ink/5">
            <div>
              <span className="text-[9px] font-mono text-art-ink/40 block">High-Risk Blocks</span>
              <span className="text-sm font-bold">{sc.highRiskBlockCount} / {sc.totalBlockCount}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-art-ink/40 block">Risk Adder</span>
              <span className="text-sm font-bold">${sc.riskAdjustedCostAdder}/wafer</span>
            </div>
          </div>
        </div>

        {/* Commodity Cost card */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-art-rust" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-art-ink">Commodity Cost</h4>
          </div>
          <div className="text-2xl font-serif font-black">${sc.commodityCostPerUnit.toFixed(2)}</div>
          <span className="text-[9px] text-art-ink/40 font-mono block">per unit (wafer + packaging)</span>
          <div className="space-y-1.5 pt-2 border-t border-art-ink/5">
            {sc.topCommodityCosts.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-art-ink/70">{c.name}</span>
                <span className="font-mono font-bold">${c.costPerUnit.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-scores card */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-art-rust" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-art-ink">Risk Factors</h4>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center space-x-1.5 text-art-ink/70">
                  <Truck className="w-3 h-3" />
                  <span>Supplier Concentration</span>
                </span>
                <span className="font-mono font-bold">{sc.supplierConcentrationScore.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-art-cream rounded-full overflow-hidden border border-art-ink/5">
                <div className="h-full bg-art-rust rounded-full" style={{ width: `${Math.min(sc.supplierConcentrationScore, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center space-x-1.5 text-art-ink/70">
                  <Globe className="w-3 h-3" />
                  <span>Geopolitical Exposure</span>
                </span>
                <span className="font-mono font-bold">{sc.geopoliticalRiskScore.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-art-cream rounded-full overflow-hidden border border-art-ink/5">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(sc.geopoliticalRiskScore, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center space-x-1.5 text-art-ink/70">
                  <Clock className="w-3 h-3" />
                  <span>Lead Time Volatility</span>
                </span>
                <span className="font-mono font-bold">{sc.leadTimeVolatilityScore.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-art-cream rounded-full overflow-hidden border border-art-ink/5">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(sc.leadTimeVolatilityScore, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commodity Reference Pricing Table */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-art-rust" />
          <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-art-ink">Commodity Reference Pricing</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-art-ink/10">
                <th className="text-left py-2 px-2 text-[9px] font-bold font-mono text-art-ink/40 uppercase tracking-wider">Commodity</th>
                <th className="text-right py-2 px-2 text-[9px] font-bold font-mono text-art-ink/40 uppercase tracking-wider">Price (USD)</th>
                <th className="text-left py-2 px-2 text-[9px] font-bold font-mono text-art-ink/40 uppercase tracking-wider">Unit</th>
                <th className="text-left py-2 px-2 text-[9px] font-bold font-mono text-art-ink/40 uppercase tracking-wider">Source Region</th>
                <th className="text-left py-2 px-2 text-[9px] font-bold font-mono text-art-ink/40 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_COMMODITY_PRICES.map((cp) => (
                <tr key={cp.id} className="border-b border-art-ink/5 hover:bg-art-cream/20">
                  <td className="py-2 px-2 font-bold">{cp.name}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold">${cp.priceUsd.toFixed(2)}</td>
                  <td className="py-2 px-2 text-art-ink/60">{cp.unit}</td>
                  <td className="py-2 px-2 text-art-ink/60">{cp.region}</td>
                  <td className="py-2 px-2 text-art-ink/40 max-w-[200px] truncate" title={cp.notes}>{cp.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Interpretation Card */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center space-x-2 text-amber-700">
          <AlertTriangle className="w-4 h-4" />
          <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono">Supply Chain Intelligence</h4>
        </div>
        <p className="text-xs text-amber-800/80 leading-relaxed">
          {sc.compositeRiskScore >= 70
            ? 'Critical supply chain exposure. Multiple blocks carry high risk. Consider supplier diversification, safety stock, and alternative sourcing before tapeout.'
            : sc.compositeRiskScore >= 50
            ? 'Elevated supply chain risk. Key blocks have medium-to-high dependency on concentrated suppliers. Review single-source dependencies and geopolitical exposure.'
            : sc.compositeRiskScore >= 30
            ? 'Moderate supply chain risk. Some blocks carry non-trivial exposure. Standard dual-sourcing and inventory buffers recommended.'
            : sc.compositeRiskScore >= 15
            ? 'Low supply chain risk. Minor dependencies managed through standard procurement practices.'
            : 'Minimal supply chain risk. All blocks rated low or no risk. Standard procurement is sufficient.'}
        </p>
        <p className="text-[10px] text-amber-700/60 font-mono">
          Risk-adjusted cost adder: ${sc.riskAdjustedCostAdder.toFixed(2)} per wafer
          {sc.totalBlockCount > 0
            ? ` \u00B7 ${sc.highRiskBlockCount} of ${sc.totalBlockCount} blocks flagged high risk`
            : ' \u00B7 No architecture blocks defined'}
        </p>
      </div>
    </div>
  );
}

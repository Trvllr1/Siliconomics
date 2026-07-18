/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import { Build } from '../types';
import { calculateMurphyYield, calculateDPW, round, ComputedBuildMetrics } from '../utils/mathEngine';
import { computeTimeProjection } from '../utils/timeEngine';
import { TrendingUp, DollarSign, Percent, Clock, BarChart3, TrendingDown } from 'lucide-react';

interface ChartsViewProps {
  activeBuild: Build;
  computedMetrics: ComputedBuildMetrics;
}

export default function ChartsView({ activeBuild, computedMetrics }: ChartsViewProps) {
  const dm = activeBuild.designModel;
  const snap = computedMetrics.snapshot;

  // 1. Generate Yield Curve Data: Plot Murphy Yield and Dies Per Wafer over varying Die Areas (50mm2 to 600mm2)
  const yieldCurveData = [];
  for (let area = 50; area <= 600; area += 25) {
    const rawYield = calculateMurphyYield(area, dm.defectDensity);
    const dpw = calculateDPW(area);
    const goodDies = dpw * rawYield;
    
    yieldCurveData.push({
      area,
      yieldPercentage: round(rawYield * 100, 1),
      dpw,
      goodDies: round(goodDies, 1),
    });
  }

  // 2. Generate Cost Stack Breakdown
  const costBreakdownData = [
    {
      name: 'Packaged Unit Cost',
      'Raw Die Cost': round(snap.rawDieCost, 2),
      'Assembly/Pkg Cost': round(dm.packagingCost, 2),
      'Electrical Test Cost': round(dm.testTimeSeconds * dm.testCostPerSecond, 2),
    },
  ];

  // 3. Generate Sensitivity Data over Defect Density (D0: 0.02 to 0.35 defects/cm2)
  const sensitivityData = [];
  for (let d0 = 0.02; d0 <= 0.35; d0 += 0.03) {
    let computedYield: number;
    let dieCost: number;

    if (dm.topology === 'monolithic') {
      computedYield = calculateMurphyYield(dm.dieArea, d0);
      const dpwVal = calculateDPW(dm.dieArea);
      const rawCost = dm.waferCost / Math.max(1, dpwVal * computedYield);
      dieCost = (rawCost + dm.packagingCost + (dm.testTimeSeconds * dm.testCostPerSecond)) / (dm.testYield / 100);
    } else {
      // Chiplet
      const coreYield = calculateMurphyYield(dm.dieArea, d0);
      const coreDPW = calculateDPW(dm.dieArea);
      const coreCost = dm.waferCost / Math.max(1, coreDPW * coreYield);

      const ioYield = calculateMurphyYield(dm.ioDieArea, d0);
      const ioDPW = calculateDPW(dm.ioDieArea);
      const ioCost = dm.waferCost / Math.max(1, ioDPW * ioYield);

      const rawCost = (coreCost * dm.chipletCount) + ioCost;
      const sysYield = Math.pow(coreYield, dm.chipletCount) * ioYield * (dm.packagingYield / 100);
      computedYield = sysYield;
      dieCost = (rawCost + dm.packagingCost + (dm.testTimeSeconds * dm.testCostPerSecond)) / (dm.testYield / 100);
    }

    sensitivityData.push({
      d0: round(d0, 2),
      Yield: round(computedYield * 100, 1),
      'Packaged Unit Cost ($)': round(dieCost, 1),
    });
  }

  // Active build's operating coordinates for markers
  const activeArea = round(snap.totalDieArea, 1);
  const activeYield = round(snap.dieYield * 100, 1);

  return (
    <div className="space-y-6 font-sans">
      {/* Chart 1: Murphy's Yield Curve */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-art-ink/5">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-mono font-bold text-art-ink uppercase tracking-widest">
              Murphy Yield & Good Dies Curve
            </h3>
          </div>
          <span className="text-[10px] text-art-ink/70 bg-art-cream/60 border border-art-ink/10 rounded-lg px-2.5 py-1 font-mono">
            D0 = {dm.defectDensity} defects/cm²
          </span>
        </div>
        
        <p className="text-[11px] text-art-ink/60 mb-5 leading-relaxed font-sans">
          Plotting product yield (left axis) and good dies harvested per wafer (right axis) against varying die size. 
          The terracotta marker represents this build's active size/yield configuration.
        </p>

        <div className="h-[240px] w-full text-[10px] font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yieldCurveData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 242, 238, 0.1)" />
              <XAxis 
                dataKey="area" 
                tickLine={false} 
                stroke="#DFDCD6" 
                style={{ opacity: 0.6 }}
                tickFormatter={(val) => `${val} mm²`}
              />
              <YAxis 
                yAxisId="left"
                tickLine={false} 
                stroke="#D94E33" 
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickLine={false} 
                stroke="#5E7A68" 
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(217, 78, 51, 0.3)', color: '#F7F5F2', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                formatter={(value, name) => [value, name === 'yieldPercentage' ? 'Yield' : name === 'goodDies' ? 'Good Dies/Wafer' : 'DPW']}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="yieldPercentage" 
                name="Yield Percentage" 
                stroke="#D94E33" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="goodDies" 
                name="Good Dies/Wafer" 
                stroke="#5E7A68" 
                strokeWidth={2.5}
                dot={false}
              />
              
              {/* Highlight Dot representing current build coordinates */}
              <ReferenceDot 
                yAxisId="left"
                x={activeArea} 
                y={activeYield} 
                r={7} 
                fill="#D94E33" 
                stroke="#ffffff" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 2: Cost Stack Breakdown */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-art-ink/5">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-art-rust" />
              <h3 className="text-xs font-mono font-bold text-art-ink uppercase tracking-widest">
                Packaged Unit Cost Stack
              </h3>
            </div>
            <span className="text-[10px] font-mono text-art-ink/80 bg-art-cream/80 px-2.5 py-1 rounded-lg border border-art-ink/10">
              Total: ${snap.grossCostPerGoodDie.toFixed(2)}
            </span>
          </div>
          
          <p className="text-[11px] text-art-ink/60 mb-5 leading-relaxed font-sans">
            Breakdown of unit cost components (COGS) amortized after yield losses.
          </p>

          <div className="h-[220px] w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdownData} layout="vertical" margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 242, 238, 0.1)" horizontal={false} />
                <XAxis type="number" stroke="#DFDCD6" style={{ opacity: 0.6 }} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis type="category" dataKey="name" stroke="#DFDCD6" style={{ opacity: 0.6 }} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(217, 78, 51, 0.3)', color: '#F7F5F2', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                  formatter={(value) => [`$${value}`, '']}
                />
                <Legend iconType="rect" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Raw Die Cost" stackId="a" fill="#D94E33" barSize={32} />
                <Bar dataKey="Assembly/Pkg Cost" stackId="a" fill="#BFA173" />
                <Bar dataKey="Electrical Test Cost" stackId="a" fill="#665E54" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: D0 Yield & Cost Sensitivity Analysis */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-art-ink/5">
            <div className="flex items-center space-x-2">
              <Percent className="w-4 h-4 text-art-rust" />
              <h3 className="text-xs font-mono font-bold text-art-ink uppercase tracking-widest">
                Process Maturity Cost Sensitivity
              </h3>
            </div>
          </div>
          
          <p className="text-[11px] text-art-ink/60 mb-5 leading-relaxed font-sans">
            Observing how Unit Cost (left axis) increases exponentially as Defect Density (D0) worsens (x-axis).
          </p>

          <div className="h-[220px] w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensitivityData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 242, 238, 0.1)" />
                <XAxis 
                  dataKey="d0" 
                  tickLine={false} 
                  stroke="#DFDCD6" 
                  style={{ opacity: 0.6 }}
                  tickFormatter={(val) => `${val}/cm²`}
                />
                <YAxis 
                  tickLine={false} 
                  stroke="#D94E33" 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(217, 78, 51, 0.3)', color: '#F7F5F2', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                  formatter={(value, name) => [String(name).includes('Cost') ? `$${value}` : `${value}%`, String(name)]}
                />
                <Line 
                  type="monotone" 
                  dataKey="Packaged Unit Cost ($)" 
                  stroke="#D94E33" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                
                {/* Active Build's Current D0 representation */}
                <ReferenceLine 
                  x={dm.defectDensity} 
                  stroke="#BFA173" 
                  strokeDasharray="4 4"
                  label={{ value: 'Current D0', position: 'insideTopLeft', fill: '#F4F2EE', fontSize: 9, fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 'bold' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TIME-DIMENSION CHARTS (only when timeModel is present) */}
      {activeBuild.timeModel && (() => {
        const timeResult = computeTimeProjection(activeBuild);
        const proj = timeResult.projection;

        // Chart 4: Quarterly Revenue & Margin Waterfall
        const revenueMarginData = proj.map(q => ({
          quarter: q.label,
          qIdx: q.quarter,
          revenueM: q.revenueM,
          cogsM: q.cogsM,
          grossProfitM: q.grossProfitM,
          grossMarginPct: q.revenueM > 0 ? round((q.grossProfitM / q.revenueM) * 100, 1) : 0,
          isRespin: q.isRespinQuarter,
        }));

        // Chart 5: Cumulative Cash Flow with Break-Even
        const cashFlowData = proj.map(q => ({
          quarter: q.label,
          qIdx: q.quarter,
          cumulativeCashFlowM: q.cumulativeCashFlowM,
          netProfitM: q.netProfitM,
          cumulativeNreM: q.cumulativeNreM,
          isRespin: q.isRespinQuarter,
        }));

        // Also compute baseline cash flow for respin overlay
        let baselineCFData: typeof cashFlowData | null = null;
        if (timeResult.withRespin) {
          let cum = 0;
          baselineCFData = timeResult.baseline.projections.map(q => {
            cum += q.netProfitM;
            return {
              quarter: q.label,
              qIdx: q.quarter,
              cumulativeCashFlowM: cum,
              netProfitM: q.netProfitM,
              cumulativeNreM: q.cumulativeNreM,
              isRespin: false,
            };
          });
        }

        // Chart 6: Yield-Ramp Curve (D0 + Die Yield over time)
        const yieldRampData = proj.map(q => ({
          quarter: q.label,
          qIdx: q.quarter,
          d0: round(q.d0 * 100, 2),   // /cm² × 100 for display
          dieYieldPct: round(q.dieYield * 100, 1),
          effectiveYieldPct: round(q.effectiveYield * 100, 1),
          supplyUnitsM: round(q.supplyUnits / 1e6, 2),
          goodUnitsM: round(q.goodUnits / 1e6, 2),
          isRespin: q.isRespinQuarter,
        }));

        const beQ = timeResult.breakEvenQuarter;

        return (
          <div className="space-y-6 mt-6 pt-6 border-t-2 border-art-ink/10">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-art-rust" />
              <h3 className="text-xs font-mono font-bold text-art-ink uppercase tracking-widest">
                Time-Dimensioned Projections
              </h3>
              <span className="text-[9px] bg-art-ink/5 text-art-ink/50 border border-art-ink/10 px-2 py-0.5 rounded-full font-mono font-bold ml-2">
                {proj.length} quarters · {timeResult.programConstraint}
              </span>
            </div>

            {/* Chart 4: Quarterly Revenue & Gross Margin */}
            <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-art-ink/5">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-art-rust" />
                  <h3 className="text-xs font-mono font-bold text-art-ink uppercase tracking-widest">
                    Quarterly Revenue & Gross Margin
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-art-ink/80 bg-art-cream/80 px-2.5 py-1 rounded-lg border border-art-ink/10">
                  Total Rev: ${round(revenueMarginData.reduce((s, r) => s + r.revenueM, 0), 0)}M
                </span>
              </div>

              <p className="text-[11px] text-art-ink/60 mb-5 leading-relaxed font-sans">
                Quarterly revenue (bars, left axis) and gross margin percentage (line, right axis) across the {proj.length}-quarter projection horizon.
                {activeBuild.timeModel.annualAspErosionPct > 0 && ` ASP erodes ${activeBuild.timeModel.annualAspErosionPct}%/year.`}
                {activeBuild.timeModel.respin?.probability ? ` Respin risk: ${(activeBuild.timeModel.respin.probability * 100).toFixed(0)}%.` : ''}
              </p>

              <div className="h-[240px] w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueMarginData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 242, 238, 0.15)" />
                    <XAxis dataKey="quarter" tickLine={false} stroke="#DFDCD6" style={{ opacity: 0.6 }} interval={3} />
                    <YAxis yAxisId="left" tickLine={false} stroke="#D94E33" tickFormatter={(val) => `$${val}M`} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} stroke="#5E7A68" domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(217, 78, 51, 0.3)', color: '#F7F5F2', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                      formatter={(value: any, name: any) => {
                        const v = Number(value) || 0;
                        if (name === 'Revenue') return [`$${v}M`, name];
                        if (name === 'COGS') return [`$${v}M`, name];
                        if (name === 'Gross Margin %') return [`${v}%`, name];
                        return [v, name];
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                    <Bar yAxisId="left" dataKey="revenueM" name="Revenue" fill="#D94E33" barSize={12} opacity={0.85} />
                    <Bar yAxisId="left" dataKey="cogsM" name="COGS" fill="#665E54" barSize={12} opacity={0.6} />
                    <Line yAxisId="right" type="monotone" dataKey="grossMarginPct" name="Gross Margin %" stroke="#5E7A68" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    {timeResult.withRespin && timeResult.withRespin.projections.map(q => q.isRespinQuarter).some(Boolean) && (
                      <ReferenceLine x={revenueMarginData.find(d => d.isRespin)?.quarter ?? ''} stroke="#BFA173" strokeDasharray="4 4" label={{ value: 'Respin', position: 'insideTopRight', fill: '#BFA173', fontSize: 9 }} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 5: Cumulative Cash Flow with Break-Even */}
              <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-art-ink/5">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-art-rust" />
                    <h3 className="text-xs font-mono font-bold text-art-ink uppercase tracking-widest">
                      Cumulative Cash Flow
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-art-ink/80 bg-art-cream/80 px-2.5 py-1 rounded-lg border border-art-ink/10">
                    {beQ != null ? `BE at Q${beQ + 1}` : 'No break-even'}
                  </span>
                </div>

                <p className="text-[11px] text-art-ink/60 mb-5 leading-relaxed font-sans">
                  Cumulative net cash flow over the program horizon. The dashed line marks the break-even quarter where cumulative cash flow turns non-negative.
                  {timeResult.withRespin && ' The lighter line shows the baseline (no respin) scenario for comparison.'}
                </p>

                <div className="h-[220px] w-full text-[10px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 242, 238, 0.15)" />
                      <XAxis dataKey="quarter" tickLine={false} stroke="#DFDCD6" style={{ opacity: 0.6 }} interval={3} />
                      <YAxis tickLine={false} stroke="#D94E33" tickFormatter={(val) => `$${val}M`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(217, 78, 51, 0.3)', color: '#F7F5F2', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                        formatter={(value: any, name: any) => {
                          const v = Number(value) || 0;
                          const label = name === 'cumulativeCashFlowM' ? 'Expected (respin-weighted)' : name === 'baselineCashFlowM' ? 'Baseline (no respin)' : name;
                          return [`$${v}M`, label];
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />

                      {/* Baseline overlay (no respin) */}
                      {baselineCFData && (
                        <Area type="monotone" data={baselineCFData} dataKey="cumulativeCashFlowM" name="Baseline (no respin)" stroke="#BFA173" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
                      )}

                      <Area type="monotone" dataKey="cumulativeCashFlowM" name="Expected (respin-weighted)" stroke="#D94E33" strokeWidth={2.5} fill="#D94E33" fillOpacity={0.08} dot={false} activeDot={{ r: 5 }} />

                      {/* Break-even reference line */}
                      {beQ != null && (
                        <ReferenceLine
                          y={0}
                          stroke="#5E7A68"
                          strokeWidth={1.5}
                          strokeDasharray="6 3"
                          label={{ value: `Break-Even Q${beQ + 1}`, position: 'insideBottomRight', fill: '#5E7A68', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                        />
                      )}

                      {/* Respin marker */}
                      {cashFlowData.filter(d => d.isRespin).map((d) => (
                        <ReferenceDot key={`respin-${d.qIdx}`} x={d.quarter} y={d.cumulativeCashFlowM} r={6} fill="#BFA173" stroke="#fff" strokeWidth={1.5} />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 6: Yield-Ramp Curve */}
              <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-art-ink/5">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-art-rust" />
                    <h3 className="text-xs font-mono font-bold text-art-ink uppercase tracking-widest">
                      D0 Yield-Learning & Volume Ramp
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-art-ink/80 bg-art-cream/80 px-2.5 py-1 rounded-lg border border-art-ink/10">
                    {activeBuild.timeModel.rampShape} ramp · τ={activeBuild.timeModel.d0Tau}q
                  </span>
                </div>

                <p className="text-[11px] text-art-ink/60 mb-5 leading-relaxed font-sans">
                  Defect density improvement (D0, left axis inverted) and shipped volume (right axis) per quarter.
                  Yield-learning follows the parametric curve D0(q) = D0_mature + (D0_initial − D0_mature)·e^(−q/τ).
                </p>

                <div className="h-[220px] w-full text-[10px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={yieldRampData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 242, 238, 0.15)" />
                      <XAxis dataKey="quarter" tickLine={false} stroke="#DFDCD6" style={{ opacity: 0.6 }} interval={3} />
                      <YAxis yAxisId="left" tickLine={false} stroke="#D94E33" domain={[0, 'auto']} reversed tickFormatter={(val) => `${val} c/cm²`} />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} stroke="#5E7A68" domain={[0, 'auto']} tickFormatter={(val) => `${val}M`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(217, 78, 51, 0.3)', color: '#F7F5F2', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                        formatter={(value: any, name: any) => {
                          const v = Number(value) || 0;
                          if (name === 'D0') return [`${v} c/cm²`, name];
                          if (name === 'Shipped Volume') return [`${v}M units`, name];
                          return [v, name];
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                      <Area yAxisId="left" type="monotone" dataKey="d0" name="D0" stroke="#D94E33" strokeWidth={2.5} fill="#D94E33" fillOpacity={0.1} dot={false} activeDot={{ r: 5 }} />
                      <Area yAxisId="right" type="monotone" dataKey="goodUnitsM" name="Shipped Volume" stroke="#5E7A68" strokeWidth={2.5} fill="#5E7A68" fillOpacity={0.08} dot={false} activeDot={{ r: 5 }} />
                      {yieldRampData.filter(d => d.isRespin).map((d) => (
                        <ReferenceDot key={`respin-${d.qIdx}`} yAxisId="left" x={d.quarter} y={d.d0} r={6} fill="#BFA173" stroke="#fff" strokeWidth={1.5} />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Program Constraint Banner */}
            <div className={`px-5 py-3 rounded-xl border-2 text-xs font-mono flex items-center space-x-3 ${
              timeResult.programConstraint === 'supply' ? 'bg-orange-50 border-orange-200 text-orange-800' :
              timeResult.programConstraint === 'demand' ? 'bg-blue-50 border-blue-200 text-blue-800' :
              'bg-green-50 border-green-200 text-green-800'
            }`}>
              <span className="font-bold uppercase tracking-wider text-[9px]">
                {timeResult.programConstraint === 'supply' ? '⚠ Supply-Constrained' :
                 timeResult.programConstraint === 'demand' ? 'ℹ Demand-Constrained' : '✓ Balanced'}
              </span>
              <span className="opacity-80">{timeResult.constraintExplanation}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

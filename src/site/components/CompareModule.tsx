import { useState } from 'react';
import { motion } from 'motion/react';

import { getDefaultBuild, getComparisonBuild, computeMetricsForBuild } from '../lib/engineAccess';
import ProvenanceStamp from './ProvenanceStamp';

const buildA = getDefaultBuild();
const buildB = getComparisonBuild();
const metricsA = computeMetricsForBuild(buildA).snapshot;
const metricsB = computeMetricsForBuild(buildB).snapshot;

const ROWS = [
  { label: 'Process Node', a: buildA.designModel.processNode, b: buildB.designModel.processNode },
  { label: 'Die Area', a: `${buildA.designModel.dieArea}mm²`, b: `${buildB.designModel.dieArea}mm²` },
  { label: 'Topology', a: buildA.designModel.topology, b: buildB.designModel.topology },
  { label: 'Dies/Wafer', a: metricsA.dpw.toString(), b: metricsB.dpw.toString() },
  { label: 'Die Yield', a: `${(metricsA.dieYield * 100).toFixed(1)}%`, b: `${(metricsB.dieYield * 100).toFixed(1)}%` },
  { label: 'Unit Cost', a: `$${metricsA.fullyLoadedCostPerDie.toFixed(2)}`, b: `$${metricsB.fullyLoadedCostPerDie.toFixed(2)}` },
  { label: 'Gross Margin', a: `${metricsA.grossMargin.toFixed(1)}%`, b: `${metricsB.grossMargin.toFixed(1)}%` },
  { label: 'Break-Even', a: `${metricsA.breakEvenVolumeMillion.toFixed(1)}M`, b: `${metricsB.breakEvenVolumeMillion.toFixed(1)}M` },
  { label: 'Wafer Cost', a: `$${buildA.designModel.waferCost.toLocaleString()}`, b: `$${buildB.designModel.waferCost.toLocaleString()}` },
];

function isDeltaSignificant(a: string, b: string): 'higher' | 'lower' | 'same' {
  const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
  const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
  if (isNaN(numA) || isNaN(numB)) return 'same';
  const ratio = numB / numA;
  if (ratio > 1.05) return 'higher';
  if (ratio < 0.95) return 'lower';
  return 'same';
}

export default function CompareModule() {
  const [thirdColumn, setThirdColumn] = useState(false);

  return (
    <div className="glow-card rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-art-ink font-mono">Monolithic vs Chiplet</h3>
        <label className="flex items-center gap-2 text-[10px] font-mono text-art-ink/50 cursor-pointer">
          <input
            type="checkbox"
            checked={thirdColumn}
            onChange={e => setThirdColumn(e.target.checked)}
            className="accent-art-rust"
          />
          Show N3 column
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono" aria-label="Monolithic vs Chiplet comparison">
          <thead>
            <tr className="border-b border-art-ink/10">
              <th scope="col" className="text-left py-2 pr-4 text-[9px] text-art-ink/40 uppercase tracking-wider">Metric</th>
              <th scope="col" className="text-right py-2 px-4 text-[9px] text-art-ink/40 uppercase tracking-wider">
                {buildA.name}
              </th>
              <th scope="col" className="text-right py-2 px-4 text-[9px] text-art-ink/40 uppercase tracking-wider">
                {buildB.name}
              </th>
              {thirdColumn && (
                <th scope="col" className="text-right py-2 pl-4 text-[9px] text-art-ink/40 uppercase tracking-wider">
                  N3 (est.)
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => {
              const delta = isDeltaSignificant(row.a, row.b);
              return (
                <motion.tr
                  key={row.label}
                  className="border-b border-art-ink/5"
                  initial={{ backgroundColor: 'transparent' }}
                  whileHover={{ backgroundColor: 'rgba(240, 246, 252, 0.03)' }}
                  transition={{ duration: 0.12 }}
                >
                  <td className="py-2.5 pr-4 text-art-ink/60">{row.label}</td>
                  <td className="text-right py-2.5 px-4 font-bold text-art-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{row.a}</td>
                  <td className={`text-right py-2.5 px-4 font-bold ${
                    delta === 'higher' ? 'text-risk-crimson' : delta === 'lower' ? 'text-ver-green' : 'text-art-ink'
                  }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.b}
                    {delta !== 'same' && (
                      <motion.span
                        className="ml-1 text-[9px]"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        {delta === 'higher' ? '▲' : '▼'}
                      </motion.span>
                    )}
                  </td>
                  {thirdColumn && (
                    <td className="text-right py-2.5 pl-4 text-art-ink/50">—</td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-2 items-center text-[9px] font-mono text-art-ink/50">
        <span className="inline-block w-2 h-2 rounded-full bg-ver-green" aria-hidden="true" />
        <span>Lower is better</span>
        <span className="inline-block w-2 h-2 rounded-full bg-risk-crimson ml-3" aria-hidden="true" />
        <span>Higher is better</span>
      </div>

      <ProvenanceStamp className="mt-4" />
    </div>
  );
}

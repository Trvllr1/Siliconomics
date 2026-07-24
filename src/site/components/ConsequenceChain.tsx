import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import { computeBuildMetrics } from '../../utils/mathEngine';

const build = DEFAULT_BUILDS[0]!;
const dm = build.designModel;
const metrics = computeBuildMetrics(build);
const s = metrics.snapshot;

const NODES = [
  { id: 'area', label: 'Die Area', value: `${dm.dieArea}mm²`, formula: 'A = width × height', color: '#00BFA6', bgColor: 'rgba(0,191,166,0.12)', borderColor: 'rgba(0,191,166,0.4)' },
  { id: 'dpw', label: 'DPW', value: `${s.dpw}`, formula: 'DPW = (π·d²)/(4·A) − (π·d)/√(2·A)', color: '#5B9DFF', bgColor: 'rgba(91,157,255,0.12)', borderColor: 'rgba(91,157,255,0.4)' },
  { id: 'yield', label: 'Yield', value: `${(s.dieYield * 100).toFixed(1)}%`, formula: 'Y = ((1 − e^(−A·D0)) / (A·D0))²', color: '#FBBF24', bgColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.4)' },
  { id: 'cost', label: 'Unit Cost', value: `$${s.fullyLoadedCostPerDie.toFixed(2)}`, formula: 'Cost = wafer / (DPW × yield) + P&T + NRE', color: '#D9B45B', bgColor: 'rgba(217,180,91,0.12)', borderColor: 'rgba(217,180,91,0.4)' },
  { id: 'margin', label: 'Gross Margin', value: `${s.grossMargin.toFixed(1)}%`, formula: 'Margin = (ASP − cost) / ASP', color: '#F87171', bgColor: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.4)' },
  { id: 'breakeven', label: 'Break-Even', value: `${s.breakEvenVolumeMillion.toFixed(1)}M`, formula: 'B/E = NRE / (ASP − variable cost)', color: '#00BFA6', bgColor: 'rgba(0,191,166,0.12)', borderColor: 'rgba(0,191,166,0.4)' },
];

export default function ConsequenceChain() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="py-8">
      <div className="overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
        <div className="flex items-center justify-center gap-0 min-w-max md:min-w-0" role="list" aria-label="Formula dependency chain">
          {NODES.map((node, i) => (
            <div key={node.id} className="flex items-center" role="listitem">
              <div
                className="relative"
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-describedby={hoveredId === node.id ? `tooltip-${node.id}` : undefined}
              >
                <div className={`px-4 py-3 rounded-lg border text-center transition-all cursor-default min-w-[100px] ${
                  hoveredId === node.id
                    ? 'border-art-rust bg-art-rust/10 shadow-[0_0_20px_rgba(0,191,166,0.15)]'
                    : 'hover:border-art-ink/20'
                }`} style={hoveredId === node.id ? {} : { backgroundColor: node.bgColor, borderColor: node.borderColor }}>
                  <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: hoveredId === node.id ? undefined : node.color, opacity: hoveredId === node.id ? 0.4 : 0.8 }}>{node.label}</div>
                  <div className="text-sm font-mono font-bold text-art-ink mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{node.value}</div>
                </div>
                <AnimatePresence>
                  {hoveredId === node.id && (
                    <motion.div
                      id={`tooltip-${node.id}`}
                      role="tooltip"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-surface-1 border border-art-ink/15 rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.45)] p-3 min-w-[200px] z-10"
                    >
                      <p className="text-[10px] font-mono text-art-ink/70">{node.formula}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {i < NODES.length - 1 && (
                <div className="w-8 h-px mx-1" style={{ background: `linear-gradient(90deg, ${node.color}66, ${NODES[i + 1]!.color}66)` }} aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-[10px] font-mono text-art-ink/50 mt-4">
        The product thesis in one glance — every number computed live
      </p>
    </div>
  );
}

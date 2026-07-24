import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import ProvenanceStamp from './ProvenanceStamp';
import ProductFrame from './ProductFrame';

interface PillarCardProps {
  title: string;
  description: string;
  proof: string;
  index: number;
}

/* Mini wireframe visuals for each pillar */
const PILLAR_VISUALS: Record<number, React.ReactNode> = {
  0: ( // Computes, doesn't guess — formula trace
    <div className="space-y-2 p-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-ver-green" />
        <span className="text-[9px] font-mono text-art-ink/60">Murphy Yield Model</span>
      </div>
      <div className="bg-surface-2 rounded p-2 font-mono text-[10px] text-art-ink/70">
        Y = ((1 − e<sup>−A·D0</sup>) / (A·D0))²
      </div>
      <div className="flex gap-2 text-[9px] font-mono text-art-ink/40">
        <span>v4.3</span>
        <span>·</span>
        <span>SIA-cost-2026</span>
      </div>
    </div>
  ),
  1: ( // Every number defends itself — trace popover
    <div className="space-y-2 p-3">
      <div className="bg-surface-2 rounded p-2 border border-art-ink/10">
        <div className="text-[9px] font-mono text-art-ink/40 uppercase mb-1">Equation</div>
        <div className="text-[10px] font-mono text-art-ink/70">DPW = π·d²/(4·A) − π·d/√(2·A)</div>
      </div>
      <div className="bg-surface-2 rounded p-2 border border-art-ink/10">
        <div className="text-[9px] font-mono text-art-ink/40 uppercase mb-1">Inputs</div>
        <div className="flex justify-between text-[10px] font-mono text-art-ink/60">
          <span>Die Area</span><span className="text-art-ink/80">260mm²</span>
        </div>
      </div>
    </div>
  ),
  2: ( // Decisions with a paper trail — version stamps
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between bg-surface-2 rounded p-2">
        <span className="text-[10px] font-mono text-art-ink/60">Build #0047</span>
        <span className="text-[9px] font-mono text-ver-green">APPROVED</span>
      </div>
      <div className="flex items-center justify-between bg-surface-2 rounded p-2">
        <span className="text-[10px] font-mono text-art-ink/60">Hash</span>
        <span className="text-[9px] font-mono text-eng-blue">0x7a9f…c3d4</span>
      </div>
      <div className="text-[9px] font-mono text-art-ink/50 text-center">Immutable · Content-hashed · Timestamped</div>
    </div>
  ),
  3: ( // Programs, not snapshots — mini chart
    <div className="p-3">
      <div className="flex items-end gap-1 h-16">
        {[20, 35, 55, 70, 82, 90, 95, 98, 100, 102].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-art-rust/20"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-art-ink/50 mt-1">
        <span>Q1</span>
        <span>Q10</span>
      </div>
      <div className="text-[9px] font-mono text-art-ink/40 text-center mt-1">20-Quarter Cumulative Cash Flow</div>
    </div>
  ),
};

export default function PillarCard({ title, description, proof, index }: PillarCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-surface-1 border border-art-ink/10 rounded-lg p-6 flex flex-col"
    >
      <span className="text-[10px] font-mono text-art-ink/50 mb-2">0{index + 1}</span>
      <h3 className="text-lg font-bold text-art-ink mb-2">{title}</h3>
      <p className="text-sm text-art-ink/70 leading-relaxed mb-4 flex-1">{description}</p>

      <ProductFrame caption={title}>
        {PILLAR_VISUALS[index] || (
          <div className="h-24 flex items-center justify-center text-[10px] font-mono text-art-ink/20">
            {title}
          </div>
        )}
      </ProductFrame>

      <ProvenanceStamp className="mt-3" />
    </motion.div>
  );
}

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import ProvenanceStamp from './ProvenanceStamp';

export default function DeterminismProofStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="bg-surface-1 border border-art-ink/10 rounded-lg p-6" aria-label="Determinism proof demonstration">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-art-ink mb-2 font-mono">Same input. Always the same output.</h3>
          <p className="text-xs text-art-ink/60 leading-relaxed mb-3">
            Run the same Build through the engine N times. Every run produces the identical hash.
            No randomness. No hidden state. Deterministic by design.
          </p>
          <ProvenanceStamp />
        </div>
        <div className="bg-surface-2 border border-art-ink/10 rounded-lg p-4 font-mono text-[10px] min-w-[200px]">
          <div className="text-art-ink/40 mb-1">INPUT HASH</div>
          {inView && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-eng-blue break-all mb-3">a1b2c3d4e5f6...</div>
              <div className="text-art-ink/40 mb-1">RUN 1 → RUN N</div>
              <div className="text-ver-green break-all">0x7a9f = 0x7a9f</div>
            </motion.div>
          )}
          <div className="mt-3 pt-3 border-t border-art-ink/10 text-art-ink/50">
            93 golden tests · 0 regressions
          </div>
        </div>
      </div>
    </div>
  );
}

import type { CalculationTrace } from '../../types';
import ProvenanceStamp from './ProvenanceStamp';

export default function TracePopover({ trace, onClose }: { trace: CalculationTrace; onClose?: () => void }) {
  return (
    <div role="tooltip" className="bg-surface-1 border border-art-ink/15 rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.45)] p-4 min-w-[280px] max-w-sm font-mono text-xs">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-art-ink text-sm">{trace.name}</h4>
        {onClose && (
          <button onClick={onClose} className="text-art-ink/30 hover:text-art-ink text-sm ml-2">&times;</button>
        )}
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-art-ink/40 text-[10px] uppercase tracking-wider">Equation</span>
          <p className="text-art-ink/80 mt-0.5 font-mono">{trace.equation}</p>
        </div>
        <div>
          <span className="text-art-ink/40 text-[10px] uppercase tracking-wider">Definition</span>
          <p className="text-art-ink/70 mt-0.5">{trace.definition}</p>
        </div>
        <div>
          <span className="text-art-ink/40 text-[10px] uppercase tracking-wider">Inputs</span>
          <div className="mt-0.5 space-y-0.5">
            {Object.entries(trace.inputs).map(([key, val]) => (
              <div key={key} className="flex justify-between text-art-ink/70">
                <span>{key}</span>
                <span className="text-art-ink/90">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-art-ink/40 pt-1 border-t border-art-ink/10">
          <span>Ref: {trace.referenceModel}</span>
          <span>v{trace.version}</span>
        </div>
      </div>
      <ProvenanceStamp className="mt-3 pt-2 border-t border-art-ink/10" />
    </div>
  );
}

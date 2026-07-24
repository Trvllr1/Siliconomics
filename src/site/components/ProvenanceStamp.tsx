

const STAMP_TEXT = 'DETERMINISTIC · MURPHY-YIELD v1.3 · REF DATA 2026-07 · REPRODUCIBLE';

export default function ProvenanceStamp({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Provenance: DETERMINISTIC, MURPHY-YIELD v1.3, REF DATA 2026-07, REPRODUCIBLE">
      <span className="w-1.5 h-1.5 rounded-full bg-ver-green flex-shrink-0" aria-hidden="true" />
      <span className="h-px flex-1 bg-art-ink/10" aria-hidden="true" />
      <span className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-ink/50">
        {STAMP_TEXT}
      </span>
    </div>
  );
}

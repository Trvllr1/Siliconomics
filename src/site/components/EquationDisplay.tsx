import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface EquationDisplayProps {
  equation: string;
  version?: string;
  label?: string;
  displayMode?: boolean;
}

export default function EquationDisplay({ equation, version, label, displayMode = true }: EquationDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(equation, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true,
        });
      } catch {
        // Fallback to plain text if KaTeX fails
        if (containerRef.current) {
          containerRef.current.textContent = equation;
        }
      }
    }
  }, [equation, displayMode]);

  return (
    <div className="my-4">
      {label && (
        <div className="text-[10px] font-mono text-art-ink/40 uppercase tracking-wider mb-2">{label}</div>
      )}
      <div className="bg-surface-2 border border-art-ink/10 rounded-lg p-4">
        <div
          ref={containerRef}
          className="text-art-ink font-mono text-sm overflow-x-auto"
          style={{ color: '#F0F6FC' }}
        />
        {version && (
          <div className="mt-2 pt-2 border-t border-art-ink/10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ver-green flex-shrink-0" />
            <span className="text-[9px] font-mono text-art-ink/40 uppercase tracking-wider">
              {version}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

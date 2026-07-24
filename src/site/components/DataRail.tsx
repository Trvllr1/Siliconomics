import { PRECONFIG_ARCHETYPES } from '../../data/archetypes';
import { DEFAULT_FORMULA_LIBRARY } from '../../data/defaultFormulaLibrary';
import { DEFAULT_REFERENCE_MODELS } from '../../data/defaultReferenceModels';

type DataRailPreset = 'platform' | 'methodology' | 'cost' | 'coverage';

interface DataRailProps {
  preset?: DataRailPreset;
  items?: { value: string; label: string; glow?: boolean }[];
  className?: string;
}

const PRESETS: Record<DataRailPreset, { value: string; label: string; glow?: boolean }[]> = {
  platform: [
    { value: '148', label: 'GOLDEN TESTS', glow: true },
    { value: String(DEFAULT_FORMULA_LIBRARY.length), label: 'FORMULAS' },
    { value: String(DEFAULT_REFERENCE_MODELS.length), label: 'REF MODELS' },
    { value: String(PRECONFIG_ARCHETYPES.length), label: 'ARCHETYPES' },
    { value: '20Q', label: 'HORIZON' },
  ],
  methodology: [
    { value: 'MURPHY', label: 'YIELD MODEL' },
    { value: 'SIA', label: 'COST BASIS' },
    { value: 'SHA-256', label: 'HASH VERIFY', glow: true },
    { value: 'v4.2', label: 'FORMULA VER' },
  ],
  cost: [
    { value: '$47M', label: 'AVG RESPIN COST', glow: true },
    { value: '18mo', label: 'MEDIAN DELAY' },
    { value: '3×', label: 'CONFLICTING MODELS' },
    { value: '0', label: 'AUDIT TRAIL' },
  ],
  coverage: [
    { value: '20', label: 'QUARTER HORIZON' },
    { value: String(DEFAULT_FORMULA_LIBRARY.length), label: 'FORMULAS' },
    { value: String(DEFAULT_REFERENCE_MODELS.length), label: 'REF MODELS' },
    { value: String(PRECONFIG_ARCHETYPES.length), label: 'ARCHETYPES' },
  ],
};

export default function DataRail({ preset, items, className = '' }: DataRailProps) {
  const data = items ?? (preset ? PRESETS[preset] : PRESETS.platform);

  return (
    <div className={`grid auto-cols-fr grid-flow-col border-y border-art-ink/10 ${className}`} role="list" aria-label="Platform metrics">
      {data.map((item) => (
        <div key={item.label} className="border-r border-art-ink/10 px-4 py-4 last:border-r-0" role="listitem">
          <p className={`font-mono text-lg font-bold ${item.glow ? 'text-art-rust drop-shadow-[0_0_8px_rgba(0,191,166,0.4)]' : 'text-art-ink'}`}>
            {item.value}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-art-ink/45">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

import React, { useMemo } from 'react';
import { Build } from '../types';
import { computeBuildMetrics, round } from '../utils/mathEngine';
import { computeSensitivity, getTopSensitivities, SensitivityResult } from '../utils/SensitivityAnalysis';
import { TrendingUp, DollarSign, Percent, Package } from 'lucide-react';

interface SensitivityViewProps {
  activeBuild: Build;
}

const METRICS: { key: 'grossMargin' | 'roi' | 'grossCostPerGoodDie' | 'breakEvenVolumeMillion'; label: string; unit: string; icon: React.ReactNode; higherIsBetter: boolean }[] = [
  { key: 'grossMargin', label: 'Gross Margin', unit: '%', icon: <Percent className="w-4 h-4" />, higherIsBetter: true },
  { key: 'roi', label: 'ROI', unit: '%', icon: <TrendingUp className="w-4 h-4" />, higherIsBetter: true },
  { key: 'grossCostPerGoodDie', label: 'Unit COGS', unit: '$', icon: <DollarSign className="w-4 h-4" />, higherIsBetter: false },
  { key: 'breakEvenVolumeMillion', label: 'Break-Even Volume', unit: 'M', icon: <Package className="w-4 h-4" />, higherIsBetter: false },
];

interface TornadoResult extends SensitivityResult {
  baselineMetric: number;
}

export default function SensitivityView({ activeBuild }: SensitivityViewProps) {
  const snap = useMemo(() => computeBuildMetrics(activeBuild).snapshot, [activeBuild]);
  const sensitivityResults = useMemo(() => computeSensitivity(activeBuild, snap), [activeBuild, snap]);
  const [selectedMetric, setSelectedMetric] = React.useState<typeof METRICS[number]>(METRICS[0]!);

  const topImpacts = useMemo(
    () => getTopSensitivities(sensitivityResults, selectedMetric.key),
    [sensitivityResults, selectedMetric.key],
  );

  // Inject baseline values into results for the tornado chart
  const resultsWithBaseline: TornadoResult[] = useMemo(
    () => sensitivityResults.map((r) => ({ ...r, baselineMetric: (r.points.find((p) => p.variation === 0) ?? r.points[0]!)[selectedMetric.key] as number })),
    [sensitivityResults, selectedMetric.key],
  );

  return (
    <div className="space-y-6">
      {/* Metric selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMetric(m)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedMetric.key === m.key
                ? 'bg-art-rust text-white border-art-rust'
                : 'bg-white text-art-ink/60 border-art-ink/15 hover:border-art-rust/30 hover:text-art-ink'
            }`}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Tornado charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resultsWithBaseline.map((result) => {
          const min = Math.min(...result.points.map((p) => (p as any)[selectedMetric.key]));
          const max = Math.max(...result.points.map((p) => (p as any)[selectedMetric.key]));
          const baseline = result.baselineMetric;
          const downside = selectedMetric.higherIsBetter ? min - baseline : max - baseline;
          const upside = selectedMetric.higherIsBetter ? max - baseline : min - baseline;

          return (
            <div
              key={result.paramName}
              className="bg-white border border-art-ink/10 rounded-xl p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold font-mono text-art-ink/80">{result.paramLabel}</h4>
                <span className="text-[10px] font-mono text-art-ink/40">
                  {selectedMetric.higherIsBetter ? `${round(min, 1)} – ${round(max, 1)}` : `${round(max, 1)} – ${round(min, 1)}`}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-mono">
                <span className="text-red-600">↓ {round(Math.abs(downside), 1)}</span>
                <span className="text-art-ink/30">|</span>
                <span className="text-art-ink/50">BL {round(baseline, 1)}</span>
                <span className="text-art-ink/30">|</span>
                <span className="text-green-600">↑ {round(Math.abs(upside), 1)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top sensitivities ranked */}
      <div className="bg-white border border-art-ink/10 rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-art-ink/60 font-mono">
          Top Drivers of {selectedMetric.label}
        </h3>
        <div className="space-y-1">
          {topImpacts.slice(0, 5).map((t, i) => (
            <div key={t.paramName} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-art-ink/30 w-4">{i + 1}.</span>
                <span className="font-mono text-art-ink/80">{t.paramLabel}</span>
              </div>
              <span className="font-mono font-bold text-art-rust">{round(t.impact, 2)} {selectedMetric.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

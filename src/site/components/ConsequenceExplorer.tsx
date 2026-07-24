import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValueEvent } from 'motion/react';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import { computeBuildMetrics } from '../../utils/mathEngine';
import TracePopover from './TracePopover';
import ProvenanceStamp from './ProvenanceStamp';

const baseBuild = DEFAULT_BUILDS[0]!;

/* Animated number component — ticks from old value to new */
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const motionVal = useSpring(value, { stiffness: 120, damping: 20 });
  const [display, setDisplay] = useState(value.toFixed(decimals));
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      setDisplay(value.toFixed(decimals));
      return;
    }
    motionVal.set(value);
  }, [value, decimals, motionVal]);

  useMotionValueEvent(motionVal, 'change', (latest) => {
    setDisplay(latest.toFixed(decimals));
  });

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</span>;
}

export default function ConsequenceExplorer() {
  const [dieArea, setDieArea] = useState(baseBuild.designModel.dieArea);
  const [defectDensity, setDefectDensity] = useState(baseBuild.designModel.defectDensity);
  const [waferCost, setWaferCost] = useState(baseBuild.designModel.waferCost);

  const metrics = useMemo(() => {
    const modified = {
      ...baseBuild,
      designModel: {
        ...baseBuild.designModel,
        dieArea,
        defectDensity,
        waferCost,
      },
    };
    const result = computeBuildMetrics(modified);
    return {
      dpw: result.snapshot.dpw,
      yield: result.snapshot.dieYield * 100,
      unitCost: result.snapshot.fullyLoadedCostPerDie,
      margin: result.snapshot.grossMargin,
    };
  }, [dieArea, defectDensity, waferCost]);

  const [traceMetric, setTraceMetric] = useState<string | null>(null);

  const cards = [
    { id: 'dpw', label: 'Dies Per Wafer', value: metrics.dpw, decimals: 0, unit: '' },
    { id: 'yield', label: 'Die Yield', value: metrics.yield, decimals: 1, unit: '%' },
    { id: 'unitCost', label: 'Unit Cost', value: metrics.unitCost, decimals: 2, unit: '$' },
    { id: 'margin', label: 'Gross Margin', value: metrics.margin, decimals: 1, unit: '%' },
  ];

  return (
    <div className="bg-surface-1 border border-art-ink/10 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" role="group" aria-label="Consequence Explorer controls">
        <div>
          <label className="text-xs font-mono text-art-ink/60 block mb-2">
            Die Area: <span className="text-art-ink font-bold">{dieArea} mm²</span>
          </label>
          <input
            type="range"
            min={50}
            max={800}
            step={5}
            value={dieArea}
            onChange={e => setDieArea(Number(e.target.value))}
            className="w-full accent-art-rust"
            aria-label="Die area slider"
          />
          <div className="flex justify-between text-[9px] font-mono text-art-ink/50 mt-1">
            <span>50</span>
            <span>800</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-art-ink/60 block mb-2">
            D0 Defect Density: <span className="text-art-ink font-bold">{defectDensity}</span>
          </label>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.01}
            value={defectDensity}
            onChange={e => setDefectDensity(Number(e.target.value))}
            className="w-full accent-art-rust"
            aria-label="Defect density slider"
          />
          <div className="flex justify-between text-[9px] font-mono text-art-ink/50 mt-1">
            <span>0.01</span>
            <span>0.50</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-art-ink/60 block mb-2">
            Wafer Cost: <span className="text-art-ink font-bold">${waferCost.toLocaleString()}</span>
          </label>
          <input
            type="range"
            min={3000}
            max={20000}
            step={100}
            value={waferCost}
            onChange={e => setWaferCost(Number(e.target.value))}
            className="w-full accent-art-rust"
            aria-label="Wafer cost slider"
          />
          <div className="flex justify-between text-[9px] font-mono text-art-ink/50 mt-1">
            <span>$3K</span>
            <span>$20K</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => (
          <motion.div
            key={card.id}
            className="bg-surface-2 border border-art-ink/10 rounded-lg p-4 text-center relative"
            onMouseEnter={() => setTraceMetric(card.id)}
            onMouseLeave={() => setTraceMetric(null)}
            whileHover={{ borderColor: 'rgba(240, 246, 252, 0.15)' }}
          >
            <div className="text-[9px] font-mono text-art-ink/40 uppercase tracking-wider mb-1">{card.label}</div>
            <div className="text-xl font-mono font-bold text-art-ink">
              {card.unit === '$' ? '$' : ''}<AnimatedNumber value={card.value} decimals={card.decimals} />{card.unit === '%' ? '%' : ''}
            </div>
            {traceMetric === card.id && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10">
                <TracePopover
                  trace={{
                    name: card.label,
                    equation: 'Computed live from engine',
                    inputs: { 'Die Area': dieArea, 'D0': defectDensity, 'Wafer Cost': waferCost },
                    definition: `The ${card.label.toLowerCase()} computed from current slider values.`,
                    referenceModel: 'TSMC N4P Reference Model v1.2',
                    version: 'Murphy-SIA-v4.3',
                    calculationPath: [],
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] font-mono text-art-ink/50">
          This panel is running the Siliconomics engine in your browser.
        </p>
      </div>
    </div>
  );
}

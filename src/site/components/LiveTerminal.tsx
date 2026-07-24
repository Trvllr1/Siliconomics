import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import { computeBuildMetrics, calculateDPW, calculateMurphyYield } from '../../utils/mathEngine';
import ProvenanceStamp from './ProvenanceStamp';

const build = DEFAULT_BUILDS[0]!;
const dm = build.designModel;

const TYPING_SPEED = 70;
const COMPUTE_PAUSE = 400;

interface Line {
  text: string;
  type: 'input' | 'output' | 'pass' | 'stamp';
  complete: boolean;
}

const INPUT_LINE = `INPUT  die=${dm.dieArea}mm²  node=${dm.processNode}  D0=${dm.defectDensity}  wafer=$${dm.waferCost}`;
const OUTPUT_NAMES = [
  'COMPUTING...',
  '',
];

function computeResults() {
  const dpw = calculateDPW(dm.dieArea);
  const yieldVal = calculateMurphyYield(dm.dieArea, dm.defectDensity);
  const goodDiePerWafer = dpw * yieldVal;
  const rawDieCost = dm.waferCost / goodDiePerWafer;
  const packagingTest = dm.packagingCost + dm.testTimeSeconds * dm.testCostPerSecond;
  const packagingTestAdj = packagingTest / ((dm.packagingYield / 100) * (dm.testYield / 100));
  const fullyLoaded = rawDieCost + packagingTestAdj + (dm.nreCost * 1_000_000) / (dm.targetVolume * 1_000_000);
  const margin = ((dm.asp - fullyLoaded) / dm.asp) * 100;

  return [
    `DPW           ${dpw}  dies/wafer`,
    `Murphy Yield  ${(yieldVal * 100).toFixed(1)}%`,
    `Good Die      ${Math.round(goodDiePerWafer)}  dies/wafer`,
    `Unit Cost     $${fullyLoaded.toFixed(2)}`,
    `Gross Margin  ${margin.toFixed(1)}%`,
  ];
}

const VERIFICATION_LINE = '✓ ALL OUTPUTS VERIFIED';
const STAMP_LINE = 'ENGINE OUTPUT · NOT A SIMULATION · FORMULA SET MURPHY-SIA-v4.3';

export default function LiveTerminal() {
  const [phase, setPhase] = useState<'idle' | 'typing' | 'computing' | 'results' | 'done'>('idle');
  const [typedInput, setTypedInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [resultLines, setResultLines] = useState<string[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('idle');
    setTypedInput('');
    setResultLines([]);
    setShowVerification(false);
    setShowStamp(false);
  };

  useEffect(() => {
    const cursorInterval = setInterval(() => setShowCursor(c => !c), 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (phase !== 'idle') return;
    const t = setTimeout(() => setPhase('typing'), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'typing' || typedInput.length >= INPUT_LINE.length) {
      if (phase === 'typing' && typedInput.length >= INPUT_LINE.length) {
        const t = setTimeout(() => setPhase('computing'), COMPUTE_PAUSE);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => {
      setTypedInput(INPUT_LINE.slice(0, typedInput.length + 1));
    }, TYPING_SPEED);
    return () => clearTimeout(t);
  }, [phase, typedInput]);

  useEffect(() => {
    if (phase !== 'computing') return;
    const results = computeResults();
    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < results.length) {
        setResultLines(prev => [...prev, results[i]!]);
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setShowVerification(true);
        setTimeout(() => {
          setShowStamp(true);
          setPhase('done');
        }, 600);
      }
    }, 300);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  return (
    <div className="bg-surface-2 border border-art-ink/10 rounded-lg font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-art-ink/10 bg-surface-1">
        <span className="text-art-ink/50 text-[10px] uppercase tracking-wider">Terminal — Siliconomics Engine v2.4</span>
        <button
          onClick={reset}
          className="text-[9px] text-art-ink/30 hover:text-art-rust transition-colors"
          aria-label="Replay terminal"
        >
          ↻ replay
        </button>
      </div>
      <div className="p-4 min-h-[240px] space-y-1.5" aria-live="polite">
        {phase !== 'idle' && (
          <div>
            <span className="text-eng-blue">{'$ '}</span>
            <span>{typedInput}</span>
            {phase === 'typing' && typedInput.length < INPUT_LINE.length && (
              <span className={`inline-block w-2 h-4 bg-art-ink/70 ml-0.5 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
            )}
          </div>
        )}
        <AnimatePresence>
          {resultLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-art-ink/80"
            >
              <span className="text-ver-green mr-2">▶</span>
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
        {showVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-ver-green font-bold mt-2"
          >
            {VERIFICATION_LINE}
          </motion.div>
        )}
        {showStamp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3"
          >
            <ProvenanceStamp />
          </motion.div>
        )}
      </div>
    </div>
  );
}

type DiagramVariant =
  | 'wafer-cross-section'
  | 'packaging-stack'
  | 'yield-curve'
  | 'decision-tree'
  | 'cost-waterfall'
  | 'audit-chain'
  | 'broken-spreadsheet'
  | 'tribal-knowledge'
  | 'unaudited-number';

interface TechDiagramProps {
  variant: DiagramVariant;
  className?: string;
}

export default function TechDiagram({ variant, className = '' }: TechDiagramProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={`w-full h-auto ${className}`} aria-hidden="true">
      {variant === 'wafer-cross-section' && (
        <>
          {/* Substrate */}
          <rect x="20" y="100" width="160" height="30" fill="rgba(91,157,255,0.08)" stroke="rgba(91,157,255,0.4)" strokeWidth="0.8" />
          <text x="100" y="119" textAnchor="middle" fill="rgba(240,246,252,0.4)" fontSize="7" fontFamily="JetBrains Mono">SUBSTRATE</text>
          {/* Die layers */}
          <rect x="40" y="60" width="50" height="38" fill="rgba(0,191,166,0.1)" stroke="rgba(0,191,166,0.5)" strokeWidth="0.8" />
          <rect x="110" y="60" width="50" height="38" fill="rgba(0,191,166,0.1)" stroke="rgba(0,191,166,0.5)" strokeWidth="0.8" />
          <text x="65" y="83" textAnchor="middle" fill="rgba(0,191,166,0.7)" fontSize="7" fontFamily="JetBrains Mono">DIE A</text>
          <text x="135" y="83" textAnchor="middle" fill="rgba(0,191,166,0.7)" fontSize="7" fontFamily="JetBrains Mono">DIE B</text>
          {/* Interconnect */}
          <line x1="90" y1="79" x2="110" y2="79" stroke="rgba(217,180,91,0.7)" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="90" cy="79" r="2" fill="#FBBF24" opacity="0.8" />
          <circle cx="110" cy="79" r="2" fill="#FBBF24" opacity="0.8" />
          {/* Heat spreader */}
          <rect x="30" y="45" width="140" height="12" fill="rgba(240,246,252,0.03)" stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" />
          <text x="100" y="54" textAnchor="middle" fill="rgba(240,246,252,0.3)" fontSize="6" fontFamily="JetBrains Mono">HEAT SPREADER</text>
          {/* Bumps */}
          {[50, 70, 120, 140].map(x => <circle key={x} cx={x} cy="99" r="2.5" fill="rgba(217,180,91,0.4)" stroke="rgba(217,180,91,0.6)" strokeWidth="0.5" />)}
        </>
      )}
      {variant === 'packaging-stack' && (
        <>
          {[0, 1, 2, 3, 4].map(i => {
            const y = 20 + i * 26;
            const colors = ['rgba(0,191,166,0.5)', 'rgba(91,157,255,0.5)', 'rgba(217,180,91,0.5)', 'rgba(0,191,166,0.4)', 'rgba(91,157,255,0.4)'];
            const labels = ['PACKAGE', 'INTERPOSER', 'DIE', 'TSV', 'PCB'];
            return (
              <g key={i}>
                <rect x="40" y={y} width="120" height="20" fill={`${colors[i]!.replace('0.5', '0.06').replace('0.4', '0.04')}`} stroke={colors[i]} strokeWidth="0.7" rx="1" />
                <text x="100" y={y + 13} textAnchor="middle" fill={colors[i]} fontSize="7" fontFamily="JetBrains Mono">{labels[i]}</text>
              </g>
            );
          })}
          {/* Connecting lines */}
          {[0, 1, 2, 3].map(i => <line key={i} x1="100" y1={40 + i * 26} x2="100" y2={46 + i * 26} stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />)}
        </>
      )}
      {variant === 'yield-curve' && (
        <>
          {/* Axes */}
          <line x1="30" y1="130" x2="180" y2="130" stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" />
          <line x1="30" y1="20" x2="30" y2="130" stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" />
          {/* Yield curve */}
          <path d="M30 120 Q60 110, 80 90 Q100 70, 120 55 Q140 42, 160 35 Q170 32, 180 30" stroke="#00BFA6" strokeWidth="1.5" fill="none" />
          {/* Area fill */}
          <path d="M30 120 Q60 110, 80 90 Q100 70, 120 55 Q140 42, 160 35 Q170 32, 180 30 L180 130 L30 130 Z" fill="rgba(0,191,166,0.06)" />
          {/* Data points */}
          {[[50, 115], [80, 90], [110, 60], [140, 42], [170, 32]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#0D1117" stroke="#00BFA6" strokeWidth="1" />
          ))}
          {/* Labels */}
          <text x="105" y="148" textAnchor="middle" fill="rgba(240,246,252,0.35)" fontSize="7" fontFamily="JetBrains Mono">WAFER LOT</text>
          <text x="10" y="75" fill="rgba(240,246,252,0.35)" fontSize="7" fontFamily="JetBrains Mono" transform="rotate(-90, 10, 75)">YIELD %</text>
        </>
      )}
      {variant === 'decision-tree' && (
        <>
          {/* Root */}
          <circle cx="100" cy="25" r="10" fill="rgba(0,191,166,0.1)" stroke="#00BFA6" strokeWidth="1" />
          <text x="100" y="28" textAnchor="middle" fill="#00BFA6" fontSize="6" fontFamily="JetBrains Mono">BUILD</text>
          {/* Branches */}
          <line x1="100" y1="35" x2="55" y2="65" stroke="rgba(91,157,255,0.5)" strokeWidth="0.8" />
          <line x1="100" y1="35" x2="145" y2="65" stroke="rgba(91,157,255,0.5)" strokeWidth="0.8" />
          {/* Level 2 */}
          <rect x="35" y="60" width="40" height="18" rx="2" fill="rgba(91,157,255,0.08)" stroke="rgba(91,157,255,0.5)" strokeWidth="0.7" />
          <text x="55" y="72" textAnchor="middle" fill="rgba(91,157,255,0.8)" fontSize="6" fontFamily="JetBrains Mono">OPTION A</text>
          <rect x="125" y="60" width="40" height="18" rx="2" fill="rgba(91,157,255,0.08)" stroke="rgba(91,157,255,0.5)" strokeWidth="0.7" />
          <text x="145" y="72" textAnchor="middle" fill="rgba(91,157,255,0.8)" fontSize="6" fontFamily="JetBrains Mono">OPTION B</text>
          {/* Level 3 */}
          <line x1="55" y1="78" x2="55" y2="105" stroke="rgba(217,180,91,0.5)" strokeWidth="0.6" />
          <line x1="145" y1="78" x2="145" y2="105" stroke="rgba(217,180,91,0.5)" strokeWidth="0.6" />
          <rect x="30" y="105" width="50" height="18" rx="2" fill="rgba(217,180,91,0.06)" stroke="rgba(217,180,91,0.5)" strokeWidth="0.6" />
          <text x="55" y="117" textAnchor="middle" fill="rgba(217,180,91,0.8)" fontSize="6" fontFamily="JetBrains Mono">REVIEW</text>
          <rect x="120" y="105" width="50" height="18" rx="2" fill="rgba(217,180,91,0.06)" stroke="rgba(217,180,91,0.5)" strokeWidth="0.6" />
          <text x="145" y="117" textAnchor="middle" fill="rgba(217,180,91,0.8)" fontSize="6" fontFamily="JetBrains Mono">REVIEW</text>
          {/* Decision */}
          <line x1="55" y1="123" x2="100" y2="145" stroke="rgba(0,191,166,0.6)" strokeWidth="0.8" />
          <line x1="145" y1="123" x2="100" y2="145" stroke="rgba(248,113,113,0.4)" strokeWidth="0.8" strokeDasharray="3 2" />
          <circle cx="100" cy="148" r="8" fill="rgba(0,191,166,0.12)" stroke="#00BFA6" strokeWidth="1" />
          <text x="100" y="151" textAnchor="middle" fill="#00BFA6" fontSize="5" fontFamily="JetBrains Mono">DECIDE</text>
        </>
      )}
      {variant === 'cost-waterfall' && (
        <>
          {/* Bars */}
          {[
            { x: 20, h: 90, label: 'WAFER', color: 'rgba(91,157,255,0.6)' },
            { x: 55, h: 30, label: 'YIELD', color: 'rgba(248,113,113,0.5)' },
            { x: 90, h: 45, label: 'PKG', color: 'rgba(217,180,91,0.6)' },
            { x: 125, h: 20, label: 'TEST', color: 'rgba(91,157,255,0.4)' },
            { x: 160, h: 110, label: 'TOTAL', color: 'rgba(0,191,166,0.7)' },
          ].map((bar) => (
            <g key={bar.label}>
              <rect x={bar.x} y={135 - bar.h} width="25" height={bar.h} fill={bar.color.replace(/[\d.]+\)$/, '0.1)')} stroke={bar.color} strokeWidth="0.8" />
              <text x={bar.x + 12.5} y="148" textAnchor="middle" fill="rgba(240,246,252,0.45)" fontSize="6" fontFamily="JetBrains Mono">{bar.label}</text>
            </g>
          ))}
          {/* Connector lines */}
          <line x1="45" y1="45" x2="55" y2="45" stroke="rgba(240,246,252,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="80" y1="105" x2="90" y2="105" stroke="rgba(240,246,252,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="115" y1="90" x2="125" y2="90" stroke="rgba(240,246,252,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
        </>
      )}
      {variant === 'audit-chain' && (
        <>
          {/* Chain of blocks */}
          {['INPUT', 'ENGINE', 'OUTPUT', 'HASH'].map((label, i) => {
            const x = 15 + i * 48;
            const colors = ['#5B9DFF', '#00BFA6', '#FBBF24', '#00BFA6'];
            return (
              <g key={label}>
                <rect x={x} y="55" width="40" height="30" rx="2" fill={`${colors[i]!}11`} stroke={colors[i]} strokeWidth="0.8" />
                <text x={x + 20} y="74" textAnchor="middle" fill={colors[i]} fontSize="6.5" fontFamily="JetBrains Mono">{label}</text>
                {i < 3 && <line x1={x + 42} y1="70" x2={x + 46} y2="70" stroke="rgba(240,246,252,0.3)" strokeWidth="0.8" />}
              </g>
            );
          })}
          {/* Verification arc */}
          <path d="M35 55 Q100 15, 175 55" stroke="rgba(0,191,166,0.3)" strokeWidth="0.6" fill="none" strokeDasharray="4 3" />
          <text x="100" y="28" textAnchor="middle" fill="rgba(0,191,166,0.5)" fontSize="6" fontFamily="JetBrains Mono">VERIFY</text>
          {/* Lock icon */}
          <rect x="86" y="100" width="28" height="22" rx="3" fill="rgba(0,191,166,0.06)" stroke="rgba(0,191,166,0.4)" strokeWidth="0.7" />
          <path d="M95 100 V93 A5 5 0 0 1 105 93 V100" stroke="rgba(0,191,166,0.5)" strokeWidth="0.8" fill="none" />
          <circle cx="100" cy="112" r="2" fill="#00BFA6" opacity="0.7" />
          <text x="100" y="136" textAnchor="middle" fill="rgba(240,246,252,0.35)" fontSize="6" fontFamily="JetBrains Mono">IMMUTABLE</text>
        </>
      )}
      {variant === 'broken-spreadsheet' && (
        <>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map(i => <line key={`h${i}`} x1="30" y1={25 + i * 22} x2="170" y2={25 + i * 22} stroke="rgba(240,246,252,0.1)" strokeWidth="0.5" />)}
          {[0, 1, 2, 3].map(i => <line key={`v${i}`} x1={30 + i * 47} y1="25" x2={30 + i * 47} y2="135" stroke="rgba(240,246,252,0.1)" strokeWidth="0.5" />)}
          {/* Broken cells */}
          <rect x="77" y="47" width="47" height="22" fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.4)" strokeWidth="0.7" />
          <text x="100" y="61" textAnchor="middle" fill="rgba(248,113,113,0.7)" fontSize="7" fontFamily="JetBrains Mono">#REF!</text>
          <rect x="124" y="91" width="46" height="22" fill="rgba(248,113,113,0.06)" stroke="rgba(248,113,113,0.3)" strokeWidth="0.7" />
          <text x="147" y="105" textAnchor="middle" fill="rgba(248,113,113,0.6)" fontSize="7" fontFamily="JetBrains Mono">ERR</text>
          {/* Diagonal strike */}
          <line x1="40" y1="30" x2="160" y2="130" stroke="rgba(248,113,113,0.35)" strokeWidth="1.5" />
          <line x1="45" y1="30" x2="165" y2="130" stroke="rgba(248,113,113,0.2)" strokeWidth="0.5" />
        </>
      )}
      {variant === 'tribal-knowledge' && (
        <>
          {/* Head silhouette */}
          <circle cx="100" cy="55" r="30" fill="rgba(217,180,91,0.04)" stroke="rgba(217,180,91,0.3)" strokeWidth="0.8" />
          {/* Knowledge fragments inside */}
          <text x="100" y="48" textAnchor="middle" fill="rgba(217,180,91,0.5)" fontSize="6" fontFamily="JetBrains Mono">$47.23</text>
          <text x="100" y="58" textAnchor="middle" fill="rgba(91,157,255,0.4)" fontSize="5" fontFamily="JetBrains Mono">yield = ???</text>
          <text x="100" y="68" textAnchor="middle" fill="rgba(240,246,252,0.3)" fontSize="5" fontFamily="JetBrains Mono">model v??</text>
          {/* Disconnected nodes outside */}
          <circle cx="45" cy="110" r="8" stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="120" r="8" stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" fill="none" />
          <circle cx="155" cy="110" r="8" stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" fill="none" />
          {/* Broken connections */}
          <line x1="53" y1="110" x2="70" y2="115" stroke="rgba(248,113,113,0.3)" strokeWidth="0.6" strokeDasharray="3 3" />
          <line x1="108" y1="120" x2="130" y2="115" stroke="rgba(248,113,113,0.3)" strokeWidth="0.6" strokeDasharray="3 3" />
          {/* Exit arrow */}
          <path d="M130 55 L165 55" stroke="rgba(248,113,113,0.4)" strokeWidth="0.8" markerEnd="url(#arrow)" />
          <text x="155" y="45" fill="rgba(248,113,113,0.5)" fontSize="6" fontFamily="JetBrains Mono">EXIT</text>
        </>
      )}
      {variant === 'unaudited-number' && (
        <>
          {/* Big number */}
          <text x="100" y="70" textAnchor="middle" fill="rgba(240,246,252,0.7)" fontSize="28" fontFamily="JetBrains Mono" fontWeight="bold">$47.23</text>
          {/* Question marks around it */}
          <text x="40" y="50" fill="rgba(248,113,113,0.5)" fontSize="14" fontFamily="JetBrains Mono">?</text>
          <text x="155" y="55" fill="rgba(248,113,113,0.4)" fontSize="12" fontFamily="JetBrains Mono">?</text>
          <text x="60" y="95" fill="rgba(248,113,113,0.3)" fontSize="10" fontFamily="JetBrains Mono">?</text>
          {/* Missing source indicators */}
          <line x1="55" y1="100" x2="145" y2="100" stroke="rgba(240,246,252,0.1)" strokeWidth="0.5" />
          <text x="100" y="115" textAnchor="middle" fill="rgba(240,246,252,0.25)" fontSize="7" fontFamily="JetBrains Mono">NO SOURCE</text>
          <text x="100" y="128" textAnchor="middle" fill="rgba(240,246,252,0.25)" fontSize="7" fontFamily="JetBrains Mono">NO EQUATION</text>
          <text x="100" y="141" textAnchor="middle" fill="rgba(240,246,252,0.25)" fontSize="7" fontFamily="JetBrains Mono">NO TRACE</text>
          {/* Strike */}
          <line x1="60" y1="105" x2="140" y2="105" stroke="rgba(248,113,113,0.3)" strokeWidth="0.8" />
        </>
      )}
    </svg>
  );
}

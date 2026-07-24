/**
 * Persona-specific SVG hero illustrations for Solutions pages.
 * Each variant depicts the persona's relationship to the Siliconomics Build.
 */

interface Props {
  variant: 'architect' | 'manufacturing' | 'finance' | 'executive' | 'services';
  className?: string;
}

export default function SolutionHeroVisual({ variant, className = '' }: Props) {
  const visuals: Record<Props['variant'], JSX.Element> = {
    architect: (
      <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Architecture decision tree flowing into cost computation">
        {/* Wafer grid background */}
        <defs>
          <pattern id="arch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,191,166,0.08)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="480" height="320" fill="url(#arch-grid)" />
        {/* Die area representation */}
        <rect x="40" y="60" width="120" height="120" rx="4" fill="rgba(0,191,166,0.06)" stroke="#00BFA6" strokeWidth="1.5" strokeDasharray="4 2" />
        <text x="100" y="130" textAnchor="middle" className="fill-[#00BFA6]" fontSize="9" fontFamily="JetBrains Mono">Die A</text>
        <text x="100" y="145" textAnchor="middle" className="fill-[#00BFA6]/60" fontSize="8" fontFamily="JetBrains Mono">287mm²</text>
        {/* Smaller chiplet alternative */}
        <rect x="40" y="200" width="55" height="55" rx="3" fill="rgba(0,191,166,0.1)" stroke="#00BFA6" strokeWidth="1" />
        <rect x="105" y="200" width="55" height="55" rx="3" fill="rgba(91,157,255,0.1)" stroke="#5B9DFF" strokeWidth="1" />
        <text x="100" y="275" textAnchor="middle" className="fill-[#5B9DFF]" fontSize="8" fontFamily="JetBrains Mono">Chiplet alt.</text>
        {/* Decision arrow */}
        <path d="M 180 120 C 220 120 220 160 260 160" stroke="#00BFA6" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M 180 230 C 220 230 220 190 260 190" stroke="#5B9DFF" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Cost computation block */}
        <rect x="260" y="100" width="180" height="140" rx="6" fill="rgba(13,17,23,0.6)" stroke="rgba(240,246,252,0.12)" strokeWidth="1" />
        <text x="280" y="125" className="fill-[#F0F6FC]/50" fontSize="8" fontFamily="JetBrains Mono">UNIT ECONOMICS</text>
        <text x="280" y="150" className="fill-[#00BFA6]" fontSize="11" fontFamily="JetBrains Mono">Cost/die: $47.23</text>
        <text x="280" y="170" className="fill-[#FBBF24]" fontSize="11" fontFamily="JetBrains Mono">Yield: 68.2%</text>
        <text x="280" y="190" className="fill-[#D9B45B]" fontSize="11" fontFamily="JetBrains Mono">Margin: 42.1%</text>
        <text x="280" y="215" className="fill-[#F0F6FC]/30" fontSize="8" fontFamily="JetBrains Mono">Murphy-SIA v4.3 · TSMC N4P</text>
        {/* Provenance stamp */}
        <circle cx="285" cy="230" r="3" fill="#34D399" />
        <text x="295" y="233" className="fill-[#34D399]" fontSize="7" fontFamily="JetBrains Mono">DETERMINISTIC</text>
      </svg>
    ),

    manufacturing: (
      <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Yield learning curve with supply-demand timeline">
        <defs>
          <linearGradient id="mfg-yield-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Y-axis */}
        <line x1="60" y1="40" x2="60" y2="200" stroke="rgba(240,246,252,0.15)" strokeWidth="1" />
        <text x="50" y="50" textAnchor="end" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">95%</text>
        <text x="50" y="120" textAnchor="end" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">70%</text>
        <text x="50" y="195" textAnchor="end" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">45%</text>
        {/* Yield learning curve */}
        <path d="M 60 185 C 100 170 140 130 200 100 S 320 65 420 55" stroke="#FBBF24" strokeWidth="2" fill="none" />
        <path d="M 60 185 C 100 170 140 130 200 100 S 320 65 420 55 L 420 200 L 60 200 Z" fill="url(#mfg-yield-grad)" />
        <text x="240" y="30" textAnchor="middle" className="fill-[#FBBF24]" fontSize="9" fontFamily="JetBrains Mono">YIELD LEARNING CURVE</text>
        {/* X-axis timeline */}
        <line x1="60" y1="200" x2="440" y2="200" stroke="rgba(240,246,252,0.15)" strokeWidth="1" />
        <text x="100" y="215" textAnchor="middle" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">Q1</text>
        <text x="200" y="215" textAnchor="middle" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">Q5</text>
        <text x="320" y="215" textAnchor="middle" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">Q10</text>
        <text x="420" y="215" textAnchor="middle" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">Q20</text>
        {/* Supply-demand bars */}
        <rect x="80" y="240" width="30" height="50" rx="2" fill="rgba(251,191,36,0.2)" stroke="#FBBF24" strokeWidth="0.5" />
        <rect x="140" y="250" width="30" height="40" rx="2" fill="rgba(251,191,36,0.3)" stroke="#FBBF24" strokeWidth="0.5" />
        <rect x="200" y="245" width="30" height="45" rx="2" fill="rgba(251,191,36,0.4)" stroke="#FBBF24" strokeWidth="0.5" />
        <rect x="260" y="255" width="30" height="35" rx="2" fill="rgba(251,191,36,0.5)" stroke="#FBBF24" strokeWidth="0.5" />
        {/* Demand line */}
        <path d="M 80 280 L 140 270 L 200 260 L 260 250 L 320 248 L 380 247" stroke="#F87171" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="400" y="250" className="fill-[#F87171]" fontSize="7" fontFamily="JetBrains Mono">DEMAND</text>
        <text x="280" y="300" textAnchor="middle" className="fill-[#FBBF24]/60" fontSize="8" fontFamily="JetBrains Mono">SUPPLY vs DEMAND · 20Q</text>
      </svg>
    ),

    finance: (
      <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Quarterly P&L with break-even marker and sensitivity range">
        <defs>
          <linearGradient id="fin-cashflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9B45B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D9B45B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* P&L chart frame */}
        <rect x="40" y="30" width="400" height="170" rx="4" fill="rgba(13,17,23,0.4)" stroke="rgba(240,246,252,0.08)" />
        <text x="60" y="50" className="fill-[#D9B45B]" fontSize="9" fontFamily="JetBrains Mono">CUMULATIVE CASH FLOW</text>
        {/* Zero line */}
        <line x1="60" y1="130" x2="420" y2="130" stroke="rgba(240,246,252,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
        <text x="55" y="133" textAnchor="end" className="fill-[#F0F6FC]/30" fontSize="7" fontFamily="JetBrains Mono">$0</text>
        {/* Cash flow curve (starts negative, crosses zero, goes positive) */}
        <path d="M 70 175 C 120 170 160 160 200 145 S 280 115 340 90 L 410 65" stroke="#D9B45B" strokeWidth="2" fill="none" />
        <path d="M 70 175 C 120 170 160 160 200 145 S 280 115 340 90 L 410 65 L 410 200 L 70 200 Z" fill="url(#fin-cashflow)" opacity="0.5" />
        {/* Break-even marker */}
        <line x1="235" y1="40" x2="235" y2="195" stroke="#34D399" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="210" y="42" width="80" height="16" rx="3" fill="rgba(52,211,153,0.15)" stroke="#34D399" strokeWidth="0.5" />
        <text x="250" y="53" textAnchor="middle" className="fill-[#34D399]" fontSize="7" fontFamily="JetBrains Mono">BREAK-EVEN Q8</text>
        {/* Sensitivity band */}
        <path d="M 70 165 C 120 162 160 155 200 142 S 280 118 340 98 L 410 78" stroke="#D9B45B" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
        <path d="M 70 185 C 120 180 160 168 200 152 S 280 125 340 100 L 410 72" stroke="#D9B45B" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
        {/* Metrics row */}
        <rect x="40" y="220" width="120" height="70" rx="4" fill="rgba(13,17,23,0.4)" stroke="rgba(217,180,91,0.15)" />
        <text x="55" y="240" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">GROSS MARGIN</text>
        <text x="55" y="260" className="fill-[#D9B45B]" fontSize="14" fontFamily="JetBrains Mono" fontWeight="bold">42.1%</text>
        <text x="55" y="278" className="fill-[#34D399]" fontSize="8" fontFamily="JetBrains Mono">▲ from 38.7%</text>
        <rect x="180" y="220" width="120" height="70" rx="4" fill="rgba(13,17,23,0.4)" stroke="rgba(217,180,91,0.15)" />
        <text x="195" y="240" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">ASP EROSION</text>
        <text x="195" y="260" className="fill-[#F87171]" fontSize="14" fontFamily="JetBrains Mono" fontWeight="bold">-8%/yr</text>
        <text x="195" y="278" className="fill-[#F0F6FC]/30" fontSize="8" fontFamily="JetBrains Mono">modeled Q1-Q20</text>
        <rect x="320" y="220" width="120" height="70" rx="4" fill="rgba(13,17,23,0.4)" stroke="rgba(217,180,91,0.15)" />
        <text x="335" y="240" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">PROGRAM NPV</text>
        <text x="335" y="260" className="fill-[#D9B45B]" fontSize="14" fontFamily="JetBrains Mono" fontWeight="bold">$312M</text>
        <text x="335" y="278" className="fill-[#34D399]" fontSize="8" fontFamily="JetBrains Mono">above threshold</text>
      </svg>
    ),

    executive: (
      <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Frozen Build decision record with approval chain">
        {/* Decision record frame */}
        <rect x="40" y="30" width="400" height="260" rx="6" fill="rgba(13,17,23,0.5)" stroke="rgba(91,157,255,0.15)" />
        {/* Header bar */}
        <rect x="40" y="30" width="400" height="36" rx="6" fill="rgba(91,157,255,0.08)" />
        <circle cx="60" cy="48" r="4" fill="#34D399" />
        <text x="72" y="52" className="fill-[#5B9DFF]" fontSize="9" fontFamily="JetBrains Mono">BUILD #2847 · FROZEN</text>
        <text x="350" y="52" className="fill-[#F0F6FC]/30" fontSize="8" fontFamily="JetBrains Mono">2026-07-15</text>
        {/* Decision status */}
        <rect x="60" y="80" width="90" height="24" rx="12" fill="rgba(52,211,153,0.15)" stroke="#34D399" strokeWidth="0.5" />
        <text x="105" y="95" textAnchor="middle" className="fill-[#34D399]" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">APPROVED</text>
        {/* Metrics grid */}
        <text x="60" y="130" className="fill-[#F0F6FC]/40" fontSize="7" fontFamily="JetBrains Mono">KEY METRICS AT DECISION TIME</text>
        <line x1="60" y1="138" x2="420" y2="138" stroke="rgba(240,246,252,0.06)" />
        <text x="60" y="158" className="fill-[#F0F6FC]/60" fontSize="9" fontFamily="JetBrains Mono">Unit Cost</text>
        <text x="200" y="158" className="fill-[#5B9DFF]" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">$47.23</text>
        <text x="300" y="158" className="fill-[#F0F6FC]/25" fontSize="7" fontFamily="JetBrains Mono">← traceable</text>
        <text x="60" y="178" className="fill-[#F0F6FC]/60" fontSize="9" fontFamily="JetBrains Mono">Gross Margin</text>
        <text x="200" y="178" className="fill-[#5B9DFF]" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">42.1%</text>
        <text x="300" y="178" className="fill-[#F0F6FC]/25" fontSize="7" fontFamily="JetBrains Mono">← traceable</text>
        <text x="60" y="198" className="fill-[#F0F6FC]/60" fontSize="9" fontFamily="JetBrains Mono">Break-even</text>
        <text x="200" y="198" className="fill-[#5B9DFF]" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">Q8 2028</text>
        <text x="300" y="198" className="fill-[#F0F6FC]/25" fontSize="7" fontFamily="JetBrains Mono">← traceable</text>
        {/* Provenance footer */}
        <line x1="60" y1="220" x2="420" y2="220" stroke="rgba(240,246,252,0.06)" />
        <text x="60" y="240" className="fill-[#F0F6FC]/30" fontSize="7" fontFamily="JetBrains Mono">CONTENT HASH: sha256:4f2a...c91e</text>
        <text x="60" y="255" className="fill-[#F0F6FC]/30" fontSize="7" fontFamily="JetBrains Mono">ENGINE: Murphy-SIA v4.3 · REF DATA: 2026-07</text>
        <text x="60" y="270" className="fill-[#5B9DFF]/50" fontSize="7" fontFamily="JetBrains Mono">RATIONALE: "Program meets margin floor with acceptable risk exposure."</text>
      </svg>
    ),

    services: (
      <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Portfolio comparison across multiple engagement Builds">
        {/* Portfolio grid */}
        <text x="40" y="25" className="fill-[#F87171]" fontSize="9" fontFamily="JetBrains Mono">PORTFOLIO COMPARISON</text>
        {/* Engagement cards */}
        {[0, 1, 2].map(i => (
          <g key={i} transform={`translate(${40 + i * 150}, 40)`}>
            <rect width="135" height="110" rx="4" fill="rgba(13,17,23,0.5)" stroke={`rgba(248,113,113,${0.1 + i * 0.05})`} />
            <text x="10" y="20" fill={`rgba(248,113,113,${0.6 + i * 0.15})`} fontSize="8" fontFamily="JetBrains Mono">
              {['DEAL A', 'DEAL B', 'DEAL C'][i]}
            </text>
            <text x="10" y="42" className="fill-[#F0F6FC]/60" fontSize="8" fontFamily="JetBrains Mono">Margin</text>
            <text x="90" y="42" className="fill-[#F0F6FC]" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="end">
              {['38.2%', '44.7%', '31.1%'][i]}
            </text>
            <text x="10" y="60" className="fill-[#F0F6FC]/60" fontSize="8" fontFamily="JetBrains Mono">B/E</text>
            <text x="90" y="60" className="fill-[#F0F6FC]" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="end">
              {['Q9', 'Q6', 'Q12'][i]}
            </text>
            <text x="10" y="78" className="fill-[#F0F6FC]/60" fontSize="8" fontFamily="JetBrains Mono">Risk</text>
            <rect x="10" y="85" width={[60, 35, 80][i]} height="4" rx="2" fill={['#FBBF24', '#34D399', '#F87171'][i]} opacity="0.6" />
          </g>
        ))}
        {/* Comparison arrows */}
        <path d="M 175 155 L 175 170 L 325 170 L 325 155" stroke="rgba(248,113,113,0.3)" strokeWidth="1" fill="none" />
        <text x="250" y="185" textAnchor="middle" className="fill-[#F87171]/60" fontSize="8" fontFamily="JetBrains Mono">SAME METHODOLOGY · COMPARABLE</text>
        {/* Decision package export */}
        <rect x="60" y="200" width="360" height="90" rx="4" fill="rgba(13,17,23,0.4)" stroke="rgba(248,113,113,0.1)" />
        <text x="80" y="222" className="fill-[#F87171]" fontSize="8" fontFamily="JetBrains Mono">DECISION PACKAGE · EXPORTABLE</text>
        <line x1="80" y1="232" x2="400" y2="232" stroke="rgba(240,246,252,0.06)" />
        <text x="80" y="250" className="fill-[#F0F6FC]/50" fontSize="8" fontFamily="JetBrains Mono">Assumptions · Computation · Alternatives · Recommendation</text>
        <text x="80" y="268" className="fill-[#F0F6FC]/30" fontSize="7" fontFamily="JetBrains Mono">Portable to co-investors, LPs, or client boards</text>
        <circle cx="85" cy="280" r="3" fill="#34D399" />
        <text x="95" y="283" className="fill-[#34D399]" fontSize="7" fontFamily="JetBrains Mono">PROVENANCE VERIFIED</text>
      </svg>
    ),
  };

  return visuals[variant] || null;
}

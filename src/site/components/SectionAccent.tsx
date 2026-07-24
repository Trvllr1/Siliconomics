type AccentVariant = 'orbit' | 'grid-fade' | 'signal-pulse' | 'die-cluster';

interface SectionAccentProps {
  variant: AccentVariant;
  className?: string;
}

export default function SectionAccent({ variant, className = '' }: SectionAccentProps) {
  return (
    <div className={`absolute pointer-events-none ${className}`} aria-hidden="true">
      {variant === 'orbit' && (
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full opacity-60">
          <circle cx="200" cy="200" r="180" stroke="rgba(0,191,166,0.4)" strokeWidth="0.8" strokeDasharray="8 12" />
          <circle cx="200" cy="200" r="130" stroke="rgba(91,157,255,0.35)" strokeWidth="0.6" strokeDasharray="4 8" />
          <circle cx="200" cy="200" r="75" stroke="rgba(217,180,91,0.3)" strokeWidth="0.5" />
          <circle cx="200" cy="20" r="4" fill="#00BFA6" className="signal-pulse-dot" />
          <circle cx="380" cy="200" r="3" fill="#5B9DFF" className="signal-pulse-dot" style={{ animationDelay: '-1s' }} />
          <circle cx="200" cy="380" r="3.5" fill="#FBBF24" className="signal-pulse-dot" style={{ animationDelay: '-2s' }} />
        </svg>
      )}
      {variant === 'grid-fade' && (
        <svg viewBox="0 0 600 300" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="grid-fade-mask" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0" />
              <stop offset="0.3" stopColor="white" stopOpacity="0.6" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g opacity="0.5" mask="url(#grid-fade-mask)">
            {Array.from({ length: 15 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 20} x2="600" y2={i * 20} stroke="rgba(240,246,252,0.06)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 30 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20 + 60} y2="300" stroke="rgba(240,246,252,0.05)" strokeWidth="0.5" />
            ))}
          </g>
          <circle cx="300" cy="150" r="2.5" fill="#00BFA6" opacity="0.7" className="signal-pulse-dot" />
          <circle cx="180" cy="90" r="2" fill="#5B9DFF" opacity="0.5" className="signal-pulse-dot" style={{ animationDelay: '-1.2s' }} />
          <circle cx="420" cy="210" r="2" fill="#FBBF24" opacity="0.5" className="signal-pulse-dot" style={{ animationDelay: '-0.7s' }} />
        </svg>
      )}
      {variant === 'signal-pulse' && (
        <svg viewBox="0 0 300 100" fill="none" className="w-full h-full">
          <path d="M0 50 Q75 30, 150 50 T300 50" stroke="rgba(0,191,166,0.4)" strokeWidth="1" fill="none" />
          <circle cx="75" cy="40" r="3" fill="#00BFA6" className="signal-pulse-dot" />
          <circle cx="150" cy="50" r="2.5" fill="#5B9DFF" className="signal-pulse-dot" style={{ animationDelay: '-0.8s' }} />
          <circle cx="225" cy="45" r="2" fill="#FBBF24" className="signal-pulse-dot" style={{ animationDelay: '-1.6s' }} />
        </svg>
      )}
      {variant === 'die-cluster' && (
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full opacity-50">
          {/* Wafer fragment arc */}
          <path d="M20 180 A160 160 0 0 1 180 20" stroke="rgba(240,246,252,0.2)" strokeWidth="0.8" fill="none" />
          <path d="M40 180 A140 140 0 0 1 180 40" stroke="rgba(0,191,166,0.3)" strokeWidth="0.6" fill="none" />
          {/* Die grid */}
          {[0, 1, 2, 3].map(row =>
            [0, 1, 2, 3].map(col => {
              const x = 60 + col * 28;
              const y = 60 + row * 28;
              const highlight = (row + col) % 3 === 0;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={x} y={y} width="24" height="24"
                  stroke={highlight ? 'rgba(0,191,166,0.6)' : 'rgba(240,246,252,0.15)'}
                  strokeWidth="0.6"
                  fill={highlight ? 'rgba(0,191,166,0.08)' : 'transparent'}
                />
              );
            })
          )}
          {/* Signal dots */}
          <circle cx="72" cy="72" r="2" fill="#00BFA6" opacity="0.8" />
          <circle cx="128" cy="100" r="1.5" fill="#5B9DFF" opacity="0.7" />
          <circle cx="100" cy="144" r="1.5" fill="#FBBF24" opacity="0.6" />
        </svg>
      )}
    </div>
  );
}

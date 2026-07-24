/**
 * SVG illustration for the Platform page hero — depicts the Reference Models
 * interface where teams load their own assumptions (BYOA).
 */

interface Props {
  className?: string;
}

export default function ReferenceModelVisual({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 640 420" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Reference Models interface showing configurable foundry, packaging, and labor assumptions with version control">
      {/* Background grid */}
      <defs>
        <pattern id="rm-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(0,191,166,0.06)" strokeWidth="0.5" />
        </pattern>
        <linearGradient id="rm-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0D1117" />
          <stop offset="1" stopColor="#101920" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#rm-fade)" />
      <rect width="640" height="420" fill="url(#rm-grid)" />

      {/* Header bar */}
      <rect x="20" y="16" width="600" height="36" rx="6" fill="rgba(240,246,252,0.04)" stroke="rgba(240,246,252,0.08)" strokeWidth="1" />
      <text x="36" y="39" fill="#F0F6FC" opacity="0.45" fontSize="9" fontFamily="monospace" letterSpacing="0.12em">REFERENCE MODELS</text>
      <text x="580" y="39" textAnchor="end" fill="#00BFA6" opacity="0.6" fontSize="8" fontFamily="monospace">v2026.07 · 42 models</text>

      {/* Foundry node card */}
      <rect x="20" y="68" width="290" height="152" rx="6" fill="rgba(0,191,166,0.04)" stroke="rgba(0,191,166,0.2)" strokeWidth="1" />
      <rect x="20" y="68" width="290" height="30" rx="6" fill="rgba(0,191,166,0.08)" />
      <rect x="20" y="92" width="290" height="6" fill="rgba(0,191,166,0.04)" />
      <circle cx="36" cy="83" r="4" fill="#00BFA6" opacity="0.7" />
      <text x="48" y="86" fill="#00BFA6" fontSize="10" fontFamily="monospace" fontWeight="bold">Foundry · Process Nodes</text>
      <text x="280" y="86" textAnchor="end" fill="#F0F6FC" opacity="0.3" fontSize="8" fontFamily="monospace">8 loaded</text>

      {/* Foundry rows */}
      <text x="36" y="116" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">TSMC N3E</text>
      <text x="160" y="116" fill="#FBBF24" fontSize="9" fontFamily="monospace">$18,200/wf</text>
      <text x="250" y="116" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">D₀ 0.09</text>
      <rect x="260" y="108" width="36" height="14" rx="3" fill="rgba(0,191,166,0.15)" />
      <text x="278" y="118" textAnchor="middle" fill="#00BFA6" fontSize="7" fontFamily="monospace">BYOA</text>

      <text x="36" y="138" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">TSMC N4P</text>
      <text x="160" y="138" fill="#FBBF24" fontSize="9" fontFamily="monospace">$16,800/wf</text>
      <text x="250" y="138" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">D₀ 0.11</text>
      <rect x="260" y="130" width="36" height="14" rx="3" fill="rgba(91,157,255,0.15)" />
      <text x="278" y="140" textAnchor="middle" fill="#5B9DFF" fontSize="7" fontFamily="monospace">REF</text>

      <text x="36" y="160" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">Samsung SF3</text>
      <text x="160" y="160" fill="#FBBF24" fontSize="9" fontFamily="monospace">$15,500/wf</text>
      <text x="250" y="160" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">D₀ 0.14</text>
      <rect x="260" y="152" width="36" height="14" rx="3" fill="rgba(91,157,255,0.15)" />
      <text x="278" y="162" textAnchor="middle" fill="#5B9DFF" fontSize="7" fontFamily="monospace">REF</text>

      <text x="36" y="182" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">Intel 18A</text>
      <text x="160" y="182" fill="#FBBF24" fontSize="9" fontFamily="monospace">$14,900/wf</text>
      <text x="250" y="182" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">D₀ 0.13</text>
      <rect x="260" y="174" width="36" height="14" rx="3" fill="rgba(0,191,166,0.15)" />
      <text x="278" y="184" textAnchor="middle" fill="#00BFA6" fontSize="7" fontFamily="monospace">BYOA</text>

      {/* Version badge */}
      <text x="36" y="210" fill="#F0F6FC" opacity="0.2" fontSize="7" fontFamily="monospace">Last updated: 2026-07-18 · Provenance: NDA-foundry-quotes-v3</text>

      {/* Packaging card */}
      <rect x="330" y="68" width="290" height="152" rx="6" fill="rgba(251,191,36,0.04)" stroke="rgba(251,191,36,0.2)" strokeWidth="1" />
      <rect x="330" y="68" width="290" height="30" rx="6" fill="rgba(251,191,36,0.08)" />
      <rect x="330" y="92" width="290" height="6" fill="rgba(251,191,36,0.04)" />
      <circle cx="346" cy="83" r="4" fill="#FBBF24" opacity="0.7" />
      <text x="358" y="86" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">Packaging · Assembly</text>
      <text x="590" y="86" textAnchor="end" fill="#F0F6FC" opacity="0.3" fontSize="8" fontFamily="monospace">6 loaded</text>

      {/* Packaging rows */}
      <text x="346" y="116" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">CoWoS-S</text>
      <text x="460" y="116" fill="#D9B45B" fontSize="9" fontFamily="monospace">$420/unit</text>
      <text x="555" y="116" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">Y: 92%</text>
      <rect x="566" y="108" width="36" height="14" rx="3" fill="rgba(0,191,166,0.15)" />
      <text x="584" y="118" textAnchor="middle" fill="#00BFA6" fontSize="7" fontFamily="monospace">BYOA</text>

      <text x="346" y="138" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">EMIB</text>
      <text x="460" y="138" fill="#D9B45B" fontSize="9" fontFamily="monospace">$285/unit</text>
      <text x="555" y="138" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">Y: 95%</text>
      <rect x="566" y="130" width="36" height="14" rx="3" fill="rgba(91,157,255,0.15)" />
      <text x="584" y="140" textAnchor="middle" fill="#5B9DFF" fontSize="7" fontFamily="monospace">REF</text>

      <text x="346" y="160" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">Foveros</text>
      <text x="460" y="160" fill="#D9B45B" fontSize="9" fontFamily="monospace">$510/unit</text>
      <text x="555" y="160" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">Y: 88%</text>
      <rect x="566" y="152" width="36" height="14" rx="3" fill="rgba(91,157,255,0.15)" />
      <text x="584" y="162" textAnchor="middle" fill="#5B9DFF" fontSize="7" fontFamily="monospace">REF</text>

      <text x="346" y="182" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">FCBGA std</text>
      <text x="460" y="182" fill="#D9B45B" fontSize="9" fontFamily="monospace">$38/unit</text>
      <text x="555" y="182" textAnchor="end" fill="#F0F6FC" opacity="0.25" fontSize="8" fontFamily="monospace">Y: 99%</text>
      <rect x="566" y="174" width="36" height="14" rx="3" fill="rgba(91,157,255,0.15)" />
      <text x="584" y="184" textAnchor="middle" fill="#5B9DFF" fontSize="7" fontFamily="monospace">REF</text>

      <text x="346" y="210" fill="#F0F6FC" opacity="0.2" fontSize="7" fontFamily="monospace">Last updated: 2026-07-12 · Provenance: OSAT-bid-round-Q3</text>

      {/* Labor & Operations card */}
      <rect x="20" y="236" width="290" height="100" rx="6" fill="rgba(91,157,255,0.04)" stroke="rgba(91,157,255,0.2)" strokeWidth="1" />
      <rect x="20" y="236" width="290" height="30" rx="6" fill="rgba(91,157,255,0.08)" />
      <rect x="20" y="260" width="290" height="6" fill="rgba(91,157,255,0.04)" />
      <circle cx="36" cy="251" r="4" fill="#5B9DFF" opacity="0.7" />
      <text x="48" y="254" fill="#5B9DFF" fontSize="10" fontFamily="monospace" fontWeight="bold">Labor · Operations</text>
      <text x="280" y="254" textAnchor="end" fill="#F0F6FC" opacity="0.3" fontSize="8" fontFamily="monospace">3 loaded</text>

      <text x="36" y="284" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">Design eng (US)</text>
      <text x="180" y="284" fill="#5B9DFF" fontSize="9" fontFamily="monospace">$185/hr</text>
      <text x="36" y="304" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">Test eng (TW)</text>
      <text x="180" y="304" fill="#5B9DFF" fontSize="9" fontFamily="monospace">$62/hr</text>
      <text x="36" y="324" fill="#F0F6FC" opacity="0.7" fontSize="9" fontFamily="monospace">Mask shop NRE</text>
      <text x="180" y="324" fill="#D9B45B" fontSize="9" fontFamily="monospace">$4.2M</text>

      {/* Yield Learning card */}
      <rect x="330" y="236" width="290" height="100" rx="6" fill="rgba(248,113,113,0.04)" stroke="rgba(248,113,113,0.2)" strokeWidth="1" />
      <rect x="330" y="236" width="290" height="30" rx="6" fill="rgba(248,113,113,0.08)" />
      <rect x="330" y="260" width="290" height="6" fill="rgba(248,113,113,0.04)" />
      <circle cx="346" cy="251" r="4" fill="#F87171" opacity="0.7" />
      <text x="358" y="254" fill="#F87171" fontSize="10" fontFamily="monospace" fontWeight="bold">Yield · Learning Curves</text>
      <text x="590" y="254" textAnchor="end" fill="#F0F6FC" opacity="0.3" fontSize="8" fontFamily="monospace">4 loaded</text>

      {/* Yield curve mini chart */}
      <polyline points="346,325 380,318 420,305 460,295 500,290 540,288 580,287" stroke="#F87171" strokeWidth="1.5" fill="none" opacity="0.6" />
      <polyline points="346,320 380,310 420,298 460,292 500,289 540,287 580,286" stroke="#00BFA6" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="3 2" />
      <text x="346" y="284" fill="#F0F6FC" opacity="0.5" fontSize="8" fontFamily="monospace">D₀ learning: 0.14 → 0.09 over 12 months</text>
      <text x="582" y="284" textAnchor="end" fill="#F87171" opacity="0.5" fontSize="7" fontFamily="monospace">Murphy model</text>

      {/* Bottom status bar */}
      <rect x="20" y="354" width="600" height="46" rx="6" fill="rgba(240,246,252,0.03)" stroke="rgba(240,246,252,0.06)" strokeWidth="1" />
      <circle cx="40" cy="377" r="5" fill="#00BFA6" opacity="0.8" />
      <text x="54" y="370" fill="#F0F6FC" opacity="0.5" fontSize="8" fontFamily="monospace">BYOA STATUS</text>
      <text x="54" y="383" fill="#F0F6FC" opacity="0.35" fontSize="7" fontFamily="monospace">4 custom · 38 defaults</text>
      <text x="54" y="394" fill="#F0F6FC" opacity="0.25" fontSize="7" fontFamily="monospace">Same formulas, your data</text>
      <rect x="490" y="365" width="120" height="24" rx="4" fill="rgba(0,191,166,0.12)" stroke="#00BFA6" strokeWidth="1" />
      <text x="550" y="381" textAnchor="middle" fill="#00BFA6" fontSize="9" fontFamily="monospace" fontWeight="bold">Apply to Build →</text>
    </svg>
  );
}

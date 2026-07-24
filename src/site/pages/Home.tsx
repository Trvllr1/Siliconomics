import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import dashboardImage from '../../assets/images/product-dashboard.png';
import { PRECONFIG_ARCHETYPES } from '../../data/archetypes';
import { DEFAULT_FORMULA_LIBRARY } from '../../data/defaultFormulaLibrary';
import { DEFAULT_REFERENCE_MODELS } from '../../data/defaultReferenceModels';
import SEO from '../components/SEO';
import ConsequenceChain from '../components/ConsequenceChain';
import ConsequenceExplorer from '../components/ConsequenceExplorer';
import PillarCard from '../components/PillarCard';
import ProgramChart from '../components/ProgramChart';
import CompareModule from '../components/CompareModule';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import HeroTopology from '../components/HeroTopology';
import VisualEvidencePanel from '../components/VisualEvidencePanel';
import SectionAccent from '../components/SectionAccent';
import DataRail from '../components/DataRail';
import TechDiagram from '../components/TechDiagram';
import { INSIGHTS_INDEX } from '../content/insights';
import { HERO, PILLARS, PROBLEM_PANELS, WORKFLOW_STEPS, ANTI_POSITIONING, PARTNER_OFFER, CHIPPIE_DESCRIPTION } from '../content/pages';

const COVERAGE_FACTS = [
  { value: '20', label: 'Quarter program horizon' },
  { value: String(DEFAULT_FORMULA_LIBRARY.length), label: 'Traceable model formulas' },
  { value: String(DEFAULT_REFERENCE_MODELS.length), label: 'Versioned reference models' },
  { value: String(PRECONFIG_ARCHETYPES.length), label: 'Silicon starting archetypes' },
];

const BUYER_FIT = [
  { title: 'Capital allocation', body: 'CFO and finance teams interrogating NRE, margin, break-even, and lifetime return.' },
  { title: 'Product commitment', body: 'Product and program leaders taking architecture trade-offs into a gate review.' },
  { title: 'Manufacturing exposure', body: 'Foundry and OSAT planners modeling yield, package complexity, and ramp risk.' },
];

const PRODUCT_MILESTONES = [
  { label: 'Decision governance', detail: 'Frozen snapshots, content hashes, and a decision record tied to the Build.' },
  { label: 'Meeting Mode', detail: 'Gate-review presentation mode with exportable decision decks.' },
  { label: 'Sensitivity Lab', detail: 'Interactive driver analysis across a 20-quarter program horizon.' },
];

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={`py-16 md:py-24 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/* Inline SVG die/wafer decorative element */
function DieWaferDecor() {
  return (
    <svg
      className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 opacity-[0.04] pointer-events-none"
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
    >
      {/* Wafer circle */}
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" className="text-art-ink" />
      <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.3" className="text-art-ink" />
      <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="0.3" className="text-art-ink" />
      {/* Die grid lines */}
      <line x1="40" y1="100" x2="160" y2="100" stroke="currentColor" strokeWidth="0.3" className="text-art-ink" />
      <line x1="100" y1="40" x2="100" y2="160" stroke="currentColor" strokeWidth="0.3" className="text-art-ink" />
      {/* Die rectangles */}
      <rect x="70" y="70" width="20" height="20" stroke="currentColor" strokeWidth="0.5" className="text-art-ink" />
      <rect x="110" y="70" width="20" height="20" stroke="currentColor" strokeWidth="0.5" className="text-art-ink" />
      <rect x="70" y="110" width="20" height="20" stroke="currentColor" strokeWidth="0.5" className="text-art-ink" />
      <rect x="110" y="110" width="20" height="20" stroke="currentColor" strokeWidth="0.5" className="text-art-ink" />
    </svg>
  );
}

function DieToDollarsFlow() {
  const stages = ['WAFER', 'DIE', 'YIELD', 'PACKAGE', 'PROGRAM'];

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 hidden lg:block" aria-hidden="true">
      <div className="mx-8 mb-7 flex items-center justify-between border-t border-art-ink/15 pt-4">
        {stages.map((stage, index) => (
          <div key={stage} className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center border border-art-rust/50 bg-art-cream/90 text-[9px] font-mono font-bold text-art-rust">
              0{index + 1}
            </div>
            <span className="authority-label text-[9px] text-art-ink/60">{stage}</span>
            {index < stages.length - 1 && <span className="h-px w-9 bg-art-rust/50" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function WaferCoverageGraphic() {
  return (
    <svg viewBox="0 0 520 360" fill="none" aria-hidden="true" className="h-auto w-full">
      <defs>
        <radialGradient id="wafer-glow" cx="0" cy="0" r="1" gradientTransform="translate(200 174) rotate(90) scale(148)">
          <stop stopColor="#00BFA6" stopOpacity="0.34" />
          <stop offset="0.62" stopColor="#0D1117" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0D1117" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="line-glow" x1="56" y1="112" x2="475" y2="261" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00BFA6" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#00BFA6" />
          <stop offset="1" stopColor="#5B9DFF" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <circle cx="178" cy="180" r="148" fill="url(#wafer-glow)" stroke="#F0F6FC" strokeOpacity="0.28" />
      <circle cx="178" cy="180" r="112" stroke="#F0F6FC" strokeOpacity="0.18" />
      <circle cx="178" cy="180" r="74" stroke="#00BFA6" strokeOpacity="0.42" />
      {[-72, -36, 0, 36, 72].map(offset => (
        <g key={offset} opacity="0.56">
          <path d={`M78 ${180 + offset}H278`} stroke="#F0F6FC" strokeOpacity="0.22" />
          <path d={`M${178 + offset} 80V280`} stroke="#F0F6FC" strokeOpacity="0.22" />
        </g>
      ))}
      <rect x="142" y="144" width="72" height="72" stroke="#00BFA6" strokeWidth="2" />
      <rect x="151" y="153" width="22" height="22" fill="#00BFA6" fillOpacity="0.28" />
      <rect x="183" y="153" width="22" height="22" fill="#5B9DFF" fillOpacity="0.3" />
      <rect x="151" y="185" width="22" height="22" fill="#5B9DFF" fillOpacity="0.22" />
      <rect x="183" y="185" width="22" height="22" fill="#00BFA6" fillOpacity="0.45" />
      <path d="M242 180H355L384 140H458" stroke="url(#line-glow)" strokeWidth="2" />
      <path d="M355 180L384 220H458" stroke="url(#line-glow)" strokeWidth="2" />
      <circle cx="242" cy="180" r="5" fill="#00BFA6" />
      <circle cx="384" cy="140" r="5" fill="#00BFA6" />
      <circle cx="384" cy="220" r="5" fill="#5B9DFF" />
      <text x="56" y="326" fill="#F0F6FC" fillOpacity="0.55" fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="2">SILICON INPUTS</text>
      <text x="366" y="122" fill="#F0F6FC" fillOpacity="0.72" fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="2">COST</text>
      <text x="366" y="248" fill="#F0F6FC" fillOpacity="0.72" fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="2">RISK</text>
    </svg>
  );
}

function CapabilityGlyph({ index }: { index: number }) {
  const paths = [
    <><circle cx="32" cy="32" r="18" /><path d="M14 32h36M32 14v36" /><circle cx="32" cy="32" r="5" /></>,
    <><path d="M12 44 25 31l9 7 18-20" /><path d="M12 50h40" /><circle cx="25" cy="31" r="3" /><circle cx="34" cy="38" r="3" /></>,
    <><path d="M15 17h34v30H15z" /><path d="M22 17v-5h20v5M22 28h20M22 38h12" /><circle cx="42" cy="42" r="8" /></>,
    <><path d="M32 10 50 20v24L32 54 14 44V20z" /><path d="m14 20 18 10 18-10M32 30v24" /></>,
  ];

  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-14 w-14 text-art-rust">
      {paths[index]}
    </svg>
  );
}

/** Background SVG for each platform capability card */
function CapabilityCardBg({ index }: { index: number }) {
  const bgs = [
    // Build Workspace — teal wafer with glowing die grid
    <svg viewBox="0 0 320 280" fill="none" className="absolute right-[-20px] bottom-[-20px] w-[70%] h-[70%] pointer-events-none" aria-hidden="true">
      <defs>
        <radialGradient id="bw-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#00BFA6" stopOpacity="0.25" />
          <stop offset="0.7" stopColor="#00BFA6" stopOpacity="0.08" />
          <stop offset="1" stopColor="#00BFA6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="180" cy="160" r="110" fill="url(#bw-glow)" />
      <circle cx="180" cy="160" r="90" stroke="#00BFA6" strokeWidth="0.8" strokeOpacity="0.3" />
      <circle cx="180" cy="160" r="60" stroke="#00BFA6" strokeWidth="0.5" strokeOpacity="0.2" />
      {[0, 45, 90, 135].map(a => <line key={a} x1="180" y1="160" x2={180 + 90 * Math.cos(a * Math.PI / 180)} y2={160 + 90 * Math.sin(a * Math.PI / 180)} stroke="#00BFA6" strokeWidth="0.4" strokeOpacity="0.2" />)}
      <rect x="155" y="135" width="50" height="50" stroke="#00BFA6" strokeWidth="1.2" strokeOpacity="0.5" />
      <rect x="160" y="140" width="18" height="18" fill="#00BFA6" fillOpacity="0.2" />
      <rect x="182" y="140" width="18" height="18" fill="#00BFA6" fillOpacity="0.12" />
      <rect x="160" y="162" width="18" height="18" fill="#00BFA6" fillOpacity="0.12" />
      <rect x="182" y="162" width="18" height="18" fill="#00BFA6" fillOpacity="0.2" />
      <circle cx="169" cy="149" r="2" fill="#00BFA6" fillOpacity="0.6" />
      <circle cx="191" cy="171" r="2" fill="#00BFA6" fillOpacity="0.6" />
    </svg>,
    // Explainability — blue branching provenance tree
    <svg viewBox="0 0 320 280" fill="none" className="absolute right-[-20px] bottom-[-20px] w-[70%] h-[70%] pointer-events-none" aria-hidden="true">
      <defs>
        <radialGradient id="ex-glow" cx="0.5" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#5B9DFF" stopOpacity="0.2" />
          <stop offset="1" stopColor="#5B9DFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="320" height="280" fill="url(#ex-glow)" />
      <path d="M180 40v35M180 75l-60 45M180 75l60 45M120 120v35M240 120v35M120 155l-25 35M120 155l25 35M240 155l-25 35M240 155l25 35" stroke="#5B9DFF" strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="180" cy="40" r="6" fill="#5B9DFF" fillOpacity="0.35" stroke="#5B9DFF" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="180" cy="75" r="7" fill="#5B9DFF" fillOpacity="0.25" stroke="#5B9DFF" strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx="120" cy="120" r="5" fill="#5B9DFF" fillOpacity="0.3" />
      <circle cx="240" cy="120" r="5" fill="#5B9DFF" fillOpacity="0.3" />
      <circle cx="120" cy="155" r="4" fill="#5B9DFF" fillOpacity="0.2" />
      <circle cx="240" cy="155" r="4" fill="#5B9DFF" fillOpacity="0.2" />
      <circle cx="95" cy="190" r="3.5" fill="#5B9DFF" fillOpacity="0.15" />
      <circle cx="145" cy="190" r="3.5" fill="#5B9DFF" fillOpacity="0.15" />
      <circle cx="215" cy="190" r="3.5" fill="#5B9DFF" fillOpacity="0.15" />
      <circle cx="265" cy="190" r="3.5" fill="#5B9DFF" fillOpacity="0.15" />
    </svg>,
    // Time-Dimension — gold/amber timeline with quarter pulses
    <svg viewBox="0 0 320 280" fill="none" className="absolute right-[-20px] bottom-[-20px] w-[70%] h-[70%] pointer-events-none" aria-hidden="true">
      <defs>
        <linearGradient id="td-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D9B45B" stopOpacity="0" />
          <stop offset="0.3" stopColor="#D9B45B" stopOpacity="0.5" />
          <stop offset="0.7" stopColor="#FBBF24" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FBBF24" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="td-glow" cx="0.6" cy="0.7" r="0.5">
          <stop offset="0" stopColor="#D9B45B" stopOpacity="0.15" />
          <stop offset="1" stopColor="#D9B45B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="320" height="280" fill="url(#td-glow)" />
      <line x1="40" y1="200" x2="290" y2="200" stroke="url(#td-line)" strokeWidth="1.5" />
      {[80, 120, 160, 200, 240].map((x, i) => <g key={x}><line x1={x} y1="195" x2={x} y2="205" stroke="#D9B45B" strokeWidth="1" strokeOpacity="0.5" /><line x1={x} y1="200" x2={x} y2={200 - 30 - i * 12} stroke="#D9B45B" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="3 2" /><circle cx={x} cy={200 - 30 - i * 12} r="4" fill="#D9B45B" fillOpacity={0.15 + i * 0.06} stroke="#D9B45B" strokeWidth="0.8" strokeOpacity="0.4" /></g>)}
      <path d="M80 160C110 140 140 170 170 130S230 100 260 120" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.35" fill="none" />
      <text x="75" y="225" fill="#D9B45B" fillOpacity="0.3" fontFamily="JetBrains Mono, monospace" fontSize="8">Q1</text>
      <text x="235" y="225" fill="#FBBF24" fillOpacity="0.3" fontFamily="JetBrains Mono, monospace" fontSize="8">Q20</text>
    </svg>,
    // Comparison — crimson/teal split panel with delta highlights
    <svg viewBox="0 0 320 280" fill="none" className="absolute right-[-20px] bottom-[-20px] w-[70%] h-[70%] pointer-events-none" aria-hidden="true">
      <defs>
        <linearGradient id="cp-split" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#00BFA6" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="transparent" stopOpacity="0" />
          <stop offset="1" stopColor="#F87171" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="280" fill="url(#cp-split)" />
      <line x1="170" y1="40" x2="170" y2="240" stroke="#F0F6FC" strokeWidth="0.8" strokeOpacity="0.15" strokeDasharray="6 4" />
      <rect x="60" y="70" width="80" height="130" rx="3" stroke="#00BFA6" strokeWidth="1" strokeOpacity="0.35" />
      <rect x="190" y="70" width="80" height="130" rx="3" stroke="#F87171" strokeWidth="1" strokeOpacity="0.3" />
      {[95, 115, 135, 155].map(y => <><line key={`l${y}`} x1="75" y1={y} x2="125" y2={y} stroke="#00BFA6" strokeWidth="0.8" strokeOpacity="0.25" /><line key={`r${y}`} x1="205" y1={y} x2="255" y2={y} stroke="#F87171" strokeWidth="0.8" strokeOpacity="0.2" /></>)}
      <path d="M148 110l14-12 6 6" stroke="#00BFA6" strokeWidth="1.2" strokeOpacity="0.5" />
      <path d="M148 150l14 12 6-6" stroke="#F87171" strokeWidth="1.2" strokeOpacity="0.45" />
      <text x="80" y="215" fill="#00BFA6" fillOpacity="0.25" fontFamily="JetBrains Mono, monospace" fontSize="8">BUILD A</text>
      <text x="210" y="215" fill="#F87171" fillOpacity="0.25" fontFamily="JetBrains Mono, monospace" fontSize="8">BUILD B</text>
    </svg>,
  ];
  return bgs[index] ?? null;
}

export default function Home() {
  return (
    <div className="bg-art-cream min-h-screen">
      <SEO title="Siliconomics — Deterministic Silicon Economics" description="Siliconomics is the decision system for silicon economics — deterministic, auditable program modeling for teams making $100M+ chip decisions without $100M of tribal knowledge." ogImage="/og/home.svg" />

      <main id="main-content">
        {/* Hero billboard — silicon inputs translated into commercial decisions. */}
        <section className="silicon-billboard silicon-grid relative isolate overflow-hidden border-b border-art-ink/10">
          <DieWaferDecor />
          <HeroTopology className="absolute inset-y-0 right-0 z-0 h-full w-[72%] opacity-95 lg:w-[64%]" />
          <div className="silicon-signal-field" aria-hidden="true">
            <span className="silicon-signal-arc silicon-signal-arc--teal" />
            <span className="silicon-signal-arc silicon-signal-arc--blue" />
            <span className="silicon-signal-arc silicon-signal-arc--gold" />
            <span className="silicon-signal-trace" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,23,0.98)_0%,rgba(13,17,23,0.70)_42%,rgba(13,17,23,0.10)_100%)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10 md:px-10 md:pb-28 md:pt-16">
            <div className="mb-12 flex w-fit items-center gap-3 border-y border-art-rust/40 py-3 text-art-ink">
              <span className="authority-label text-art-rust">Now available</span>
              <span className="h-3 w-px bg-art-ink/25" />
              <span className="text-xs font-medium">Meeting Mode: exportable decision decks for gate reviews</span>
            </div>
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="relative z-10 lg:col-span-6">
                <span className="authority-label mb-5 block text-eng-blue">{HERO.eyebrow}</span>
                <h1 className="mb-6 max-w-3xl font-serif text-art-ink" style={{ fontSize: 'clamp(3.1rem, 6.3vw, 5.75rem)', fontWeight: 900, letterSpacing: '0', lineHeight: 0.98 }}>
                  Silicon architecture, translated into financial truth.
                </h1>
                <p className="mb-5 max-w-xl text-base leading-relaxed text-art-ink/75 md:text-lg">
                  Turn architecture, yield, packaging, and ramp assumptions into a shared, defensible program view before the decision reaches a gate review.
                </p>
                <p className="mb-8 max-w-lg text-sm leading-relaxed text-art-ink/50 italic border-l-2 border-art-rust/30 pl-4">
                  They inform the market context. You compute the program-specific answer.<br />
                  <span className="not-italic font-mono text-[10px] text-art-rust/70 uppercase tracking-wider">What you use after reading SemiAnalysis.</span>
                </p>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <Link to="/app" className="inline-flex items-center bg-art-rust px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#0D1117] transition-colors hover:bg-art-rust/85">
                    {HERO.ctaDemo}
                  </Link>
                  <Link to="/platform" className="inline-flex items-center border border-art-ink/30 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-art-ink transition-colors hover:border-art-rust hover:text-art-rust">
                    {HERO.ctaMethodology}
                  </Link>
                </div>
                <p className="text-[10px] font-mono text-art-ink/50">{HERO.microProof}</p>
              </div>
              <div className="relative lg:col-span-6">
                <figure className="card-reveal relative border border-art-ink/25 bg-surface-1 shadow-[0_32px_90px_rgba(0,0,0,0.55)]">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-art-ink/15 bg-[#0D1117]/75 px-4 py-3 backdrop-blur-sm">
                    <span className="authority-label text-[9px] text-art-rust">Live program intelligence</span>
                    <span className="font-mono text-[9px] text-art-ink/50">ILLUSTRATIVE BUILD</span>
                  </div>
                  <img src={dashboardImage} alt="Siliconomics dashboard showing program metrics, active semiconductor Builds, operational alerts, and an audit trace." className="block aspect-[1.44] w-full bg-[#0D1117] object-contain" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/75 to-transparent px-5 pb-5 pt-20">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-art-rust">Every number has a lineage</p>
                    <p className="mt-1 text-xs text-art-ink/70">From input assumptions to board-level decision.</p>
                  </div>
                </figure>
              </div>
            </div>
            <DieToDollarsFlow />
          </div>
        </section>

        <section className="border-b border-art-ink/10 bg-surface-1 px-6 py-5 md:px-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            {['Deterministic modeling', 'Auditable provenance', 'Board-ready decisions'].map((claim, index) => (
              <div key={claim} className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-art-rust">0{index + 1}</span>
                <span className="authority-label text-[10px] text-art-ink/70">{claim}</span>
              </div>
            ))}
          </div>
        </section>

        <Section className="section-atmosphere--deep relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="grid-fade" className="top-0 left-0 w-48 h-32 opacity-30" />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 md:px-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="authority-label mb-4 block text-art-rust">Who Siliconomics serves</span>
              <h2 className="max-w-xl font-serif text-4xl font-black leading-tight text-art-ink md:text-5xl">
                The commercial system around a silicon decision.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-art-ink/65">
                Siliconomics connects the people accountable for architecture with the people accountable for its financial consequence.
              </p>
              <div className="mt-8 border-l border-art-rust pl-5">
                <p className="authority-label text-[10px] text-art-rust">Founding design partners</p>
                <p className="mt-2 text-sm leading-relaxed text-art-ink/70">We are looking for teams bringing live silicon programs into a more disciplined commercial operating model.</p>
                <Link to="/partners" className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.16em] text-art-ink underline decoration-art-rust decoration-2 underline-offset-4 hover:text-art-rust">
                  Explore the program
                </Link>
              </div>
            </div>
            <div className="grid gap-3 lg:col-span-4">
              {BUYER_FIT.map((buyer, index) => (
                <div key={buyer.title} className="border border-art-ink/12 bg-[#0D1117]/65 p-5">
                  <span className="font-mono text-[10px] text-art-rust">0{index + 1}</span>
                  <h3 className="mt-2 text-base font-bold text-art-ink">{buyer.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-art-ink/60">{buyer.body}</p>
                </div>
              ))}
            </div>
            <div className="relative lg:col-span-3">
              <VisualEvidencePanel variant="program" />
            </div>
          </div>
          <div className="mx-auto mt-14 grid max-w-7xl grid-cols-2 border-y border-art-ink/10 md:grid-cols-4">
            {COVERAGE_FACTS.map(fact => (
              <div key={fact.label} className="border-r border-art-ink/10 px-6 py-6 last:border-r-0 md:px-8">
                <p className="font-serif text-4xl font-black text-art-ink">{fact.value}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.13em] text-art-ink/50">{fact.label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section className="section-atmosphere--warm relative overflow-hidden border-b border-art-ink/10">
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
            <div className="grid gap-8 border-b border-art-ink/10 pb-10 md:grid-cols-12 md:items-end">
              <div className="md:col-span-7">
                <span className="authority-label mb-4 block text-eng-blue">Platform capabilities</span>
                <h2 className="max-w-2xl font-serif text-4xl font-black leading-tight text-art-ink md:text-5xl">Four guarantees. Zero ambiguity.</h2>
              </div>
              <p className="md:col-span-4 md:col-start-9 text-sm leading-relaxed text-art-ink/60">Not features — commitments. Each capability exists because enterprise silicon decisions cannot tolerate guesswork, missing provenance, or single-point-in-time analysis.</p>
            </div>
            <div className="grid md:grid-cols-2">
              {PILLARS.map((pillar, index) => (
                <Link key={pillar.title} to="/platform" className="group card-reveal relative overflow-hidden border-b border-r border-art-ink/10 p-7 transition-colors hover:bg-surface-1/50 md:min-h-72 md:p-9">
                  <CapabilityCardBg index={index} />
                  <div className="absolute right-0 top-0 h-16 w-16 border-b border-l border-art-ink/10" />
                  <div className="relative z-10 flex items-start justify-between gap-8">
                    <CapabilityGlyph index={index} />
                    <span className="font-mono text-[10px] text-art-ink/35">0{index + 1}</span>
                  </div>
                  <h3 className="relative z-10 mt-10 text-[1.6rem] font-black leading-tight text-art-ink transition-colors group-hover:text-art-rust">{pillar.title}</h3>
                  <p className="relative z-10 mt-3 max-w-md text-sm leading-relaxed text-art-ink/70">{pillar.description}</p>
                  <span className="relative z-10 mt-7 inline-block text-[10px] font-bold uppercase tracking-[0.17em] text-art-rust">See how →</span>
                </Link>
              ))}
            </div>
          </div>
        </Section>

        <Section className="section-atmosphere--terminal relative overflow-hidden border-b border-art-ink/10">
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
            <div className="flex flex-col justify-between gap-4 border-b border-art-ink/10 pb-8 md:flex-row md:items-end">
              <div>
                <span className="authority-label mb-4 block text-art-rust">What is new</span>
                <h2 className="font-serif text-4xl font-black text-art-ink md:text-5xl">Built for the next review.</h2>
              </div>
              <Link to="/insights" className="text-[10px] font-bold uppercase tracking-[0.16em] text-art-ink/70 underline decoration-art-rust decoration-2 underline-offset-4 hover:text-art-rust">View insights</Link>
            </div>
            <div className="grid divide-y divide-art-ink/10 md:grid-cols-[1.1fr_0.9fr] md:divide-x md:divide-y-0">
              <article className="py-8 pr-0 md:pr-10">
                <p className="authority-label text-[10px] text-eng-blue">Latest published analysis</p>
                <p className="mt-5 font-mono text-[10px] text-art-ink/45">{INSIGHTS_INDEX[0]?.dateline}</p>
                <h3 className="mt-2 max-w-xl font-serif text-2xl font-bold leading-snug text-art-ink">{INSIGHTS_INDEX[0]?.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-art-ink/60">{INSIGHTS_INDEX[0]?.description}</p>
                <Link to={`/insights/${INSIGHTS_INDEX[0]?.slug ?? ''}`} className="mt-6 inline-block text-[10px] font-bold uppercase tracking-[0.16em] text-art-rust">Read the analysis</Link>
              </article>
              <div className="grid gap-5 py-6 pl-0 md:pl-10">
                {/* Teardown analysis illustration */}
                <div className="glow-card rounded-lg p-5 overflow-hidden">
                  <div className="flex items-center gap-2 mb-3 border-b border-art-ink/10 pb-2">
                    <span className="h-2 w-2 rounded-full bg-ver-green" />
                    <span className="text-[9px] font-mono text-art-ink/50 uppercase tracking-wider">Live teardown — AI accelerator</span>
                  </div>
                  <svg viewBox="0 0 400 180" fill="none" className="w-full h-auto" aria-label="Cost waterfall teardown analysis">
                    {/* Cost waterfall bars */}
                    <text x="10" y="12" fill="#F0F6FC" fillOpacity="0.4" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="1">COST WATERFALL ($/die)</text>
                    {[
                      { x: 20, h: 100, label: 'Wafer', val: '$142', color: '#00BFA6' },
                      { x: 75, h: 70, label: 'Yield', val: '$98', color: '#5B9DFF' },
                      { x: 130, h: 45, label: 'Pkg', val: '$63', color: '#FBBF24' },
                      { x: 185, h: 30, label: 'Test', val: '$42', color: '#D9B45B' },
                      { x: 240, h: 20, label: 'NRE', val: '$28', color: '#F87171' },
                    ].map(bar => (
                      <g key={bar.label}>
                        <rect x={bar.x} y={150 - bar.h} width="40" height={bar.h} fill={bar.color} fillOpacity="0.3" stroke={bar.color} strokeWidth="0.8" strokeOpacity="0.6" rx="2" />
                        <text x={bar.x + 20} y={145 - bar.h} fill={bar.color} fontFamily="JetBrains Mono, monospace" fontSize="8" textAnchor="middle" fillOpacity="0.9">{bar.val}</text>
                        <text x={bar.x + 20} y={165} fill="#F0F6FC" fillOpacity="0.4" fontFamily="JetBrains Mono, monospace" fontSize="7" textAnchor="middle">{bar.label}</text>
                      </g>
                    ))}
                    {/* Yield curve mini-chart */}
                    <text x="300" y="12" fill="#F0F6FC" fillOpacity="0.4" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="1">YIELD CURVE</text>
                    <rect x="295" y="20" width="95" height="70" stroke="#F0F6FC" strokeOpacity="0.1" strokeWidth="0.5" rx="2" />
                    <path d="M300 85 C315 80 325 65 340 50 S360 30 385 28" stroke="#00BFA6" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />
                    <path d="M300 85 C315 80 325 65 340 50 S360 30 385 28 V85 H300 Z" fill="#00BFA6" fillOpacity="0.08" />
                    <circle cx="340" cy="50" r="3" fill="#00BFA6" fillOpacity="0.6" />
                    <text x="335" y="46" fill="#00BFA6" fillOpacity="0.7" fontFamily="JetBrains Mono, monospace" fontSize="7">81.5%</text>
                    {/* Packaging stack */}
                    <text x="300" y="105" fill="#F0F6FC" fillOpacity="0.4" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="1">PKG STACK</text>
                    <rect x="310" y="115" width="60" height="8" fill="#FBBF24" fillOpacity="0.2" stroke="#FBBF24" strokeWidth="0.5" strokeOpacity="0.4" rx="1" />
                    <text x="375" y="122" fill="#FBBF24" fillOpacity="0.5" fontFamily="JetBrains Mono, monospace" fontSize="6">HBM</text>
                    <rect x="310" y="126" width="60" height="8" fill="#5B9DFF" fillOpacity="0.2" stroke="#5B9DFF" strokeWidth="0.5" strokeOpacity="0.4" rx="1" />
                    <text x="375" y="133" fill="#5B9DFF" fillOpacity="0.5" fontFamily="JetBrains Mono, monospace" fontSize="6">Interposer</text>
                    <rect x="310" y="137" width="60" height="8" fill="#00BFA6" fillOpacity="0.2" stroke="#00BFA6" strokeWidth="0.5" strokeOpacity="0.4" rx="1" />
                    <text x="375" y="144" fill="#00BFA6" fillOpacity="0.5" fontFamily="JetBrains Mono, monospace" fontSize="6">Substrate</text>
                    <rect x="310" y="148" width="60" height="8" fill="#D9B45B" fillOpacity="0.2" stroke="#D9B45B" strokeWidth="0.5" strokeOpacity="0.4" rx="1" />
                    <text x="375" y="155" fill="#D9B45B" fillOpacity="0.5" fontFamily="JetBrains Mono, monospace" fontSize="6">BGA</text>
                  </svg>
                </div>
                <div className="grid">
                  {PRODUCT_MILESTONES.map((milestone, index) => (
                    <div key={milestone.label} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-art-ink/10 py-4 last:border-b-0">
                      <span className="font-mono text-[10px] text-art-rust">0{index + 1}</span>
                      <div>
                        <h3 className="text-sm font-bold text-art-ink">{milestone.label}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-art-ink/60">{milestone.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Consequence chain — THE PRODUCT THESIS */}
        <Section className="section-atmosphere--deep relative overflow-hidden border-y-2 border-art-rust/30">
          <SectionAccent variant="orbit" className="top-[-3rem] left-[-4rem] w-64 h-64 opacity-50" />
          <SectionAccent variant="signal-pulse" className="bottom-4 left-0 right-0 h-12 opacity-40" />
          <div className="section-glow-accent" style={{ '--glow-color': 'rgba(0,191,166,0.12)', '--glow-x': '50%', '--glow-y': '40%' } as React.CSSProperties} />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 border border-art-rust/50 bg-art-rust/10 text-[0.6875rem] font-mono uppercase tracking-[0.16em] text-art-rust font-bold mb-4">
                The product thesis in one glance
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-art-ink mb-3">Every cost decision is a consequence chain.</h2>
              <p className="text-sm text-art-ink/55 max-w-2xl mx-auto">Architecture → yield → packaging → program economics. One assumption changes everything downstream. Siliconomics makes the chain visible and auditable.</p>
            </div>
            <ConsequenceChain />
            <DataRail preset="methodology" className="mt-10" />
          </div>
        </Section>

        {/* Problem — the industry failure modes */}
        <Section className="section-atmosphere--deep relative overflow-hidden">
          <SectionAccent variant="orbit" className="top-[-4rem] right-[-6rem] w-64 h-64" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="mb-10">
              <span className="authority-label mb-4 block text-risk-crimson">The industry problem</span>
              <h2 className="max-w-2xl font-serif text-3xl font-black leading-tight text-art-ink md:text-4xl">The tools behind $100M decisions haven't changed in thirty years.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PROBLEM_PANELS.map((p, i) => {
                const diagrams: Array<'broken-spreadsheet' | 'tribal-knowledge' | 'unaudited-number'> = ['broken-spreadsheet', 'tribal-knowledge', 'unaudited-number'];
                return (
                  <div key={p.title} className="glow-card glow-card--crimson rounded-lg p-6">
                    <TechDiagram variant={diagrams[i]!} className="mb-4 h-28 opacity-80" />
                    <span className="text-[10px] font-mono text-risk-crimson/70 mb-2 block uppercase tracking-wider">× Failure mode 0{i + 1}</span>
                    <h3 className="text-base font-bold text-art-ink mb-2">{p.title}</h3>
                    <p className="text-sm text-art-ink/60 leading-relaxed">{p.description}</p>
                  </div>
                );
              })}
            </div>
            <DataRail preset="cost" className="mt-10" />
          </div>
        </Section>

        {/* Workflow — the method in motion */}
        <Section className="section-atmosphere--warm relative overflow-hidden">
          <SectionAccent variant="signal-pulse" className="top-4 left-0 right-0 h-16 opacity-40" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <span className="authority-label mb-4 block text-center text-eng-blue">The Siliconomics method</span>
            <h2 className="font-serif text-3xl font-black text-art-ink text-center mb-10 md:text-4xl">From intent to defensible export.</h2>
            <div className="overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
              <div className="flex items-stretch gap-0 min-w-max md:min-w-0">
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={step.number} className="flex items-center">
                    <div className="glow-card rounded-lg p-4 w-40 flex-shrink-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-art-rust/50 bg-art-rust/10 text-[10px] font-mono font-bold text-art-rust shadow-[0_0_12px_rgba(0,191,166,0.15)]">0{step.number}</span>
                      <h4 className="text-sm font-bold text-art-ink mt-3 mb-1">{step.title}</h4>
                      <p className="text-[10px] text-art-ink/50 leading-relaxed">{step.description}</p>
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div className="trace-flow-line w-8 flex-shrink-0" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Consequence Explorer */}
        <Section className="section-atmosphere--evidence relative overflow-hidden">
          <SectionAccent variant="die-cluster" className="top-4 right-[-2rem] w-40 h-40 opacity-40" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <span className="authority-label mb-4 block text-center text-eng-blue">Interactive — move the sliders</span>
            <h2 className="text-2xl font-bold text-art-ink text-center mb-2 font-mono">Consequence Explorer</h2>
            <p className="text-sm text-art-ink/50 text-center mb-8">
              Adjust die area, defect density, and wafer cost. Metrics update live from the real engine.
            </p>
            <ConsequenceExplorer />
          </div>
        </Section>

        {/* Four pillars */}
        <Section className="section-atmosphere--warm relative overflow-hidden">
          <SectionAccent variant="die-cluster" className="bottom-[-3rem] left-[-4rem] w-56 h-56 opacity-30" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="mb-10 max-w-2xl">
              <span className="authority-label mb-4 block text-art-rust">Proof architecture</span>
              <h2 className="font-serif text-3xl font-black text-art-ink md:text-4xl mb-3">Four pillars of defensible output.</h2>
              <p className="text-sm text-art-ink/55 leading-relaxed">Every number the platform produces rests on these guarantees — determinism, traceable provenance, Murphy-class yield modeling, and versioned reference data.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PILLARS.map((p, i) => (
                <PillarCard key={p.title} title={p.title} description={p.description} proof={p.proof} index={i} />
              ))}
            </div>
          </div>
        </Section>

        {/* BYOA — Bring Your Own Assumptions */}
        <Section className="section-atmosphere--deep relative overflow-hidden">
          <SectionAccent variant="orbit" className="top-[-2rem] right-[-4rem] w-56 h-56 opacity-30" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
              <div>
                <span className="authority-label mb-4 block text-art-rust">Bring Your Own Assumptions</span>
                <h2 className="font-serif text-3xl font-black text-art-ink md:text-4xl mb-4">Your data. Same deterministic engine.</h2>
                <p className="text-sm text-art-ink/60 leading-relaxed mb-4">
                  Platform defaults use published reference data — analyst estimates, published list prices, SIA equations.
                  In Team mode, load your NDA-covered foundry quotes, packaging bids, yield data, and labor rates.
                  The engine computes on your numbers. The calculation method never changes.
                </p>
                <p className="text-sm text-art-ink/60 leading-relaxed mb-6">
                  BYOA separates data from computation. Your private assumptions travel with your Build — versioned, dated, auditable. Platform defaults are always available as a baseline.
                </p>
                <Link to="/platform" className="inline-flex text-sm font-bold text-art-rust hover:text-art-rust/80 transition-colors">
                  See how Reference Models work →
                </Link>
              </div>
              <div className="glow-card rounded-lg p-6">
                <p className="text-[9px] font-mono uppercase tracking-wider text-art-ink/40 mb-5">REFERENCE MODELS — WHAT YOU CAN LOAD</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Foundry pricing', detail: 'Wafer cost, D0, NRE, mask sets', color: '#00BFA6' },
                    { label: 'Packaging bids', detail: 'OSAT quotes, assembly yield, thermals', color: '#FBBF24' },
                    { label: 'Volume & ASP', detail: 'Contracted schedules, erosion curves', color: '#D9B45B' },
                    { label: 'Labor rates', detail: 'Regional engineering costs, team size', color: '#5B9DFF' },
                    { label: 'Yield learning', detail: 'Your fab lot data, learning curves', color: '#F87171' },
                    { label: 'Test flow', detail: 'Test costs, insertion points, coverage', color: '#00BFA6' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 py-2">
                      <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: item.color }} aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-art-ink">{item.label}</p>
                        <p className="text-[10px] text-art-ink/50 font-mono">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-art-ink/8 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ver-green" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-art-ink/50">Same inputs + same formulas = same outputs. Always.</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Program Chart */}
        <Section className="section-atmosphere--evidence relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="mb-8 max-w-2xl">
              <span className="authority-label mb-3 block text-eng-blue">20-quarter horizon</span>
              <h2 className="text-2xl font-bold text-art-ink mb-2">Program economics across time.</h2>
              <p className="text-sm text-art-ink/55 leading-relaxed">Revenue, cost, and margin projected quarter-by-quarter from the same deterministic inputs. No separate spreadsheet required.</p>
            </div>
            <ProgramChart />
          </div>
        </Section>

        {/* Comparison teaser */}
        <Section className="section-atmosphere--deep relative overflow-hidden">
          <SectionAccent variant="grid-fade" className="top-0 right-0 w-64 h-40 opacity-40" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="mb-8 max-w-2xl">
              <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-3">Live engine comparison</p>
              <h2 className="text-2xl md:text-3xl font-bold text-art-ink mb-3">Monolithic vs Chiplet — computed, not estimated.</h2>
              <p className="text-sm text-art-ink/60 leading-relaxed">
                Same design assumptions. Two architectures. Every cell below is a deterministic output of the Siliconomics engine — yield, cost, margin — not a market guess.
              </p>
            </div>
            <CompareModule />
          </div>
        </Section>

        {/* Chippie — AI advisor */}
        <Section className="section-atmosphere--terminal relative overflow-hidden">
          <SectionAccent variant="signal-pulse" className="bottom-6 left-0 right-0 h-12 opacity-30" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="grid gap-8 items-center md:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <svg width="28" height="28" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-eng-blue">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="5.5" cy="6.5" r="1" fill="currentColor" />
                    <circle cx="10.5" cy="6.5" r="1" fill="currentColor" />
                    <path d="M5 10.5c.8.8 2.2.8 3 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                  <h2 className="text-2xl font-bold text-art-ink">{CHIPPIE_DESCRIPTION.heading}</h2>
                </div>
                <p className="text-sm text-art-ink/65 leading-relaxed mb-5">{CHIPPIE_DESCRIPTION.body}</p>
                <p className="text-xs text-art-ink/45 leading-relaxed mb-5">Chippie reads your Builds, queries the deterministic engine, and cites real numbers. It never fabricates a metric.</p>
                <Link to="/methodology" className="inline-block text-[10px] font-bold uppercase tracking-[0.16em] text-art-rust hover:text-art-rust/80 transition-colors">
                  Read the methodology →
                </Link>
              </div>
              <div className="glow-card rounded-lg p-5 font-mono text-xs">
                <div className="flex items-center gap-2 mb-4 border-b border-art-ink/10 pb-3">
                  <span className="h-2 w-2 rounded-full bg-ver-green" />
                  <span className="text-art-ink/50">chippie session</span>
                </div>
                <div className="space-y-3">
                  <p className="text-art-ink/50"><span className="text-eng-blue">you:</span> What's the break-even on Manhattan-X1?</p>
                  <p className="text-art-ink/70"><span className="text-art-rust">chippie:</span> Break-even is <span className="text-ver-green font-bold">Q7</span> at 81.5% die yield, $8,500 ASP, and 2.4K units/quarter ramp. Sensitivity is highest to ASP erosion (±1.2Q per 5% change).</p>
                  <p className="text-art-ink/50"><span className="text-eng-blue">you:</span> What if yield drops to 70%?</p>
                  <p className="text-art-ink/70"><span className="text-art-rust">chippie:</span> Break-even shifts to <span className="text-risk-crimson font-bold">Q9</span>. Unit cost rises 18%. Margin falls from 62% to 54%.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Anti-positioning */}
        <Section className="section-atmosphere--deep relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <span className="authority-label mb-6 block text-center text-art-ink/40">What Siliconomics is not</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ANTI_POSITIONING.map(item => (
                <div key={item} className="glow-card glow-card--crimson rounded-lg p-5 text-center">
                  <span className="block mb-3 text-2xl font-mono text-risk-crimson/60 line-through decoration-2">✗</span>
                  <span className="text-sm font-bold text-art-ink">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center font-mono text-xs text-art-rust">What it is → A deterministic commercial decision system with auditable provenance.</p>
          </div>
        </Section>

        {/* Partner CTA — closing immersive */}
        <Section className="section-atmosphere--deep relative overflow-hidden">
          <SectionAccent variant="grid-fade" className="inset-0" />
          <div className="section-glow-accent" style={{ '--glow-color': 'rgba(0,191,166,0.1)', '--glow-x': '50%', '--glow-y': '30%' } as React.CSSProperties} />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 text-center">
            <DataRail preset="platform" className="mb-10" />
            <h2 className="font-serif text-3xl font-black text-art-ink mb-4 md:text-4xl">{PARTNER_OFFER.headline}</h2>
            <p className="text-sm text-art-ink/60 max-w-xl mx-auto mb-8">{PARTNER_OFFER.body}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/partners"
                className="inline-flex items-center px-6 py-3 text-sm font-bold bg-art-rust text-[#0D1117] hover:bg-art-rust/85 transition-colors shadow-[0_0_20px_rgba(0,191,166,0.2)]"
              >
                {PARTNER_OFFER.cta}
              </Link>
              <Link
                to="/investors"
                className="inline-flex items-center px-6 py-3 text-sm font-bold text-art-ink border border-art-ink/20 hover:border-art-rust hover:text-art-rust transition-colors"
              >
                For investors
              </Link>
            </div>
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}

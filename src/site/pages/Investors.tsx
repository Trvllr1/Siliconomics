import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import SectionAccent from '../components/SectionAccent';
import TechDiagram from '../components/TechDiagram';
import DataRail from '../components/DataRail';
import { INVESTOR_MILESTONES } from '../content/pages';

const INVESTOR_POINTS = [
  {
    title: 'The problem',
    body: 'Critical silicon decisions are still reconciled across spreadsheets, point estimates, reports, and institutional memory. The technical choice and commercial consequence are rarely visible in one place.',
  },
  {
    title: 'What Siliconomics is building',
    body: 'A Build-centric decision system that computes semiconductor economics deterministically, makes every result traceable, and records the decision path that follows.',
  },
  {
    title: 'The initial wedge',
    body: 'Early-stage and first-silicon teams facing node, architecture, packaging, yield, and program-economics decisions before they have decades of internal modeling infrastructure.',
  },
  {
    title: 'Why the workflow matters',
    body: 'The product is designed to replace isolated snapshots with versioned, reproducible program models that technical and commercial stakeholders can inspect together.',
  },
] as const;

export default function Investors() {
  return (
    <div className="min-h-screen bg-art-cream">
      <SEO
        title="Investors - Siliconomics"
        description="Siliconomics is building an auditable decision system for teams navigating the economics of modern semiconductor programs."
        ogImage="/og/investors.svg"
      />
      <main id="main-content">
        <section className="section-atmosphere--deep relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="orbit" className="top-[-5rem] right-[-5rem] w-72 h-72" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-16">
            <div className="grid gap-8 items-center lg:grid-cols-[1.2fr_0.8fr]">
              <div className="max-w-3xl">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">Investor relations</p>
                <h1 className="font-serif font-black text-art-ink text-4xl md:text-6xl leading-tight mb-5">
                  Building the decision layer for silicon economics.
                </h1>
                <p className="text-base text-art-ink/65 leading-relaxed">
                  Siliconomics is in development and focused on securing design partners for active proof-of-concept engagements. The goal is simple: make high-consequence silicon decisions understandable, reproducible, and defensible before they become expensive.
                </p>
              </div>
              <TechDiagram variant="decision-tree" className="opacity-70" />
            </div>
          </div>
        </section>

        <section className="section-atmosphere--warm relative py-16">

          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid gap-5 md:grid-cols-2">
          {INVESTOR_POINTS.map((point, index) => (
            <section key={point.title} className="glow-card rounded-lg p-6">
              <p className="font-mono text-xs text-art-rust mb-3">0{index + 1}</p>
              <h2 className="text-xl font-bold text-art-ink mb-2">{point.title}</h2>
              <p className="text-sm text-art-ink/65 leading-relaxed">{point.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-12 glow-card rounded-lg p-8 md:p-10">
          <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">Near-term execution</p>
          <h2 className="text-2xl font-bold text-art-ink mb-6">From PoC evidence to a repeatable commercial motion.</h2>
          <ol className="grid gap-4 md:grid-cols-2">
            {INVESTOR_MILESTONES.map((milestone, index) => (
              <li key={milestone} className="flex gap-3 text-sm text-art-ink/70 leading-relaxed">
                <span className="font-mono text-art-rust">0{index + 1}</span>
                {milestone}
              </li>
            ))}
          </ol>
        </section>
          </div>
        </section>

        <section className="section-atmosphere--deep relative py-16">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 text-center">
          <DataRail preset="platform" className="mb-10" />
          <ProvenanceStamp className="justify-center mb-5" />
          <h2 className="text-2xl font-bold text-art-ink mb-3">Start with the product evidence.</h2>
          <p className="text-sm text-art-ink/60 max-w-xl mx-auto mb-6">
            Explore the deterministic workflow in the demo, or contact the team for an investor conversation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="mailto:hello@siliconomics.com?subject=Investor%20conversation" className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors">
              Contact Siliconomics
            </a>
            <a href="/app" className="inline-flex items-center px-6 py-3 text-sm font-bold text-art-ink border border-art-ink/20 hover:border-art-rust hover:text-art-rust transition-colors">
              Launch free demo
            </a>
          </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
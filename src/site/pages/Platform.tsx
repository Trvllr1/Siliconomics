import { useRef, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import ReferenceModelVisual from '../components/ReferenceModelVisual';
import SiteFooter from '../components/SiteFooter';
import VisualEvidencePanel from '../components/VisualEvidencePanel';
import { PLATFORM_SECTIONS } from '../content/pillars';
import { MARKET_POSITIONING } from '../content/pages';

function FadeInSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export default function Platform() {
  return (
    <div className="min-h-screen bg-art-cream">
      <SEO
        title="Platform - Siliconomics"
        description="A deterministic, auditable workspace for modeling and defending semiconductor program decisions."
        ogImage="/og/platform.svg"
      />
      <main id="main-content">
        <section className="silicon-grid relative overflow-hidden border-b border-art-ink/10 bg-[#101920]">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full border border-eng-blue/25 blur-[1px]" aria-hidden="true" />
          <div className="absolute right-20 top-28 h-52 w-52 rounded-full border border-art-rust/35" aria-hidden="true" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-16">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">
                One auditable program view
              </p>
              <h1 className="font-serif font-black text-art-ink text-4xl md:text-6xl leading-tight mb-5">
                From first assumption to defended decision.
              </h1>
              <p className="text-base text-art-ink/65 leading-relaxed mb-6">
                Siliconomics gives cross-functional teams a shared Build, a deterministic computation layer, and the evidence needed to decide with confidence.
              </p>
              <Link to="/decision-system" className="inline-flex text-sm font-bold text-art-rust hover:text-art-rust/80 transition-colors mb-6">
                See the Build-to-gate-review decision system
              </Link>
              <ProvenanceStamp />
            </div>
            <figure className="relative overflow-hidden rounded-lg border border-art-ink/15 bg-[#0D1117] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              <ReferenceModelVisual className="block w-full" />
              <figcaption className="border-t border-art-ink/10 px-3 py-2 text-[10px] font-mono text-art-ink/45">
                Reference Models — where teams load their own foundry quotes, packaging bids, and assumptions.
              </figcaption>
            </figure>
          </div>
          </div>
        </section>

        {/* Market positioning */}
        <section className="border-b border-art-ink/10 bg-[#0D1117] py-14">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-art-rust mb-3">{MARKET_POSITIONING.headline}</p>
            <div className="mt-8 divide-y divide-art-ink/10">
              {MARKET_POSITIONING.comparisons.map((row) => (
                <div key={row.category} className="grid gap-4 py-5 md:grid-cols-[140px_1fr_auto_1fr] md:items-center">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-eng-blue">{row.category}</span>
                    <p className="text-xs text-art-ink/45 mt-0.5">{row.names}</p>
                  </div>
                  <p className="text-sm text-art-ink/60">{row.theyDo}</p>
                  <span className="hidden md:block font-mono text-art-rust text-xs">→</span>
                  <p className="text-sm font-medium text-art-ink/90">{row.youGet}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm italic text-art-ink/55">
              They tell you what the industry looks like. <span className="not-italic font-semibold text-eng-blue">Siliconomics</span> tells you what your program costs.
            </p>
          </div>
        </section>

        <section className="border-y border-art-ink/10">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            {PLATFORM_SECTIONS.map((section, index) => (
              <FadeInSection key={section.title}>
                <article className="grid gap-8 border-b border-art-ink/10 py-14 last:border-b-0 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-16">
                  <div>
                    <p className="font-mono text-xs text-art-rust mb-4">0{index + 1}</p>
                    <h2 className="text-2xl font-bold text-art-ink mb-3">{section.title}</h2>
                    <p className="text-sm text-art-ink/65 leading-relaxed">{section.description}</p>
                  </div>
                  <div className="border-t border-art-ink/15 pt-5 md:border-t-0 md:border-l md:pl-8 md:pt-0">
                    <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-ink/40 mb-4">
                      What the team can inspect
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {section.capabilities.map((capability) => (
                        <li key={capability} className="flex gap-3 text-sm text-art-ink/75 leading-relaxed">
                          <span aria-hidden="true" className="font-mono text-ver-green">+</span>
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </FadeInSection>
            ))}
          </div>
        </section>

        <section className="border-b border-art-ink/10 bg-[#101920] py-20 md:py-28">
          <div className="max-w-7xl mx-auto grid items-center gap-10 px-6 md:px-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="authority-label mb-4 text-art-rust">Evidence, not optimism</p>
              <h2 className="max-w-lg font-serif text-4xl font-black leading-tight text-art-ink md:text-5xl">The program view survives the room.</h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-art-ink/65">
                Bring assumptions, calculation traces, sensitivities, and decisions into the same operating record. The conversation can move quickly because the evidence remains inspectable.
              </p>
              <Link to="/app" className="mt-7 inline-flex border border-art-rust/55 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-art-rust transition-colors hover:bg-art-rust hover:text-[#0D1117]">
                Inspect the demo workspace
              </Link>
            </div>
            <VisualEvidencePanel variant="insight" />
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-16 text-center">
          <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">
            Start with the evidence
          </p>
          <h2 className="text-2xl font-bold text-art-ink mb-3">Explore a complete Build in the free demo.</h2>
          <p className="text-sm text-art-ink/60 max-w-xl mx-auto mb-6">
            Use illustrative data to inspect the model, calculation traces, comparison workflow, and board-ready outputs without creating an account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/app" className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors">
              Launch free demo
            </Link>
            <Link to="/partners" className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-art-ink border border-art-ink/15 rounded-md hover:border-art-ink/30 transition-colors">
              Apply as a design partner
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import SectionAccent from '../components/SectionAccent';
import DataRail from '../components/DataRail';
import { STAKEHOLDER_SOLUTIONS } from '../content/pages';

export default function Solutions() {
  return (
    <div className="min-h-screen bg-art-cream">
      <SEO
        title="Solutions for Silicon Decisions - Siliconomics"
        description="The commercial intelligence layer that connects engineering decisions to business outcomes — for every stakeholder in a silicon program."
        ogImage="/og/solutions.svg"
      />
      <main id="main-content">
        {/* ─── HERO ─── */}
        <section className="section-atmosphere--deep relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="orbit" className="top-10 right-10 w-72 h-72 opacity-30" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-16 md:pt-28 md:pb-20">
            <div className="max-w-4xl">
              <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">
                One platform. Five views. Zero disconnected spreadsheets.
              </p>
              <h1 className="font-serif font-black text-art-ink text-4xl md:text-6xl leading-tight mb-5">
                The commercial intelligence layer for silicon programs.
              </h1>
              <p className="text-base text-art-ink/65 leading-relaxed max-w-3xl">
                Every technical and commercial stakeholder inspects the same auditable program model.
                Architecture, manufacturing, finance, executive, and diligence teams see one Build — not five parallel spreadsheets.
              </p>
              <ProvenanceStamp className="mt-8" />
            </div>
          </div>
        </section>

        {/* ─── SOLUTIONS GRID ─── */}
        <section className="section-atmosphere--evidence relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="grid-fade" className="inset-0 opacity-20" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {STAKEHOLDER_SOLUTIONS.map((solution, index) => (
                <Link
                  key={solution.slug}
                  to={`/solutions/${solution.slug}`}
                  className="group glow-card p-6 rounded-lg transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                  style={{ borderColor: `${solution.colorAccent}20` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: solution.colorAccent, color: solution.colorAccent }}
                    >
                      <span className="text-[10px] font-mono font-bold">0{index + 1}</span>
                    </span>
                    <h2 className="text-lg font-bold text-art-ink group-hover:text-art-rust transition-colors">{solution.navLabel}</h2>
                  </div>
                  <p className="text-sm text-art-ink/70 leading-relaxed mb-4">{solution.whatSilProvides.slice(0, 160)}…</p>
                  <span className="inline-block text-xs font-bold transition-colors" style={{ color: solution.colorAccent }}>
                    See the full workflow →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── POSITIONING STATEMENT ─── */}
        <section className="section-atmosphere--warm relative overflow-hidden border-b border-art-ink/10">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 text-center">
            <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-rust mb-4">
              What Siliconomics is not
            </p>
            <h2 className="font-serif font-black text-art-ink text-2xl md:text-3xl leading-snug max-w-3xl mx-auto mb-6">
              Not EDA. Not a foundry quote. Not a spreadsheet. Not AI-generated numbers.
            </h2>
            <p className="text-sm text-art-ink/60 max-w-2xl mx-auto mb-8">
              Siliconomics is the commercial intelligence layer that connects engineering decisions to business outcomes.
              It computes. It traces. It records. It does not guess.
            </p>
            <DataRail preset="platform" className="justify-center" />
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="section-atmosphere--deep relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 text-center">
            <h2 className="text-2xl font-bold text-art-ink mb-3">See the decision chain in action.</h2>
            <p className="text-sm text-art-ink/60 max-w-xl mx-auto mb-6">
              Explore the demo with illustrative Build data, or apply to work through an active program with the founding team.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/app" className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors">
                Launch free demo
              </Link>
              <Link to="/partners" className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-art-ink border border-art-ink/15 rounded-md hover:border-art-ink/30 transition-colors">
                Apply as a design partner
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
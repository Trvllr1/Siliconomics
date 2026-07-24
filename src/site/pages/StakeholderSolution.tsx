import { Link, Navigate, useParams } from 'react-router-dom';
import SEO, { SITE_ORIGIN } from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import DataRail from '../components/DataRail';
import SectionAccent from '../components/SectionAccent';
import SolutionHeroVisual from '../components/SolutionHeroVisual';
import { STAKEHOLDER_SOLUTIONS } from '../content/pages';

export default function StakeholderSolution() {
  const { stakeholder } = useParams();
  const solution = STAKEHOLDER_SOLUTIONS.find(item => item.slug === stakeholder);

  if (!solution) {
    return <Navigate to="/solutions" replace />;
  }

  const canonical = `${SITE_ORIGIN}/solutions/${solution.slug}`;
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Solutions', item: `${SITE_ORIGIN}/solutions` },
      { '@type': 'ListItem', position: 3, name: solution.navLabel, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-art-cream">
      <SEO
        title={`${solution.navLabel} - Siliconomics`}
        description={solution.summary}
        ogImage="/og/solutions.svg"
        canonical={canonical}
        structuredData={breadcrumbStructuredData}
      />
      <main id="main-content">
        {/* ─── SECTION 1: HERO ─── */}
        <section className="section-atmosphere--deep relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="orbit" className="top-10 right-10 w-64 h-64 opacity-40" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-16 md:pt-28 md:pb-20">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.8fr] items-center">
              <div>
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] mb-4" style={{ color: solution.colorAccent }}>
                  {solution.eyebrow}
                </p>
                <h1 className="font-serif font-black text-art-ink text-4xl md:text-6xl leading-tight mb-6">
                  {solution.title}
                </h1>
                <p className="text-base text-art-ink/70 leading-relaxed max-w-3xl mb-8">
                  {solution.whatSilProvides}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/app" className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors">
                    Launch free demo
                  </Link>
                  <Link to="/methodology" className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-art-ink border border-art-ink/15 rounded-md hover:border-art-ink/30 transition-colors">
                    See the methodology
                  </Link>
                </div>
                <ProvenanceStamp className="mt-8" />
              </div>
              <SolutionHeroVisual variant={solution.heroVariant} className="w-full h-auto opacity-85 hidden lg:block" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: THE GAP ─── */}
        <section className="section-atmosphere--terminal relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="signal-pulse" className="top-6 left-0 right-0 h-8 opacity-20" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-risk-crimson mb-4">
                  The missing layer
                </p>
                <h2 className="font-serif font-black text-art-ink text-2xl md:text-3xl leading-snug">
                  No system connects engineering decisions to commercial outcomes.
                </h2>
                <p className="text-sm text-art-ink/50 mt-4 font-mono">
                  The status quo is spreadsheets and meetings.
                </p>
              </div>
              <div className="lg:col-span-8">
                <ol className="space-y-4">
                  {solution.gap.map((point, i) => (
                    <li key={i} className="flex items-start gap-4 bg-surface-1/50 border border-art-ink/8 rounded-lg px-5 py-4">
                      <span className="shrink-0 w-6 h-6 rounded-full border border-risk-crimson/40 flex items-center justify-center mt-0.5">
                        <span className="text-[9px] font-mono font-bold text-risk-crimson">{String(i + 1).padStart(2, '0')}</span>
                      </span>
                      <p className="text-sm text-art-ink/75 leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: WHAT SILICONOMICS PROVIDES ─── */}
        <section className="section-atmosphere--warm relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="grid-fade" className="inset-0 opacity-30" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
              <div className="lg:col-span-5">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] mb-4" style={{ color: solution.colorAccent }}>
                  The commercial intelligence layer
                </p>
                <h2 className="font-serif font-black text-art-ink text-2xl md:text-3xl leading-snug mb-5">
                  One Build. Every consequence computed.
                </h2>
                <p className="text-base text-art-ink/70 leading-relaxed">
                  {solution.whatSilProvides}
                </p>
              </div>
              <div className="lg:col-span-7">
                <div className="grid gap-3 sm:grid-cols-2">
                  {solution.personaValue.map((value, i) => (
                    <div
                      key={i}
                      className="glow-card rounded-lg p-5"
                      style={{ borderColor: `${solution.colorAccent}22` }}
                    >
                      <span className="text-[9px] font-mono font-bold block mb-2" style={{ color: solution.colorAccent }}>
                        0{i + 1}
                      </span>
                      <p className="text-sm text-art-ink/75 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: THE DECISION ─── */}
        <section className="section-atmosphere--deep relative overflow-hidden border-b border-art-ink/10">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-12">
              <div className="md:col-span-4">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-rust mb-4">The decision</p>
                <h2 className="font-serif font-black text-art-ink text-2xl leading-snug">
                  The question your team needs to answer together.
                </h2>
              </div>
              <div className="md:col-span-8 border-l-0 md:border-l border-art-ink/10 md:pl-12 flex items-center">
                <p className="text-lg text-art-ink/80 leading-relaxed font-serif italic">
                  &ldquo;{solution.decision}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: YOUR WORKFLOW IN SILICONOMICS ─── */}
        <section className="section-atmosphere--evidence relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="grid-fade" className="inset-0 opacity-20" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="max-w-3xl mb-10">
              <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] mb-4" style={{ color: solution.colorAccent }}>
                How to engage
              </p>
              <h2 className="font-serif font-black text-art-ink text-2xl md:text-3xl leading-snug">
                Your workflow in Siliconomics.
              </h2>
              <p className="text-sm text-art-ink/60 mt-3">
                From first input to defended decision — this is how {solution.eyebrow.replace('For ', '').toLowerCase()} use the platform.
              </p>
            </div>
            <ol className="relative">
              {/* Connecting line */}
              <div
                className="absolute left-[19px] top-6 bottom-6 w-px opacity-30 hidden md:block"
                style={{ backgroundColor: solution.colorAccent }}
                aria-hidden="true"
              />
              {solution.workflow.map((item, i) => (
                <li key={i} className="relative grid grid-cols-1 md:grid-cols-[2.5rem_1fr_1.2fr] gap-4 md:gap-6 py-5 border-b border-art-ink/8 last:border-b-0">
                  <span
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: solution.colorAccent, color: solution.colorAccent }}
                  >
                    <span className="text-xs font-mono font-bold">{i + 1}</span>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-art-ink">{item.step}</p>
                  </div>
                  <div>
                    <p className="text-sm text-art-ink/65 leading-relaxed">{item.outcome}</p>
                  </div>
                </li>
              ))}
            </ol>
            <DataRail preset="methodology" className="mt-10" />
          </div>
        </section>

        {/* ─── SECTION 6: BYOA ─── */}
        <section className="section-atmosphere--deep relative overflow-hidden border-b border-art-ink/10">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-rust mb-4">
                  Bring Your Own Assumptions
                </p>
                <h2 className="font-serif font-black text-art-ink text-2xl md:text-3xl leading-snug mb-5">
                  {solution.byoa.headline}
                </h2>
                <p className="text-sm text-art-ink/65 leading-relaxed">
                  {solution.byoa.description}
                </p>
                <p className="text-[10px] font-mono text-art-ink/40 mt-4">
                  BYOA changes the inputs, not the calculation method. Same deterministic engine. Your private data.
                </p>
              </div>
              <div className="lg:col-span-7">
                <div className="glow-card rounded-lg p-6">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-art-ink/40 mb-4">In Reference Models, you can:</p>
                  <ul className="space-y-3">
                    {solution.byoa.examples.map((example, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="shrink-0 w-5 h-5 rounded border flex items-center justify-center mt-0.5" style={{ borderColor: `${solution.colorAccent}55`, color: solution.colorAccent }}>
                          <span className="text-[9px] font-mono font-bold">{i + 1}</span>
                        </span>
                        <p className="text-sm text-art-ink/70 leading-relaxed">{example}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pt-4 border-t border-art-ink/8 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-ver-green" aria-hidden="true" />
                    <span className="text-[10px] font-mono text-art-ink/50">Platform defaults ship free. BYOA available in Team mode.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 7: FOR THE PLANNING TEAM + CTAs ─── */}
        <section className="section-atmosphere--warm relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-12 items-start">
              <div className="md:col-span-4">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">For the planning team</p>
                <h2 className="font-serif font-black text-art-ink text-3xl leading-tight">
                  One model, not parallel stories.
                </h2>
              </div>
              <div className="md:col-span-8 border-l-0 md:border-l border-art-ink/10 md:pl-12">
                <p className="text-lg text-art-ink/75 leading-relaxed mb-7">{solution.teamValue}</p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/app" className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors">
                    Launch free demo
                  </Link>
                  <Link to="/partners" className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-art-ink border border-art-ink/15 rounded-md hover:border-art-ink/30 transition-colors">
                    Apply as a design partner
                  </Link>
                </div>
              </div>
            </div>

            {/* Other stakeholders */}
            <div className="mt-16 pt-10 border-t border-art-ink/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-ink/45 mb-2">Other stakeholders</p>
                  <p className="text-sm text-art-ink/70">Explore how Siliconomics supports the rest of the planning team.</p>
                </div>
                <Link to="/solutions" className="text-sm font-bold text-art-rust hover:text-art-rust/80 transition-colors">
                  View all solutions
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

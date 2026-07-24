import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import DataRail from '../components/DataRail';

const PRINCIPLES = [
  { name: 'Calm', description: 'Intentional whitespace. No noise. Every element earns its place.' },
  { name: 'Precision', description: 'Numbers always carry units, sources, and vintage. No fabricated metrics.' },
  { name: 'Authority', description: 'Fortune 100 boardroom credibility. Every computation is defensible.' },
  { name: 'Explainability', description: 'Every number shows its work. Trace any metric to its equation and inputs.' },
  { name: 'Collaboration', description: 'Built for cross-functional teams: architects, finance, program, executive.' },
];

export default function Company() {
  return (
    <div className="bg-art-cream min-h-screen">
      <SEO title="About — Siliconomics" description="Deterministic, auditable program modeling for semiconductor economics." />
      <main id="main-content">
        <section className="section-atmosphere--warm relative overflow-hidden border-b border-art-ink/10">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
            <div className="max-w-3xl">
              <h1 className="font-serif font-black text-art-ink text-4xl mb-4">About Siliconomics</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-sm text-art-ink/70 leading-relaxed mb-6">
              Semiconductor programs are the most capital-intensive engineering projects in human history.
              Yet the tools used to model their economics have not changed in thirty years — spreadsheets,
              tribal knowledge, and consultant one-off models.
            </p>
            <p className="text-sm text-art-ink/70 leading-relaxed mb-6">
              Siliconomics was built to change that. A deterministic, auditable program modeling system
              for teams making $100M+ chip decisions without $100M of tribal knowledge.
            </p>
            <p className="text-sm text-art-ink/70 leading-relaxed mb-8">
              Every number is computed by a golden-test-locked engine. Every calculation carries provenance.
              Every Build is versioned and immutable. This is the standard that silicon economics deserves.
            </p>
          </div>

          <ProvenanceStamp className="mb-10" />
          <DataRail preset="platform" className="mb-10" />
            </div>
          </div>
        </section>

        <section className="section-atmosphere--deep relative py-12">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
            <div className="max-w-3xl">

          <h2 className="text-lg font-bold text-art-ink mb-4 font-mono">Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {PRINCIPLES.map(p => (
              <div key={p.name} className="glow-card rounded-lg p-4">
                <h3 className="text-sm font-bold text-art-ink mb-1">{p.name}</h3>
                <p className="text-xs text-art-ink/60">{p.description}</p>
              </div>
            ))}
          </div>

          <div className="glow-card rounded-lg p-6">
            <h3 className="text-sm font-bold text-art-ink mb-2 font-mono">Contact</h3>
            <p className="text-xs text-art-ink/60 mb-1">
              Questions, partnerships, press: <a href="mailto:hello@siliconomics.com" className="text-art-rust hover:text-art-rust/80">hello@siliconomics.com</a>
            </p>
            <p className="text-xs text-art-ink/40 font-mono mt-4">
              Hiring: We are not currently hiring, but we value great introductions.
            </p>
          </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

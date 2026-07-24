import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import { INSIGHTS_INDEX } from '../content/insights';

export default function Insights() {
  return (
    <div className="bg-art-cream min-h-screen">
      <SEO
        title="Semiconductor Economics Insights - Siliconomics"
        description="Teardowns, analysis, and deterministic semiconductor economics models. Every published number is grounded in the Siliconomics engine."
        canonical="https://siliconomics-app.vercel.app/insights"
      />
      <main id="main-content" className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
        <h1 className="font-serif font-black text-art-ink text-4xl mb-3">Insights</h1>
        <p className="text-sm text-art-ink/60 max-w-xl mb-2">
          Teardowns, analysis, and deterministic models — every number computed live from the engine.
        </p>
        <ProvenanceStamp className="mb-10" />

        <div className="space-y-6">
          {INSIGHTS_INDEX.map(article => (
            <Link
              key={article.slug}
              to={`/insights/${article.slug}`}
              className="block bg-surface-1 border border-art-ink/10 rounded-lg p-6 hover:border-art-ink/20 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono text-art-ink/30">{article.dateline}</span>
                {article.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-mono text-art-ink/40 bg-art-ink/5 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-base font-bold text-art-ink mb-2 group-hover:text-art-rust transition-colors">
                {article.title}
              </h2>
              <p className="text-xs text-art-ink/60 leading-relaxed mb-3">{article.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-art-rust">{article.headlineMetric.value}</span>
                <span className="text-[10px] font-mono text-art-ink/40">{article.headlineMetric.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

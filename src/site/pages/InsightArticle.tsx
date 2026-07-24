import { useParams, Link } from 'react-router-dom';
import SEO, { SITE_ORIGIN } from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import EquationDisplay from '../components/EquationDisplay';
import SiteFooter from '../components/SiteFooter';
import { INSIGHTS_INDEX } from '../content/insights';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';

function buildAppUrl(build: import('../../types').Build): string {
  const json = JSON.stringify(build);
  const encoded = btoa(encodeURIComponent(json));
  return `/app#build=${encoded}`;
}

export default function InsightArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = INSIGHTS_INDEX.find(a => a.slug === slug);

  if (!article) {
    return (
      <div className="bg-art-cream min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-bold text-art-ink mb-2">Article not found</h1>
          <Link to="/insights" className="text-xs text-art-rust hover:text-art-rust/80">← Back to insights</Link>
        </div>
      </div>
    );
  }

  const build = DEFAULT_BUILDS.find(b => b.id === article.buildId);
  const shareUrl = build ? buildAppUrl(build) : null;
  const articleUrl = `${SITE_ORIGIN}/insights/${article.slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.dateline,
    dateModified: article.dateline,
    mainEntityOfPage: articleUrl,
    author: { '@type': 'Organization', name: 'Siliconomics' },
    publisher: { '@type': 'Organization', name: 'Siliconomics' },
    keywords: article.tags.join(', '),
  };

  return (
    <div className="bg-art-cream min-h-screen">
      <SEO
        title={`${article.title} — Siliconomics`}
        description={article.description}
        canonical={articleUrl}
        ogImage="/og/insights.svg"
        ogType="article"
        structuredData={articleSchema}
      />
      <main id="main-content" className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
        <Link to="/insights" className="text-[10px] font-mono text-art-ink/40 hover:text-art-rust transition-colors mb-6 block">
          ← Back to insights
        </Link>

        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-art-ink/30">{article.dateline}</span>
            {article.tags.map(tag => (
              <span key={tag} className="text-[9px] font-mono text-art-ink/40 bg-art-ink/5 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>

          <h1 className="font-serif font-black text-art-ink text-3xl mb-4">{article.title}</h1>

          <div className="bg-surface-1 border border-art-ink/10 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold text-art-rust" style={{ fontVariantNumeric: 'tabular-nums' }}>{article.headlineMetric.value}</span>
              <span className="text-xs font-mono text-art-ink/50">{article.headlineMetric.label}</span>
            </div>
            <ProvenanceStamp className="mt-3" />
          </div>

          <div className="space-y-4">
            {article.content.map((block, i) => {
              if (block.type === 'paragraph') {
                return <p key={i} className="text-sm text-art-ink/70 leading-relaxed">{block.text}</p>;
              }
              if (block.type === 'heading') {
                return <h2 key={i} className="text-lg font-bold text-art-ink mt-6 mb-2">{block.text}</h2>;
              }
              if (block.type === 'table') {
                return (
                  <div key={i} className="overflow-x-auto my-6">
                    <table className="w-full text-xs font-mono border border-art-ink/10 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-surface-2 border-b border-art-ink/10">
                          {block.headers.map((h, j) => (
                            <th key={j} scope="col" className="text-left py-2 px-3 text-[9px] text-art-ink/40 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, j) => (
                          <tr key={j} className="border-b border-art-ink/5 hover:bg-art-ink/5">
                            {row.map((cell, k) => (
                              <td key={k} className="py-2 px-3 text-art-ink/70" style={{ fontVariantNumeric: 'tabular-nums' }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {block.caption && (
                      <p className="text-[10px] font-mono text-art-ink/30 mt-2">{block.caption}</p>
                    )}
                  </div>
                );
              }
              if (block.type === 'equation') {
                return (
                  <EquationDisplay
                    key={i}
                    equation={block.formula}
                    version={block.version}
                    label={block.label}
                  />
                );
              }
              if (block.type === 'cta') {
                return (
                  <div key={i} className="bg-surface-1 border border-art-ink/10 rounded-lg p-4 mt-4">
                    <p className="text-xs text-art-ink/60 mb-3">{block.text}</p>
                    <p className="text-[10px] font-mono text-art-ink/40 mb-3">
                      Explore the full model — every parameter, every trace, every projection.
                    </p>
                    {shareUrl && (
                      <a
                        href={shareUrl}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors"
                      >
                        Open this Build
                      </a>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

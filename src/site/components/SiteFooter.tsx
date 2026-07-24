import { Link } from 'react-router-dom';
import ProvenanceStamp from './ProvenanceStamp';
import DataRail from './DataRail';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Platform', href: '/platform' },
      { label: 'Decision System', href: '/decision-system' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Methodology', href: '/methodology' },
      { label: 'Launch Demo', href: '/app' },
    ],
  },
  {
    title: 'Method',
    links: [
      { label: 'Determinism', href: '/methodology#determinism' },
      { label: 'Formula Library', href: '/methodology#cost-equations' },
      { label: 'Reference Data', href: '/methodology#reference-data' },
      { label: 'Golden Tests', href: '/methodology#golden-tests' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/company' },
      { label: 'Insights', href: '/insights' },
      { label: 'Partners', href: '/partners' },
      { label: 'Investors', href: '/investors' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Data Handling', href: '/trust' },
      { label: 'Security', href: '/trust' },
      { label: 'AI Policy', href: '/trust' },
      { label: 'Contact', href: '/company' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="section-atmosphere--deep relative border-t border-art-ink/10">
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-16">
        <DataRail preset="platform" className="mb-12" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {FOOTER_COLUMNS.map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-art-ink/50 uppercase tracking-wider mb-4 font-mono">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      to={link.href}
                      className="text-sm text-art-ink/70 hover:text-art-rust transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-art-ink/10">
          <ProvenanceStamp className="mb-4" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs text-art-ink/40 font-mono">
              No analytics. No tracking pixels.
            </p>
            <p className="text-xs text-art-ink/50 font-mono">
              © {new Date().getFullYear()} Siliconomics Manhattan Corp. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import PricingCard from '../components/PricingCard';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import { PRICING_FAQ } from '../content/faq';

const TIERS = [
  {
    title: 'Demo',
    price: '$0',
    subtitle: 'Free forever. Zero signup.',
    features: [
      'Unlimited Builds in localStorage',
      'Full deterministic engine — every formula',
      'All charts, sensitivity sweeps, and exports',
      'Data never leaves your browser',
    ],
    cta: 'Launch Demo',
    ctaHref: '/app',
  },
  {
    title: 'Team',
    price: '$36,000/yr',
    subtitle: '5 seats · unlimited Builds · quarterly data refresh',
    features: [
      'Everything in Demo, plus:',
      '5 named seats with SSO authentication',
      'Tenant-isolated Postgres (your data, your instance)',
      'Quarterly reference-data refresh',
      'Chippie AI advisor with web intelligence',
      'Private reference model overlays (BYOA)',
      'Priority onboarding & Slack channel',
    ],
    cta: 'Start with a design partnership',
    ctaHref: '/partners',
    highlighted: true,
  },
  {
    title: 'Services & VC',
    price: '$60,000/yr',
    subtitle: 'Multi-engagement · unlimited client programs',
    features: [
      'Everything in Team, plus:',
      'Multi-engagement license — no per-client fees',
      'Use across unlimited client programs',
      'Custom reference model onboarding',
      'White-label export capability',
      'Dedicated success manager',
    ],
    cta: 'Contact us',
    ctaHref: '/partners',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-1 border border-art-ink/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center justify-between"
        aria-expanded={open}
      >
        <span className="text-xs font-mono font-bold text-art-ink">{q}</span>
        <motion.span
          className="text-art-ink/30 text-sm ml-2"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs text-art-ink/60 px-4 pb-3 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Pricing() {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRICING_FAQ.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="bg-art-cream min-h-screen">
      <SEO
        title="Pricing - Siliconomics"
        description="No dark patterns. No countdown timers. Every tier includes the full deterministic engine."
        canonical="https://siliconomics-app.vercel.app/pricing"
        structuredData={faqStructuredData}
      />
      <main id="main-content">
        {/* Hero */}
        <section className="bg-[#101920] border-b border-art-ink/10 pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-6 md:px-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-art-rust mb-4">Transparent economics for silicon economics</p>
            <h1 className="font-serif font-black text-art-ink text-4xl md:text-5xl mb-4">Every tier. Full engine. No feature gates.</h1>
            <p className="text-sm text-art-ink/55 max-w-2xl mx-auto mb-3 leading-relaxed">
              The deterministic computation layer is identical across all plans. You're paying for team infrastructure, data freshness, and intelligence — not for access to formulas you can already verify in the demo.
            </p>
            <ProvenanceStamp className="justify-center" />
          </div>
        </section>

        {/* What you're replacing */}
        <section className="border-b border-art-ink/10 bg-surface-1 py-8">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-art-ink/40 mb-5">What teams typically replace</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border border-art-ink/10 rounded-md p-4 bg-art-cream">
                <p className="font-mono text-[10px] text-art-ink/40 mb-1">SPREADSHEET MODELS</p>
                <p className="text-lg font-mono font-bold text-art-ink/30 line-through">$0 + tribal risk</p>
                <p className="text-xs text-art-ink/50 mt-1">Unnamed cells. One person who "knows." No audit trail.</p>
              </div>
              <div className="border border-art-ink/10 rounded-md p-4 bg-art-cream">
                <p className="font-mono text-[10px] text-art-ink/40 mb-1">CONSULTING ENGAGEMENT</p>
                <p className="text-lg font-mono font-bold text-art-ink/30 line-through">$150K+ / engagement</p>
                <p className="text-xs text-art-ink/50 mt-1">Non-reproducible. Walks out the door with the slide deck.</p>
              </div>
              <div className="border border-art-rust/30 rounded-md p-4 bg-art-rust/5">
                <p className="font-mono text-[10px] text-art-rust mb-1">SILICONOMICS</p>
                <p className="text-lg font-mono font-bold text-art-ink">$36K/yr</p>
                <p className="text-xs text-art-ink/70 mt-1">Deterministic. Auditable. Yours to keep. Always reproducible.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tier cards */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {TIERS.map(tier => (
              <PricingCard key={tier.title} {...tier} />
            ))}
          </div>

          {/* Design Partner Program */}
          <div className="bg-[#101920] border border-art-ink/15 rounded-lg p-8 mb-16 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-art-rust mb-2">Design Partner Program</p>
            <h3 className="text-xl font-serif font-bold text-art-ink mb-2">6 months free. Full platform. Founder access.</h3>
            <p className="text-sm text-art-ink/55 max-w-lg mx-auto mb-4">
              Active silicon decision within 2 quarters. Exec sponsor attends one review per month. Success metric: a Siliconomics Build cited in your gate review.
            </p>
            <Link
              to="/partners"
              className="inline-flex items-center border border-art-rust/55 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-art-rust transition-colors hover:bg-art-rust hover:text-[#0D1117]"
            >
              Apply for partnership
            </Link>
          </div>

          {/* FAQ */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-art-ink font-mono mb-4">Questions you're probably asking</h3>
            {PRICING_FAQ.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

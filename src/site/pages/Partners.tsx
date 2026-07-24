import { Link } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import SectionAccent from '../components/SectionAccent';
import DataRail from '../components/DataRail';
import { PARTNER_OFFER } from '../content/pages';

const APPLY_SUBJECT = encodeURIComponent('Siliconomics Design Partner Application');
const APPLY_BODY = encodeURIComponent(
  `Please tell us about your organization and current silicon program:\n\n` +
  `Organization:\nRole:\nCurrent program description:\n` +
  `Which of the four criteria apply:\n` +
  `1. Active silicon decision within 2 quarters — Y/N\n` +
  `2. Exec sponsor attending one review per month — Y/N\n` +
  `3. Willingness to compare outputs against internal numbers — Y/N\n` +
  `4. No conflict with another partner — Y/N\n\n` +
  `Anything else we should know:`
);

const SUCCESS_DESCRIPTION = `
A Siliconomics Build cited in your gate review. That is what success looks like for a design partner.
`;

export default function Partners() {
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'design-partner',
        name: formData.get('name'),
        email: formData.get('email'),
        company: formData.get('company'),
        role: formData.get('role'),
        message: formData.get('message'),
        website: formData.get('website'),
        startedAt,
      }),
    });

    if (response.ok) {
      setStatus('success');
      event.currentTarget.reset();
      return;
    }

    const result = await response.json().catch(() => null) as { error?: string } | null;
    setError(result?.error || 'We could not submit your application.');
    setStatus('error');
  }

  return (
    <div className="bg-art-cream min-h-screen">
      <SEO title="Design Partner Program — Siliconomics" description="6-month free partnership — full platform, direct founder access, your reference assumptions loaded." />
      <main id="main-content">
        <section className="section-atmosphere--deep relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="orbit" className="top-[-4rem] right-[-4rem] w-56 h-56" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
            <h1 className="font-serif font-black text-art-ink text-4xl mb-3">Design Partner Program</h1>
            <p className="text-sm text-art-ink/60 max-w-xl mb-2">
              {PARTNER_OFFER.body}
            </p>
            <ProvenanceStamp className="mb-6" />
            <DataRail preset="platform" className="mt-6" />
          </div>
        </section>

        <section className="section-atmosphere--warm relative py-12">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="glow-card rounded-lg p-6">
            <h3 className="text-sm font-bold text-art-ink mb-4 font-mono">Selection Criteria</h3>
            <ol className="space-y-3">
              {PARTNER_OFFER.criteria.map((crit, i) => (
                <li key={i} className="text-xs text-art-ink/70 flex items-start gap-2">
                  <span className="text-art-rust font-bold font-mono min-w-4">{i + 1}.</span>
                  {crit}
                </li>
              ))}
            </ol>
          </div>

          <div className="glow-card glow-card--gold rounded-lg p-6">
            <h3 className="text-sm font-bold text-art-ink mb-4 font-mono">What Success Looks Like</h3>
            <p className="text-sm text-art-ink/70 leading-relaxed font-mono">
              {SUCCESS_DESCRIPTION}
            </p>
          </div>
        </div>

        <section className="section-atmosphere--evidence relative overflow-hidden rounded-lg p-6 md:p-8">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-lg font-bold text-art-ink mb-2">Apply for a design partnership</h2>
            <p className="text-sm text-art-ink/60 mb-6">
              Tell us about the decision ahead. We will follow up by email if there is a fit.
            </p>
            {status === 'success' ? (
              <div className="border border-ver-green/30 bg-ver-green/10 p-5 text-sm text-art-ink/80" role="status">
                Your application has been received. We will be in touch by email.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-art-ink/80">
                    Name
                    <input name="name" required minLength={2} autoComplete="name" className="border border-art-ink/15 bg-surface-2 px-3 py-2 text-art-ink" />
                  </label>
                  <label className="grid gap-2 text-sm text-art-ink/80">
                    Work email
                    <input name="email" required type="email" autoComplete="email" className="border border-art-ink/15 bg-surface-2 px-3 py-2 text-art-ink" />
                  </label>
                  <label className="grid gap-2 text-sm text-art-ink/80">
                    Organization
                    <input name="company" required minLength={2} autoComplete="organization" className="border border-art-ink/15 bg-surface-2 px-3 py-2 text-art-ink" />
                  </label>
                  <label className="grid gap-2 text-sm text-art-ink/80">
                    Role
                    <input name="role" required minLength={2} autoComplete="organization-title" className="border border-art-ink/15 bg-surface-2 px-3 py-2 text-art-ink" />
                  </label>
                </div>
                <label className="grid gap-2 text-sm text-art-ink/80">
                  What silicon decision are you working through?
                  <textarea name="message" required minLength={20} rows={6} className="border border-art-ink/15 bg-surface-2 px-3 py-2 text-art-ink resize-y" />
                </label>
                <label className="sr-only" aria-hidden="true">
                  Website
                  <input name="website" type="text" tabIndex={-1} autoComplete="off" />
                </label>
                {status === 'error' && <p className="text-sm text-risk-crimson" role="alert">{error}</p>}
                <div className="flex flex-wrap items-center gap-4">
                  <button type="submit" disabled={status === 'submitting'} className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 disabled:opacity-60 transition-colors">
                    {status === 'submitting' ? 'Submitting...' : PARTNER_OFFER.cta}
                  </button>
                  <a href={`mailto:partners@siliconomics.com?subject=${APPLY_SUBJECT}&body=${APPLY_BODY}`} className="text-xs font-mono text-art-rust hover:text-art-rust/80">
                    Prefer email instead
                  </a>
                </div>
                <p className="text-[10px] font-mono text-art-ink/40">By submitting, you agree to our <Link to="/privacy" className="text-art-rust hover:text-art-rust/80">privacy policy</Link>.</p>
              </form>
            )}
          </div>
        </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

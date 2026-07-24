import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';

export default function Privacy() {
  return (
    <div className="bg-art-cream min-h-screen">
      <SEO
        title="Privacy and Data Handling - Siliconomics"
        description="How Siliconomics handles demo data, team data, reference models, and Chippie AI conversations."
        canonical="https://siliconomics-app.vercel.app/privacy"
      />
      <main id="main-content" className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
        <div className="max-w-3xl">
          <h1 className="font-serif font-black text-art-ink text-4xl mb-3">Privacy & Data Handling</h1>
          <ProvenanceStamp className="mb-8" />

          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-bold text-art-ink mb-2 font-mono">Data Collection</h2>
              <p className="text-xs text-art-ink/60 leading-relaxed">
                Siliconomics collects no personal data, usage analytics, or telemetry in any mode.
                There are no analytics scripts, tag managers, tracking pixels, or third-party cookies
                on this website or in the application.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-art-ink mb-2 font-mono">Demo Mode</h2>
              <p className="text-xs text-art-ink/60 leading-relaxed">
                In Demo mode, all data is stored in your browser's localStorage. Nothing is transmitted
                to any server. You can clear your data at any time by clearing browser storage or using
                the "New Session" option in the application. No account, signup, or personal information
                is required.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-art-ink mb-2 font-mono">Team Mode</h2>
              <p className="text-xs text-art-ink/60 leading-relaxed">
                In Team mode, data is stored in tenant-isolated Postgres databases hosted by Neon.
                Authentication is handled by Clerk with support for SSO, MFA, and SCIM. All data in
                transit is encrypted with TLS 1.3. All data at rest is encrypted. Data access is
                owner-scoped — your data is never accessible to other tenants.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-art-ink mb-2 font-mono">AI & Chippie</h2>
              <p className="text-xs text-art-ink/60 leading-relaxed">
                Chippie, the AI advisor, operates on an opt-in basis per message. It reads only the
                Build data you explicitly share in a conversation. It uses NVIDIA-hosted open models
                via proxy — no data is sent to third-party API providers. No data is used for training.
                Every number Chippie cites comes from the deterministic engine, not from AI generation.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-art-ink mb-2 font-mono">Reference Data</h2>
              <p className="text-xs text-art-ink/60 leading-relaxed">
                All shipped reference data is sourced from public, analyst, or published-list-price
                sources. Every data point carries a confidence rating and vintage date. No confidential
                or NDA-restricted data is included. Team mode users can load their own reference data
                under their own NDA coverage.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-art-ink mb-2 font-mono">Changes to This Policy</h2>
              <p className="text-xs text-art-ink/60 leading-relaxed">
                If our data handling practices change, we will update this page and note the change
                in our release notes. We will never add analytics, tracking, or data collection without
                explicit disclosure and, where required, consent.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-art-ink mb-2 font-mono">Contact</h2>
              <p className="text-xs text-art-ink/60 leading-relaxed">
                For privacy questions: <a href="mailto:privacy@siliconomics.com" className="text-art-rust hover:text-art-rust/80">privacy@siliconomics.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import SectionAccent from '../components/SectionAccent';
import TechDiagram from '../components/TechDiagram';
import DataRail from '../components/DataRail';

const DATA_HANDLING_ROWS = [
  { aspect: 'Data storage', demo: 'localStorage only', team: 'Tenant-isolated Postgres (Neon)', highlight: true },
  { aspect: 'Authentication', demo: 'None required', team: 'Clerk — SSO, MFA, SCIM' },
  { aspect: 'Data transmission', demo: 'Nothing transmitted', team: 'TLS 1.3, encrypted at rest' },
  { aspect: 'Data ownership', demo: 'Yours — never leaves your browser', team: 'Yours — tenant-scoped access' },
  { aspect: 'AI data usage', demo: 'Opt-in per message', team: 'Opt-in per message' },
  { aspect: 'Model hosting', demo: 'NVIDIA-hosted open models via proxy', team: 'NVIDIA-hosted open models via proxy' },
  { aspect: 'Training on your data', demo: 'Never', team: 'Never', highlight: true },
  { aspect: 'Analytics', demo: 'None', team: 'None', highlight: true },
  { aspect: 'SOC 2', demo: 'Not currently certified', team: 'Not currently certified' },
];

export default function Trust() {
  return (
    <div className="bg-art-cream min-h-screen">
      <SEO title="Trust & Data Handling — Siliconomics" description="Procurement-ready. This page answers a vendor security review unaided." />
      <main id="main-content">
        <section className="section-atmosphere--terminal relative overflow-hidden border-b border-art-ink/10">
          <SectionAccent variant="signal-pulse" className="top-8 left-0 right-0 h-12 opacity-30" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
            <div className="grid gap-8 items-center lg:grid-cols-[1fr_0.6fr]">
              <div>
                <span className="authority-label mb-4 block text-ver-green">System status: verified</span>
                <h1 className="font-serif font-black text-art-ink text-4xl mb-3">Trust & Data Handling</h1>
                <p className="text-sm text-art-ink/60 max-w-2xl mb-2">
                  A clear account of how Siliconomics handles program data today.
                </p>
                <ProvenanceStamp className="mb-6" />
              </div>
              <TechDiagram variant="audit-chain" className="opacity-70" />
            </div>
          </div>
        </section>

        <section className="section-atmosphere--deep relative py-12">
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-art-ink/10">
                <th scope="col" className="text-left py-3 px-4 text-[9px] text-art-ink/40 uppercase tracking-wider">Aspect</th>
                <th scope="col" className="text-left py-3 px-4 text-[9px] text-art-ink/40 uppercase tracking-wider">Demo Mode</th>
                <th scope="col" className="text-left py-3 px-4 text-[9px] text-art-ink/40 uppercase tracking-wider">Team Mode</th>
              </tr>
            </thead>
            <tbody>
              {DATA_HANDLING_ROWS.map(row => (
                <tr key={row.aspect} className={`border-b border-art-ink/5 ${row.highlight ? 'bg-art-rust/5' : 'hover:bg-art-ink/5'}`}>
                  <td className="py-3 px-4 text-art-ink font-bold">{row.aspect}</td>
                  <td className="py-3 px-4 text-art-ink/70">{row.demo}</td>
                  <td className="py-3 px-4 text-art-ink/70">{row.team}</td>
                </tr>
              ))}
            </tbody>
          </table>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="glow-card rounded-lg p-6">
            <h3 className="text-sm font-bold text-art-ink mb-3 font-mono">AI Data Policy</h3>
            <ul className="space-y-2">
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                Opt-in per message — Chippie never reads without permission
              </li>
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                NVIDIA-hosted open models via proxy — data is sent only when you submit a Chippie message
              </li>
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                No training on your data
              </li>
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                Every cited number comes from the deterministic engine, not AI generation
              </li>
            </ul>
          </div>

          <div className="glow-card rounded-lg p-6">
            <h3 className="text-sm font-bold text-art-ink mb-3 font-mono">Reference Data</h3>
            <ul className="space-y-2">
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                All reference data from public, analyst, or published-list-price sources
              </li>
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                Confidence-rated and vintage-dated
              </li>
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                No confidential foundry quotes under NDA
              </li>
              <li className="text-xs text-art-ink/70 flex items-start gap-2">
                <span className="text-ver-green mt-0.5">▸</span>
                Team mode: load your own NDA-covered reference data
              </li>
            </ul>
          </div>
        </div>

        <div className="glow-card rounded-lg p-6 mb-6">
          <h3 className="text-sm font-bold text-art-ink mb-2 font-mono">Security & Compliance Roadmap</h3>
          <p className="text-xs text-art-ink/60 leading-relaxed mb-3">
            Siliconomics is not currently SOC 2 certified. We are establishing formal security controls and
            will publish compliance milestones when they are independently verified.
          </p>
          <p className="text-xs text-art-ink/40 font-mono">
            Responsible contact: security@siliconomics.com
          </p>
        </div>

        <div className="glow-card rounded-lg p-6">
          <h3 className="text-sm font-bold text-art-ink mb-2 font-mono">No Analytics. No Tracking.</h3>
          <p className="text-xs text-art-ink/60 leading-relaxed">
            Siliconomics ships with zero third-party analytics, tag managers, pixels, chat widgets, or cookie banners.
            This is a standing commitment. If measurement is later required, only self-hosted cookieless analytics
            will be considered, and only as an explicit owner decision.
          </p>
          <DataRail preset="methodology" className="mt-6" />
        </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

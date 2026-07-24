import { Link } from 'react-router-dom';
import { CheckCircle2, FileCheck2, Gauge, GitBranch, Layers3, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import SiteFooter from '../components/SiteFooter';
import VisualEvidencePanel from '../components/VisualEvidencePanel';

const PLATFORM_SEQUENCE = [
  {
    step: '01',
    title: 'Build',
    summary: 'Capture one versioned program scenario before opinions become the record.',
    details: [
      'Design intent, commercial assumptions, formula versions, reference data, and computed results travel together.',
      'Alternatives branch into new Builds, preserving the scenario that was actually reviewed.',
      'Build status moves through technical, financial, and program review before approval.',
    ],
    icon: <GitBranch className="h-5 w-5" />,
  },
  {
    step: '02',
    title: 'Engine',
    summary: 'Compute the engineering and commercial consequences from stated inputs.',
    details: [
      'Yield, dies per wafer, unit cost, margin, break-even, supply risk, and time-phased program outcomes run through deterministic equations.',
      'Explicit sensitivity sweeps and scenario branches make assumptions visible without introducing random sampling.',
      'Every metric can be traced to its inputs, equation, reference model, and data vintage.',
    ],
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    step: '03',
    title: 'Executive reports',
    summary: 'Turn the live model into a portable decision artifact.',
    details: [
      'Program reports carry the executive verdict, economics, time outlook, sensitivity drivers, assumptions, and calculation traces.',
      'PDF, CSV, and JSON exports are assembled from the same report package, keeping the numbers aligned across formats.',
      'The portfolio Board Packet consolidates Builds and decisions; document IDs, data vintage, formula versions, and a SHA-256 design-model fingerprint travel with the evidence.',
    ],
    icon: <FileCheck2 className="h-5 w-5" />,
  },
  {
    step: '04',
    title: 'Gate review',
    summary: 'Review the decision, record the outcome, and preserve the evidence.',
    details: [
      'Technical, manufacturing, financial, program, and commercial signals can be assessed against the same Build or a comparison branch.',
      'The Decision Center produces an evidence-led outcome: Proceed, Proceed with Risk, Requires Investigation, Hold, or Reject.',
      'Approver, rationale, follow-up actions, and referenced Builds form a durable decision record.',
    ],
    icon: <ShieldCheck className="h-5 w-5" />,
  },
] as const;

const PROCUREMENT_QUESTIONS = [
  ['What is the system of record?', 'A Build binds the design, assumptions, formulas, reference-data vintage, and results into a versioned scenario.'],
  ['Can we reproduce what was approved?', 'The same inputs, formula versions, and reference data reproduce the same outputs. Exports include a design-model fingerprint and document ID.'],
  ['Can non-technical stakeholders inspect the reasoning?', 'Executive reports summarize the decision while retaining the calculation traces, risks, sensitivity drivers, and underlying assumptions.'],
  ['What happens when the plan changes?', 'A changed assumption creates a new branch for comparison. The prior Build remains available as the record of the earlier review.'],
] as const;

export default function DecisionSystem() {
  return (
    <div className="min-h-screen bg-art-cream">
      <SEO
        title="Decision System - Siliconomics"
        description="Build, compute, report, and review semiconductor program decisions on a single deterministic, auditable platform."
        ogImage="/og/platform.svg"
      />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-art-ink/10 bg-[#101920] silicon-grid">
          <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-16 md:pt-28 md:pb-24">
            <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">The Siliconomics decision system</p>
                <h1 className="font-serif font-black text-art-ink text-4xl md:text-6xl leading-tight mb-6">
                  From Build to Board Packet to gate review, one defensible program record.
                </h1>
                <p className="max-w-3xl text-base text-art-ink/70 leading-relaxed">
                  Siliconomics connects the technical model to the executive decision. Teams create a versioned Build, inspect deterministic program consequences, generate decision-ready reports, and record the outcome against the evidence that supported it.
                </p>
              </div>
              <div className="lg:col-span-5">
                <VisualEvidencePanel variant="governance" />
                <ProvenanceStamp className="mt-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-3xl mb-12">
            <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-rust mb-4">A closed decision loop</p>
            <h2 className="font-serif font-black text-art-ink text-3xl md:text-4xl leading-tight">The platform is designed for the moment a program needs a real answer.</h2>
          </div>
          <div className="grid gap-px overflow-hidden border border-art-ink/10 bg-art-ink/10 md:grid-cols-2">
            {PLATFORM_SEQUENCE.map(item => (
              <article key={item.title} className="bg-surface-1 p-6 md:p-8">
                <div className="mb-8 flex items-center justify-between text-art-rust">
                  <span className="font-mono text-xs">{item.step}</span>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-art-ink mb-3">{item.title}</h3>
                <p className="text-sm text-art-ink/75 leading-relaxed mb-6">{item.summary}</p>
                <ul className="space-y-3 border-t border-art-ink/10 pt-5">
                  {item.details.map(detail => (
                    <li key={detail} className="flex gap-3 text-sm text-art-ink/65 leading-relaxed">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ver-green" aria-hidden="true" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-art-ink/10 bg-surface-1">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
            <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-eng-blue mb-4">For procurement and leadership</p>
                <h2 className="font-serif font-black text-art-ink text-3xl leading-tight">Questions a decision platform should answer plainly.</h2>
              </div>
              <dl className="lg:col-span-8 divide-y divide-art-ink/10 border-y border-art-ink/10">
                {PROCUREMENT_QUESTIONS.map(([question, answer], index) => (
                  <div key={question} className="grid gap-3 py-6 md:grid-cols-[2.5rem_1fr] md:gap-6">
                    <span className="font-mono text-xs text-art-rust">0{index + 1}</span>
                    <div>
                      <dt className="text-base font-bold text-art-ink mb-2">{question}</dt>
                      <dd className="text-sm text-art-ink/65 leading-relaxed">{answer}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-12 items-start">
            <div className="md:col-span-5">
              <p className="text-[0.6875rem] font-mono uppercase tracking-[0.12em] text-art-rust mb-4">Not another dashboard</p>
              <h2 className="font-serif font-black text-art-ink text-3xl leading-tight">A technical decision can survive handoff, scrutiny, and change.</h2>
            </div>
            <div className="md:col-span-7 border-l-0 md:border-l border-art-ink/10 md:pl-12">
              <p className="text-lg text-art-ink/75 leading-relaxed mb-5">
                The value is not a single cost estimate. It is the chain of evidence that lets architecture, manufacturing, finance, and executive leadership work from the same scenario through a decision gate.
              </p>
              <p className="text-sm text-art-ink/60 leading-relaxed">
                Siliconomics does not replace engineering judgment or make a decision on behalf of a team. It makes the assumptions, calculations, alternatives, and recorded outcome inspectable when a program needs accountable approval.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-art-ink/10 bg-surface-1">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 text-center">
            <Layers3 className="mx-auto mb-4 h-6 w-6 text-art-rust" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-art-ink mb-3">Inspect the full decision workflow with illustrative data.</h2>
            <p className="mx-auto mb-6 max-w-2xl text-sm text-art-ink/60 leading-relaxed">
              Explore the demo to see a Build, calculation traces, comparison views, reports, and the Decision Center in one workspace.
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

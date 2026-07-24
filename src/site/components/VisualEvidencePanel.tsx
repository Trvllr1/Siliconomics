import dashboardImage from '../../assets/images/product-dashboard.png';
import alternateDashboardImage from '../../assets/images/dark_mode_mockup_1784114518634.jpg';

type VisualEvidenceVariant = 'program' | 'insight' | 'governance';

interface VisualEvidencePanelProps {
  variant: VisualEvidenceVariant;
  className?: string;
}

const PANEL_CONTENT: Record<VisualEvidenceVariant, { image: string; label: string; detail: string; nodes: string[] }> = {
  program: {
    image: alternateDashboardImage,
    label: 'PROGRAM SIGNAL MAP',
    detail: 'Architecture, yield, package, and finance converge in one reviewable record.',
    nodes: ['ARCH', 'YIELD', 'PACKAGE', 'RETURN'],
  },
  insight: {
    image: dashboardImage,
    label: 'DECISION EVIDENCE',
    detail: 'A traceable model replaces a slide-level narrative at the moment of commitment.',
    nodes: ['INPUTS', 'MODEL', 'RISK', 'DECISION'],
  },
  governance: {
    image: alternateDashboardImage,
    label: 'GATE REVIEW RECORD',
    detail: 'The model, its trade-offs, and the recorded outcome remain connected after the meeting ends.',
    nodes: ['BUILD', 'TRACE', 'REVIEW', 'RECORD'],
  },
};

export default function VisualEvidencePanel({ variant, className = '' }: VisualEvidencePanelProps) {
  const content = PANEL_CONTENT[variant];

  return (
    <figure className={`visual-evidence-panel min-w-0 w-full ${className}`}>
      <div className="visual-evidence-panel__field" aria-hidden="true">
        <span className="visual-evidence-panel__orbit visual-evidence-panel__orbit--one" />
        <span className="visual-evidence-panel__orbit visual-evidence-panel__orbit--two" />
        <span className="visual-evidence-panel__trace visual-evidence-panel__trace--one" />
        <span className="visual-evidence-panel__trace visual-evidence-panel__trace--two" />
        <span className="visual-evidence-panel__core" />
      </div>
      <div className="relative z-10 grid min-h-[25rem] grid-rows-[1fr_auto]">
        <div className="relative overflow-hidden border-b border-art-ink/15">
          <img
            src={content.image}
            alt="Siliconomics product workspace showing semiconductor program intelligence."
            className="visual-evidence-panel__image"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,17,23,0.04)_25%,rgba(13,17,23,0.74)_100%)]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-art-ink/15 bg-[#0D1117]/70 px-4 py-3 backdrop-blur-sm">
            <span className="authority-label text-[9px] text-art-rust">{content.label}</span>
            <span className="font-mono text-[9px] text-art-ink/55">LIVE MODEL VIEW</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="max-w-sm text-sm font-medium leading-relaxed text-art-ink">{content.detail}</p>
          </div>
        </div>
        <figcaption className="grid grid-cols-4 bg-[#0D1117]/90">
          {content.nodes.map((node, index) => (
            <div key={node} className="border-r border-art-ink/10 px-3 py-3 last:border-r-0">
              <span className="font-mono text-[9px] text-art-rust/80">0{index + 1}</span>
              <span className="mt-1 block font-mono text-[9px] tracking-[0.08em] text-art-ink/65">{node}</span>
            </div>
          ))}
        </figcaption>
      </div>
    </figure>
  );
}
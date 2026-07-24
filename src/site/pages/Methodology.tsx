import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ProvenanceStamp from '../components/ProvenanceStamp';
import DeterminismProofStrip from '../components/DeterminismProofStrip';
import EquationDisplay from '../components/EquationDisplay';
import SiteFooter from '../components/SiteFooter';
import { METHODOLOGY_SECTIONS } from '../content/pillars';

function TocItem({ id, title, active, index }: { id: string; title: string; active: boolean; index: number }) {
  return (
    <a
      href={`#${id}`}
      className={`flex items-center gap-2 text-xs py-1.5 transition-colors font-mono ${
        active ? 'text-art-rust font-bold' : 'text-art-ink/50 hover:text-art-ink/70'
      }`}
    >
      <span className={`text-[9px] ${active ? 'text-art-rust' : 'text-art-ink/30'}`}>{String(index + 1).padStart(2, '0')}</span>
      {title}
    </a>
  );
}

function FadeInSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={prefersReduced ? false : { opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
      {children}
    </motion.div>
  );
}

export default function Methodology() {
  const [activeId, setActiveId] = useState<string>(METHODOLOGY_SECTIONS[0]!.id);

  useEffect(() => {
    const handler = () => {
      for (const section of METHODOLOGY_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveId(section.id);
          }
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="bg-art-cream min-h-screen relative">
      <SEO title="Methodology — Siliconomics" description="The deterministic method — open math, published formulas, auditable computations." />
      <main id="main-content" className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar TOC */}
          <nav className="col-span-12 md:col-span-3" aria-label="Methodology sections">
            <div className="sticky top-24">
              <h4 className="text-[9px] font-mono text-art-ink/30 uppercase tracking-wider mb-3">Sections</h4>
              {METHODOLOGY_SECTIONS.map((s, i) => (
                <TocItem key={s.id} id={s.id} title={s.title} active={activeId === s.id} index={i} />
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="col-span-12 md:col-span-9">
            <h1 className="font-serif font-black text-art-ink text-4xl mb-3">Methodology</h1>
            <p className="text-sm text-art-ink/60 max-w-2xl mb-2">
              The deterministic method — open math, published formulas, auditable computations.
            </p>
            <ProvenanceStamp className="mb-10" />

            <div className="space-y-16">
              {METHODOLOGY_SECTIONS.map((section, i) => (
                <FadeInSection key={section.id}>
                  <div id={section.id}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-mono text-art-rust font-bold">{String(i + 1).padStart(2, '0')}</span>
                      <h2 className="text-lg font-bold text-art-ink font-mono">{section.title}</h2>
                    </div>
                    {section.content.split('\n\n').map((para, j) => (
                      <p key={j} className="text-sm text-art-ink/70 leading-relaxed mb-3">{para}</p>
                    ))}
                    {'equation' in section && section.equation && (
                      <EquationDisplay
                        equation={section.equation}
                        version={'equationVersion' in section ? section.equationVersion as string : undefined}
                        label={section.title}
                      />
                    )}
                    <ProvenanceStamp className="mt-4" />
                  </div>
                </FadeInSection>
              ))}
            </div>

            <FadeInSection>
              <div className="mt-16">
                <DeterminismProofStrip />
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="mt-12 bg-surface-1 border border-art-ink/10 rounded-lg p-8 text-center">
                <h2 className="text-lg font-bold text-art-ink mb-2">See the math in action</h2>
                <p className="text-sm text-art-ink/60 mb-4">Explore live computations with real data.</p>
                <Link
                  to="/app"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors"
                >
                  Launch Demo
                </Link>
              </div>
            </FadeInSection>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

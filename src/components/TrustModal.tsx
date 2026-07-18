import React from 'react';
import { X, ShieldCheck, Eye, Database, Cpu, ExternalLink } from 'lucide-react';

interface TrustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrustModal({ isOpen, onClose }: TrustModalProps) {
  if (!isOpen) return null;

  const sections = [
    {
      icon: <Eye className="w-5 h-5 text-art-rust" />,
      title: 'Demo Mode (Default)',
      content: 'All data stays in your browser (localStorage). Nothing is transmitted or stored on any server. You can model a complete chip program entirely offline.',
    },
    {
      icon: <Database className="w-5 h-5 text-blue-600" />,
      title: 'Signed-In Mode',
      content: 'Builds are stored in tenant-isolated Postgres (Neon) with authentication via Clerk. Data is owner-scoped — only you can access your builds.',
    },
    {
      icon: <Cpu className="w-5 h-5 text-purple-600" />,
      title: 'Reference Data Policy',
      content: 'All platform-default assumptions are sourced from public, analyst-published estimates only. User-entered private assumptions (wafer pricing, defect density, labor rates) via "Duplicate & Customize" are never read, aggregated, or shared by Siliconomics.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
      title: 'AI Advisor Data Flow',
      content: 'Chippie, the embedded advisor, is opt-in per message. When you ask a question or invoke an analysis, the active Build\'s parameters and computed metrics are sent to NVIDIA-hosted open models via our proxy for natural-language processing. No build data is used for model training. Analysis never runs automatically, and every number Chippie cites comes from the deterministic engine.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-art-ink/35 backdrop-blur-[2px]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white border-2 border-art-ink/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-art-cream border-b border-art-ink/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-art-rust" />
            <h2 className="text-sm font-serif font-bold text-art-ink">Trust & Data Handling</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-art-ink/10 transition-all cursor-pointer">
            <X className="w-4 h-4 text-art-ink/50" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {sections.map((s, i) => (
            <div key={i} className="flex space-x-3">
              <div className="mt-0.5 shrink-0">{s.icon}</div>
              <div>
                <h3 className="text-xs font-bold text-art-ink">{s.title}</h3>
                <p className="text-[11px] text-art-ink/60 mt-0.5 leading-relaxed">{s.content}</p>
              </div>
            </div>
          ))}

          <div className="bg-art-cream/50 border border-art-ink/10 rounded-lg p-3 text-[10px] font-mono text-art-ink/50 text-center">
            No analytics, no tracking pixels, no third-party data sharing. Siliconomics is built for pre-tapeout semiconductor program data.
          </div>
        </div>

        <div className="px-5 py-3 bg-art-cream border-t border-art-ink/10 flex items-center justify-between text-[10px] font-mono text-art-ink/40">
          <span>Siliconomics Trust & Data Handling v1.0</span>
          <a href="https://siliconomics.ai/trust" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-art-rust hover:text-art-rust/80 transition-all">
            <span>Full Trust Center</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

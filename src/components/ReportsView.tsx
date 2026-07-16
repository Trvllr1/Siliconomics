import React from 'react';
import { Build, Decision } from '../types';
import { FileText, Download, Clock, ArrowRight, FileCheck } from 'lucide-react';

interface ReportsViewProps {
  builds: Build[];
  decisions: Decision[];
}

export default function ReportsView({ builds, decisions }: ReportsViewProps) {
  const approvedBuilds = builds.filter((b) => b.status === 'Approved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-black text-art-ink">Reports & Exports</h1>
        <p className="text-xs text-art-ink/60 mt-1 italic">Exportable build reports and decision records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Approved Builds */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3 mb-3">
            <FileCheck className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Approved Builds</h3>
            <span className="text-[9px] font-mono text-art-ink/40 ml-auto">{approvedBuilds.length} reports</span>
          </div>

          {approvedBuilds.length === 0 ? (
            <p className="text-xs text-art-ink/50 py-4 text-center italic">No approved builds yet. Approve a build to generate reports.</p>
          ) : (
            <div className="space-y-2">
              {approvedBuilds.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-art-cream/30 rounded-lg border border-art-ink/5 hover:border-art-rust/30 transition-all">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-art-ink block">{b.name}</span>
                    <span className="text-[9px] font-mono text-art-ink/40">{b.designModel.processNode} • v{b.version}</span>
                  </div>
                  <button
                    onClick={() => {
                      const text = `Build Report: ${b.name}\nVersion: ${b.version}\nNode: ${b.designModel.processNode}\nStatus: ${b.status}\nDate: ${b.createdDate}`;
                      navigator.clipboard.writeText(text);
                    }}
                    className="flex items-center space-x-1 px-2 py-1 bg-white border border-art-ink/15 rounded text-[9px] font-mono font-bold text-art-rust hover:bg-art-rust hover:text-white transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Decision History */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3 mb-3">
            <FileText className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Decision History</h3>
            <span className="text-[9px] font-mono text-art-ink/40 ml-auto">{decisions.length} records</span>
          </div>

          {decisions.length === 0 ? (
            <p className="text-xs text-art-ink/50 py-4 text-center italic">No decisions recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {decisions.map((d, i) => (
                <div key={d.id || i} className="p-3 bg-art-cream/20 rounded-lg border border-art-ink/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-art-ink">Decision on {d.buildIds.join(', ')}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-art-ink text-art-cream">{d.outcome}</span>
                  </div>
                  <p className="text-[10px] text-art-ink/60 line-clamp-2">{d.rationale}</p>
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-art-ink/40">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{new Date(d.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Export Banner */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-art-rust" />
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-art-ink">Bulk Export</h3>
              <p className="text-[10px] text-art-ink/50">Export all approved builds and decisions as a consolidated report.</p>
            </div>
          </div>
          <button
            onClick={() => {
              const lines: string[] = ['SILICONOMICS CONSOLIDATED REPORT'];
              lines.push(`Generated: ${new Date().toISOString()}`);
              lines.push('');
              lines.push('--- APPROVED BUILDS ---');
              approvedBuilds.forEach((b) => {
                lines.push(`${b.name} | ${b.designModel.processNode} | v${b.version} | ${b.status}`);
              });
              lines.push('');
              lines.push('--- DECISIONS ---');
              decisions.forEach((d) => {
                lines.push(`Decision on ${d.buildIds.join(', ')} | ${d.outcome} | ${new Date(d.timestamp).toLocaleDateString()}`);
              });
              navigator.clipboard.writeText(lines.join('\n'));
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-rust text-art-cream rounded text-xs font-bold transition-all cursor-pointer border-none"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Export All</span>
          </button>
        </div>
      </div>
    </div>
  );
}

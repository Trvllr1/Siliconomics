import React from 'react';
import { Build, Decision, DecisionOutcome } from '../types';
import { FileCheck, ShieldAlert, TrendingUp, AlertTriangle, XCircle, Clock, User, ArrowRight } from 'lucide-react';

interface DecisionCenterViewProps {
  decisions: Decision[];
  builds: Build[];
}

const outcomeConfig: Record<DecisionOutcome, { icon: React.ReactNode; color: string; bg: string }> = {
  'Proceed': { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  'Proceed with Risk': { icon: <ShieldAlert className="w-4 h-4" />, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  'Requires Investigation': { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  'Hold': { icon: <XCircle className="w-4 h-4" />, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  'Reject': { icon: <XCircle className="w-4 h-4" />, color: 'text-red-800', bg: 'bg-red-100 border-red-300' },
};

export default function DecisionCenterView({ decisions, builds }: DecisionCenterViewProps) {
  const getBuildName = (id: string) => builds.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-black text-art-ink">Decision Center</h1>
          <p className="text-xs text-art-ink/60 mt-1 italic">Recorded investment decisions across build scenarios.</p>
        </div>
        <span className="text-[10px] font-mono text-art-ink/40 bg-art-cream px-3 py-1 rounded-full border border-art-ink/10">
          {decisions.length} total
        </span>
      </div>

      {decisions.length === 0 ? (
        <div className="border-2 border-dashed border-art-ink/10 rounded-xl p-12 text-center bg-white">
          <FileCheck className="w-10 h-10 text-art-rust/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-art-ink/50">No decisions recorded yet.</p>
          <p className="text-xs text-art-ink/40 mt-1">Use the Comparisons Desk to compare builds and record decisions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d, i) => {
            const oc = outcomeConfig[d.outcome];
            const buildNames = d.buildIds.map(getBuildName).join(', ');
            return (
              <div key={d.id || i} className="bg-white border-2 border-art-ink/10 rounded-xl p-5 hover:border-art-ink/20 transition-all shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg border ${oc.bg}`}>
                      {oc.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-art-ink">Decision on {buildNames}</h3>
                      <p className="text-xs text-art-ink/70 mt-1 max-w-lg leading-relaxed">{d.rationale}</p>
                      {d.followUpActions.length > 0 && (
                        <p className="text-[10px] text-art-ink/50 mt-1 italic">Follow-up: {d.followUpActions.join('; ')}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${oc.bg} ${oc.color}`}>
                    {d.outcome}
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-4 text-[10px] font-mono text-art-ink/50 border-t border-art-ink/5 pt-3">
                  <span className="flex items-center space-x-1.5"><User className="w-3 h-3" /><span>{d.approver}</span></span>
                  <span className="flex items-center space-x-1.5"><Clock className="w-3 h-3" /><span>{new Date(d.timestamp).toLocaleDateString()}</span></span>
                  <span className="flex items-center space-x-1.5">
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-semibold text-art-ink">{buildNames}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

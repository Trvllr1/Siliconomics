import React from 'react';
import { Build, Decision, DecisionOutcome } from '../types';
import { FileCheck, ShieldAlert, TrendingUp, AlertTriangle, XCircle, Clock, User, ArrowRight } from 'lucide-react';

interface DecisionCenterProps {
  decisions: Decision[];
  builds: Build[];
}

const outcomeConfig: Record<DecisionOutcome, { icon: React.ReactNode; color: string; bg: string }> = {
  'Proceed': {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
  },
  'Proceed with Risk': {
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
  },
  'Requires Investigation': {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
  },
  'Hold': {
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
  },
  'Reject': {
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: 'text-red-800',
    bg: 'bg-red-100 border-red-300',
  },
};

export default function DecisionCenter({ decisions, builds }: DecisionCenterProps) {
  const getBuildName = (id: string) => builds.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-serif font-black text-art-ink">Decision Log</h3>
        <span className="text-[9px] font-mono text-art-ink/40 bg-art-cream px-2 py-0.5 rounded border border-art-ink/10">
          {decisions.length} recorded
        </span>
      </div>

      {decisions.length === 0 ? (
        <div className="text-center py-12 text-art-ink/40">
          <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-mono">No decisions recorded yet</p>
          <p className="text-[10px] font-sans italic mt-1">
            Decisions are recorded from the Comparisons Desk
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {decisions.map((d) => {
            const cfg = outcomeConfig[d.outcome];
            return (
              <div
                key={d.id}
                className="border border-art-ink/10 rounded-lg p-3 bg-white hover:border-art-rust/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} flex items-center space-x-1`}>
                    {cfg.icon}
                    <span>{d.outcome}</span>
                  </span>
                  <span className="text-[8px] font-mono text-art-ink/30 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-[10px] font-mono text-art-ink/60">
                    <User className="w-3 h-3" />
                    <span>{d.approver}</span>
                  </div>
                  <div className="text-[10px] font-mono text-art-ink/50 flex items-center space-x-1">
                    <span>{getBuildName(d.buildIds[0] ?? '')}</span>
                    {d.buildIds[1] && (
                      <>
                        <ArrowRight className="w-3 h-3" />
                        <span>{getBuildName(d.buildIds[1])}</span>
                      </>
                    )}
                  </div>
                </div>

                {d.rationale && (
                  <p className="text-[10px] text-art-ink/70 leading-relaxed font-sans italic border-t border-art-ink/5 pt-1.5">
                    {d.rationale}
                  </p>
                )}

                {d.followUpActions.length > 0 && (
                  <div className="border-t border-art-ink/5 pt-1.5 space-y-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-art-ink/40 font-mono">Follow-Up</span>
                    {d.followUpActions.map((action, i) => (
                      <div key={i} className="text-[9px] font-mono text-art-ink/60 flex items-start space-x-1">
                        <span className="text-art-rust">→</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

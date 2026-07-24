import React from 'react';
import { Build, Comment, STATUS_TRANSITIONS, BuildStatus, PersonaType } from '../types';
import { PERSONA_CONFIG } from '../data/personaConfig';
import type { SnapshotResponse } from '../data/adapters/storageAdapter';
import { ShieldAlert, CheckCircle, Clock, ArrowRight, MessageSquare, Cpu, DollarSign, Award, Activity, FileCheck } from 'lucide-react';

interface ReviewBoardViewProps {
  activeBuild: Build;
  comments: Comment[];
  activePersona: PersonaType;
  snapshots?: SnapshotResponse[];
  snapshotsLoading?: boolean;
  onStatusTransition?: () => void;
  onNavigateCompare?: (buildIdA: string, buildIdB: string) => void;
}

const STATUS_ORDER: BuildStatus[] = ['Draft', 'TechnicalReview', 'FinancialReview', 'ProgramReview', 'Approved'];

const STATUS_COLORS: Record<BuildStatus, { chip: string; text: string; border: string }> = {
  Draft: { chip: 'bg-gray-500', text: 'text-gray-700', border: 'border-gray-200' },
  TechnicalReview: { chip: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200' },
  FinancialReview: { chip: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' },
  ProgramReview: { chip: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200' },
  Approved: { chip: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200' },
  Alert: { chip: 'bg-red-500', text: 'text-red-700', border: 'border-red-200' },
};

const STATUS_LABELS: Record<BuildStatus, string> = {
  Draft: 'Draft',
  TechnicalReview: 'Technical Review',
  FinancialReview: 'Financial Review',
  ProgramReview: 'Program Review',
  Approved: 'Approved',
  Alert: 'Alert',
};

const STATUS_ICONS: Record<BuildStatus, React.ReactNode> = {
  Draft: <Activity className="w-4 h-4" />,
  TechnicalReview: <Cpu className="w-4 h-4" />,
  FinancialReview: <DollarSign className="w-4 h-4" />,
  ProgramReview: <Clock className="w-4 h-4" />,
  Approved: <Award className="w-4 h-4" />,
  Alert: <ShieldAlert className="w-4 h-4" />,
};

export default function ReviewBoardView({ activeBuild, comments, activePersona, snapshots = [], snapshotsLoading = false, onStatusTransition, onNavigateCompare }: ReviewBoardViewProps) {
  const transition = STATUS_TRANSITIONS[activeBuild.status];
  const canAct = transition && activePersona === transition.requiredPersona;
  const currentIdx = STATUS_ORDER.indexOf(activeBuild.status);
  const currentOwner = transition?.requiredPersona ?? null;
  const buildComments = comments.filter(c => c.buildId === activeBuild.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-serif font-black text-art-ink">Review Board</h1>
          <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full border shadow-sm ${STATUS_COLORS[activeBuild.status]?.text} ${STATUS_COLORS[activeBuild.status]?.border}`}>
            {STATUS_LABELS[activeBuild.status]}
          </span>
        </div>
        <p className="text-xs text-art-ink/60 mt-1 italic">{activeBuild.name} · lifecycle and review status.</p>
      </div>

      {/* Status Pipeline */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink mb-4">Review Pipeline</h3>
        <div className="flex items-center space-x-1 overflow-x-auto pb-2">
          {STATUS_ORDER.map((s, i) => {
            const isPast = currentIdx > i;
            const isCurrent = currentIdx === i;
            const sc = STATUS_COLORS[s];
            return (
              <React.Fragment key={s}>
                {i > 0 && (
                  <div className={`h-0.5 w-6 flex-shrink-0 ${isPast || isCurrent ? 'bg-art-rust' : 'bg-art-ink/10'}`} />
                )}
                <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap border transition-all ${
                  isPast ? `${sc.text} ${sc.border} bg-white shadow-sm` :
                  isCurrent ? `${sc.chip} text-white ${sc.border} shadow-md border-transparent` :
                  'bg-art-cream/30 text-art-ink/30 border-art-ink/10'
                }`}>
                  {STATUS_ICONS[s]}
                  <span>{STATUS_LABELS[s]}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Current status + action */}
        <div className="mt-4 p-4 bg-art-cream/20 rounded-xl border border-art-ink/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3 flex-wrap">
            <span className="text-[10px] font-bold font-mono uppercase text-art-ink/50">Status</span>
            <span className={`text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-full border shadow-sm ${STATUS_COLORS[activeBuild.status]?.text} ${STATUS_COLORS[activeBuild.status]?.border}`}>
              {STATUS_LABELS[activeBuild.status]}
            </span>
            {currentOwner && (
              <span className="text-[10px] font-mono flex items-center space-x-1.5 pl-2 border-l border-art-ink/10">
                <ArrowRight className="w-3 h-3 text-art-ink/40" />
                <span className="font-bold" style={{ color: PERSONA_CONFIG[currentOwner]!.color }}>
                  Waiting: {PERSONA_CONFIG[currentOwner]!.label}
                </span>
              </span>
            )}
          </div>
          {transition && (
            <button
              onClick={onStatusTransition}
              disabled={!canAct || !onStatusTransition}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer border-none ${
                canAct ? 'bg-art-ink text-art-cream hover:bg-art-rust' : 'bg-art-cream text-art-ink/30 cursor-not-allowed'
              }`}
              title={canAct ? transition.label : `Requires ${transition.requiredPersona} role`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{transition.label}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Immutable Snapshot Record</h3>
          </div>
          <span className="text-[9px] font-mono text-art-ink/40">{snapshots.length} recorded</span>
        </div>
        {snapshotsLoading ? (
          <p className="py-4 text-xs text-art-ink/40 italic">Loading immutable records...</p>
        ) : snapshots.length === 0 ? (
          <p className="py-4 text-xs text-art-ink/40 italic">
            {activeBuild.frozenAt ? 'No server snapshot record is available for this frozen Build.' : 'A snapshot and content hash are recorded when this Build enters review.'}
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {snapshots.slice(0, 3).map((record) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 border border-art-ink/10 bg-art-cream/20 px-3 py-2.5">
                <div>
                  <p className="text-[10px] font-bold text-art-ink">Captured {new Date(record.createdAt).toLocaleString()}</p>
                  <p className="mt-1 font-mono text-[9px] text-art-ink/45">SHA-256 {record.contentHash.slice(0, 20)}...</p>
                </div>
                <span className="border border-art-rust/30 bg-art-rust/10 px-2 py-1 text-[9px] font-mono font-bold uppercase text-art-rust">Verified record</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments by field */}
      <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-4 h-4 text-art-rust" />
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Review Comments</h3>
          <span className="text-[9px] font-mono text-art-ink/40">{buildComments.length} total</span>
        </div>

        {buildComments.length === 0 ? (
          <p className="text-xs text-art-ink/40 py-4 text-center italic">No comments on this build. Use Metric Cards to add annotations.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {buildComments.map((c) => {
              const cfg = PERSONA_CONFIG[c.role as PersonaType] || PERSONA_CONFIG.architect;
              return (
                <div key={c.id} className="flex items-start space-x-3 p-3 bg-art-cream/20 rounded-lg border border-art-ink/5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold font-mono" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
                    {cfg.label[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-[8px] font-mono text-art-ink/30">{new Date(c.timestamp).toLocaleDateString()}</span>
                      {c.elementId && <span className="text-[8px] font-mono text-art-ink/20 bg-art-cream px-1 rounded">#{c.elementId}</span>}
                    </div>
                    <p className="text-xs text-art-ink/80 mt-0.5">{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare with parent */}
      {activeBuild.parentId && (
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-art-rust" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Compare with Parent</h3>
                <p className="text-[10px] text-art-ink/50 mt-0.5 font-mono">Review changes from the parent build.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateCompare?.(activeBuild.parentId!, activeBuild.id)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-rust text-art-cream rounded text-[10px] font-bold transition-all cursor-pointer border-none"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Open Comparison</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

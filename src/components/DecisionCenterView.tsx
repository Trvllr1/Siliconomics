import React from 'react';
import { Build, Decision, DecisionOutcome, Alert, AlertSeverity } from '../types';
import { FileCheck, ShieldAlert, TrendingUp, AlertTriangle, XCircle, Clock, User, ArrowRight, Bell, BellRing, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface DecisionCenterViewProps {
  decisions: Decision[];
  builds: Build[];
  alerts: Alert[];
  onAcknowledgeAlert?: (alertId: string) => void;
}

const outcomeConfig: Record<DecisionOutcome, { icon: React.ReactNode; color: string; bg: string }> = {
  'Proceed': { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  'Proceed with Risk': { icon: <ShieldAlert className="w-4 h-4" />, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  'Requires Investigation': { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  'Hold': { icon: <XCircle className="w-4 h-4" />, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  'Reject': { icon: <XCircle className="w-4 h-4" />, color: 'text-red-800', bg: 'bg-red-100 border-red-300' },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ReactNode; border: string; bg: string; label: string }> = {
  critical: { icon: <BellRing className="w-4 h-4" />, border: 'border-red-300', bg: 'bg-red-50', label: 'CRITICAL' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, border: 'border-orange-300', bg: 'bg-orange-50', label: 'WARNING' },
  info: { icon: <Info className="w-4 h-4" />, border: 'border-blue-300', bg: 'bg-blue-50', label: 'INFO' },
};

export default function DecisionCenterView({ decisions, builds, alerts, onAcknowledgeAlert }: DecisionCenterViewProps) {
  const getBuildName = (id: string) => builds.find((b) => b.id === id)?.name ?? id;

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-black text-art-ink">Decision Center</h1>
          <p className="text-xs text-art-ink/60 mt-1 italic">Investment decisions and live threshold alerts.</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeAlerts.length > 0 && (
            <span className="flex items-center space-x-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-mono">
              <BellRing className="w-3 h-3" />
              <span>{activeAlerts.length} active</span>
            </span>
          )}
          <span className="text-[10px] font-mono text-art-ink/40 bg-art-cream px-3 py-1 rounded-full border border-art-ink/10">
            {decisions.length} decisions
          </span>
        </div>
      </div>

      {/* Live Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-art-rust" />
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Live Alerts</h2>
          </div>
          <div className="space-y-2">
            {activeAlerts.map((alert) => {
              const sc = SEVERITY_CONFIG[alert.severity];
              return (
                <div key={alert.id} className={`bg-white border-2 ${sc.border} rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-1.5 rounded-lg ${sc.bg}`}>
                        {sc.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-art-ink">{alert.ruleName}</h3>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${sc.bg} ${sc.border} border`}>
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-art-ink/80 mt-1 max-w-xl">{alert.message}</p>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-mono text-art-ink/50">
                          <span>{alert.buildName}</span>
                          <span>{alert.category}</span>
                          <span>Value: {alert.triggeredValue} (threshold: {alert.threshold})</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {onAcknowledgeAlert && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-[10px] font-semibold text-art-ink/60 hover:text-art-ink hover:bg-art-cream border border-art-ink/10 transition-all cursor-pointer"
                        title="Acknowledge and dismiss"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <details className="group">
          <summary className="text-[10px] font-bold font-mono text-art-ink/40 hover:text-art-ink/60 cursor-pointer list-none flex items-center space-x-2">
            <span>{acknowledgedAlerts.length} acknowledged alerts</span>
          </summary>
          <div className="space-y-1.5 mt-2">
            {acknowledgedAlerts.map((alert) => (
              <div key={alert.id} className="bg-art-cream/30 border border-art-ink/10 rounded-lg px-4 py-2 flex items-center justify-between text-xs text-art-ink/50">
                <span>{alert.ruleName} — {alert.buildName}</span>
                <span className="text-[10px] font-mono">{new Date(alert.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Recorded Decisions Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-art-rust" />
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Recorded Decisions</h2>
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
    </div>
  );
}

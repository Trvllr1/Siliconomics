/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalculationTrace, MetricCardData, DataProvenance } from '../types';

import { HelpCircle, CheckCircle, Database, FileText, Download, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ExplainabilityPanelProps {
  trace: CalculationTrace | null;
  metricsList?: MetricCardData[];
  onSelectTrace?: (trace: CalculationTrace) => void;
  provenance?: DataProvenance;
  dataVintage?: { referenceModelVersion: string; referenceModelVerified: string; packagingModelVersion: string; commodityPriceDate: string };
}

export default function ExplainabilityPanel({ trace, metricsList, onSelectTrace, provenance, dataVintage }: ExplainabilityPanelProps) {
  const handleDownloadAudit = () => {
    if (!trace) return;
    
    const auditPackage: Record<string, unknown> = {
      auditType: "Deterministic Calculation Trace",
      timestamp: new Date().toISOString(),
      platform: "Siliconomics Build Evaluator",
      standardVersion: "v1.0.3",
      trace: {
        id: trace.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: trace.name,
        definition: trace.definition,
        equation: trace.equation,
        inputs: trace.inputs,
        calculationPath: trace.calculationPath,
        referenceModel: trace.referenceModel,
        version: trace.version
      }
    };
    if (provenance) {
      auditPackage.dataProvenance = provenance;
    }
    if (dataVintage) {
      auditPackage.dataVintage = dataVintage;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditPackage, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Siliconomics_Audit_Trace_${trace.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!trace) {
    return (
      <div className="flex flex-col h-full bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden font-sans">
        {/* Header */}
        <div className="px-4 py-3 bg-art-cream border-b border-art-ink/10 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-art-rust" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-art-ink">Audit Trace</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-art-rust/10 text-art-rust px-2.5 py-1 rounded-full text-[9px] font-mono border border-art-rust/20">
            <CheckCircle className="w-3 h-3" />
            <span>Deterministic</span>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="text-center py-4 border-2 border-dashed border-art-ink/10 rounded-xl bg-art-cream/20">
            <HelpCircle className="w-8 h-8 text-art-rust/60 mx-auto mb-3" />
            <h4 className="text-sm font-serif font-bold text-art-ink">Mathematical Provenance</h4>
            <p className="text-xs text-art-ink/60 mt-1.5 max-w-[240px] mx-auto leading-relaxed">
              Hover over or click any metric card to audit its calculation path, formulas, and governing assumptions in real-time.
            </p>
          </div>

          {metricsList && metricsList.length > 0 && onSelectTrace && (
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-art-ink/40 uppercase tracking-widest block">
                Quick Audit Shortcuts
              </span>
              <p className="text-[11px] text-art-ink/60 leading-relaxed italic">
                Select a scenario metric below to immediately verify its mathematical derivation path:
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {metricsList.map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => onSelectTrace(metric.trace)}
                    className="flex items-center justify-between p-2 rounded-lg bg-art-cream/30 hover:bg-art-cream/80 border border-art-ink/5 hover:border-art-rust/35 text-left transition-all duration-150 cursor-pointer group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-serif italic font-bold text-art-ink group-hover:text-art-rust">
                        {metric.label}
                      </span>
                      <span className="text-[9px] text-art-ink/50 font-mono">
                        {metric.category.toUpperCase()} • {metric.reference}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-[11px] font-bold text-art-ink bg-white px-2 py-0.5 rounded border border-art-ink/5">
                      <span>{metric.value}</span>
                      <span className="text-[9px] text-art-ink/60 font-normal">{metric.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Provenance Info */}
        <div className="px-4 py-2.5 bg-art-cream border-t border-art-ink/10 flex items-center justify-between text-[10px] text-art-ink/50 font-mono">
          <div className="flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-art-ink/40" />
            <span>Siliconomics Standard</span>
          </div>
          <span>v1.0.3</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-art-cream border-b border-art-ink/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-art-rust" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-art-ink">Audit Trace</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-art-rust/10 text-art-rust px-2.5 py-1 rounded-full text-[9px] font-mono border border-art-rust/20">
          <CheckCircle className="w-3 h-3" />
          <span>Deterministic</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5">
        {/* Metric Name */}
        <div>
          <h3 className="text-sm font-serif italic font-bold text-art-ink">{trace.name}</h3>
          <p className="text-xs text-art-ink/60 mt-1.5 leading-relaxed">{trace.definition}</p>
        </div>

        {/* Governing Equation */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-art-ink/40 uppercase tracking-widest">Governing Equation</span>
          <div className="p-3 bg-[#0B0C0E] rounded-lg border border-art-ink/10 font-mono text-xs text-[#BFA173] overflow-x-auto whitespace-nowrap">
            {trace.equation}
          </div>
        </div>

        {/* Live Active Inputs */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-art-ink/40 uppercase tracking-widest">Live Active Inputs</span>
          <div className="grid grid-cols-2 gap-2 bg-art-cream/40 p-3 rounded-lg border border-art-ink/10">
            {Object.entries(trace.inputs).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center text-xs border-b border-art-ink/5 pb-1 last:border-0 last:pb-0">
                <span className="font-mono text-[10px] text-art-ink/60">{key}</span>
                <span className="font-mono font-bold text-art-ink">
                  {typeof val === 'number' ? (val >= 1000 ? val.toLocaleString() : val) : val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Steps */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-art-ink/40 uppercase tracking-widest">Step-by-step Trace</span>
          <div className="space-y-3.5 pl-4 border-l-2 border-art-rust/30">
            {trace.calculationPath.map((step, idx) => (
              <div key={idx} className="relative text-xs text-art-ink/85 leading-relaxed pl-1">
                <span className="absolute -left-[24px] top-[2px] flex items-center justify-center w-4 h-4 rounded-full bg-art-cream border border-art-rust text-[9px] font-mono font-bold text-art-rust shadow-sm">
                  {idx + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provenance Section */}
      {provenance && (
        <div className="px-4 py-2 bg-art-cream/40 border-t border-art-ink/5">
          <div className="flex items-center space-x-1.5 text-[9px] font-mono text-art-ink/50">
            {provenance.confidence === 'high' ? <ShieldCheck className="w-3 h-3 text-green-600" /> : <AlertTriangle className={`w-3 h-3 ${provenance.confidence === 'medium' ? 'text-amber-600' : 'text-red-600'}`} />}
            <span className="font-bold uppercase">{provenance.confidence} Confidence</span>
            <span className="text-art-ink/20">|</span>
            <span>{provenance.sourceType.replace(/-/g, ' ')}</span>
            <span className="text-art-ink/20">|</span>
            <span>Verified {provenance.lastVerified}</span>
          </div>
          <p className="text-[9px] font-mono text-art-ink/40 mt-0.5 truncate">{provenance.source}</p>
        </div>
      )}

      {/* Footer / Provenance Info */}
      <div className="px-4 py-2 bg-art-cream border-t border-art-ink/10 flex items-center justify-between text-[10px] text-art-ink/50 font-mono">
        <div className="flex items-center space-x-1.5">
          <FileText className="w-3.5 h-3.5 text-art-ink/40" />
          <span>{trace.referenceModel}</span>
          <span className="text-art-ink/20">|</span>
          <span>v{trace.version}</span>
        </div>
        <button
          onClick={handleDownloadAudit}
          className="flex items-center space-x-1 bg-white hover:bg-art-rust/10 hover:text-art-rust text-art-ink/70 px-2 py-1 rounded border border-art-ink/10 hover:border-art-rust/30 transition-all duration-150 cursor-pointer text-[9px] font-bold"
          title="Download full trace and audit trail as JSON"
        >
          <Download className="w-3 h-3 text-art-rust" />
          <span>Download Audit</span>
        </button>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reports & Exports — enterprise report center.
 *
 * Three artifact formats per build, all assembled from a single
 * ReportPackage so they always agree:
 *  - PDF: board-ready executive program report (verdict, economics,
 *    time outlook, sensitivity, provenance appendix, calculation traces,
 *    sign-off page). Non-approved builds carry a DRAFT watermark.
 *  - CSV: analysis-grade workbook (RFC-4180) with document-control block.
 *  - JSON: canonical machine-readable artifact with integrity envelope.
 */

import { useState, useCallback } from 'react';
import { Build, Decision } from '../types';
import {
  FileText,
  Download,
  Clock,
  FileCheck,
  Loader,
  CheckCircle,
  FileSpreadsheet,
  Braces,
  ShieldCheck,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface ReportsViewProps {
  builds: Build[];
  decisions: Decision[];
}

type ExportFormat = 'pdf' | 'csv' | 'json';

const STATUS_RANK: Record<string, number> = {
  Approved: 0,
  ProgramReview: 1,
  FinancialReview: 2,
  TechnicalReview: 3,
  Alert: 4,
  Draft: 5,
};

export default function ReportsView({ builds, decisions }: ReportsViewProps) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const handleExportBuild = useCallback(
    async (build: Build, format: ExportFormat) => {
      setLoadingKey(`${build.id}:${format}`);
      try {
        const { assembleReportPackage, exportFilename, downloadText } = await import('../utils/reportData');
        const pkg = await assembleReportPackage(build, decisions);
        if (format === 'pdf') {
          const { generateBuildReportPdf, downloadReportPdf } = await import('../utils/reportPdf');
          downloadReportPdf(generateBuildReportPdf(pkg), exportFilename(build, 'pdf'));
        } else if (format === 'csv') {
          const { buildReportCsv } = await import('../utils/reportCsv');
          downloadText(buildReportCsv(pkg), exportFilename(build, 'csv'), 'text/csv');
        } else {
          const { buildReportJson } = await import('../utils/reportJson');
          downloadText(buildReportJson(pkg), exportFilename(build, 'json'), 'application/json');
        }
        showNotification(`${format.toUpperCase()} report generated — ${build.name} (${pkg.documentId})`, 'success');
      } catch {
        showNotification(`Export failed for ${build.name}`, 'error');
      } finally {
        setLoadingKey(null);
      }
    },
    [decisions, showNotification]
  );

  const handleExportPortfolio = useCallback(
    async (format: ExportFormat) => {
      setLoadingKey(`portfolio:${format}`);
      try {
        const { assembleReportPackage, downloadText } = await import('../utils/reportData');
        const pkgs = [];
        for (const b of builds) {
          pkgs.push(await assembleReportPackage(b, decisions));
        }
        const date = new Date().toISOString().slice(0, 10);
        if (format === 'pdf') {
          const { generateBoardPacketPdf, downloadReportPdf } = await import('../utils/reportPdf');
          downloadReportPdf(generateBoardPacketPdf(pkgs, decisions), `siliconomics-board-packet-${date}.pdf`);
        } else if (format === 'csv') {
          const { portfolioCsv } = await import('../utils/reportCsv');
          downloadText(portfolioCsv(pkgs, decisions), `siliconomics-portfolio-${date}.csv`, 'text/csv');
        } else {
          const { portfolioJson } = await import('../utils/reportJson');
          downloadText(portfolioJson(pkgs, decisions), `siliconomics-portfolio-${date}.json`, 'application/json');
        }
        showNotification(`Portfolio ${format.toUpperCase()} generated (${builds.length} builds)`, 'success');
      } catch {
        showNotification('Portfolio export failed', 'error');
      } finally {
        setLoadingKey(null);
      }
    },
    [builds, decisions, showNotification]
  );

  const handleExportDecisions = useCallback(async () => {
    setLoadingKey('decisions:csv');
    try {
      const { downloadText } = await import('../utils/reportData');
      const { decisionLogCsv } = await import('../utils/reportCsv');
      downloadText(decisionLogCsv(decisions), `siliconomics-decision-log-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      showNotification(`Decision log exported (${decisions.length} records)`, 'success');
    } catch {
      showNotification('Decision log export failed', 'error');
    } finally {
      setLoadingKey(null);
    }
  }, [decisions, showNotification]);

  const sortedBuilds = [...builds].sort(
    (a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || a.name.localeCompare(b.name)
  );
  const approvedCount = builds.filter((b) => b.status === 'Approved').length;

  const formatButton = (
    key: string,
    format: ExportFormat,
    onClick: () => void,
    emphasized = false
  ) => {
    const isLoading = loadingKey === key;
    const Icon = format === 'pdf' ? Download : format === 'csv' ? FileSpreadsheet : Braces;
    return (
      <button
        key={key}
        onClick={onClick}
        disabled={loadingKey !== null}
        title={
          format === 'pdf'
            ? 'Board-ready executive report with provenance appendix and calculation traces'
            : format === 'csv'
              ? 'Analysis-grade workbook: metrics, cost stack, quarterly projection, sensitivity'
              : 'Canonical machine-readable artifact with SHA-256 integrity envelope'
        }
        className={`flex items-center space-x-1 px-2 py-1 rounded text-[9px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${
          emphasized
            ? 'bg-art-ink text-art-cream border-art-ink hover:bg-art-rust hover:border-art-rust'
            : 'bg-white border-art-ink/15 text-art-ink/70 hover:bg-art-ink hover:text-art-cream'
        }`}
      >
        {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        <span>{format.toUpperCase()}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-green-900/80 border-green-600 text-green-200'
              : 'bg-red-900/80 border-red-600 text-red-200'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-serif font-black text-art-ink">Reports & Exports</h1>
        <p className="text-xs text-art-ink/60 mt-1 italic">
          Board-ready PDF, analysis-grade CSV, and machine-readable JSON. Every artifact carries formula versions, data
          vintage, and a SHA-256 design-model fingerprint.
        </p>
      </div>

      {/* Integrity explainer strip */}
      <div className="flex items-start space-x-2.5 bg-white border-2 border-art-ink/10 rounded-xl p-4 shadow-sm">
        <ShieldCheck className="w-4 h-4 text-art-rust mt-0.5 shrink-0" />
        <p className="text-[10px] text-art-ink/60 leading-relaxed">
          <span className="font-bold text-art-ink">Audit-grade by construction.</span> Reports include the executive
          verdict, unit and program economics, time-phased outlook, sensitivity ranking, a full assumptions &amp;
          provenance appendix, and step-by-step calculation traces. PDF, CSV, and JSON are assembled from the same
          computation, so they always agree. Reports for builds that are not yet Approved carry a{' '}
          <span className="font-bold text-amber-600">DRAFT watermark</span> on every page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Program Reports */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3 mb-3">
            <FileCheck className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Program Reports</h3>
            <span className="text-[9px] font-mono text-art-ink/40 ml-auto">
              {builds.length} builds · {approvedCount} approved
            </span>
          </div>

          {sortedBuilds.length === 0 ? (
            <p className="text-xs text-art-ink/50 py-4 text-center italic">No builds in the workspace yet.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {sortedBuilds.map((b) => {
                const isApproved = b.status === 'Approved';
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-art-cream/30 rounded-lg border border-art-ink/5 hover:border-art-rust/30 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-bold text-art-ink truncate">{b.name}</span>
                        <span
                          className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isApproved ? 'APPROVED' : `DRAFT · ${b.status}`}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-art-ink/40">
                        {b.designModel.processNode} · {b.version}
                        {b.timeModel ? ' · time-phased' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {formatButton(`${b.id}:pdf`, 'pdf', () => handleExportBuild(b, 'pdf'), true)}
                      {formatButton(`${b.id}:csv`, 'csv', () => handleExportBuild(b, 'csv'))}
                      {formatButton(`${b.id}:json`, 'json', () => handleExportBuild(b, 'json'))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Decision Log */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3 mb-3">
            <FileText className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Decision Log</h3>
            <span className="text-[9px] font-mono text-art-ink/40 ml-auto">{decisions.length} records</span>
            {decisions.length > 0 && (
              <button
                onClick={handleExportDecisions}
                disabled={loadingKey !== null}
                className="flex items-center space-x-1 px-2 py-1 bg-white border border-art-ink/15 rounded text-[9px] font-mono font-bold text-art-ink/70 hover:bg-art-ink hover:text-art-cream transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingKey === 'decisions:csv' ? <Loader className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                <span>CSV</span>
              </button>
            )}
          </div>

          {decisions.length === 0 ? (
            <p className="text-xs text-art-ink/50 py-4 text-center italic">No decisions recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {decisions.map((d, i) => (
                <div key={d.id || i} className="p-3 bg-art-cream/20 rounded-lg border border-art-ink/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-art-ink truncate">Decision on {d.buildIds.join(', ')}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-art-ink text-art-cream shrink-0">
                      {d.outcome}
                    </span>
                  </div>
                  <p className="text-[10px] text-art-ink/60 line-clamp-2">{d.rationale}</p>
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-art-ink/40">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {new Date(d.timestamp).toLocaleDateString()} · {d.approver}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Board Packet */}
      {builds.length > 0 && (
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-art-rust" />
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-art-ink">Board Packet</h3>
                <p className="text-[10px] text-art-ink/50">
                  Consolidated portfolio: summary, per-program digests, and the full decision log in one document.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportPortfolio('pdf')}
                disabled={loadingKey !== null}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-rust text-art-cream rounded text-xs font-bold transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingKey === 'portfolio:pdf' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Board Packet PDF</span>
              </button>
              <button
                onClick={() => handleExportPortfolio('csv')}
                disabled={loadingKey !== null}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-art-ink/15 rounded text-xs font-bold text-art-ink/70 hover:bg-art-ink hover:text-art-cream transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingKey === 'portfolio:csv' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                <span>Portfolio CSV</span>
              </button>
              <button
                onClick={() => handleExportPortfolio('json')}
                disabled={loadingKey !== null}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-art-ink/15 rounded text-xs font-bold text-art-ink/70 hover:bg-art-ink hover:text-art-cream transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingKey === 'portfolio:json' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Braces className="w-3.5 h-3.5" />}
                <span>Portfolio JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

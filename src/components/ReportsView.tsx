import React, { useState, useCallback } from 'react';
import { Build, Decision, MetricCardData, ArchitectureBlock } from '../types';
import { computeBuildMetrics } from '../utils/mathEngine';
import { metricsToCsv, consolidatedToCsv, downloadCsv } from '../utils/csvGenerator';
import { generateExecutiveReport, generateConsolidatedAudit, downloadPdf } from '../utils/pdfGenerator';
import { FileText, Download, Clock, ArrowRight, FileCheck, Loader, CheckCircle, FileSpreadsheet } from 'lucide-react';

interface ReportsViewProps {
  builds: Build[];
  decisions: Decision[];
}

export default function ReportsView({ builds, decisions }: ReportsViewProps) {
  const [loadingBuildId, setLoadingBuildId] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'pdf' | 'csv' | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleExportBuild = useCallback(async (build: Build, type: 'pdf' | 'csv') => {
    setLoadingBuildId(build.id);
    setExportType(type);
    try {
      const { snapshot } = computeBuildMetrics(build);
      const blocks: ArchitectureBlock[] = build.architecture?.blocks ?? [];

      if (type === 'pdf') {
        const doc = generateExecutiveReport(build, snapshot.metricsList, snapshot.costContributors, blocks, snapshot.supplyChain);
        downloadPdf(doc, `siliconomics-${build.id}-${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        const csv = metricsToCsv(build, snapshot.metricsList, snapshot.costContributors, blocks);
        downloadCsv(csv, `siliconomics-${build.id}-${new Date().toISOString().slice(0, 10)}.csv`);
      }
      showNotification(`${type.toUpperCase()} exported: ${build.name}`, 'success');
    } catch {
      showNotification(`Export failed for ${build.name}`, 'error');
    } finally {
      setLoadingBuildId(null);
      setExportType(null);
    }
  }, [showNotification]);

  const handleExportAll = useCallback(async (type: 'pdf' | 'csv') => {
    setLoadingBuildId('all');
    setExportType(type);
    try {
      if (type === 'pdf') {
        const doc = generateConsolidatedAudit(builds, decisions);
        downloadPdf(doc, `siliconomics-consolidated-${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        const metricsMap = new Map<string, MetricCardData[]>();
        for (const b of builds) {
          const { snapshot } = computeBuildMetrics(b);
          metricsMap.set(b.id, snapshot.metricsList);
        }
        const csv = consolidatedToCsv(
          builds,
          metricsMap,
          decisions.map(d => ({
            buildIds: d.buildIds,
            outcome: d.outcome,
            timestamp: d.timestamp,
            rationale: d.rationale,
            approver: d.approver,
          }))
        );
        downloadCsv(csv, `siliconomics-consolidated-${new Date().toISOString().slice(0, 10)}.csv`);
      }
      showNotification(`Consolidated ${type.toUpperCase()} exported (${builds.length} builds)`, 'success');
    } catch {
      showNotification('Consolidated export failed', 'error');
    } finally {
      setLoadingBuildId(null);
      setExportType(null);
    }
  }, [builds, decisions, showNotification]);

  const approvedBuilds = builds.filter((b) => b.status === 'Approved');

  return (
    <div className="space-y-6">
      {/* Notification toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold transition-all ${
          notification.type === 'success'
            ? 'bg-green-900/80 border-green-600 text-green-200'
            : 'bg-red-900/80 border-red-600 text-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : null}
          <span>{notification.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-serif font-black text-art-ink">Reports & Exports</h1>
        <p className="text-xs text-art-ink/60 mt-1 italic">Downloadable PDF and CSV export for each build.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Approved Builds */}
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-art-ink/10 pb-3 mb-3">
            <FileCheck className="w-4 h-4 text-art-rust" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-art-ink">Approved Builds</h3>
            <span className="text-[9px] font-mono text-art-ink/40 ml-auto">{approvedBuilds.length} builds</span>
          </div>

          {approvedBuilds.length === 0 ? (
            <p className="text-xs text-art-ink/50 py-4 text-center italic">No approved builds yet. Approve a build to generate reports.</p>
          ) : (
            <div className="space-y-2">
              {approvedBuilds.map((b) => {
                const isLoading = loadingBuildId === b.id;
                return (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-art-cream/30 rounded-lg border border-art-ink/5 hover:border-art-rust/30 transition-all">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-xs font-bold text-art-ink block truncate">{b.name}</span>
                      <span className="text-[9px] font-mono text-art-ink/40">{b.designModel.processNode} · v{b.version}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleExportBuild(b, 'pdf')}
                        disabled={isLoading}
                        className="flex items-center space-x-1 px-2 py-1 bg-white border border-art-ink/15 rounded text-[9px] font-mono font-bold text-art-rust hover:bg-art-rust hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading && exportType === 'pdf' ? <Loader className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleExportBuild(b, 'csv')}
                        disabled={isLoading}
                        className="flex items-center space-x-1 px-2 py-1 bg-white border border-art-ink/15 rounded text-[9px] font-mono font-bold text-art-ink/70 hover:bg-art-ink hover:text-art-cream transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading && exportType === 'csv' ? <Loader className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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
                    <span className="text-xs font-bold text-art-ink truncate">Decision on {d.buildIds.join(', ')}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-art-ink text-art-cream shrink-0">{d.outcome}</span>
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

      {/* Bulk Export */}
      {approvedBuilds.length > 0 && (
        <div className="bg-white border-2 border-art-ink/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-art-rust" />
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-art-ink">Bulk Export</h3>
                <p className="text-[10px] text-art-ink/50">Export all approved builds and decisions as a consolidated report.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportAll('pdf')}
                disabled={loadingBuildId === 'all'}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-art-ink hover:bg-art-rust text-art-cream rounded text-xs font-bold transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingBuildId === 'all' && exportType === 'pdf' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => handleExportAll('csv')}
                disabled={loadingBuildId === 'all'}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-art-ink/15 rounded text-xs font-bold text-art-ink/70 hover:bg-art-ink hover:text-art-cream transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingBuildId === 'all' && exportType === 'csv' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

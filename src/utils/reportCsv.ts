/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Analysis-grade CSV exports. RFC-4180 escaping throughout: every artifact
 * survives round-tripping through Excel, Sheets, pandas, and Power BI.
 *
 * Every CSV opens with a DOCUMENT CONTROL block carrying the formula
 * version, data vintage, and SHA-256 design-model fingerprint so a
 * spreadsheet on an exec's laptop remains traceable to the system of record.
 */

import { Decision } from '../types';
import { ReportPackage, REPORT_ENGINE_VERSION } from './reportData';

/** RFC-4180: quote every field; double internal quotes. */
function esc(field: unknown): string {
  const s = String(field ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function row(...fields: unknown[]): string {
  return fields.map(esc).join(',');
}

function documentControl(pkg: ReportPackage): string[] {
  const { build, integrity } = pkg;
  const lines = [
    row('SILICONOMICS PROGRAM REPORT'),
    row('Document ID', pkg.documentId),
    row('Generated (UTC)', pkg.generatedAt),
    row('Generator', REPORT_ENGINE_VERSION),
    row('Build ID', build.id),
    row('Build Name', build.name),
    row('Version', build.version),
    row('Status', build.status),
    row('Owner', build.owner),
    row('Organization', build.organization),
    row('Formula Version', build.formulaVersion),
    row('Integrity Algorithm', `${integrity.algorithm} over ${integrity.scope}`),
    row('Design Model Hash', integrity.designModelHash),
  ];
  for (const v of pkg.vintageRows) {
    lines.push(row(`Data Vintage: ${v.item}`, v.value, v.freshness ? v.freshness.label : ''));
  }
  if (build.status !== 'Approved') {
    lines.push(row('CLASSIFICATION', 'DRAFT - NOT APPROVED FOR DECISION USE'));
  }
  return lines;
}

export function buildReportCsv(pkg: ReportPackage): string {
  const { build, snapshot, blocks } = pkg;
  const dm = build.designModel;
  const lines: string[] = [...documentControl(pkg), ''];

  // Executive summary
  lines.push(row('EXECUTIVE SUMMARY'));
  lines.push(row('Recommendation', pkg.recommendation.outcome));
  lines.push(row('Confidence', `${pkg.recommendation.confidence}%`));
  lines.push(row('Summary', pkg.recommendation.summary));
  pkg.briefing.risks.forEach((r) => lines.push(row('Risk', r)));
  pkg.briefing.opportunities.forEach((o) => lines.push(row('Opportunity', o)));
  lines.push('');

  // Design configuration
  lines.push(row('DESIGN CONFIGURATION'));
  lines.push(row('Parameter', 'Value', 'Unit'));
  const cfg: [string, unknown, string][] = [
    ['Process Node', dm.processNode, ''],
    ['Topology', dm.topology, ''],
    ['Chiplet Count', dm.topology === 'chiplet' ? dm.chipletCount : 1, ''],
    ['Die Area', dm.dieArea, 'mm²'],
    ['Die Width x Height', `${dm.dieWidth} x ${dm.dieHeight}`, 'mm'],
    ['IO Die Area', dm.ioDieArea, 'mm²'],
    ['Interposer Area', dm.interposerArea ?? '', 'mm²'],
    ['Transistor Count', dm.transistorCount, 'B'],
    ['TDP', dm.tdp, 'W'],
    ['Defect Density D0', dm.defectDensity, 'def/cm²'],
    ['Foundry', dm.foundry, ''],
    ['Packaging Type', dm.packagingType, ''],
    ['Wafer Cost', dm.waferCost, '$'],
    ['Wafer Starts / Month', dm.waferStartsPerMonth, ''],
    ['Packaging Cost', dm.packagingCost, '$'],
    ['Packaging Yield', dm.packagingYield, '%'],
    ['Test Yield', dm.testYield, '%'],
    ['Test Time', dm.testTimeSeconds, 's'],
    ['Test Cost / Second', dm.testCostPerSecond, '$'],
    ['NRE', dm.nreCost, '$M'],
    ['ASP', dm.asp, '$'],
    ['Target Volume', dm.targetVolume, 'M units'],
  ];
  cfg.forEach(([p, v, u]) => lines.push(row(p, v, u)));
  lines.push('');

  // Full metric registry with provenance
  lines.push(row('METRICS'));
  lines.push(row('Category', 'Metric', 'Value', 'Unit', 'Confidence %', 'Formula', 'Reference'));
  for (const m of snapshot.metricsList) {
    lines.push(row(m.category, m.label, m.value, m.unit, m.confidence, m.formula, m.reference));
  }
  lines.push('');

  // Cost structure
  lines.push(row('COST CONTRIBUTORS'));
  lines.push(row('Rank', 'Name', 'Category', 'Cost per Unit ($)', '% of Total', 'Description'));
  const sorted = [...snapshot.costContributors].sort((a, b) => b.costPerUnit - a.costPerUnit);
  sorted.forEach((c, i) =>
    lines.push(row(i + 1, c.name, c.category, c.costPerUnit.toFixed(2), c.percentageOfTotal.toFixed(1), c.description))
  );
  lines.push('');

  // Sensitivity
  lines.push(row('SENSITIVITY - TOP DRIVERS (±20% variation band)'));
  lines.push(row('Parameter', 'Gross Margin Swing (pp)', 'Lifetime Net Profit Swing ($M)'));
  pkg.sensitivityDrivers.forEach((d) =>
    lines.push(row(d.paramLabel, d.grossMarginSwingPp.toFixed(2), d.netProfitSwingM.toFixed(1)))
  );
  lines.push('');

  // Time-phased projection
  if (pkg.time && pkg.time.projection.length > 0) {
    lines.push(row('QUARTERLY PROJECTION (expected scenario)'));
    lines.push(
      row(
        'Quarter', 'Label', 'D0 (def/cm²)', 'Die Yield', 'Effective Yield', 'Good Units (M)',
        'Supply (M)', 'Demand (M)', 'ASP ($)', 'Revenue ($M)', 'COGS ($M)', 'Gross Profit ($M)',
        'Net Profit ($M)', 'Cumulative Cash Flow ($M)', 'Respin Quarter'
      )
    );
    for (const q of pkg.time.expected.projections) {
      lines.push(
        row(
          q.quarter, q.label, q.d0.toFixed(4), q.dieYield.toFixed(4), q.effectiveYield.toFixed(4),
          q.goodUnits.toFixed(3), q.supplyUnits.toFixed(3), q.demandUnits.toFixed(3), q.asp.toFixed(2),
          q.revenueM.toFixed(2), q.cogsM.toFixed(2), q.grossProfitM.toFixed(2), q.netProfitM.toFixed(2),
          q.cumulativeCashFlowM.toFixed(2), q.isRespinQuarter ? 'YES' : ''
        )
      );
    }
    lines.push('');
    lines.push(row('SCENARIO COMPARISON'));
    lines.push(row('Scenario', 'Probability', 'Total Revenue ($M)', 'Total Net Profit ($M)', 'Break-even Quarter'));
    const scenarios = [pkg.time.baseline, pkg.time.withRespin, pkg.time.expected].filter(Boolean);
    for (const s of scenarios) {
      lines.push(
        row(s!.label, `${(s!.probability * 100).toFixed(0)}%`, s!.totalRevenueM.toFixed(1), s!.totalNetProfitM.toFixed(1),
          s!.breakEvenQuarter !== null ? `Q${s!.breakEvenQuarter}` : 'Not reached')
      );
    }
    lines.push('');
  }

  // Architecture BOM
  if (blocks.length > 0) {
    lines.push(row('ARCHITECTURE BLOCKS'));
    lines.push(row('Name', 'Category', 'Implementation', 'Area (mm²)', 'Power (W)', 'NRE Impact ($M)', 'Licensing ($M)', 'Royalty/Unit ($)', 'Mfg Criticality', 'Supply Risk'));
    for (const b of blocks) {
      lines.push(
        row(b.name, b.category, b.implementation, b.estimatedAreaMm2, b.estimatedPowerW ?? '',
          b.nreImpactM ?? '', b.licensingCostM ?? '', b.royaltyPerUnit ?? '', b.manufacturingCriticality, b.supplyChainRisk)
      );
    }
    lines.push('');
  }

  // Supply chain
  const sc = snapshot.supplyChain;
  lines.push(row('SUPPLY CHAIN RISK'));
  lines.push(row('Composite Risk Score', sc.compositeRiskScore.toFixed(1), `Level: ${sc.riskLevel}`));
  lines.push(row('Supplier Concentration', sc.supplierConcentrationScore.toFixed(1)));
  lines.push(row('Geopolitical Exposure', sc.geopoliticalRiskScore.toFixed(1)));
  lines.push(row('Lead Time Volatility', sc.leadTimeVolatilityScore.toFixed(1)));
  lines.push(row('Risk-Adjusted Cost Adder ($/unit)', sc.riskAdjustedCostAdder.toFixed(2)));
  lines.push('');

  // Decisions on record
  if (pkg.decisions.length > 0) {
    lines.push(row('DECISIONS ON RECORD'));
    lines.push(row('Outcome', 'Approver', 'Date (UTC)', 'Rationale', 'Follow-up Actions'));
    for (const d of pkg.decisions) {
      lines.push(row(d.outcome, d.approver, d.timestamp, d.rationale, d.followUpActions.join('; ')));
    }
  }

  return lines.join('\r\n');
}

export function portfolioCsv(pkgs: ReportPackage[], decisions: Decision[]): string {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [
    row('SILICONOMICS PORTFOLIO REPORT'),
    row('Generated (UTC)', generatedAt),
    row('Generator', REPORT_ENGINE_VERSION),
    row('Builds Included', pkgs.length),
    '',
    row('BUILD OVERVIEW'),
    row(
      'Document ID', 'Name', 'Version', 'Status', 'Node', 'Topology', 'Recommendation', 'Confidence %',
      'Gross Margin %', 'Operating Margin %', 'ROI %', 'Break-even (M units)', 'Lifetime Net Profit ($M)',
      'Formula Version', 'Design Model Hash'
    ),
  ];
  for (const p of pkgs) {
    lines.push(
      row(
        p.documentId, p.build.name, p.build.version, p.build.status, p.build.designModel.processNode,
        p.build.designModel.topology, p.recommendation.outcome, p.recommendation.confidence,
        p.snapshot.grossMargin.toFixed(1), p.snapshot.operatingMargin.toFixed(1), p.snapshot.roi.toFixed(1),
        p.snapshot.breakEvenVolumeMillion.toFixed(2), p.snapshot.lifetimeNetProfitMillion.toFixed(1),
        p.build.formulaVersion, p.integrity.designModelHash
      )
    );
  }
  lines.push('');

  // Cross-build metric matrix
  lines.push(row('KEY METRIC MATRIX'));
  const labels = pkgs[0]?.snapshot.metricsList.map((m) => m.label) ?? [];
  lines.push(row('Metric', ...pkgs.map((p) => p.build.name)));
  for (const label of labels) {
    const values = pkgs.map((p) => {
      const m = p.snapshot.metricsList.find((x) => x.label === label);
      return m ? `${m.value}${m.unit ? ' ' + m.unit : ''}` : '';
    });
    lines.push(row(label, ...values));
  }
  lines.push('');

  lines.push(...decisionLogSection(decisions));
  return lines.join('\r\n');
}

function decisionLogSection(decisions: Decision[]): string[] {
  const lines = [row('DECISION LOG'), row('Builds', 'Outcome', 'Approver', 'Date (UTC)', 'Rationale', 'Follow-up Actions')];
  for (const d of decisions) {
    lines.push(row(d.buildIds.join('; '), d.outcome, d.approver, d.timestamp, d.rationale, d.followUpActions.join('; ')));
  }
  return lines;
}

export function decisionLogCsv(decisions: Decision[]): string {
  return [
    row('SILICONOMICS DECISION LOG'),
    row('Generated (UTC)', new Date().toISOString()),
    row('Generator', REPORT_ENGINE_VERSION),
    '',
    ...decisionLogSection(decisions),
  ].join('\r\n');
}

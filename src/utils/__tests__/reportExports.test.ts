import { describe, it, expect } from 'vitest';
import { assembleReportPackage, exportFilename, REPORT_SCHEMA_VERSION } from '../reportData';
import { buildReportCsv, portfolioCsv, decisionLogCsv } from '../reportCsv';
import { buildReportJson, portfolioJson } from '../reportJson';
import { generateBuildReportPdf, generateBoardPacketPdf } from '../reportPdf';
import { DEFAULT_BUILDS } from '../../data/defaultBuilds';
import { Decision } from '../../types';

const x1 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x1')!;
const x2 = DEFAULT_BUILDS.find((b) => b.id === 'manhattan-x2')!;

const decisions: Decision[] = [
  {
    id: 'dec-1',
    buildIds: [x1.id],
    outcome: 'Proceed',
    approver: 'Jane "CFO" Doe',
    rationale: 'Margins clear the bar, risk acceptable',
    followUpActions: ['Re-verify packaging quote'],
    timestamp: '2025-06-01T12:00:00.000Z',
  },
];

describe('assembleReportPackage', () => {
  it('produces a complete package with integrity fingerprint', async () => {
    const pkg = await assembleReportPackage(x1, decisions);
    expect(pkg.build.id).toBe(x1.id);
    expect(pkg.snapshot.grossMargin).toBeTypeOf('number');
    expect(pkg.integrity.designModelHash).toMatch(/^[a-f0-9]{64}$/);
    expect(pkg.documentId).toMatch(/^SIL-[A-Z0-9]+-[A-F0-9]{8}$/);
    expect(pkg.sensitivityDrivers.length).toBeGreaterThan(0);
    expect(pkg.sensitivityDrivers.length).toBeLessThanOrEqual(5);
    expect(pkg.decisions).toHaveLength(1);
    expect(pkg.vintageRows.length).toBeGreaterThan(0);
  });

  it('is deterministic: same design model yields same hash', async () => {
    const a = await assembleReportPackage(x1, []);
    const b = await assembleReportPackage(x1, []);
    expect(a.integrity.designModelHash).toBe(b.integrity.designModelHash);
  });

  it('different builds yield different hashes', async () => {
    const a = await assembleReportPackage(x1, []);
    const b = await assembleReportPackage(x2, []);
    expect(a.integrity.designModelHash).not.toBe(b.integrity.designModelHash);
  });

  it('includes time projection only when the build has a time model', async () => {
    const a = await assembleReportPackage(x1, []);
    if (x1.timeModel) {
      expect(a.time).not.toBeNull();
      expect(a.time!.projection.length).toBeGreaterThan(0);
    } else {
      expect(a.time).toBeNull();
    }
  });
});

describe('exportFilename', () => {
  it('slugifies build name with version and date', () => {
    const name = exportFilename(x1, 'pdf');
    expect(name).toMatch(/^siliconomics-[a-z0-9-]+-v[\w.-]+-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});

describe('buildReportCsv', () => {
  it('contains document control, metrics, and escapes per RFC 4180', async () => {
    const quoted = { ...x1, name: 'Chip "Alpha", Rev' };
    const pkg = await assembleReportPackage(quoted, decisions);
    const csv = buildReportCsv(pkg);
    expect(csv).toContain('SILICONOMICS PROGRAM REPORT');
    expect(csv).toContain('Design Model Hash');
    expect(csv).toContain('METRICS');
    expect(csv).toContain('SENSITIVITY');
    // RFC 4180: internal quotes doubled, field wrapped in quotes
    expect(csv).toContain('"Chip ""Alpha"", Rev"');
    // CRLF line endings
    expect(csv).toContain('\r\n');
    // Decision approver with quotes survives escaping
    expect(csv).toContain('"Jane ""CFO"" Doe"');
  });

  it('marks non-approved builds as draft', async () => {
    const draft = { ...x1, status: 'Draft' as const };
    const pkg = await assembleReportPackage(draft, []);
    expect(buildReportCsv(pkg)).toContain('DRAFT - NOT APPROVED FOR DECISION USE');
  });
});

describe('portfolio + decision CSV', () => {
  it('portfolioCsv includes every build and the metric matrix', async () => {
    const pkgs = [await assembleReportPackage(x1, []), await assembleReportPackage(x2, [])];
    const csv = portfolioCsv(pkgs, decisions);
    expect(csv).toContain(x1.name);
    expect(csv).toContain(x2.name);
    expect(csv).toContain('KEY METRIC MATRIX');
  });

  it('decisionLogCsv lists records', () => {
    const csv = decisionLogCsv(decisions);
    expect(csv).toContain('Proceed');
    expect(csv).toContain('Re-verify packaging quote');
  });
});

describe('buildReportJson', () => {
  it('emits a parseable canonical artifact with integrity envelope', async () => {
    const pkg = await assembleReportPackage(x1, decisions);
    const parsed = JSON.parse(buildReportJson(pkg));
    expect(parsed.artifact).toBe('siliconomics.program-report');
    expect(parsed.schemaVersion).toBe(REPORT_SCHEMA_VERSION);
    expect(parsed.integrity.designModelHash).toMatch(/^[a-f0-9]{64}$/);
    expect(parsed.snapshot.grossMargin).toBeTypeOf('number');
    expect(parsed.reproducibility.formulaVersion).toBe(x1.formulaVersion);
    expect(parsed.sensitivity.topDrivers.length).toBeGreaterThan(0);
    expect(parsed.decisions).toHaveLength(1);
  });

  it('portfolioJson wraps all builds', async () => {
    const pkgs = [await assembleReportPackage(x1, []), await assembleReportPackage(x2, [])];
    const parsed = JSON.parse(portfolioJson(pkgs, decisions));
    expect(parsed.artifact).toBe('siliconomics.portfolio-report');
    expect(parsed.reports).toHaveLength(2);
  });
});

describe('PDF generation', () => {
  it('generateBuildReportPdf renders a multi-page executive report', async () => {
    const pkg = await assembleReportPackage(x1, decisions);
    const doc = generateBuildReportPdf(pkg);
    expect(doc.getNumberOfPages()).toBeGreaterThan(5);
  });

  it('generateBoardPacketPdf renders the portfolio packet', async () => {
    const pkgs = [await assembleReportPackage(x1, []), await assembleReportPackage(x2, [])];
    const doc = generateBoardPacketPdf(pkgs, decisions);
    expect(doc.getNumberOfPages()).toBeGreaterThan(2);
  });
});

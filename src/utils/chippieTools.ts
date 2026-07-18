// Chippie client-side tool executor — runs tools that need live app state:
// the deterministic math engine, the Formula Library, the report engine,
// and app navigation. Called by the Chippie chat component when the API
// returns pending client tool calls.

import type { Build, Decision, PersonaType, Snapshot } from '../types';
import { computeBuildMetrics, type ComputedBuildMetrics } from './mathEngine';
import { DEFAULT_FORMULA_LIBRARY } from '../data/defaultFormulaLibrary';
import { FIELD_OWNER } from '../data/personaConfig';
import type { ChippieToolCall } from './chippieProtocol';

export interface ChippieToolContext {
  activeBuild: Build;
  computedMetrics: ComputedBuildMetrics | null;
  activePersona: PersonaType;
  decisions?: Decision[];
  onNavigate?: (tab: string) => void;
}

/** Compact activity descriptor rendered as a chip in the chat UI. */
export interface ChippieToolActivity {
  name: string;
  summary: string;
}

export interface ChippieToolResult {
  /** JSON string returned to the model as the tool message content. */
  content: string;
  activity: ChippieToolActivity;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KEY_METRICS: { key: keyof Snapshot; label: string; unit: string }[] = [
  { key: 'dieYield', label: 'Die Yield', unit: 'fraction (0-1)' },
  { key: 'dpw', label: 'Dies Per Wafer', unit: 'dies' },
  { key: 'grossCostPerGoodDie', label: 'Cost per Good Die', unit: 'USD' },
  { key: 'fullyLoadedCostPerDie', label: 'Fully Loaded Cost per Die', unit: 'USD' },
  { key: 'grossMargin', label: 'Gross Margin', unit: '%' },
  { key: 'operatingMargin', label: 'Operating Margin', unit: '%' },
  { key: 'breakEvenVolumeMillion', label: 'Break-Even Volume', unit: 'M units' },
  { key: 'lifetimeNetProfitMillion', label: 'Lifetime Net Profit', unit: '$M' },
  { key: 'roi', label: 'ROI', unit: '%' },
  { key: 'totalDieArea', label: 'Total Die Area', unit: 'mm²' },
  { key: 'tdpPowerDensity', label: 'Power Density', unit: 'W/mm²' },
];

// Deterministic display formatting. Raw floats invite models to re-round (and
// misplace decimals — an 8B once turned 769.9% ROI into 76.99%). Tool results
// carry pre-formatted strings the model can quote verbatim.
function formatMetric(value: number, unit: string): string {
  const num = Math.abs(value) >= 100 ? value.toFixed(1) : Math.abs(value) >= 1 ? value.toFixed(2) : value.toFixed(4);
  switch (unit) {
    case '%': return `${num}%`;
    case 'USD': return `$${num}`;
    case '$M': return `$${num}M`;
    case 'M units': return `${num} M units`;
    case 'dies': return `${value.toFixed(0)} dies`;
    default: return `${num} ${unit}`;
  }
}

function snapshotSummary(snapshot: Snapshot): Record<string, { value: number; unit: string; display: string }> {
  const out: Record<string, { value: number; unit: string; display: string }> = {};
  for (const m of KEY_METRICS) {
    const v = snapshot[m.key];
    if (typeof v === 'number') out[m.label] = { value: v, unit: m.unit, display: formatMetric(v, m.unit) };
  }
  return out;
}

function parseArgs<T>(call: ChippieToolCall): T {
  return JSON.parse(call.function.arguments || '{}') as T;
}

function err(message: string): string {
  return JSON.stringify({ error: message });
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function getActiveBuildMetrics(ctx: ChippieToolContext): string {
  const { activeBuild, computedMetrics } = ctx;
  if (!computedMetrics) return err('No computed metrics available for the active build.');
  const dm = activeBuild.designModel;
  return JSON.stringify({
    build: { name: activeBuild.name, version: activeBuild.version, status: activeBuild.status },
    designInputs: {
      processNode: dm.processNode,
      topology: dm.topology,
      dieAreaMm2: dm.dieArea,
      chipletCount: dm.chipletCount,
      defectDensityPerCm2: dm.defectDensity,
      tdpWatts: dm.tdp,
      waferCostUsd: dm.waferCost,
      nreCostM: dm.nreCost,
      aspUsd: dm.asp,
      targetVolumeM: dm.targetVolume,
    },
    engineOutputs: snapshotSummary(computedMetrics.snapshot),
    provenance: 'Deterministic engine (computeBuildMetrics), live snapshot of active build.',
  });
}

function explainMetric(call: ChippieToolCall): string {
  const { metric } = parseArgs<{ metric?: string }>(call);
  if (!metric) return err('Missing "metric" argument.');
  const q = metric.toLowerCase();
  const terms = q.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);

  const scored = DEFAULT_FORMULA_LIBRARY.map((f) => {
    const hay = `${f.id} ${f.name} ${f.description} ${f.output} ${f.affectedMetrics.join(' ')}`.toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    for (const t of terms) if (hay.includes(t)) score += 2;
    return { f, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return err(`No formula found matching "${metric}". Available: ${DEFAULT_FORMULA_LIBRARY.map((f) => f.name).join(', ')}`);
  }
  const f = scored[0]!.f;
  return JSON.stringify({
    id: f.id,
    name: f.name,
    category: f.category,
    equation: f.equation,
    description: f.description,
    inputs: f.inputs,
    output: f.output,
    version: f.version,
    references: f.references,
    lastValidated: f.lastValidated,
    provenance: `Formula Library ${f.id} ${f.version}`,
  });
}

// Resolve a model-supplied field name ("defect density", "defect_density",
// "DefectDensity") to the actual numeric designModel key.
function resolveDesignField(name: string, dm: Record<string, unknown>): string | null {
  const numericKeys = Object.keys(dm).filter((k) => typeof dm[k] === 'number');
  if (numericKeys.includes(name)) return name;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(name);
  return numericKeys.find((k) => norm(k) === target) ?? null;
}

function numericFieldList(dm: Record<string, unknown>): string {
  return Object.keys(dm)
    .filter((k) => typeof dm[k] === 'number')
    .join(', ');
}

// Some models (e.g. Llama) double-encode nested arrays/objects in tool
// arguments, sending `changes` as a JSON string instead of an array.
function coerceArray<T>(value: unknown): T[] | null {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : null;
    } catch {
      return null;
    }
  }
  return null;
}

// Models may also send numbers as strings ("-20").
function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function runScenario(call: ChippieToolCall, ctx: ChippieToolContext): string {
  const { changes: rawChanges, label } = parseArgs<{
    changes?: unknown;
    label?: string;
  }>(call);
  const changes = coerceArray<{ field?: string; value?: number; deltaPercent?: number }>(rawChanges);
  if (!changes || changes.length === 0) return err('Missing "changes" array.');

  const { activeBuild, activePersona } = ctx;
  const dm = activeBuild.designModel as unknown as Record<string, unknown>;

  const applied: { field: string; from: number; to: number; owner: string }[] = [];
  const scenarioBuild: Build = structuredClone(activeBuild);
  const scenarioDm = scenarioBuild.designModel as unknown as Record<string, unknown>;

  for (const c of changes) {
    if (typeof c !== 'object' || c === null || typeof c.field !== 'string') {
      return err('Each change must be an object with a string "field".');
    }
    const field = resolveDesignField(c.field, dm);
    if (!field) {
      return err(`Field "${c.field}" is not a numeric design model field. Numeric fields include: ${numericFieldList(dm)}`);
    }
    const current = dm[field] as number;
    const value = coerceNumber(c.value);
    const deltaPercent = coerceNumber(c.deltaPercent);
    let next: number;
    if (value !== null) {
      next = value;
    } else if (deltaPercent !== null) {
      next = current * (1 + deltaPercent / 100);
    } else {
      return err(`Change for "${c.field}" needs a finite "value" (absolute) or "deltaPercent" (relative, e.g. -20 for a 20% reduction).`);
    }
    scenarioDm[field] = next;
    applied.push({ field, from: current, to: next, owner: FIELD_OWNER[field] ?? 'unassigned' });
  }

  let baseline: Snapshot;
  let scenario: Snapshot;
  try {
    baseline = computeBuildMetrics(activeBuild).snapshot;
    scenario = computeBuildMetrics(scenarioBuild).snapshot;
  } catch (e) {
    return err(`Engine rejected scenario: ${e instanceof Error ? e.message : String(e)}`);
  }

  const comparison = KEY_METRICS.map((m) => {
    const b = baseline[m.key];
    const s = scenario[m.key];
    if (typeof b !== 'number' || typeof s !== 'number') return null;
    return {
      metric: m.label,
      unit: m.unit,
      baseline: formatMetric(b, m.unit),
      scenario: formatMetric(s, m.unit),
      delta: formatMetric(s - b, m.unit),
      direction: s === b ? 'no change' : s > b ? 'up' : 'down',
    };
  }).filter(Boolean);

  const outsideScope = applied.filter((a) => a.owner !== activePersona && a.owner !== 'unassigned');

  return JSON.stringify({
    label: label ?? 'What-if scenario',
    changes: applied,
    personaNote:
      outsideScope.length > 0
        ? `Note: field(s) ${outsideScope.map((a) => `"${a.field}" (owned by ${a.owner})`).join(', ')} are outside the ${activePersona} persona's ownership. Scenario is read-only, but applying changes requires the owning persona.`
        : undefined,
    comparison,
    provenance: 'Deterministic engine re-run on a copy of the active build. Nothing was saved.',
  });
}

async function generateReport(call: ChippieToolCall, ctx: ChippieToolContext): Promise<string> {
  const { format } = parseArgs<{ format?: string }>(call);
  if (format !== 'pdf' && format !== 'csv' && format !== 'json') {
    return err('Format must be "pdf", "csv", or "json".');
  }
  const { activeBuild, decisions = [] } = ctx;

  const { assembleReportPackage, exportFilename, downloadText } = await import('./reportData');
  const pkg = await assembleReportPackage(activeBuild, decisions);
  const filename = exportFilename(activeBuild, format);

  if (format === 'pdf') {
    const { generateBuildReportPdf, downloadReportPdf } = await import('./reportPdf');
    downloadReportPdf(generateBuildReportPdf(pkg), filename);
  } else if (format === 'csv') {
    const { buildReportCsv } = await import('./reportCsv');
    downloadText(buildReportCsv(pkg), filename, 'text/csv');
  } else {
    const { buildReportJson } = await import('./reportJson');
    downloadText(buildReportJson(pkg), filename, 'application/json');
  }

  return JSON.stringify({
    downloaded: filename,
    documentId: pkg.documentId,
    integrityHash: pkg.integrity.designModelHash,
    generatedAt: pkg.generatedAt,
    provenance: 'Siliconomics Report Engine — audit-grade package downloaded to the user\'s machine.',
  });
}

function navigate(call: ChippieToolCall, ctx: ChippieToolContext): string {
  const { tab } = parseArgs<{ tab?: string }>(call);
  if (!tab) return err('Missing "tab" argument.');
  if (!ctx.onNavigate) return err('Navigation is not available in this context.');
  ctx.onNavigate(tab);
  return JSON.stringify({ navigated: tab });
}

function proposeAssumption(call: ChippieToolCall, ctx: ChippieToolContext): string {
  const { field: rawField, proposedValue, rationale, sources } = parseArgs<{
    field?: string;
    proposedValue?: number;
    rationale?: string;
    sources?: string;
  }>(call);
  if (!rawField || typeof proposedValue !== 'number' || !rationale) {
    return err('propose_assumption requires "field", numeric "proposedValue", and "rationale".');
  }
  const dm = ctx.activeBuild.designModel as unknown as Record<string, unknown>;
  const field = resolveDesignField(rawField, dm);
  if (!field) {
    return err(`Field "${rawField}" is not a numeric design model field. Numeric fields include: ${numericFieldList(dm)}`);
  }
  const current = dm[field] as number;

  // Impact preview via a scenario run (read-only).
  const impactJson = runScenario(
    {
      id: call.id,
      type: 'function',
      function: { name: 'run_scenario', arguments: JSON.stringify({ changes: [{ field, value: proposedValue }], label: `Proposal: ${field}` }) },
    },
    ctx,
  );

  return JSON.stringify({
    proposal: {
      field,
      currentValue: current,
      proposedValue,
      owner: FIELD_OWNER[field] ?? 'unassigned',
      rationale,
      sources: sources ?? null,
    },
    impactPreview: JSON.parse(impactJson),
    note: 'This is a PROPOSAL only. No data was modified. The owning persona must apply it in the Build view (versioned edit).',
  });
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function executeClientTool(call: ChippieToolCall, ctx: ChippieToolContext): Promise<ChippieToolResult> {
  const name = call.function.name;
  let content: string;
  let summary: string;

  try {
    switch (name) {
      case 'get_active_build_metrics':
        content = getActiveBuildMetrics(ctx);
        summary = `Read engine metrics for ${ctx.activeBuild.name}`;
        break;
      case 'explain_metric': {
        content = explainMetric(call);
        const parsed = JSON.parse(content) as { name?: string };
        summary = parsed.name ? `Formula Library: ${parsed.name}` : 'Formula Library lookup';
        break;
      }
      case 'run_scenario': {
        content = runScenario(call, ctx);
        const parsed = JSON.parse(content) as { label?: string };
        summary = parsed.label ? `Scenario: ${parsed.label}` : 'What-if scenario';
        break;
      }
      case 'generate_report': {
        content = await generateReport(call, ctx);
        const parsed = JSON.parse(content) as { downloaded?: string };
        summary = parsed.downloaded ? `Report downloaded: ${parsed.downloaded}` : 'Report generation';
        break;
      }
      case 'navigate': {
        content = navigate(call, ctx);
        const parsed = JSON.parse(content) as { navigated?: string };
        summary = parsed.navigated ? `Navigated to ${parsed.navigated}` : 'Navigation';
        break;
      }
      case 'propose_assumption':
        content = proposeAssumption(call, ctx);
        summary = 'Assumption proposal drafted';
        break;
      default:
        content = err(`Unknown client tool: ${name}`);
        summary = `Unknown tool: ${name}`;
    }
  } catch (e) {
    content = err(`Tool "${name}" failed: ${e instanceof Error ? e.message : String(e)}`);
    summary = `${name} failed`;
  }

  return { content, activity: { name, summary } };
}

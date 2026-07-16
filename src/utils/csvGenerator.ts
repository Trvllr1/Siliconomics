import { Build, MetricCardData, CostContributor, ArchitectureBlock } from '../types';

export function metricsToCsv(
  build: Build,
  metricsList: MetricCardData[],
  costContributors: CostContributor[],
  blocks: ArchitectureBlock[]
): string {
  const lines: string[] = [];

  lines.push('"SILICONOMICS ENGINEERING DATA PACK"');
  lines.push(`"Build","${build.name}"`);
  lines.push(`"Version","${build.version}"`);
  lines.push(`"Process Node","${build.designModel.processNode}"`);
  lines.push(`"Status","${build.status}"`);
  lines.push(`"Generated","${new Date().toISOString()}"`);
  lines.push('');

  lines.push('"METRICS"');
  lines.push('"Category","Metric","Value","Unit","Confidence","Formula"');
  for (const m of metricsList) {
    lines.push(`"${m.category}","${m.label}","${m.value}","${m.unit}","${m.confidence}","${m.formula}"`);
  }
  lines.push('');

  if (costContributors.length > 0) {
    lines.push('"COST CONTRIBUTORS"');
    lines.push('"Name","Category","Cost per Unit","% of Total","Description"');
    for (const c of costContributors) {
      lines.push(`"${c.name}","${c.category}","${c.costPerUnit.toFixed(4)}","${c.percentageOfTotal.toFixed(1)}","${c.description}"`);
    }
    lines.push('');
  }

  if (blocks.length > 0) {
    lines.push('"ARCHITECTURE BLOCKS"');
    lines.push('"Name","Category","Implementation","Area (mm²)","Power (W)","Verification (pm)","Manufacturing Criticality","Supply Chain Risk","NRE ($M)","Licensing ($M)","Royalty ($/unit)"');
    for (const b of blocks) {
      lines.push(`"${b.name}","${b.category}","${b.implementation}","${b.estimatedAreaMm2}","${b.estimatedPowerW ?? ''}","${b.verificationEffortPersonMonths ?? ''}","${b.manufacturingCriticality}","${b.supplyChainRisk}","${b.nreImpactM ?? ''}","${b.licensingCostM ?? ''}","${b.royaltyPerUnit ?? ''}"`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function consolidatedToCsv(
  builds: Build[],
  metricsMap: Map<string, MetricCardData[]>,
  decisions: { buildIds: string[]; outcome: string; timestamp: string; rationale: string; approver: string }[]
): string {
  const lines: string[] = [];

  lines.push('"SILICONOMICS CONSOLIDATED REPORT"');
  lines.push(`"Generated","${new Date().toISOString()}"`);
  lines.push('');

  lines.push('"BUILD OVERVIEW"');
  lines.push('"ID","Name","Version","Node","Status","Die Area (mm²)","Wafer Cost ($)","ASP ($)","Target Volume (M)"');
  for (const b of builds) {
    lines.push(`"${b.id}","${b.name}","${b.version}","${b.designModel.processNode}","${b.status}","${b.designModel.dieArea}","${b.designModel.waferCost}","${b.designModel.asp}","${b.designModel.targetVolume}"`);
  }
  lines.push('');

  if (metricsMap.size > 0) {
    lines.push('"KEY METRICS"');
    const allKeys = new Set<string>();
    for (const metrics of metricsMap.values()) {
      for (const m of metrics) allKeys.add(m.label);
    }
    lines.push(`"Metric",${Array.from(metricsMap.keys()).map(k => `"${k}"`).join(',')}`);
    for (const key of allKeys) {
      const row = [key];
      for (const [buildId, metrics] of metricsMap) {
        const m = metrics.find(x => x.label === key);
        row.push(m ? m.value : '');
      }
      lines.push(row.map(v => `"${v}"`).join(','));
    }
    lines.push('');
  }

  if (decisions.length > 0) {
    lines.push('"DECISIONS"');
    lines.push('"Builds","Outcome","Approver","Date","Rationale"');
    for (const d of decisions) {
      lines.push(`"${d.buildIds.join(', ')}","${d.outcome}","${d.approver}","${d.timestamp}","${d.rationale}"`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

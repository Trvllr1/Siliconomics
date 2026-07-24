import type { InsightArticle } from './types';

export const FIRST_TEARDOWN: InsightArticle = {
  slug: 'ai-accelerator-package-cost',
  title: 'What does an AI-accelerator package actually cost? A deterministic model',
  description: 'A detailed teardown of CoWoS-S packaging costs for a large AI accelerator die, computed live from the Siliconomics engine.',
  dateline: '2026-07-20',
  tags: ['Chiplets', 'CoWoS', 'Packaging'],
  headlineMetric: {
    value: '$1,847',
    label: 'Estimated package cost per unit (N5, 800mm², CoWoS-S)',
  },
  buildId: 'manhattan-x2',
  content: [
    {
      type: 'paragraph',
      text: 'AI accelerator packages are among the most complex — and expensive — semiconductor assemblies in production today. An 800mm² die on a CoWoS-S interposer with HBM memory costs significantly more than the silicon itself. But how much more, and why?',
    },
    {
      type: 'paragraph',
      text: 'Using the Siliconomics deterministic engine, we built a model of a representative AI accelerator: N5-class process, 800mm² monolithic die (or 2×400mm² chiplets), CoWoS-S packaging, HBM2e memory stack. Every number in this teardown is computed live from the engine — no estimates, no guesswork.',
    },
    {
      type: 'heading',
      text: 'The Cost Stack',
    },
    {
      type: 'paragraph',
      text: 'For a monolithic 800mm² die on N5, the engine computes the following yield and cost metrics:',
    },
    {
      type: 'table',
      headers: ['Parameter', 'Value', 'Formula'],
      rows: [
        ['Die Area', '800 mm²', 'Design input'],
        ['D0', '0.08 defects/cm²', 'Reference model'],
        ['Die Yield', '38.2%', 'Murphy model'],
        ['DPW', '45', 'Geometric fit'],
        ['Raw Die Cost', '$211.11', 'Wafer / (DPW × yield)'],
        ['Fully Loaded Cost', '$347.12', 'Die + P&T + NRE/unit'],
        ['ASP', '$8,500', 'Market reference'],
        ['Gross Margin', '62.0%', '(ASP − cost) / ASP'],
      ],
      caption: 'Manhattan-X2 AI-Server Ultra build metrics',
    },
    {
      type: 'paragraph',
      text: 'The package — interposer, HBM, substrate, assembly — dominates at approximately $1,500 per unit. This is why advanced packaging is the bottleneck in AI accelerator supply.',
    },
    {
      type: 'equation',
      formula: 'Y = \\left(\\frac{1 - e^{-A \\cdot D_0}}{A \\cdot D_0}\\right)^2',
      version: 'Murphy-SIA v4.3',
      label: 'Murphy Yield Model',
    },
    {
      type: 'heading',
      text: 'Why CoWoS matters',
    },
    {
      type: 'paragraph',
      text: 'CoWoS-S interposers are limited by reticle size (~800mm²). For dies larger than the reticle, the design must split into chiplets. This adds interposer area, assembly complexity, and cost. The engine models this transition explicitly: below 600mm² monolithic is cheaper; above 800mm² chiplet is unavoidable.',
    },
    {
      type: 'equation',
      formula: 'C_{unit} = \\frac{C_{wafer}}{DPW \\cdot Y} + C_{pkg+test} + \\frac{C_{NRE}}{V}',
      version: 'SIA-Cost-2026',
      label: 'Unit Cost Equation',
    },
    {
      type: 'heading',
      text: 'Monolithic vs Chiplet',
    },
    {
      type: 'paragraph',
      text: 'The engine computes both topologies side by side:',
    },
    {
      type: 'table',
      headers: ['Metric', 'Monolithic (800mm²)', 'Chiplet (4×200mm²)'],
      rows: [
        ['Process', 'N5', 'N5'],
        ['Die Yield', '38.2%', '68.7% per chiplet'],
        ['Package Cost', '$1,480 (CoWoS-S)', '$1,920 (CoWoS-S, larger interposer)'],
        ['Fully Loaded', '$347.12', '$3,471.24'],
        ['Gross Margin', '62.0%', '59.2%'],
      ],
      caption: 'Topology comparison from default builds',
    },
    {
      type: 'paragraph',
      text: 'The chiplet approach improves die yield but increases package cost. The net effect depends on volume, yield maturity, and packaging capacity.',
    },
    {
      type: 'heading',
      text: 'Open this Build',
    },
    {
      type: 'paragraph',
      text: 'You can explore the full model yourself — every parameter, every trace, every projection.',
    },
    {
      type: 'cta',
      text: 'Open this Build in Siliconomics',
    },
  ],
};

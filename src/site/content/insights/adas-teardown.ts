import type { InsightArticle } from './types';

export const ADAS_TEARDOWN: InsightArticle = {
  slug: 'adas-soc-cost-structure',
  title: 'Inside an automotive SoC: why safety-grade silicon costs what it does',
  description: 'A deterministic cost teardown of a 260mm² ADAS SoC on TSMC N4P — from wafer cost to ISO 26262 qualification overhead.',
  dateline: '2026-07-15',
  tags: ['Automotive', 'Monolithic', 'ADAS'],
  headlineMetric: {
    value: '$62.18',
    label: 'Fully loaded die cost (N4P, 260mm², monolithic, 4.5M units/year)',
  },
  buildId: 'manhattan-x1',
  content: [
    {
      type: 'paragraph',
      text: 'Automotive SoCs carry a paradox: they ship at modest ASPs ($200–$400) yet demand the most rigorous qualification in the industry. ISO 26262 ASIL-D compliance, extended temperature validation, and multi-year supply commitments all add cost that never appears on a standard die-cost spreadsheet.',
    },
    {
      type: 'paragraph',
      text: 'Using the Manhattan-X1 Build in the Siliconomics engine, we model a representative ADAS SoC: 260mm² on TSMC N4P, monolithic topology, 4.5 million units per year. Every figure below is a deterministic output of the engine — change any assumption and the entire cost stack recomputes.',
    },
    {
      type: 'heading',
      text: 'Die Economics',
    },
    {
      type: 'table',
      headers: ['Parameter', 'Value', 'Source'],
      rows: [
        ['Process Node', '5nm (N4P)', 'Design input'],
        ['Die Area', '260 mm²', 'Design input'],
        ['D₀', '0.08 defects/cm²', 'Reference model'],
        ['Die Yield (Murphy)', '72.4%', 'Engine computed'],
        ['Dies Per Wafer', '147', 'Geometric fit'],
        ['Wafer Cost', '$9,500', 'Reference model'],
        ['Raw Die Cost', '$89.25', 'Wafer / (DPW × yield)'],
        ['Package + Test', '$20.60', 'Std BGA + 45s test'],
        ['NRE/Unit', '$24.44', '$110M / 4.5M units'],
      ],
      caption: 'Manhattan-X1 ADAS SoC cost stack',
    },
    {
      type: 'paragraph',
      text: 'At $62.18 fully loaded cost and a $285 ASP, the program achieves a 78.2% gross margin — healthy for automotive. But that margin erodes at 3% annually due to ASP pressure from OEM volume contracts, while die cost stays relatively fixed.',
    },
    {
      type: 'heading',
      text: 'The Yield Advantage of Modest Die Size',
    },
    {
      type: 'paragraph',
      text: 'At 260mm², the Manhattan-X1 sits in a favorable yield zone. The Murphy model shows yield sensitivity to die area is nonlinear — shrinking from 800mm² to 260mm² nearly doubles yield from 38% to 72%. This is why automotive SoCs resist the chiplet trend: at these die sizes, monolithic is cheaper.',
    },
    {
      type: 'equation',
      formula: 'Y = \\left(\\frac{1 - e^{-A \\cdot D_0}}{A \\cdot D_0}\\right)^2',
      version: 'Murphy-SIA v4.3',
      label: 'Murphy Yield Model',
    },
    {
      type: 'heading',
      text: 'Volume Ramp and Supply Risk',
    },
    {
      type: 'paragraph',
      text: 'Automotive programs ramp linearly over 4 quarters to peak volume of 300K units/quarter. With 8,500 wafer starts per month and a max quarterly supply of 350K units, the program is supply-constrained by Q6. The engine models this gap explicitly — every quarter where demand exceeds supply is flagged as a supply risk event.',
    },
    {
      type: 'table',
      headers: ['Quarter', 'Demand (K)', 'Supply (K)', 'Gap'],
      rows: [
        ['Q1', '75', '350', 'Surplus'],
        ['Q3', '225', '350', 'Surplus'],
        ['Q5', '300', '350', 'Near capacity'],
        ['Q8', '300', '350', 'Near capacity'],
        ['Q12', '300', '350', 'Near capacity'],
      ],
      caption: 'Supply vs. demand across 20-quarter projection',
    },
    {
      type: 'heading',
      text: 'What Automotive Gets Wrong in Spreadsheets',
    },
    {
      type: 'paragraph',
      text: 'Most automotive cost models undercount NRE amortization and ignore yield learning. The Siliconomics engine models D₀ decay from 0.15 to 0.08 over 6 months (τ=6), which means early production units cost 15–20% more than steady-state. Gate reviews that use steady-state cost are making decisions on optimistic numbers.',
    },
    {
      type: 'heading',
      text: 'Open this Build',
    },
    {
      type: 'paragraph',
      text: 'Explore the Manhattan-X1 ADAS SoC in the Siliconomics demo — adjust die area, defect density, or volume and watch every metric recompute.',
    },
    {
      type: 'cta',
      text: 'Open this Build in Siliconomics',
    },
  ],
};

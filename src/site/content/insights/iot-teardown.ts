import type { InsightArticle } from './types';

export const IOT_TEARDOWN: InsightArticle = {
  slug: 'iot-gateway-volume-economics',
  title: 'Can a $18.50 IoT chip make money at 40 million units? The math says yes — barely',
  description: 'A deterministic teardown of the Brooklyn-A2 IoT gateway SoC: high-volume, low-ASP, and the yield floor that makes it work.',
  dateline: '2026-07-22',
  tags: ['IoT', 'High Volume', 'Edge'],
  headlineMetric: {
    value: '$6.12',
    label: 'Fully loaded die cost (N7, 65mm², monolithic, 40M units/year)',
  },
  buildId: 'brooklyn-a2',
  content: [
    {
      type: 'paragraph',
      text: 'Consumer IoT is a margin game. At an $18.50 ASP and 40 million units per year, the Brooklyn-A2 IoT gateway needs die costs below $7 to survive OEM pricing pressure. The question isn\'t whether the chip works — it\'s whether the economics close.',
    },
    {
      type: 'paragraph',
      text: 'The Siliconomics engine models the Brooklyn-A2 on TSMC N7 at 65mm² — a mature node with low defect density and proven supply. Every number below is a deterministic output. Change the volume assumption and the NRE amortization shifts; change the node and yield changes; the engine recomputes everything.',
    },
    {
      type: 'heading',
      text: 'The Cost Floor',
    },
    {
      type: 'table',
      headers: ['Parameter', 'Value', 'Source'],
      rows: [
        ['Process Node', '7nm', 'Design input'],
        ['Die Area', '65 mm²', 'Design input'],
        ['D₀', '0.04 defects/cm²', 'Reference model (mature)'],
        ['Die Yield (Murphy)', '94.8%', 'Engine computed'],
        ['Dies Per Wafer', '624', 'Geometric fit'],
        ['Wafer Cost', '$5,500', 'Reference model'],
        ['Raw Die Cost', '$9.29', 'Wafer / (DPW × yield)'],
        ['Package + Test', '$2.40', 'Std pkg + 12s test'],
        ['NRE/Unit', '$0.88', '$35M / 40M units'],
      ],
      caption: 'Brooklyn-A2 IoT Gateway cost stack',
    },
    {
      type: 'paragraph',
      text: 'At $6.12 fully loaded cost and $18.50 ASP, gross margin is 66.9%. That looks comfortable — until you factor in 8% annual ASP erosion. By year 3, ASP drops to $14.40 while die cost stays near $6. Margin compresses to 58%. By year 5, it\'s below 50%.',
    },
    {
      type: 'heading',
      text: 'Why N7 and Not N5',
    },
    {
      type: 'paragraph',
      text: 'Moving to N5 would shrink the die to ~40mm² and improve yield to ~97%. But wafer cost jumps from $5,500 to $9,500 — and at 40mm², the DPW gain doesn\'t compensate. The engine computes N5 die cost at $7.84 vs N7 at $6.12. For a cost-sensitive IoT chip, the mature node wins.',
    },
    {
      type: 'equation',
      formula: 'C_{unit} = \\frac{C_{wafer}}{DPW \\cdot Y} + C_{pkg+test} + \\frac{C_{NRE}}{V}',
      version: 'SIA-Cost-2026',
      label: 'Unit Cost Equation',
    },
    {
      type: 'heading',
      text: 'The Volume Sensitivity',
    },
    {
      type: 'paragraph',
      text: 'IoT economics are uniquely volume-sensitive because NRE ($35M) amortizes across the entire production run. At 40M units, NRE adds $0.88/unit. At 10M units, it\'s $3.50/unit — a 42% cost increase that wipes out margin. This is why IoT programs live or die on volume forecasts.',
    },
    {
      type: 'table',
      headers: ['Annual Volume', 'NRE/Unit', 'Total Cost', 'Margin @ $18.50'],
      rows: [
        ['5M', '$7.00', '$12.29', '33.6%'],
        ['10M', '$3.50', '$8.79', '52.5%'],
        ['20M', '$1.75', '$7.04', '62.0%'],
        ['40M', '$0.88', '$6.12', '66.9%'],
        ['80M', '$0.44', '$5.68', '69.3%'],
      ],
      caption: 'Volume sensitivity — NRE amortization drives margin at low volumes',
    },
    {
      type: 'heading',
      text: 'Bell-Curve Volume Allocation',
    },
    {
      type: 'paragraph',
      text: 'Unlike datacenter builds that ramp linearly, IoT programs follow a bell-curve demand pattern: slow start, peak at mid-life, then taper. The Brooklyn-A2 peaks at 2.5M units/quarter in Q8–Q12, then declines. The engine models this explicitly — revenue peaks before cost reduction from yield learning is fully captured.',
    },
    {
      type: 'heading',
      text: 'Open this Build',
    },
    {
      type: 'paragraph',
      text: 'Explore the Brooklyn-A2 IoT Gateway — adjust volume, ASP erosion, or process node and see how the economics shift.',
    },
    {
      type: 'cta',
      text: 'Open this Build in Siliconomics',
    },
  ],
};

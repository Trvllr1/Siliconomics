export const PLATFORM_SECTIONS = [
  {
    title: 'Build Workspace',
    description: 'Configure every parameter of a silicon program: process node, die area, defect density, wafer cost, packaging, test, volume. All inputs have units, ranges, and reference-model defaults.',
    capabilities: [
      'Full DesignModel editor with validation and ranges',
      'Reference model binding — foundry, packaging, labor',
      'Real-time metric computation on every keystroke',
      'Version history and branching for scenario exploration',
    ],
  },
  {
    title: 'Explainability',
    description: 'Every metric carries a calculation trace: the equation, its inputs with values and sources, the reference model version, and the data vintage. Hover any number to see its full provenance.',
    capabilities: [
      'Trace popover on every metric card',
      'Formula library with versioned equations',
      'Data vintage stamps on all reference data',
      'Audit export with full calculation path',
    ],
  },
  {
    title: 'Time-Dimension Modeling',
    description: 'Static cost models hide the program reality. Add a quarterly time axis: yield-learning curves, volume ramps, ASP erosion, respin scenarios, supply-vs-demand reconciliation.',
    capabilities: [
      'D0 yield-learning curve (initial → mature, with tau)',
      'Volume ramp: linear, S-curve, or flat profiles',
      'ASP erosion with annual percentage',
      'Respin simulation with cost, schedule, and yield impact',
    ],
  },
  {
    title: 'Comparison',
    description: 'Side-by-side comparison of any two Builds. Differences are highlighted — not similarities. Monolithic vs chiplet. N5 vs N3. High-volume vs low-volume.',
    capabilities: [
      'Side-by-side metric rows with delta highlighting',
      'Architecture BOM comparison',
      'Chart overlay for program projections',
      'Export comparison report',
    ],
  },
  {
    title: 'Decision Center',
    description: 'Record decisions with full context: which Builds were compared, who approved, the rationale, and follow-up actions. Every decision is timestamped and linked to the frozen Build snapshot.',
    capabilities: [
      'Decision log with audit trail',
      'Alert rules and threshold monitoring',
      'Status workflow: Draft → Technical Review → Financial Review → Program Review → Approved',
      'Meeting Mode for board presentation',
    ],
  },
  {
    title: 'Reports & Exports',
    description: 'PDF, CSV, and JSON exports. Every export carries a provenance stamp: engine version, reference data vintage, formula set, and export timestamp.',
    capabilities: [
      'Executive Briefing PDF with program summary',
      'CSV export of all metrics and projections',
      'JSON export for pipeline integration',
      'Decision package with full audit trail',
    ],
  },
] as const;

export const METHODOLOGY_SECTIONS = [
  {
    id: 'determinism',
    title: 'Determinism',
    content: 'Siliconomics computes the same output for the same input, every time. There is no randomness, no Monte Carlo, no hidden state. This is the foundation of auditability.\n\nThe equivalence theorem: when TimeModel is absent, the engine produces a single aggregated quarter that exactly matches the static lifetime metrics. The time-dimension model is a decomposition, not a different answer.',
    equation: 'f(x) = f(x) \\quad \\forall x',
    equationVersion: 'Constitution Art. III',
  },
  {
    id: 'murphy-yield',
    title: 'Murphy Yield Model',
    content: 'We use Murphy\'s yield model. D0 is defect density in defects/cm². The model accounts for the probability distribution of defect counts across a die of area A. Murphy\'s model is the industry standard for mature-node yield estimation and is conservative compared to Poisson for large-area dies.',
    equation: 'Y = \\left(\\frac{1 - e^{-A \\cdot D_0}}{A \\cdot D_0}\\right)^2',
    equationVersion: 'Murphy-SIA v4.3',
  },
  {
    id: 'dpw',
    title: 'Dies Per Wafer',
    content: 'For a 300mm wafer (d=300). The first term is the ideal area ratio; the second term subtracts edge loss. This is the standard semi-empirical approximation used in the SIA cost model.',
    equation: 'DPW = \\frac{\\pi d^2}{4A} - \\frac{\\pi d}{\\sqrt{2A}}',
    equationVersion: 'SIA-Cost-2026',
  },
  {
    id: 'cost-equations',
    title: 'Cost Equations',
    content: 'All cost equations follow the SIA semiconductor cost model conventions. Each formula is versioned and documented in the Formula Library.',
    equation: 'C_{unit} = \\frac{C_{wafer}}{DPW \\cdot Y} + C_{pkg+test} + \\frac{C_{NRE}}{V}',
    equationVersion: 'SIA-Cost-2026',
  },
  {
    id: 'reference-data',
    title: 'Reference Data Policy',
    content: 'All reference models and commodity prices are sourced from public, analyst, or published-list-price sources. Every data point carries a confidence rating and vintage date. No confidential foundry quotes. No NDA-restricted data.\n\nReference models are versioned and independently verified. Users in Team mode can load their own reference data under their own NDA coverage.',
  },
  {
    id: 'golden-tests',
    title: 'Golden Test Regime',
    content: '93 deterministic tests lock every engine output. Changing an equation changes exactly the tests it should. Regression is impossible to miss.\n\nTests cover: DPW calculation (10 cases), Murphy yield (12 cases), cost stack (15 cases), time projection (20 cases), edge cases (16 cases), comparison engine (10 cases), and export formatting (10 cases).',
  },
  {
    id: 'what-we-dont-do',
    title: 'What We Don\'t Do',
    content: 'No Monte Carlo simulation. No random variables. No stochastic processes. No AI-generated numbers. No hidden adjustments. No black-box models.\n\nBring Your Own Assumptions (BYOA) lets a team supply private reference data, such as foundry quotes and packaging bids. It changes the inputs, not the calculation method.\n\nEvery output is the result of a deterministic equation chain that can be inspected, audited, and reproduced independently.',
  },
] as const;

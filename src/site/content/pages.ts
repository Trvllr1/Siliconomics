export const SITE = {
  name: 'Siliconomics',
  tagline: 'The decision system for silicon economics',
  version: 'MANHATTAN v1.0',
  oneLiner: 'Siliconomics is the decision system for silicon economics — deterministic, auditable program modeling for teams making $100M+ chip decisions without $100M of tribal knowledge.',
} as const;

export const NAV_ITEMS = [
  { label: 'Platform', href: '/platform' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Methodology', href: '/methodology' },
  { label: 'Insights', href: '/insights' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Trust', href: '/trust' },
] as const;

export const SOLUTION_AUDIENCES = [
  {
    title: 'Silicon leadership',
    decision: 'Choose a node, architecture, or packaging path before the program cost becomes fixed.',
    evidence: 'Compare alternatives with yield, cost, schedule, and sensitivity tied to the same Build.',
  },
  {
    title: 'Manufacturing and operations',
    decision: 'Make yield, capacity, packaging, and supply exposure visible before a gate review.',
    evidence: 'Trace each operational assumption through its impact on unit economics and program risk.',
  },
  {
    title: 'Finance and program leadership',
    decision: 'Turn technical assumptions into a defensible program view.',
    evidence: 'Model quarterly cash flow, ASP erosion, ramp shape, respin exposure, and break-even timing.',
  },
  {
    title: 'Design services and deep-tech investors',
    decision: 'Pressure-test a silicon program without relying on a one-off spreadsheet.',
    evidence: 'Review versioned assumptions, reproducible outputs, and the reasoning behind each recommendation.',
  },
] as const;

export const STAKEHOLDER_SOLUTIONS = [
  {
    slug: 'silicon-architecture',
    navLabel: 'Silicon architecture',
    eyebrow: 'For silicon architects',
    colorAccent: '#00BFA6',
    title: 'Make architecture tradeoffs legible before they become expensive.',
    summary: 'Connect node, die, topology, yield, and packaging choices to the program consequences the whole team must own.',
    decision: 'Choose an architecture, process node, or packaging path with the yield, cost, and ramp consequences visible from the first review.',
    gap: [
      'Architecture decisions carry full physical feasibility data — but zero economic visibility into what they cost the program.',
      'No system connects "die area + node + packaging choice" to "unit cost + margin + break-even" deterministically.',
      'Cost modeling lives in personal spreadsheets with assumed wafer prices, no yield model, and no packaging breakdown.',
      'The Architecture Review Board receives a narrative recommendation — never a reproducible computation.',
    ],
    whatSilProvides: 'Siliconomics is the missing economic computation layer. Architecture choices produce a Build with traced cost, yield, and packaging consequences — connected to the same engineering parameters you already work with. The review board sees computation, not persuasion.',
    workflow: [
      { step: 'Create a Build', outcome: 'Set process node, die area, topology, and packaging path.' },
      { step: 'See unit economics immediately', outcome: 'Cost, yield, and margin trace back to every input you set.' },
      { step: 'Branch alternatives', outcome: 'Compare monolithic vs chiplet, N5 vs N3, fan-out vs 2.5D — same assumptions, different paths.' },
      { step: 'Run the comparison', outcome: 'Side-by-side deltas across yield, unit cost, packaging, and program timeline.' },
      { step: 'Export the decision package', outcome: 'A frozen, versioned record with full provenance for the Architecture Review Board.' },
    ],
    personaValue: [
      'Compare monolithic and chiplet approaches against the same Build assumptions.',
      'Trace die area, defect density, yield, packaging, and test inputs to unit economics.',
      'Branch alternatives without overwriting the design basis under review.',
    ],
    teamValue: 'Give manufacturing, finance, and program leads a versioned explanation of what the architecture decision changes and why.',
    heroVariant: 'architect' as const,
    byoa: {
      headline: 'Load your foundry quotes. See your actual economics.',
      description: 'Platform defaults use published list prices. In Team mode, load your NDA-covered wafer pricing, actual D0 data, packaging bids, and NRE terms. The engine computes on your numbers — same deterministic method, your private inputs.',
      examples: [
        'Override wafer cost with your contracted foundry price',
        'Set D0 from your actual lot data instead of industry averages',
        'Load packaging bids from your OSAT shortlist',
        'Enter your NRE terms to see true program break-even',
      ],
    },
  },
  {
    slug: 'manufacturing-operations',
    navLabel: 'Manufacturing & operations',
    eyebrow: 'For manufacturing and operations leaders',
    colorAccent: '#FBBF24',
    title: 'Turn yield, capacity, and packaging constraints into a shared program view.',
    summary: 'Make the operational assumptions behind a silicon program concrete before a gate review asks the team to defend them.',
    decision: 'Assess yield learning, supply exposure, packaging choices, and volume readiness before they become schedule or margin surprises.',
    gap: [
      'Yield data, capacity plans, packaging costs, and test costs live in separate systems with no economic connection between them.',
      'No single system shows what a yield assumption change means for unit cost, program margin, or break-even timing.',
      'Operational risk — yield miss, supply shortfall, packaging delay — is communicated as narrative in meetings, not quantified program impact.',
      'The manufacturing leader cannot show engineering or finance what the operational plan means commercially without rebuilding the analysis from scratch.',
    ],
    whatSilProvides: 'One Build where yield learning, wafer cost, packaging, and test all feed the same deterministic computation. Change a yield assumption — unit cost, margin, and break-even move in real time. Supply-versus-demand is visible across 20 quarters, not buried in a disconnected spreadsheet.',
    workflow: [
      { step: 'Set manufacturing parameters', outcome: 'D0, yield learning rate, wafer cost, OSAT options, test flow — all in one place.' },
      { step: 'Model yield ramp scenarios', outcome: 'See how aggressive vs conservative yield learning changes the program economics.' },
      { step: 'Quantify supply constraints', outcome: 'Supply-versus-demand mapped across the 20-quarter program timeline.' },
      { step: 'Expose operational risk', outcome: 'Every risk assumption traces to its impact on unit cost, margin, and schedule.' },
      { step: 'Export for the program gate', outcome: 'Manufacturing risk view with full provenance — auditable by finance and engineering.' },
    ],
    personaValue: [
      'Model yield learning and supply-versus-demand constraints across the program timeline.',
      'See how packaging, test, and wafer assumptions alter fully loaded unit cost.',
      'Expose the assumptions behind operational risk instead of burying them in a spreadsheet.',
    ],
    teamValue: 'Give design and finance a common basis for discussing what the manufacturing plan can support, at what cost, and on what timeline.',
    heroVariant: 'manufacturing' as const,
    byoa: {
      headline: 'Load your yield data. Model your real supply chain.',
      description: 'Replace industry-average yield curves with your actual fab lot data. Load your packaging bids, OSAT quotes, and test costs. The 20-quarter timeline reflects your contracted capacity and your operational reality — not generic benchmarks.',
      examples: [
        'Import yield learning data from your foundry portal',
        'Set packaging costs from actual OSAT bids',
        'Enter your wafer allocation and capacity commitments',
        'Load test flow costs from your production data',
      ],
    },
  },
  {
    slug: 'finance-program',
    navLabel: 'Finance & program',
    eyebrow: 'For finance and program leadership',
    colorAccent: '#D9B45B',
    title: 'Bring technical assumptions into the program plan before the numbers harden.',
    summary: 'Translate engineering choices into a quarterly view of cash, margin, ramp, risk, and break-even timing.',
    decision: 'Evaluate the financial and delivery consequences of a silicon path using the same assumptions the technical team is reviewing.',
    gap: [
      'Engineering assumptions are manually translated into financial projections — no live connection between the technical model and the commercial model.',
      'Program P&L is built from scratch in spreadsheets for each tape-out decision, with no traceability to the engineering inputs that drive it.',
      'Sensitivity analysis is a manual exercise in a separate tab — "what if yield is 5% worse?" takes hours, not seconds.',
      'Board deck numbers drift from engineering reality after the first quarter because the models are not connected.',
    ],
    whatSilProvides: 'Finance sees the same Build that engineering works in. Quarterly P&L, ASP erosion, volume ramp, break-even, and sensitivity sweeps are computed from identical inputs. Change an assumption anywhere — the financial impact is immediate, traceable, and auditable. No reconciliation meetings required.',
    workflow: [
      { step: 'Review Build financials', outcome: 'Quarterly P&L, margin, break-even, and ramp — computed from engineering inputs, not translated.' },
      { step: 'Run sensitivity sweeps', outcome: 'Drag any parameter — yield, volume, ASP — and see financial impact in real time.' },
      { step: 'Set alert thresholds', outcome: 'Margin floor, break-even deadline, volume shortfall — flagged automatically.' },
      { step: 'Compare program alternatives', outcome: 'Side-by-side financial consequences of different technical paths.' },
      { step: 'Export the decision package', outcome: 'Full assumption lineage attached — the board sees exactly where every number comes from.' },
    ],
    personaValue: [
      'Project quarterly P&L, ASP erosion, volume ramp, and break-even timing.',
      'Compare options using expected respin impact and explicit sensitivity sweeps.',
      'Export a traceable decision package instead of reconciling disconnected models.',
    ],
    teamValue: 'Give engineering and operations a direct view of the commercial commitments their assumptions create before the program reaches a gate.',
    heroVariant: 'finance' as const,
    byoa: {
      headline: 'Load your ASP curves and volume terms. The P&L reflects reality.',
      description: 'Replace generic pricing assumptions with your contracted ASP schedules, volume commitments, and wafer terms. Break-even and margin projections use the numbers your board will hold you to — not industry estimates.',
      examples: [
        'Enter your actual ASP erosion schedule from customer contracts',
        'Set volume ramp from committed purchase orders',
        'Load your wafer contract terms (prepay, take-or-pay, flex)',
        'Override labor rates with your actual team costs',
      ],
    },
  },
  {
    slug: 'executive-leadership',
    navLabel: 'Executive leadership',
    eyebrow: 'For executive leadership',
    colorAccent: '#5B9DFF',
    title: 'Review silicon decisions with the evidence behind the recommendation intact.',
    summary: 'Move from slide-level summaries to a decision record that connects technical choices, program exposure, and financial consequence.',
    decision: 'Approve, defer, or challenge a program decision with a reproducible calculation chain and a record of the alternatives considered.',
    gap: [
      'Slide decks present recommended numbers with no traceable origin — "where did this margin come from?" has no defensible answer.',
      'Programs are approved on the basis of pattern-matching and trust, not reproducible evidence.',
      'When a program underperforms, no one can reconstruct what was known and approved at decision time.',
      'There is no audit trail connecting an approval to the specific assumptions and computations that were live at the moment the decision was made.',
    ],
    whatSilProvides: 'Frozen Builds with content hashes. Every number traces to its equation, inputs, and data vintage. The Decision Center records approval or rejection against an immutable computation state. Revisit any decision six months later — the exact evidence is intact, to the cent.',
    workflow: [
      { step: 'Review the Executive Briefing', outcome: 'Auto-generated summary from the Build — key metrics, risks, alternatives considered.' },
      { step: 'Inspect any metric', outcome: 'Click any number to see the full calculation chain — equation, inputs, data vintage.' },
      { step: 'Compare decision branches', outcome: 'See where risk, margin, and timing diverge across the alternatives.' },
      { step: 'Record your decision', outcome: 'Proceed, Hold, or Reject — with rationale, permanently linked to the frozen Build state.' },
      { step: 'Retrieve at any time', outcome: 'The decision record is immutable. Six months later, the same Build produces the same numbers.' },
    ],
    personaValue: [
      'Inspect the assumptions, equations, and data versions behind the key metrics.',
      'Compare decision branches and see where risk, margin, and timing diverge.',
      'Capture approvals and rationale against a frozen Build and exportable evidence package.',
    ],
    teamValue: 'Give every function a durable decision record, reducing rework when assumptions, ownership, or the review team changes.',
    heroVariant: 'executive' as const,
    byoa: {
      headline: 'Your team loaded verified data. Your review is grounded.',
      description: 'When your team uses BYOA, the numbers in your Executive Briefing reflect actual contracted terms — not industry averages. Every metric traces to the specific reference model version and data vintage your team loaded. You know where the numbers come from because the provenance is explicit.',
      examples: [
        'Every metric shows which reference model and version produced it',
        'Provenance stamps distinguish platform defaults from team-loaded data',
        'Frozen Builds lock the exact assumptions at decision time',
        'Audit trail shows when private data was loaded and by whom',
      ],
    },
  },
  {
    slug: 'design-services-investors',
    navLabel: 'Design services & investors',
    eyebrow: 'For design services firms and deep-tech investors',
    colorAccent: '#F87171',
    title: 'Pressure-test a silicon program without inheriting its spreadsheet maze.',
    summary: 'Create a repeatable, auditable view of program assumptions across client engagements or technical diligence.',
    decision: 'Assess whether the engineering, manufacturing, and commercial assumptions hang together before committing capital or a client recommendation.',
    gap: [
      'Every client engagement or diligence starts from zero — no reusable framework for assessing silicon program economics.',
      'Due diligence means requesting the founder\'s spreadsheet and trying to reconstruct assumptions across engineering, manufacturing, and finance.',
      'Deals cannot be compared to each other because every model is bespoke — different structure, different assumptions, different vintage.',
      'Due diligence outputs are static reports that cannot be re-run when assumptions change mid-process.',
    ],
    whatSilProvides: 'A repeatable, deterministic framework. Load program assumptions into a Build — get auditable output. Compare across portfolio engagements using identical methodology. Export decision packages that are portable to co-investors, LPs, or client boards.',
    workflow: [
      { step: 'Create a Build per engagement', outcome: 'One consistent framework for every deal or client program you assess.' },
      { step: 'Load reference data', outcome: 'Public reference models or client-supplied assumptions — versioned and dated.' },
      { step: 'Run scenarios', outcome: 'Sensitivity sweeps, alternative paths, risk quantification — deterministic, not hand-waved.' },
      { step: 'Compare across portfolio', outcome: 'Same methodology, same metrics — across every engagement you\'ve modeled.' },
      { step: 'Export the decision package', outcome: 'Portable reasoning: share with co-investors, LPs, or client boards without rebuilding.' },
    ],
    personaValue: [
      'Compare versioned scenarios without losing the source assumptions behind each option.',
      'Inspect deterministic calculations and reference-data vintage instead of accepting a static answer.',
      'Export a decision package that makes the reasoning portable across stakeholders.',
    ],
    teamValue: 'Give technical and commercial reviewers one inspectable model rather than parallel interpretations of the same silicon program.',
    heroVariant: 'services' as const,
    byoa: {
      headline: 'Load client assumptions. Assess with your framework.',
      description: 'Each engagement uses a fresh Build with client-supplied or public reference data. Compare deals using the same methodology — platform defaults for quick assessments, client-provided numbers for deep diligence. Every output is reproducible and portable.',
      examples: [
        'Load client-provided foundry quotes into their engagement Build',
        'Use platform defaults for rapid initial screening',
        'Compare portfolio deals using identical reference methodology',
        'Re-run any assessment when client assumptions change mid-process',
      ],
    },
  },
] as const;

export const INVESTOR_MILESTONES = [
  'Earn design-partner adoption on active silicon decisions.',
  'Have a Siliconomics Build cited in a real gate review.',
  'Convert successful PoCs into the first commercial contracts.',
  'Operate a repeatable reference-data refresh and customer-overlay workflow.',
] as const;

export const HERO = {
  eyebrow: 'DETERMINISTIC ENGINEERING ECONOMICS',
  headline: 'The decision system for silicon economics.',
  ctaDemo: 'Launch free demo',
  ctaMethodology: 'Explore the platform',
  microProof: 'Illustrative Build data. Deterministic engine output. Full provenance.',
} as const;

export const PILLARS = [
  {
    title: 'Deterministic. Every time.',
    description: 'The engine computes — it does not estimate. 93 golden tests lock every formula. Same inputs, same outputs, on every run, for every user.',
    proof: 'Every metric traces to Murphy\'s yield model and SIA cost equations. No Monte Carlo. No hidden state.',
  },
  {
    title: 'Every number has a lineage.',
    description: 'Hover any metric: see the equation, every input value, the reference model version, and the data vintage. Nothing is asserted without proof.',
    proof: 'Hover any metric to see its equation, inputs, reference model, and version stamp.',
  },
  {
    title: 'Decisions are permanent record.',
    description: 'Frozen Builds, content-hashed snapshots, a timestamped decision log. Your gate review is reproducible six months later — to the cent.',
    proof: 'Every commit is versioned. Every approval is recorded. Every export carries provenance.',
  },
  {
    title: '20 quarters. Not a single quarter.',
    description: 'Yield learning, ASP erosion, volume ramps, respin risk, supply constraints — modeled across a full program lifecycle, not frozen in time.',
    proof: 'Time-dimension modeling turns a static cost estimate into a multi-year program view.',
  },
] as const;

export const ANTI_POSITIONING = [
  'Not EDA',
  'Not a foundry quote',
  'Not a spreadsheet',
  'Not AI-generated numbers',
] as const;

export const MARKET_POSITIONING = {
  headline: 'Where Siliconomics fits.',
  subhead: 'They tell you what the industry looks like. Siliconomics tells you what your program costs.',
  comparisons: [
    { category: 'Research', names: 'SemiAnalysis · TechInsights · Gartner', theyDo: 'Inform the market context', youGet: 'Compute the program-specific answer' },
    { category: 'EDA', names: 'Synopsys · Cadence · Ansys', theyDo: 'Optimize physical silicon', youGet: 'Optimize the business decision around silicon' },
    { category: 'Consulting', names: 'McKinsey Semi · BCG · Bain', theyDo: 'Advise on strategy once', youGet: 'Own the model that outlives the engagement' },
  ],
} as const;

export const PROBLEM_PANELS = [
  {
    title: 'Spreadsheet sprawl',
    description: 'Fifty tabs, unnamed cells, broken links, one person who "knows where the numbers live."',
  },
  {
    title: 'Tribal knowledge',
    description: 'The yield model lives in a VP\'s head. The cost basis walked out the door with a contractor.',
  },
  {
    title: 'Un-auditable board numbers',
    description: 'A slide says "$47.23." No source. No equation. No way to defend it in a gate review.',
  },
] as const;

export const WORKFLOW_STEPS = [
  { number: 1, title: 'Intent', description: 'Define the program objective, target market, and key constraints.' },
  { number: 2, title: 'Model', description: 'Select or customize a reference model — foundry, packaging, labor.' },
  { number: 3, title: 'Build', description: 'Configure the design parameters: node, area, yield assumptions, volume.' },
  { number: 4, title: 'Compute', description: 'The deterministic engine produces all metrics instantly.' },
  { number: 5, title: 'Understand', description: 'Inspect traces, provenance stamps, and sensitivity drivers.' },
  { number: 6, title: 'Compare', description: 'Side-by-side monolithic vs chiplet, node alternatives, volume scenarios.' },
  { number: 7, title: 'Decide', description: 'Record approvals, flag risks, export a decision package.' },
  { number: 8, title: 'Export', description: 'PDF, CSV, JSON — every export carries full provenance and vintage.' },
] as const;

export const PARTNER_OFFER = {
  headline: 'Design Partner Program',
  body: '6-month free partnership — full platform, direct founder access, your reference assumptions loaded.',
  criteria: [
    'Active silicon decision within 2 quarters',
    'Exec sponsor attending one review per month',
    'Willingness to compare outputs against internal numbers',
    'No conflict with another partner',
  ],
  successMetric: 'A Siliconomics Build cited in your gate review.',
  cta: 'Apply for partnership',
} as const;

export const CHIPPIE_DESCRIPTION = {
  heading: 'Chippie, honestly',
  body: 'An AI advisor that reads your Builds. It cites engine numbers; it never produces them.',
} as const;

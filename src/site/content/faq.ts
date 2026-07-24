export const PRICING_FAQ = [
  {
    q: 'Our spreadsheet already does this',
    a: 'A spreadsheet models one scenario. Siliconomics models a program: 20-quarter P&L with yield learning, ASP erosion, respin risk, and supply-vs-demand constraints. Every number carries a trace to its source equation and reference data vintage.',
  },
  {
    q: 'You don\'t have our foundry pricing',
    a: 'We ship industry-standard reference models (Murphy yield, SIA cost equation, published foundry list prices). In Team mode, Bring Your Own Assumptions (BYOA) lets you load your own reference data — foundry quotes, packaging bids, labor rates — and the engine computes on your numbers. BYOA changes the inputs, not the calculation method: the same inputs, formulas, and data versions always reproduce the same output.',
  },
  {
    q: 'Is this AI-generated?',
    a: 'No. Every number is produced by a deterministic math engine — 93 golden-test-locked equations. Chippie, our AI advisor, reads completed Builds and cites engine numbers. It never computes, generates, or fabricates metrics.',
  },
  {
    q: 'Is it secure?',
    a: 'Demo mode runs entirely in your browser — data stays in localStorage, nothing is transmitted. Team mode uses tenant-isolated Postgres, Clerk authentication, and owner-scoped data access. See /trust for the full data-handling table.',
  },
  {
    q: 'Can I try it without talking to sales?',
    a: 'Yes. Launch Demo is free, ungated, and requires zero signup. Your data stays in your browser. No forms, no calls, no follow-up.',
  },
] as const;

# Siliconomics — GTM & Design-Partner Program Brief

### Version 1.0 — 2026-07-17

---

## 1. Positioning (one sentence, use everywhere)

> **Siliconomics is the decision system for silicon economics — deterministic, auditable program modeling for teams making $100M+ chip decisions without $100M of tribal knowledge.**

Supporting pillars (each maps to a shipped capability):
- **"Computes, doesn't guess"** — deterministic engine, golden-test-locked, formula provenance (Constitution Art. II — positioning gold)
- **"Every number defends itself"** — ExplainabilityPanel, CalculationTrace, audit JSON export, data provenance/vintage (P1)
- **"Decisions with a paper trail"** — immutable frozen Builds, content hashes, decision log (P2)
- **"Programs, not snapshots"** — quarterly P&L, yield ramp, ASP erosion, respin risk, supply-vs-demand constraint (P3)

Anti-positioning (say what you're not): not EDA, not a foundry quote, not a consultant's one-time spreadsheet, not AI-generated numbers.

---

## 2. ICP — three tiers, in priority order

| Tier | Who | Why they buy | Entry persona |
|---|---|---|---|
| 1 | First-silicon system companies — AI hardware startups, hyperscaler-adjacent teams, auto OEM silicon divisions | Making the chiplet-vs-monolithic / node / packaging call right now, with no institutional cost model. Highest pain, fastest close. | VP Silicon / Chief Architect |
| 2 | Tier-2 fabless & chiplet-era SMEs | Have spreadsheets but need auditability; need board-credible program reviews. | Program Director / CFO |
| 3 | Silicon design-services firms & deep-tech VCs | Force multipliers: one seat, many client engagements / diligences. References. | Engagement lead / Partner |

**Explicitly not targets for v1:** NVIDIA/AMD/Qualcomm-class (internal models, 18-month procurement), foundries (conflict with data neutrality), academia (free-tier later).

---

## 3. Design-Partner Program (core motion, next 2 quarters)

**Goal:** 5 active design partners → ≥3 convert to paid → 1 citable case study.

**The offer:** 6-month free partnership. They get the full platform + direct founder access + their own reference-data assumptions loaded. You get: weekly feedback, validation of cost assumptions against real-world numbers, a testimonial/case study on conversion, and first right to a paid annual.

**Selection criteria (all four required):**
1. Active silicon program decision in the next 2 quarters
2. An exec sponsor who will sit in one review per month
3. Willingness to compare model outputs against their internal numbers
4. Not a direct competitor of another partner

**Success metric per partner (the only one that matters):** *a Siliconomics Build is cited in a real gate review or board deck.* That is the PMF event. Track it explicitly.

**Sourcing:** founder network + Chiplet Summit / OCP Summit / DAC corridors + content engine (§5). Target list of 25, expect 5 conversions.

---

## 4. Pricing

- **Demo mode (anonymous, localStorage):** free top-of-funnel forever. P2's dual-mode adapter made this a deliberate GTM asset — anyone can model a chip in 5 minutes with zero signup. Never gate it.
- **Team license: $36k/yr anchor** (range $25–60k by size). Unlimited Builds, 5 seats, data-maintenance subscription included. Anchored between a TechInsights-style data license (~$15–25k) and the consulting engagement you replace (~$150k+). Renewal anchor = the quarterly reference-data refresh (P1 built the machinery; the data program is the recurring value).
- **Services firms/VC tier: $60k/yr** multi-engagement license.
- No per-seat nickel-and-diming at this stage — friction kills design-partner-to-paid conversion.

---

## 5. Content engine (the credibility channel)

This market is influenced by exactly one thing: **being visibly right about silicon economics in public.** SemiAnalysis built a business on it.

- Monthly "silicon economics teardown" — e.g., "What does an MI400-class package actually cost? A deterministic model" — built *in* Siliconomics, with the interactive Build linked in demo mode. Each post is both thought leadership and a product demo.
- Publish the methodology (Murphy yield, KGD semantics, CoWoS model) openly. The math is public anyway; the moat is data + workflow. Openness is the trust strategy.
- Venue targets: LinkedIn silicon community, HN, Chiplet Summit talk submission.

---

## 6. Anticipated objections

| Objection | Answer |
|---|---|
| "Our spreadsheet already does this" | "Can it show an auditor which formula version and data vintage produced the number your board approved last March?" (frozen Builds + provenance) |
| "Your cost numbers can't be right — you don't have our foundry pricing" | "Every assumption is sourced, dated, confidence-rated, and editable — load your NDA numbers locally; we never see them. The model, not the constants, is the product." |
| "Is this AI-generated?" | "No. Deterministic, test-locked computation. The AI advisor only reads results; it never produces numbers." (Constitution Art. II as a sales weapon) |
| "Security? You want our unannounced chip specs" | Demo mode is fully local; hosted mode needs SOC 2 roadmap statement and data-isolation summary. **Flag: 1-page security posture doc is a prerequisite for Tier-1 conversations — small task, high blocking risk.** |

---

## 7. Data-compliance stance (also a selling point)

Reference data ships exclusively from public/analyst-published estimates — never NDA-covered foundry pricing. Customers overlay their private numbers locally/in their tenant; Siliconomics never ingests them. This keeps the company clean with TSMC/Samsung NDAs, makes procurement's vendor review trivial, and differentiates from consultants who launder NDA data.

---

## 8. PMF measurement — go/no-go gates

| Gate | Signal | If missed |
|---|---|---|
| Q+1 | 5 design partners signed, ≥3 weekly-active | Wrong ICP tier — rotate to Tier 3 (services firms) |
| Q+2 | ≥2 "cited in a real gate review" events | Feature gap — likely data credibility or collaboration; interview and re-prioritize |
| Q+3 | ≥3 paid conversions at ≥$25k | Pricing/packaging problem, not product |

---

## 9. Immediate action sequence

1. Draft the 25-account target list; book Chiplet Summit / OCP presence.
2. **Priority 4 (docs refresh) — COMPLETE.** All 7 governing documents reconciled with shipped code.
3. **Priority 5 — Reference-model editing/overlay.** The one product gap GTM exposes: reference models are read-only; partners must overlay private data. Scoped and ready for implementation.
4. **Security posture one-pager** — prerequisite for Tier-1 conversations.
5. Design-partner agreement term sheet outline; first teardown-post model; target-list scoring.

---

**Decisions embedded:** design-partner-led over self-serve-led (deal size and trust bar demand it); free 6-month partnership over discounted paid (speed of learning > early revenue); open methodology (data+workflow moat, not math moat).

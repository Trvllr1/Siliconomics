# Siliconomics Architecture Implementation Brief

## Version 2.0 — Amended 2026-07-17

### Purpose

This document defines the architecture of the standalone Siliconomics platform.

Siliconomics is a deterministic engineering economics platform for the semiconductor industry. Its purpose is to unify semiconductor engineering mathematics, manufacturing economics, program economics, and financial intelligence into a single Build-centric platform.

The standalone product is architecturally derived from GSAF Studio but begins at the Build layer, omitting the EAVA engineering workflow (Explore, Architect, Verify, Assure).

---

# Core Architectural Philosophy

Siliconomics is **not** a spreadsheet replacement.

Siliconomics is **not** a financial calculator.

Siliconomics is an engineering intelligence platform.

Everything inside the platform revolves around immutable engineering Builds.

Every calculation, visualization, report, comparison, export, and financial analysis is generated from a Build.

---

# Build-Centric Object Model

The Build is the primary object within Siliconomics.

Each Build represents one complete engineering scenario.

A Build contains:

* Design parameters (DesignModel)
* Technology assumptions
* Manufacturing assumptions
* Formula version
* Engineering assumptions
* Commercial assumptions
* Computed results (Snapshot)
* Architecture blocks
* Data provenance (DataVintage)
* Time-dimension modeling (TimeModel, optional)

Once frozen (status promoted past Draft), a Build is immutable. If the user changes any input parameter, Siliconomics generates a new Build via the "Branch Variant" (newVersion) flow rather than modifying the previous one. This provides complete traceability, reproducibility, and comparison between engineering scenarios.

---

# Computational Engine

Implemented as **TypeScript pure functions** in dedicated, versioned, golden-test-locked modules:

- `src/utils/mathEngine.ts` — core deterministic models (Murphy yield, DPW, die cost, NRE amortization, margin, break-even, ROI, CoWoS/interposer cost, supply-chain risk, MPW shuttle pricing). Formula-version-pinned per Build.
- `src/utils/timeEngine.ts` — time-dimension modeling (D0 yield-learning curves, ASP erosion, volume ramp, supply-vs-demand reconciliation, respin risk scenarios, quarterly P&L with cumulative cash flow, break-even quarter).
- `src/utils/SensitivityAnalysis.ts` — parameter sweeps for die area, defect density, ASP.

**Engine rules:**
- Accept Build definitions as inputs; return structured Snapshot results.
- Maintain no persistent application state.
- Never perform user interface logic.
- Never directly manipulate databases.
- Every metric includes a `CalculationTrace` with equation, inputs, definition, reference model, version, and calculation path.

**Future trigger:** A dedicated server-side compute service (Rust or Go) should be introduced when (1) single-request latency exceeds 500ms, or (2) the engine must consume reference data exceeding 50MB, or (3) multi-threaded sensitivity sweeps are required at scale. Until those triggers fire, the TypeScript engine is the correct architecture — it avoids serialization overhead, keeps the full stack in one language, and enables browser-local demo mode.

---

# Frontend Layer

Implemented as a **Vite + React + TypeScript SPA**, deployed on Vercel.

**Key libraries:**
- `recharts` — all charts (yield curves, cost stacks, sensitivity, time-phased revenue/margin, cumulative cash flow, yield-ramp).
- `lucide-react` — icon system.
- `@clerk/clerk-react` — authentication (optional; degrades gracefully to demo mode).
- `@tanstack/react-query` — API data fetching (when signed in).
- `tailwindcss` — styling.

**Key components:**

| Component | File | Purpose |
|-----------|------|---------|
| DesignBoard | `DesignBoard.tsx` | Primary design-editing surface for the DesignModel; freeze-gated when build is immutable |
| BuildView | `BuildView.tsx` | Five-section collapsible workspace with input knobs + metric cards; includes Program Timeline section |
| ChartsView | `ChartsView.tsx` | Six charts: Murphy yield curve, cost stack, D0 sensitivity, quarterly revenue/margin, cumulative cash flow, yield-ramp |
| AI Advisor | `AiAdvisor.tsx` | Constitutional AI assistant — consumes Builds, never computes |
| ComparisonView | `ComparisonView.tsx` | Side-by-side Build comparison with AI analysis |
| DecisionCenterView | `DecisionCenterView.tsx` | Executive review, decision recording, approval workflow |
| MeetingMode | `MeetingMode.tsx` | Full-screen presentation mode for executive reviews |
| ReviewBoardView | `ReviewBoardView.tsx` | Multi-persona review board (architect, manufacturing, finance, program, executive) |
| SensitivityView | `SensitivityView.tsx` | Tornado chart and interactive sensitivity sweeps |
| ExecutiveBriefing | `ExecutiveBriefing.tsx` | Board-ready executive summary with risk/opportunity analysis |
| CommentsPanel | `CommentsPanel.tsx` | Collaboration threads anchored to metrics |
| CommandPalette | `CommandPalette.tsx` | ⌘K global command palette |
| DashboardView | `DashboardView.tsx` | Dashboard with recent builds, portfolios, activity |
| ExplainabilityPanel | `ExplainabilityPanel.tsx` | Metric drill-down with trace, equation, reference, data provenance |

**Persona system:** Five built-in personas (architect, manufacturing, finance, program, executive) with field-level edit gating via `FIELD_OWNER` in `personaConfig.ts`. Persona affects which sections/fields are editable.

---

# Persistent Data

## Production (Clerk-authenticated)

**Neon Postgres** with **Drizzle ORM** (`db/schema.ts`):

- `users` — Clerk-mapped user records.
- `builds` — Build metadata + serialized DesignModel, dataVintage, timeModel.
- `snapshots` — Computed Snapshot payloads, SHA-256 content-addressed.
- `build_events` — Append-only event log (creation, status transitions, respin branching).
- `decisions` — Append-only decision records with outcome, approver, rationale.
- `comments` — Build-anchored collaboration threads.
- `portfolios` — Build groupings.
- `alert_acks` — Acknowledged alert records.
- `custom_archetypes` — User-registered template archetypes.

Frozen builds (status ≥ TechnicalReview) reject PATCH requests with 409 Conflict. Freeze is enforced server-side via JWT middleware (`api/middleware.ts`).

**API layer:** Vercel serverless functions in `api/*.ts`:
- `api/builds.ts` — GET (list), POST (create), PATCH (update, 409 if frozen).
- `api/status-transition.ts` — Promotes status; freezes at Draft→TechnicalReview.
- `api/new-version.ts` — Creates an unfrozen child Build from a frozen parent.
- `api/decisions.ts` — Append-only decision recording.
- `api/comments.ts` — Build-anchored CRUD.
- `api/snapshots.ts` — GET snapshot by build ID.
- `api/gemini-analyze.ts`, `api/gemini-compare.ts` — Serverless Gemini proxy endpoints (replacing the retired Express `server.ts`).

## Demo Mode (no Clerk / no Postgres)

When Clerk is not configured (`VITE_CLERK_PUBLISHABLE_KEY` unset) or the user is not signed in, the app runs in **demo mode** using `localStorage` (v2-prefixed keys, e.g. `siliconomics_builds_v2`). This is a deliberate GTM feature — zero-infrastructure onboarding.

Adapters are selected via the `StorageAdapter` abstraction:
- `src/data/adapters/storageAdapter.ts` — interface.
- `src/data/adapters/localStorageAdapter.ts` — full localStorage implementation.
- `src/data/adapters/apiAdapter.ts` — fetch-based API client.
- `src/data/adapters/useAdapter.ts` — hook auto-selects local vs API based on auth state.

---

# Mathematical Engine Models (Shipped)

| Model | Function | Formula |
|-------|----------|---------|
| Dies Per Wafer | `calculateDPW(area)` | Geometric 300mm wafer packing with edge loss |
| Murphy Yield | `calculateMurphyYield(area, d0)` | `((1 - e^(-A·D0)) / (A·D0))^2` |
| KGD System Yield (Chiplet) | `computeBuildMetrics` | `coreYield^N × ioYield × interposerYield × pkgYield × testYield` |
| Chiplet Equivalent DPW | `computeBuildMetrics` | `1 / (N/DPW_core + 1/DPW_io)` |
| CoWoS/EMIB Interposer Cost | `computeBuildMetrics` | `(area × costPerMm²) / yield` or bridge pricing |
| MPW Shuttle Economics | `computeBuildMetrics` | Replaces NRE/volume with shuttle-derived equivalents |
| Supply Chain Composite Risk | `computeSupplyChainMetrics` | Weighted score from block-level risk ratings |
| D0 Yield-Learning | `computeD0(q)` | `D0_mature + (D0_initial - D0_mature) × e^(-q/τ)` |
| ASP Erosion | `computeAsp(q)` | `ASP_0 × (1 - erosion%/100)^(q/4)` |
| Volume Ramp | `rampMultiplier(q)` | Linear, S-curve, or flat |
| Supply-Demand Reconciliation | `computeTimeProjection` | `shipped = min(supply × ramp, demand)` |
| Respin Risk | `computeTimeProjection` | 3-outcome: baseline, with-respin, probability-weighted expected |
| Break-Even Quarter | `findBreakEvenQuarter` | `min{ q | cumulativeCashFlow ≥ 0 }` |

---

# Build Immutability

Builds are mutable during Draft status. Once the user transitions a build to TechnicalReview:

1. The DesignModel is SHA-256 content-hashed.
2. A Snapshot is created and stored (server-side, or cached in localStorage).
3. All input fields become read-only (enforced via `canEditField` -> `isFrozen`).
4. The only operations available on a frozen build are:
   - **Branch Variant** (new-version) — creates an unfrozen child Build.
   - **Status transitions** (TechnicalReview → FinancialReview → ProgramReview → Approved).
   - **Cycle back to Draft** via Alert → re-edit.
   - **Decision recording**, **Comments**, **Comparison**.

---

# Formula Library

Every equation in the platform exists as an independently versioned `FormulaEntry` object (`src/data/defaultFormulaLibrary.ts`). Key categories — engineering (8), manufacturing (7), financial (11), program (8). Each records version, description, inputs, outputs, validation references, and affected metrics.

Formula entries added for time-dimension modeling (v3.0): D0 yield-learning, ASP erosion, volume ramp, supply-demand reconciliation, respin risk model, break-even quarter, quarterly P&L.

Builds reference formula versions at computation time — stored in `Build.formulaVersion` (currently `Murphy-SIA-v4.3`).

---

# Reference Model Library

Editable reference datasets (`src/data/`) for technology nodes, wafer costs, packaging costs, labor rates, and commodity prices. Consumption by `computeBuildMetrics` via resolved labor rates, packaging cost models, and supply-chain weights.

---

# Explainability

Every computed metric exposes:
- **Definition** — what the metric represents
- **Equation** — the governing formula (with FormulaEntry reference)
- **Inputs** — current values of contributing parameters
- **CalculationPath** — step-by-step derivation
- **ReferenceModel** — the reference model or standard used
- **Version** — formula version at computation time

Implemented via the `CalculationTrace` interface on every `MetricCardData`.

---

# Scenario Comparison

Users compare multiple immutable Builds via `ComparisonView.tsx`. Comparison covers cost, yield, die count, packaging, NRE, ROI, break-even, and commercial impact. AI-powered comparison available via Gemini proxy (`api/gemini-compare.ts`).

---

# Precision Requirements

All financial values use double-precision floating point with explicit rounding via `round()`. Engineering calculations use floating-point where scientifically appropriate. Monetary values are displayed rounded to 2 decimal places (or 1 for millions); break-even volumes to 3 decimal places.

---

# Deployment

**Current:** Vite build → Vercel. `vercel.json` configures function runtime (Node 22), API rewrites, and CORS headers.

**Environment variables:**
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk frontend API key (optional; demo mode when absent).
- `DATABASE_URL` — Neon Postgres connection string (optional for demo).
- `GEMINI_API_KEY` — Google Gemini API key (optional; AI Advisor uses local mode when absent).
- `CLERK_SECRET_KEY` — Clerk backend secret (required for API auth).
- `CLERK_PUBLISHABLE_KEY` — Clerk frontend API key (server-side reference).

**Commands:**
- `npm run dev` — Vite dev server + API watcher (`npm run dev:api`).
- `npm run build` — Production build.
- `npm run db:generate` — Generate Drizzle migrations.
- `npm run db:migrate` — Apply migrations to Neon.
- `npm run db:push` — Push schema to Neon (dev).

---

# Deferred Architecture

The following technologies were considered but deliberately deferred. Each entry includes the trigger that would justify re-evaluation.

| Technology | Original Role | Revisit Trigger |
|-----------|---------------|-----------------|
| **Rust/Go Compute Engine** | Stateless computation microservice | Engine latency exceeds 500ms per request, or reference data > 50MB |
| **Memgraph (Graph DB)** | Engineering dependency graph | Impact-analysis feature requires > 3 hops of transitive dependency traversal with sub-100ms response |
| **TigerBeetle** | Commercial ledger (quotes, licenses, billing) | Platform ships multi-tenant billing or per-seat licensing |
| **Oracle Cloud (OCI)** | Primary deployment target | Vercel exceeds $200/month in infrastructure costs, or compliance requires on-prem deployment |
| **Docker / Kubernetes** | Service containerization | More than one server-side service is deployed (currently zero — all compute is client-side TypeScript) |
| **PowerPoint Export** | Board-packet generation | Feature request validated by 3+ enterprise pilot customers |
| **NPV / WACC Discounting** | Time-value adjustment on cash flows | Break-even quarter becomes a standard customer ask; see P3 notes for implementation path |

---

# MVP Deliverables — Status

| Deliverable | Status | Implementation |
|-------------|--------|----------------|
| Deterministic computation engine (TypeScript) | Shipped | `mathEngine.ts`, `timeEngine.ts` |
| Build generation + immutability | Shipped | `computeBuildMetrics`, status lifecycle, freeze on TechnicalReview |
| Snapshot generation | Shipped | `Snapshot` interface, metricsList with CalculationTrace |
| Formula Library (versioned) | Shipped | `defaultFormulaLibrary.ts` (34 entries, v1.0–v3.0) |
| Reference Model Library | Shipped | `defaultReferenceModels.ts`, `packagingCostModel.ts`, `defaultCommodityPrices.ts` |
| React frontend | Shipped | 20+ components in `src/components/` |
| React/Next.js frontend | Shipped | Vite + React + TypeScript SPA |
| Build comparison | Shipped | `ComparisonView.tsx` |
| Explainability (per-metric trace) | Shipped | `CalculationTrace` on every MetricCardData |
| Supply chain risk scoring | Shipped | Block-level risk → composite score |
| Architecture BOM + IP cost waterfall | Shipped | Block-level NRE, licenses, royalties |
| CoWoS / advanced packaging | Shipped | CoWoS-S/R/L + EMIB pricing models |
| MPW shuttle economics | Shipped | MPW toggle replaces NRE + volume |
| Time-dimension modeling (P3) | Shipped | `TimeModel`, 20-quarter projections, D0 learning, ASP erosion, ramp, respin |
| DataVintage / reference data freshness | Shipped | `DataVintage` on each Build |
| AI Advisor (constitutional) | Shipped | `AiAdvisor.tsx`, Gemini proxy |
| Decision recording | Shipped | `DecisionCenterView.tsx` |
| Meeting Mode | Shipped | `MeetingMode.tsx` |
| Executive Briefing | Shipped | `ExecutiveBriefing.tsx` |
| Command Palette | Shipped | `CommandPalette.tsx` (⌘K) |
| Multi-persona review board | Shipped | `ReviewBoardView.tsx` |
| Postgres + API persistence | Shipped | Neon + Drizzle + Vercel API routes |
| Clerk authentication | Shipped | Optional; demo mode when absent |
| Dual-mode StorageAdapter | Shipped | localStorage (demo) / API (auth) |
| PDF export | Shipped | `pdfGenerator.ts` |
| Markdown/CSV export | Shipped | `csvGenerator.ts` |
| Machine learning / AI agents | Future | Constitutional AI Advisor shipped; autonomous optimization deferred |
| External data acquisition | Future | Not in scope |
| Memgraph integration | Deferred | See deferred table above |
| TigerBeetle ledger | Deferred | See deferred table above |
| OCI deployment | Deferred | See deferred table above |
| PowerPoint export | Deferred | See deferred table above |
| NPV / WACC discounting | Deferred | See deferred table above |

---

# Engineering Principle

Siliconomics exists to transform deterministic engineering inputs into deterministic engineering and commercial intelligence.

Every feature implemented should reinforce three principles:

1. **Determinism** — same inputs always produce the same outputs.
2. **Explainability** — every metric shows how it was derived.
3. **Reproducibility** — historical Builds always produce identical results.

When evaluating implementation decisions, the preferred architecture is always the one that strengthens these three principles.

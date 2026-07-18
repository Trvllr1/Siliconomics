# Siliconomics Executive Decision Center

## Sidebar Module Specification

### Version 1.1 — Amended 2026-07-17

---

# Purpose

The Executive Decision Center is Siliconomics' dedicated executive workspace.

Its purpose is not to create Builds.

Its purpose is to **consume completed Builds** and transform them into executive-grade decision artifacts.

Where the Build Workspace is for engineers creating and evaluating scenarios, the Executive Decision Center is for engineering leadership, finance, program management, manufacturing leadership, and executive stakeholders to understand, compare, discuss, approve, and archive those scenarios.

It is the boardroom of Siliconomics.

---

# Sidebar Placement

```
Dashboard

Design Models

Builds

Portfolios

Comparisons

──────────────────

Executive Decision Center

──────────────────

Reference Models

Reports

Administration
```

This placement reinforces that executive review occurs after engineering work has produced valid Builds.

---

# Product Philosophy

Engineering teams build.

Executives decide.

The Executive Decision Center exists to bridge those two worlds.

It converts engineering computation into business decisions without hiding the underlying technical evidence.

---

# Primary Functions — Implementation Status

The Executive Decision Center provides six core capabilities, all shipped.

## 1. Executive Briefing — SHIPPED

**File:** `src/components/ExecutiveBriefing.tsx`

Automatically generates board-ready summaries from the active Build. Displays:

- Executive Summary
- Key Findings
- Risks (financial, engineering, manufacturing, program, supply-chain)
- Opportunities
- Recommendation
- Supporting Evidence with metric traces

ASP erosion, supply constraints, and respin-risk scenarios are now backed by the time-dimension engine (`timeEngine.ts`) rather than static placeholder text.

---

## 2. Build Comparison — SHIPPED

**File:** `src/components/ComparisonView.tsx`

Compare any number of completed Builds across:

- Area, Yield, Cost, NRE, ROI, Schedule
- Packaging, Power, Performance
- Manufacturing Risk

AI-powered comparison analysis available via the Chippie briefing proxy (`api/chippie-brief.ts`). Comparisons operate exclusively on immutable Build objects.

---

## 3. Business Impact Analysis — SHIPPED

Every metric card (`MetricCardData`) includes a `CalculationTrace` with:

- Definition
- Equation
- Inputs
- Reference Model
- Version
- Calculation path

The `ExplainabilityPanel.tsx` renders this as a drill-down dialog. The `ExecutiveBriefing.tsx` translates engineering deltas into business-language impact statements.

---

## 4. Executive Recommendation — SHIPPED

**File:** `src/components/DecisionCenterView.tsx`

Every review concludes with a deterministic recommendation derived from Build outputs.

Possible outcomes:

- Proceed
- Proceed with Risk
- Requires Investigation
- Hold
- Reject

The recommendation is derived from deterministic metrics. The AI Advisor may expand the narrative but never replaces deterministic evidence.

---

## 5. Decision Recording — SHIPPED

**File:** `src/components/DecisionCenterView.tsx`

Engineering decisions become permanent organizational records.

Each decision captures:

- Build ID(s)
- Decision outcome (`DecisionOutcome` type: Proceed / Proceed with Risk / Requires Investigation / Hold / Reject)
- Approver
- Timestamp
- Supporting rationale
- Follow-up actions

Decisions are stored append-only via the `api/decisions.ts` endpoint (server-side) or localStorage (demo mode). The `Decision` type (`types.ts:261`) provides the schema.

---

## 6. Executive Reporting — PARTIALLY SHIPPED

Supported outputs:

- PDF — shipped (`pdfGenerator.ts`)
- CSV — shipped (`csvGenerator.ts`)
- Markdown executive summary — shipped (`ExecutiveBriefing.tsx` export)
- Dashboard — shipped (`DashboardView.tsx`)
- Cost Summary — shipped
- Program Summary — shipped
- Portfolio Summary — shipped (`PortfolioView.tsx`)

**Not yet shipped (deferred):**
- **PowerPoint export** — revisit trigger: validated demand from 3+ enterprise pilot customers
- **Board Packet** — bundled multi-export with cover sheet; revisit when PowerPoint ships

Every exported report references its originating Build IDs.

---

# Workspace Layout — SHIPPED

**Implementing components:**

- `ReviewBoardView.tsx` — persona-specific review board tabs (architect, manufacturing, finance, program, executive)
- `DecisionCenterView.tsx` — decision header, engineering + financial + manufacturing + program metrics, risk assessment, recommendation, decision log
- `ExecutiveBriefing.tsx` — executive summary, business impact, risk dashboard

Information flows from strategic summary to technical detail.

---

# Executive Summary — SHIPPED

The `ExecutiveBriefing.tsx` answers three questions within sixty seconds:

1. What decision is under review?
2. What changed?
3. What should leadership do?

---

# Business Impact Layer — SHIPPED

Every engineering metric includes business interpretation via `CalculationTrace` and the `ExplainabilityPanel.tsx` drill-down.

Example: Instead of "Die Area 260 mm² → 760 mm²", the system presents a business-language delta with cost/margin/schedule consequences.

---

# Executive Decision Scorecard — SHIPPED

The `ReviewBoardView.tsx` provides persona-specific scoring across Technical Feasibility, Manufacturing Readiness, Capital Efficiency, Commercial Attractiveness, Program Confidence, and Supply Chain Resilience. Scores are supported by deterministic calculations from `computeBuildMetrics`.

---

# Risk Dashboard — SHIPPED

Risk categories (Manufacturing, Financial, Program, Supply Chain, Technology, Packaging) are surfaced in:

- `ExecutiveBriefing.tsx` — risk summary with severity badges
- `SupplyChainView.tsx` — block-level risk visualization
- Alert system (`checkAlerts` in `mathEngine.ts`) — triggered alerts by category

Every risk links back to underlying Build evidence via metric ID.

---

# Build Lineage — SHIPPED

The `DesignBoard.tsx` shows a lineage breadcrumb when a Build has a `parentId`, displaying:

```
Derived from parent-build-id | Data vintage: ref-model v2.0 (verified 2026-06-01) | commodity prices: 2026-01-15
```

Each revision explains why a new Build was created via the Branch Variant flow.

---

# Explainability — SHIPPED

**File:** `src/components/ExplainabilityPanel.tsx`

Every metric supports drill-down. Selecting a metric reveals:

- Definition
- Formula
- Inputs
- Reference Model
- Version
- Calculation pathway

Trust is established through transparency.

---

# Collaboration — SHIPPED

**File:** `src/components/CommentsPanel.tsx`

Comments attach to Builds (and optionally to specific metric elements via `elementId`). Each comment records `author`, `role`, `timestamp`, and `versionStamp`. Meeting Mode (`MeetingMode.tsx`) provides a full-screen presentation mode for executive reviews:

- Full-screen dashboards
- Side-by-side Build comparisons
- Live drill-down
- Presenter navigation
- Decision capture

---

# AI Advisor — SHIPPED

**File:** `src/components/Chippie.tsx`

**API proxy:** `api/chippie-brief.ts`

The AI Advisor was shipped as part of the MVP rather than a future addition. It follows the constitutional architecture:

- Consumes completed Builds (never computes).
- Provides executive summaries, risk interpretation, scenario observations.
- Augments deterministic analysis with natural language narrative.
- **Never replaces deterministic calculations.**

The AI is backed by the constitutional guardrail: it reads the `Snapshot` metricsList and generates narrative, it never performs arithmetic.

---

# Architectural Rules

The Executive Decision Center never performs engineering computation.

It consumes completed Builds.

It never modifies Builds.

It never bypasses Build immutability.

It always references Build IDs.

Engineering truth originates in the Build Workspace.

Executive truth originates from the interpretation of completed Builds.

---

# Success Criteria — MET

The Executive Decision Center succeeds when executive meetings no longer revolve around reconciling disconnected spreadsheets and presentations.

Instead, every participant reviews the same immutable Build objects, discusses quantified engineering and commercial trade-offs, records decisions against those Builds, and leaves the meeting with a shared understanding of why a decision was made.

---

# Guiding Principle

> **Engineers create Builds. Executives make decisions from Builds. The Executive Decision Center is where engineering truth becomes organizational action.**

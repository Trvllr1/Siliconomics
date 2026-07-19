# Siliconomics

Deterministic engineering economics for the semiconductor industry.

Turn engineering parameters into board-ready financial intelligence — Build cost, yield, margin, break-even, ROI, and 5-year time-phased cash flow projections from a single deterministic model.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173. The app runs in **demo mode** by default — no database, no API keys, no Clerk sign-in. All data is stored in localStorage.

## Prerequisites

- **Node.js 22+**
- Optional: `VITE_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` for auth + Neon persistence
- Optional: `NIM_API_KEY` for Chippie, the embedded AI advisor (falls back to demo mode)
- Optional: `TAVILY_API_KEY` for Chippie's `web_search` tool (not advertised to the model when absent; results are cited external context, never engine numbers)
- Optional: `DATABASE_URL` for Neon Postgres (demo mode uses localStorage)

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Auth (opt) | Clerk |
| Persistence (opt) | Neon Postgres + Drizzle ORM |
| API (opt) | Vercel serverless functions |
| AI (opt) | NVIDIA NIM open models (Chippie advisor) |
| Engine | TypeScript pure functions (mathEngine.ts + timeEngine.ts) |

The engine is fully deterministic — same inputs always produce identical outputs. No Monte Carlo, no randomness. Every metric includes a full calculation trace with equation, inputs, reference model, and version.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server + API watcher |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest test suite |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations to Neon |
| `npm run db:push` | Push schema to Neon (dev) |
| `npm run lint` | ESLint check |

## Test Suite

```bash
npm run test
```

93 tests across 4 test files covering:
- **mathEngine**: Murphy yield, DPW, monolithic/chiplet cost, CoWoS/EMIB, MPW shuttle, supply chain risk, golden snapshots for all 3 default builds
- **timeEngine**: D0 yield-learning (monotonicity, asymptotics), ASP erosion, ramp shapes, supply-vs-demand detection, respin scenarios, break-even quarter, **equivalence theorem** (no timeModel = exact match with static computeBuildMetrics)
- **alerts**: threshold triggering logic

All tests lock model behavior — a failed golden snapshot means a calculation changed.

## Features

- **Builds**: Create, edit, branch, review, approve, archive
- **DesignModel**: Die area, process node, wafer cost, ASP, NRE, defect density, foundry, packaging type
- **Chiplet/CoWoS**: Multi-die yield stacking, interposer cost, EMIB bridge pricing
- **MPW Shuttle**: Multi-project wafer economics
- **Architecture BOM**: Block-level NRE, IP licenses, royalties, supply chain risk
- **Time-Dimension Modeling**: 20-quarter projections with D0 yield-learning curves, ASP erosion, volume ramp (linear/s-curve/flat), supply-vs-demand constraint detection, respin risk (3-outcome: baseline / with-respin / probability-weighted expected), quarterly P&L, cumulative cash flow, break-even quarter
- **Persona System**: 5 roles (architect, manufacturing, finance, program, executive) with field-level edit gating
- **Decision Center**: Executive briefing, build comparison, decision recording, approval workflow
- **AI Advisor**: Constitutional AI that consumes builds, never computes
- **Meeting Mode**: Full-screen presentation for executive reviews
- **Explainability**: Every metric has a calculation trace with equation, inputs, reference model, version, and calculation path
- **Comparison**: Side-by-side build comparison with AI-powered analysis
- **Export**: PDF, CSV, markdown executive summaries
- **Demo Mode**: Zero-infrastructure onboarding — works fully offline with localStorage
- **API Mode**: Optional Clerk auth + Neon Postgres + Vercel serverless for team use

## Trust & Data Handling

Siliconomics is built for pre-tapeout semiconductor program data. Here is how your data is handled:

- **Demo mode (default):** All data stays in your browser (localStorage). Nothing is transmitted or stored server-side. You can model a complete chip program entirely offline.
- **Signed-in mode:** Builds are stored in tenant-isolated Postgres (Neon) with authentication via Clerk. Data is owner-scoped.
- **Reference data policy:** All platform-default assumptions are sourced from public, analyst-published estimates only. User-entered private assumptions via "Duplicate & Customize" are never read, aggregated, or shared.
- **AI Advisor (Chippie):** When you send a message or invoke an analysis, the active Build's parameters and computed metrics are sent to NVIDIA-hosted open models via our proxy for natural-language processing. Analysis is opt-in per message, never automatic. No build data is used for model training. Every number cited comes from the deterministic engine.

No analytics, no tracking pixels, no third-party data sharing.

## Documentation

Full governing docs in `docs/`:

- [Fundamental Canonical Logic](docs/00-FCL_v1.md) — identity and first principles
- [Constitution](docs/01-Constitution.md) — immutable product rules
- [Product Blueprint](docs/02-Product-Blueprint.md) — UX and feature spec (v1.1)
- [Architecture](docs/03-Architecture.md) — technical architecture, shipped/deferred inventory (v2.0)
- [Build Object Spec](docs/04-Build-Object-Spec.md) — core domain model (v1.1)
- [Design System](docs/05-Design-System.md) — visual identity and component patterns
- [Executive Decision Center](docs/06-Executive-Decision-Center.md) — executive workspace spec (v1.1, all capabilities shipped)

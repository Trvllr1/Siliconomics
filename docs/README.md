# Siliconomics Documentation

## Governing Documents

| # | Document | Status | Purpose |
|---|----------|--------|---------|
| 00 | [Fundamental Canonical Logic](00-FCL_v1.md) | ✓ Stable | Identity, purpose, and first principles |
| 01 | [Constitution](01-Constitution.md) | ✓ Stable | Immutable engineering and product rules |
| 02 | [Product Blueprint](02-Product-Blueprint.md) | ✓ Current (v1.1) | User experience and feature specification |
| 03 | [Architecture](03-Architecture.md) | ✓ Current (v2.0) | Technical architecture, stack, and shipped/deferred inventory |
| 04 | [Build Object Spec](04-Build-Object-Spec.md) | ✓ Current (v1.1) | Core domain model and Build composition |
| 05 | [Design System](05-Design-System.md) | ✓ Stable | Visual identity, typography, color, and component patterns |
| 06 | [Executive Decision Center](06-Executive-Decision-Center.md) | ✓ Current (v1.1) | Executive workspace specification, all 6 capabilities shipped |
| 09 | [Website Design Plan](09-Website-Design-Plan.md) | ✓ Current (v1.0) | Public marketing website specification ("Manhattan Web") |

## Current State (2026-07-17)

The platform has shipped four priority workstreams:

- **P1 — Reference-Data Credibility Program**: DataVintage tracking, reference model freshness indicators, formula library validation dates, data provenance on all metric cards, supply-chain commodity pricing model.
- **P2 — Persistence, Auth & True Build Immutability**: Neon Postgres + Drizzle ORM, Vercel API routes (9 endpoints), Clerk authentication (optional — demo mode when absent), dual-mode StorageAdapter (localStorage vs API), SHA-256 freeze on status transition past Draft, Build lineage branching.
- **P3 — Time-Dimension Modeling**: D0 yield-learning curves, ASP erosion, volume ramp shapes, supply-vs-demand reconciliation, respin risk (3-outcome deterministic), quarterly P&L with cumulative cash flow, break-even quarter. Enables supply/demand/balanced constraint detection — the single most valuable output for the CoWoS shortage era.
- **P4 — Documentation & Blueprint Refresh**: This amendment cycle. All governing docs reconciled with shipped code. Dead architecture (Rust/Go engine, Memgraph, TigerBeetle, OCI) moved to "Deferred Architecture" section with explicit revisit triggers. Constitution and FCL left untouched as identity documents.

**Pending flags surfaced during audits:**
1. `formulaVersion` on default builds should be bumped from `Murphy-SIA-v4.2` to `Murphy-SIA-v4.3` to reflect the new v3.0 formula-library entries for time-dimension modeling.
2. `package.json` `name` field should be changed from `"react-example"` to `"siliconomics"`.

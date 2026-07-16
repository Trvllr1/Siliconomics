# Siliconomics Documentation

## Specification Index

Every design, coding, and implementation decision is governed by the specs in this directory.

| # | Document | Authority | Relevant Code |
|---|---|---|---|
| 00 | [FCL v1 — Engineering Methodology](00-FCL_v1.md) | Workflow process guide | N/A — governs SWE behavior |
| 01 | [Constitution — Foundational Principles](01-Constitution.md) | Platform philosophy (determinism, immutability, explainability) | `src/types.ts`, `src/utils/mathEngine.ts` |
| 02 | [Product Blueprint — UX & Vision](02-Product-Blueprint.md) | Personas, user journey, navigation | `src/App.tsx`, `src/components/DashboardView.tsx` |
| 03 | [Architecture — Technical Spec](03-Architecture.md) | Backend, computation engine, data stores | `server.ts`, `src/utils/mathEngine.ts` |
| 04 | [Build Object Spec — Domain Model](04-Build-Object-Spec.md) | Build identity, lifecycle, composition | `src/types.ts` (`Build` interface) |
| 05 | [Design System — Manhattan UI/UX](05-Design-System.md) | Colors, typography, layout, motion | `src/index.css`, all components |
| 06 | [Executive Decision Center — Sidebar Module](06-Executive-Decision-Center.md) | Executive workspace (future) | N/A — pending implementation |

## Reading Order

1. **Constitution** — Understand the philosophy before building anything
2. **Product Blueprint** — Understand the user and the product vision
3. **Architecture** — Understand technical constraints and system boundaries
4. **Build Object Spec** — Understand the central domain object
5. **Design System** — Understand UI/UX rules before implementing screens
6. **Executive Decision Center** — Future module specification

## Key Citations

When implementing, reference the governing spec and article/section:

> Per Constitution Article VI: "Once created, a Build shall never be modified. Any change creates a new Build."

> Per Build Spec §5 Principle: "Every metric within a Build shall provide definition, governing formula, contributing inputs, calculation pathway, and supporting assumptions."

> Per Design System §Color Philosophy: "Accent colors indicate meaning. Never branding."

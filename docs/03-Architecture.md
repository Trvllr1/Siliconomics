# Siliconomics Architecture Implementation Brief

## Pass-Off Specification for Agent SWE

### Purpose

This document defines the implementation direction for the standalone Siliconomics platform.

Siliconomics is a deterministic engineering economics platform for the semiconductor industry. Its purpose is to unify semiconductor engineering mathematics, manufacturing economics, program economics, and financial intelligence into a single Build-centric platform.

The standalone product is architecturally derived from GSAF Studio.

Unlike Studio, however, it does **not** include the EAVA engineering workflow (Explore, Architect, Verify, Assure). Instead, it begins at the Build layer and performs deterministic commercial analysis.

The objective is to ensure both Studio and the standalone Siliconomics platform share the same architectural philosophy, object model, and engineering principles.

---

# Core Architectural Philosophy

Siliconomics is **not** a spreadsheet replacement.

Siliconomics is **not** a financial calculator.

Siliconomics is an engineering intelligence platform.

Everything inside the platform revolves around immutable engineering Builds.

Every calculation, visualization, report, comparison, export, and financial analysis is generated from a Build.

No calculations are performed directly inside the user interface.

The interface exists only to construct Design Models, submit them for computation, and visualize returned results.

---

# Build-Centric Object Model

The Build is the primary object within Siliconomics.

Each Build represents one complete engineering scenario.

A Build contains:

* Design parameters
* Technology assumptions
* Manufacturing assumptions
* Formula versions
* Engineering assumptions
* Commercial assumptions
* Computed results
* Reports
* Visualizations

Once generated, a Build is immutable.

If the user changes any input parameter, Siliconomics shall generate a new Build rather than modifying the previous one.

This provides complete traceability, reproducibility, and comparison between engineering scenarios.

---

# Computational Engine

Implement a stateless computation engine using either Rust or Go.

Responsibilities:

* Accept Build definitions as JSON payloads.
* Execute deterministic mathematical models.
* Return structured JSON results.
* Maintain no persistent application state.
* Never perform user interface logic.
* Never directly manipulate databases outside required data retrieval.

The computation engine is purely mathematical.

---

# Persistent Data

Use PostgreSQL as the primary data store.

PostgreSQL should manage:

* Build metadata
* Design Models
* Formula versions
* Reference datasets
* Scenario history
* Snapshot metadata
* User projects

The database becomes the canonical repository for engineering intelligence.

---

# Relationship Graph

Implement a graph database (Memgraph) to model engineering dependencies.

Examples include:

Technology Node

↓

Mask Count

↓

NRE

↓

Schedule

↓

ROI

or

Die Area

↓

Yield

↓

Packaging

↓

Unit Cost

The graph should support downstream impact analysis, allowing users to understand how changing one engineering parameter propagates through manufacturing and commercial outcomes.

---

# Commercial Ledger

Implement TigerBeetle strictly for commercial transactions.

TigerBeetle is **not** a computational engine.

It should record immutable financial events such as:

* Quotes
* Licenses
* Subscriptions
* Royalties
* Enterprise contracts
* Billing events
* Commercial settlements

Engineering calculations must never depend upon TigerBeetle.

---

# Mathematical Engine

Implement deterministic models for semiconductor engineering economics.

Initial models include:

• Dies Per Wafer

• Yield Estimation

• Bare Die Cost

• Compound Packaging Yield

These models should support configurable engineering inputs such as:

* Wafer diameter
* Die area
* Defect density
* Packaging yield
* Technology node
* Manufacturing assumptions

Mathematical implementations must be versioned.

Each Build records the exact formula versions used during computation.

---

# Formula Library

Create a dedicated Formula Library.

Every engineering equation shall exist as an independently versioned object.

Each formula records:

* Version
* Description
* Inputs
* Outputs
* Validation references
* Revision history

Builds shall reference Formula Library versions instead of embedding equations directly.

This guarantees reproducibility of engineering calculations over time.

---

# Reference Model Library

Engineering assumptions must never be hard-coded.

Create editable reference datasets for:

* Technology nodes
* Wafer costs
* Mask costs
* Packaging costs
* Labor assumptions
* Cloud infrastructure costs
* Certification costs
* Verification costs
* Manufacturing assumptions
* Yield assumptions

The computation engine consumes these datasets when generating Builds.

---

# Explainability

Every computed metric shall provide an explanation describing how it was derived.

For example, an ROI value should expose the contributing engineering and commercial factors rather than presenting only a numerical output.

Users should be able to inspect the reasoning chain behind every major engineering metric.

Explainability is considered a core platform capability.

---

# Scenario Comparison

Users shall be able to compare multiple immutable Builds.

Comparison views should include:

* Cost
* Yield
* Die count
* Packaging
* Schedule
* NRE
* ROI
* Break-even
* Commercial impact

The platform should clearly visualize engineering tradeoffs between alternative design scenarios.

---

# User Interface

Implement the frontend using React / Next.js.

The interface should consist of modular visualization components including:

* Wafer visualization
* Yield graphs
* Cost breakdowns
* NRE stack
* Packaging analysis
* Break-even charts
* Build comparison dashboards

These components consume JSON returned from the computation engine.

No engineering calculations shall be implemented within the frontend.

---

# Precision Requirements

Financial calculations must use fixed-point or precision decimal arithmetic.

Floating-point arithmetic must not be used for monetary values.

Engineering calculations may use floating-point precision where scientifically appropriate.

---

# Deployment

Containerize all services using Docker.

Target Oracle Cloud Infrastructure (OCI) Always Free resources for initial deployment.

Maintain a modular architecture that can later scale to Kubernetes without significant refactoring.

---

# MVP Deliverables

The first production milestone should include:

* Stateless computation engine
* PostgreSQL integration
* Memgraph integration
* TigerBeetle commercial ledger
* Formula Library
* Reference Model Library
* Immutable Build generation
* Snapshot generation
* Explainable engineering reports
* Build comparison
* React frontend
* OCI deployment

Machine learning, AI agents, autonomous optimization, and external data acquisition are explicitly outside the scope of the MVP.

---

# Engineering Principle

Siliconomics exists to transform deterministic engineering inputs into deterministic engineering and commercial intelligence.

Every feature implemented should reinforce three principles:

1. Determinism
2. Explainability
3. Reproducibility

When evaluating implementation decisions, the preferred architecture is always the one that strengthens these three principles.

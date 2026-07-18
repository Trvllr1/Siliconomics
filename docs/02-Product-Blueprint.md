# Siliconomics Product Blueprint

## Defining the User Experience of the Siliconomics Platform

### Version 1.1 — Amended 2026-07-17

---

# Purpose

Siliconomics exists to help semiconductor professionals understand the engineering, manufacturing, and commercial consequences of technical decisions.

It is not a collection of calculators.

It is not a spreadsheet replacement.

It is an engineering intelligence workspace built around immutable Builds.

Every interaction within Siliconomics should help users answer one question:

> **"If I make this engineering decision, what happens next?"**

---

# Product Philosophy

Siliconomics follows a simple workflow.

Intent

↓

Model

↓

Build

↓

Compute

↓

Understand

↓

Compare

↓

Decide

↓

Export

Every feature supports one or more stages of this workflow.

---

# Primary Personas

The platform is designed for multiple semiconductor roles.

### Engineering

* ASIC Engineers
* SoC Architects
* Physical Design Engineers
* Verification Engineers
* FPGA Engineers

Primary questions:

Can this design be built?

What are its physical consequences?

---

### Program Management

Primary questions:

Can this project meet schedule?

What changes affect cost?

Where are the risks?

---

### Finance

Primary questions:

What is total NRE?

What is projected ROI?

What is unit cost?

Where is break-even?

---

### Executive Leadership

Primary questions:

Should this program move forward?

Is another option better?

What is the business impact?

---

### Procurement

Primary questions:

Which foundry?

Which packaging?

What is supplier impact?

---

# Core Product Objects

Siliconomics revolves around five primary objects.

## Design Model

User-defined engineering intent.

Contains only inputs.

---

## Build

Immutable realization of the Design Model.

Contains all calculations.

---

## Snapshot

Complete engineering and commercial output of a Build.

---

## Comparison

Two or more Builds evaluated together.

---

## Portfolio

A collection of related Builds for a program, customer, or product family.

---

# Primary Navigation

The application should present a clean workspace with the following navigation.

Dashboard

Builds

Compare

Portfolio

Reports

Reference Models

Formula Library

Administration

Help

---

# Workspace Components

The platform provides several specialized workspaces in addition to the primary Build workspace.

## Design Board

**Component:** `DesignBoard.tsx`

The DesignBoard is the primary design-editing surface. It renders the full DesignModel as a structured form with persona-based field-level edit gating. Fields are owned by specific personas (architect, manufacturing, finance, program) via the `FIELD_OWNER` map. When a Build is frozen (status past Draft), all fields become read-only.

## Build View

**Component:** `BuildView.tsx`

Five collapsible sections (Engineering, Manufacturing, Financial, Program, Program Timeline & Time Modeling) each with input knobs on the left and metric cards on the right. The Timeline section exposes the `TimeModel` parameters: D0 yield-learning, ASP erosion, volume ramp, supply constraint, volume allocation, projection horizon, and respin risk.

## Meeting Mode

**Component:** `MeetingMode.tsx`

Full-screen presentation mode for executive reviews. Supports slide navigation, side-by-side comparisons, metric drill-down, and decision capture. Activated from the top bar.

## Command Palette

**Component:** `CommandPalette.tsx`

Global ⌘K command palette for navigating between builds, workspaces, and actions.

## Charts View

**Component:** `ChartsView.tsx`

Six chart types: Murphy yield curve, cost stack breakdown, D0 sensitivity analysis, quarterly revenue & gross margin, cumulative cash flow with break-even, and D0 yield-learning & volume ramp.

---

# Dashboard

The Dashboard serves as the user's operational home.

Display:

Recent Builds

Recent Snapshots

Portfolio Summary

Recent Reports

Pinned Projects

Recent Comparisons

Recent Activity

The dashboard answers:

"What should I work on today?"

---

# Build Workspace

Selecting "New Build" opens the Build Workspace.

The workspace guides users through engineering inputs.

Typical sections include:

Technology Node

Wafer Configuration

Die Parameters

Packaging

Manufacturing Assumptions

Program Assumptions

Financial Assumptions

Every modification updates the Design Model only.

No calculations occur until the user generates a Build.

---

# Build Generation

When the user selects Generate Build:

The platform:

Validates inputs.

Creates an immutable Build ID.

Submits the Build to the deterministic computation engine.

Generates a Snapshot.

Returns results to the workspace.

The Design Model remains editable.

The Build never changes.

---

# Snapshot Workspace

The Snapshot becomes the central analysis screen.

Organize information into expandable sections.

Engineering

Manufacturing

Program

Financial

Commercial

Risk

Every metric supports drill-down explanations.

Every chart links back to deterministic calculations.

---

# Comparison Workspace

Users select multiple Builds.

Siliconomics produces side-by-side analysis.

Compare:

Area

Yield

NRE

Wafer Cost

Packaging

Timeline

ROI

Break-even

Program Risk

Comparison is one of the platform's primary capabilities.

---

# Portfolio Workspace

A Portfolio groups related Builds.

Examples:

Next-generation processor

Customer engagement

Product family

Research project

Portfolios summarize engineering progress over time.

---

# Reports

Every Build may generate downloadable reports.

Engineering Summary

Manufacturing Summary

Commercial Summary

Executive Summary

Cost Analysis

Yield Analysis

Program Analysis

Reports are reproducible because they reference immutable Builds.

---

# Reference Models

Users with appropriate permissions may inspect and maintain engineering assumptions.

Examples:

Technology Nodes

Foundry Parameters

Packaging Options

Labor Rates

Mask Costs

Certification Costs

Cloud Costs

Reference Models are version-controlled.

Changes create new versions without altering historical Builds.

---

# Formula Library

The Formula Library documents every deterministic equation used by the platform.

Each formula includes:

Description

Inputs

Outputs

Version

Supporting references

Affected metrics

Historical Builds reference specific formula versions.

---

# Explainability

Every major metric includes:

Definition

Calculation pathway

Contributing variables

Reference formulas

Underlying assumptions

Users should never encounter unexplained numbers.

---

# Search

Global search should locate:

Builds

Snapshots

Reports

Portfolios

Reference Models

Formula versions

Search is object-based rather than document-based.

---

# Export

Users may export:

PDF reports

CSV data

Engineering summaries

Presentation-ready executive summaries

Build archives

Snapshot archives

Every export references the originating Build ID.

---

# Collaboration

Users may:

Share Builds

Share Snapshots

Share Reports

Comment on Builds

Track revision history

Collaboration never alters immutable Builds.

---

# Product Evolution

AI Advisor (shipped in v1.0)

Optimization Engines

Scenario Recommendations

Market Intelligence

Forecasting

Supply Chain Analysis

The AI Advisor (`AiAdvisor.tsx`) is shipped and operational. It follows the constitutional architecture: it consumes completed Builds, generates narrative from snapshot metrics, and never performs arithmetic or replaces the deterministic engine. Backed by a Gemini API proxy (`api/gemini-analyze.ts`) with a fallback local analysis mode when the API key is absent.

These systems consume Builds.

They never replace deterministic computation.

---

# User Journey

The ideal user experience is:

Open Siliconomics.

↓

Review Dashboard.

↓

Create or open a Design Model.

↓

Generate a Build.

↓

Review the Snapshot.

↓

Compare alternative Builds.

↓

Select the preferred scenario.

↓

Export engineering and executive reports.

↓

Make informed business decisions.

This journey represents the intended experience of every Siliconomics user.

---

# Product Success

Siliconomics succeeds when users leave the platform with greater certainty than when they entered.

Every screen, interaction, visualization, and report should reduce uncertainty.

The platform does not tell users what to build.

It enables them to understand the consequences of what they choose to build.

That is the purpose of Siliconomics.

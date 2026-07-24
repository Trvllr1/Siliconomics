// chippieDirectAnswer.ts — Deterministic router that intercepts common queries
// and serves instant responses sourced from the existing CHIPPIE_KNOWLEDGE pack.
// Bypasses the LLM entirely for known-pattern queries (navigation, glossary,
// onboarding, UI help). Returns null when no match → falls through to NIM.

import { CHIPPIE_KNOWLEDGE, type KnowledgeSection } from '../../src/data/chippieKnowledge.js';
import type { ChippieMessage, ChippieResponse } from '../../src/utils/chippieProtocol.js';

// ---------------------------------------------------------------------------
// Intent patterns — each maps to a handler that assembles a response from
// existing knowledge sections. Order matters: first match wins.
// ---------------------------------------------------------------------------

interface IntentRule {
  /** Regex patterns that trigger this intent (tested against lowercase input). */
  patterns: RegExp[];
  /** Handler returns the response content string, or null to skip. */
  handler: (input: string, context?: DirectAnswerContext) => string | null;
}

export interface DirectAnswerContext {
  buildName?: string;
  persona?: string;
}

// ---------------------------------------------------------------------------
// Knowledge helpers — pull content from the existing compiled pack.
// ---------------------------------------------------------------------------

function findSection(idSubstring: string): KnowledgeSection | undefined {
  return CHIPPIE_KNOWLEDGE.find((s) => s.id.includes(idSubstring));
}

function findSectionsBySource(source: string): KnowledgeSection[] {
  return CHIPPIE_KNOWLEDGE.filter((s) => s.source === source);
}

function findGlossaryEntry(term: string): KnowledgeSection | undefined {
  const normalized = term.toLowerCase().replace(/[^a-z0-9]/g, '');
  return CHIPPIE_KNOWLEDGE.find(
    (s) => s.source === '08-Glossary.md' && s.title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalized),
  );
}

// ---------------------------------------------------------------------------
// Intent rules
// ---------------------------------------------------------------------------

const INTENT_RULES: IntentRule[] = [
  // ── Navigation: How do I start / create a build? ──
  {
    patterns: [
      /how\s+(do\s+i|to|can\s+i)\s+(start|create|make|begin|set\s*up|configure)\s+(a\s+)?build/i,
      /start(ing)?\s+a\s+(new\s+)?build/i,
      /new\s+build/i,
      /create\s+(a\s+)?(new\s+)?build/i,
    ],
    handler: () => {
      const workspace = findSection('build-workspace');
      const generation = findSection('build-generation');
      return `### Starting a New Build

1. **Open the Build tab** from the sidebar (or press ⌘K and type "new build").
2. ${workspace?.content ?? 'The Build Workspace guides you through engineering inputs: Technology Node, Wafer Configuration, Die Parameters, Packaging, Manufacturing, Program, and Financial Assumptions.'}
3. ${generation ? 'When ready, select **Generate Build**. The platform validates inputs, creates an immutable Build object, and runs the deterministic engine to produce your Snapshot (yield, cost, margin, ROI).' : 'Select Generate Build to produce an immutable snapshot.'}

**Key principle:** Editing inputs modifies the Design Model only — no calculations occur until you explicitly generate. This keeps every Build auditable and version-locked.

**Quick start:** Duplicate an existing build from the sidebar and modify its assumptions — faster than starting from scratch.`;
    },
  },

  // ── Navigation: Where is X / How do I find X ──
  {
    patterns: [
      /where\s+(is|are|can\s+i\s+find|do\s+i\s+find)\s+(the\s+)?(portfolio|portfolios)/i,
      /how\s+(do\s+i|to|can\s+i)\s+(see|view|find|open|access)\s+(the\s+)?(portfolio|portfolios)/i,
    ],
    handler: () => {
      const section = findSection('portfolio-workspace') ?? findSection('portfolio');
      return `### Portfolios

Navigate to **Portfolios** in the sidebar (or ⌘K → "portfolios").

${section?.content ?? 'Portfolios group related builds for aggregate analysis — total volume, weighted margin, NRE exposure, and concentration risk across a product family.'}

You can create a new portfolio, assign builds to it, and view cross-build analytics including revenue-weighted margin and risk concentration.`;
    },
  },

  // ── Navigation: Dashboard ──
  {
    patterns: [
      /what('s|\s+is)\s+(on\s+)?(the\s+)?dashboard/i,
      /how\s+(do\s+i|to)\s+use\s+(the\s+)?dashboard/i,
      /what\s+does\s+(the\s+)?dashboard\s+show/i,
    ],
    handler: (_, ctx) => {
      const section = findSection('02-product-blueprint--dashboard');
      return `### Dashboard

The Dashboard is your operational home — it answers "What should I work on today?"

${section?.content ?? 'Displays: Recent Builds, Recent Snapshots, Portfolio Summary, Recent Reports, Pinned Projects, Recent Comparisons, Recent Activity.'}

${ctx?.buildName ? `Currently showing metrics for **${ctx.buildName}**.` : ''}

Use it to quickly assess program health and jump into the build that needs attention.`;
    },
  },

  // ── Capabilities: What can you do? ──
  {
    patterns: [
      /what\s+can\s+you\s+do/i,
      /what\s+are\s+your\s+(capabilities|features|tools)/i,
      /help\s*$/i,
      /^help\s+me$/i,
      /what\s+do\s+you\s+do/i,
      /how\s+can\s+you\s+help/i,
    ],
    handler: () => `### What I Can Do

I'm Chippie — your embedded program advisor. Everything I say is grounded in the deterministic engine or the governance docs. I never guess numbers.

**Core capabilities:**
- **Explain any metric** — exact formula, inputs, and provenance (e.g., "Explain how die yield is computed")
- **Run what-if scenarios** — "What if defect density improves 20%?" re-runs the engine with your change
- **Compare builds** — side-by-side delta analysis between any two builds
- **Sensitivity analysis** — rank which parameters drive a given metric most
- **Generate reports** — audit-ready PDF/CSV/JSON with integrity hashes
- **Propose assumption changes** — I suggest, you decide whether to apply
- **Search governance docs** — Constitution, Formula Library, Build Object Spec, Glossary

**Navigation:** Ask me to go to any tab — Build, Dashboard, Portfolios, Charts, Comparisons, Decisions, Reports.

**Tip:** Use the shortcut buttons below for common queries, or just ask in plain language.`,
  },

  // ── Glossary: What is [term]? ──
  {
    patterns: [
      /what\s+(is|are|does)\s+(an?\s+)?([A-Za-z0-9\s\-/]+)\??$/i,
      /define\s+([A-Za-z0-9\s\-/]+)/i,
      /what('s|\s+is)\s+(the\s+)?(meaning|definition)\s+of\s+([A-Za-z0-9\s\-/]+)/i,
    ],
    handler: (input) => {
      // Extract the term being asked about
      const match =
        input.match(/what\s+(?:is|are|does)\s+(?:an?\s+)?(.+?)\??$/i) ??
        input.match(/define\s+(.+)/i) ??
        input.match(/what(?:'s|\s+is)\s+(?:the\s+)?(?:meaning|definition)\s+of\s+(.+)/i);
      if (!match) return null;

      const term = match[1]!.trim();
      // Skip if the term is too generic or is actually a complex question
      if (term.split(/\s+/).length > 5) return null;
      if (/how|why|when|where|should|could|would/i.test(term)) return null;

      const entry = findGlossaryEntry(term);
      if (!entry) return null; // No glossary match → fall through to LLM

      return `### ${entry.title}\n\n${entry.content}\n\n*Source: ${entry.source}*`;
    },
  },

  // ── Navigation: Generic "go to X" / "open X" / "show me X" ──
  {
    patterns: [
      /(?:go\s+to|open|show\s+me|take\s+me\s+to|navigate\s+to)\s+(the\s+)?(build|dashboard|portfolio|chart|comparison|decision|report|formula|reference|supply\s*chain|review)/i,
    ],
    handler: (input) => {
      const match = input.match(
        /(?:go\s+to|open|show\s+me|take\s+me\s+to|navigate\s+to)\s+(?:the\s+)?(build|dashboard|portfolio|chart|comparison|decision|report|formula|reference|supply\s*chain|review)/i,
      );
      if (!match) return null;

      const target = match[1]!.toLowerCase().replace(/\s+/g, '');
      const tabMap: Record<string, { tab: string; description: string }> = {
        build: { tab: 'build', description: 'the Build Workspace where you configure design assumptions and generate builds' },
        dashboard: { tab: 'dashboard', description: 'your operational home with recent builds, portfolio summary, and activity' },
        portfolio: { tab: 'portfolios', description: 'aggregate analytics across build families — weighted margin, NRE exposure, concentration risk' },
        chart: { tab: 'archbom', description: 'visual analytics — Murphy yield curves, cost stacks, sensitivity plots, cash flow projections' },
        comparison: { tab: 'compare', description: 'side-by-side build comparison with delta analysis and business impact' },
        decision: { tab: 'decisions', description: 'the Executive Decision Center — gate reviews, recorded decisions, and follow-ups' },
        report: { tab: 'reports', description: 'audit-ready report generation (PDF, CSV, JSON) with document IDs and integrity hashes' },
        formula: { tab: 'formulas', description: 'the Formula Library — every equation used by the engine, versioned and cited' },
        reference: { tab: 'refmodels', description: 'reference models and industry archetypes for benchmarking your build assumptions' },
        supplychain: { tab: 'archbom', description: 'supply chain view with foundry, packaging, and test partner details' },
        review: { tab: 'review', description: 'the Review Board for structured program reviews and approval workflows' },
      };

      const info = tabMap[target];
      if (!info) return null;

      // Return a navigate tool call disguised as a direct answer with context
      return `Navigating you to **${info.tab}** — ${info.description}.\n\n` +
        `**Tip:** You can also use ⌘K (Command Palette) to jump between any workspace instantly.`;
    },
  },

  // ── Onboarding: How does Siliconomics work? ──
  {
    patterns: [
      /how\s+does\s+(siliconomics|this|the\s+(app|platform|tool))\s+work/i,
      /what\s+is\s+siliconomics/i,
      /explain\s+(siliconomics|this\s+(app|platform|tool))/i,
      /give\s+me\s+(a\s+)?(tour|overview|intro)/i,
    ],
    handler: () => {
      const constitution = findSection('01-constitution--purpose');
      return `### How Siliconomics Works

Siliconomics is a deterministic silicon economics platform. It replaces spreadsheet-based chip program planning with an auditable, formula-driven engine.

**Core workflow:**
1. **Design Model** — Configure your chip assumptions (node, die area, defect density, volume, ASP, NRE, etc.)
2. **Generate Build** — The engine produces an immutable Snapshot: yield, unit cost, gross margin, lifetime profit, ROI
3. **Compare & Iterate** — Run what-ifs, compare versions, identify which parameters drive your economics
4. **Decide & Record** — Gate reviews in the Decision Center capture approvals with full audit trail

**Key principle:** Every number is computed from first principles using published formulas (Murphy yield model, D0 cost scaling, etc.). Nothing is estimated or AI-generated. Chippie (me) can explain any metric but never invents one.

${constitution ? `\n*${constitution.content.split('\n')[0]}*` : ''}`;
    },
  },

  // ── Meeting Mode ──
  {
    patterns: [
      /how\s+(do\s+i|to|can\s+i)\s+(use|start|enter|activate)\s+(meeting|presentation|present)\s*mode/i,
      /what\s+is\s+meeting\s*mode/i,
      /present(ation)?\s*mode/i,
    ],
    handler: () => {
      const section = findSection('meeting-mode');
      return `### Meeting Mode

${section?.content ?? 'Full-screen presentation mode for executive reviews. Supports slide navigation, side-by-side comparisons, metric drill-down, and decision capture.'}

**To activate:** Click the **Present** button in the top navigation bar.

Use it for board reviews, program gates, and stakeholder presentations — it strips the editing UI and focuses on metrics and comparisons.`;
    },
  },

  // ── Command Palette ──
  {
    patterns: [
      /command\s*palette/i,
      /keyboard\s*shortcut/i,
      /⌘k|ctrl\+k|cmd\+k/i,
    ],
    handler: () => {
      return `### Command Palette (⌘K)

Press **⌘K** (or Ctrl+K on Windows) to open the global command palette.

From there you can:
- Jump to any build by name
- Switch between workspaces (Dashboard, Build, Charts, Portfolios, etc.)
- Trigger actions (generate build, create comparison, start meeting mode)
- Search across all builds and reports

It's the fastest way to navigate — no mouse required.`;
    },
  },
];

// ---------------------------------------------------------------------------
// Main entry point — returns a ChippieResponse if matched, or null.
// ---------------------------------------------------------------------------

export function tryDirectAnswer(
  userMessage: string,
  context?: DirectAnswerContext,
): ChippieResponse | null {
  const input = userMessage.trim();
  if (!input || input.length > 300) return null; // Too long = probably complex

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        const content = rule.handler(input, context);
        if (content) {
          return {
            type: 'message',
            message: { role: 'assistant', content },
          };
        }
      }
    }
  }

  return null;
}

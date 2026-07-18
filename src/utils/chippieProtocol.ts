// Chippie shared protocol — tool definitions and message shapes used by BOTH
// the serverless endpoint (api/chippie.ts) and the client executor
// (src/utils/chippieTools.ts). Keep this file dependency-free.

/** OpenAI-compatible chat message (NVIDIA NIM speaks this dialect). */
export interface ChippieToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChippieMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ChippieToolCall[];
  tool_call_id?: string;
}

/** Request body sent by the client to POST /api/chippie. */
export interface ChippieRequest {
  /** Transcript in OpenAI format, EXCLUDING the system prompt (server-owned). */
  messages: ChippieMessage[];
  /** One-line context injected into the system prompt. */
  context?: {
    buildName?: string;
    buildVersion?: string;
    persona?: string;
    /** Enables the founder-only GTM advisory toolset (gated by VITE_FOUNDER_MODE). */
    founderMode?: boolean;
  };
}

/** Response from POST /api/chippie. */
export interface ChippieResponse {
  /** 'message' = final text; 'tool_calls' = client must execute and continue. */
  type: 'message' | 'tool_calls';
  /** The assistant message to append to the transcript. */
  message: ChippieMessage;
  /** Client-side tool calls awaiting execution (when type === 'tool_calls'). */
  toolCalls?: ChippieToolCall[];
  /** Results for server tools already executed in this round; the client must
   * include these when continuing the conversation. */
  serverResults?: ChippieMessage[];
  isDemo?: boolean;
  error?: string;
}

/** Tabs Chippie may navigate to (must match App.tsx activeTab ids). */
export const CHIPPIE_NAV_TABS = [
  'dashboard',
  'build',
  'archbom',
  'review',
  'compare',
  'decisions',
  'reports',
  'portfolios',
  'refmodels',
  'formulas',
] as const;

/** Tools executed server-side inside the API function. */
export const SERVER_TOOL_NAMES = ['search_docs', 'draft_gtm_asset'] as const;

/** Tools executed in the browser (they need live app state / the math engine). */
export const CLIENT_TOOL_NAMES = [
  'get_active_build_metrics',
  'explain_metric',
  'run_scenario',
  'generate_report',
  'navigate',
  'propose_assumption',
  'compare_builds',
  'get_sensitivity_drivers',
  'query_decisions',
] as const;

export type ServerToolName = (typeof SERVER_TOOL_NAMES)[number];
export type ClientToolName = (typeof CLIENT_TOOL_NAMES)[number];

export function isServerTool(name: string): name is ServerToolName {
  return (SERVER_TOOL_NAMES as readonly string[]).includes(name);
}

export function isClientTool(name: string): name is ClientToolName {
  return (CLIENT_TOOL_NAMES as readonly string[]).includes(name);
}

/** OpenAI-format tool definitions advertised to the model. */
export const CHIPPIE_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_docs',
      description:
        'Search the Siliconomics governance documentation (FCL, Constitution, Product Blueprint, Architecture, Build Object Spec, Design System, Decision Center, Glossary, Go-To-Market). Use for questions about methodology, rules, product concepts, governance, or the meaning of ANY term or acronym (e.g. "OSAT", "NRE", "KGD") — always search before saying you do not know a term.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search terms, e.g. "yield model Murphy" or "decision gate rules".' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_active_build_metrics',
      description:
        'Fetch the deterministic engine outputs for the currently active build: yield, cost, margin, break-even, and key design inputs. ALWAYS use this instead of computing numbers yourself.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explain_metric',
      description:
        'Look up a metric or formula in the validated Formula Library: exact equation, inputs, current values, version, and references. Use when asked how a number is derived.',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', description: 'Metric or formula name, e.g. "Murphy yield", "die cost", "break-even volume".' },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_scenario',
      description:
        'Run a what-if scenario: apply parameter changes to a COPY of the active build and return baseline-vs-scenario metrics from the deterministic engine. Nothing is saved. Use for "what if" questions.',
      parameters: {
        type: 'object',
        properties: {
          changes: {
            type: 'array',
            description: 'Design model fields to change. Each change needs "value" (absolute) OR "deltaPercent" (relative).',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', description: 'DesignModel field name, e.g. "dieArea", "defectDensity", "asp", "targetVolume", "nreCost", "waferCost".' },
                value: { type: 'number', description: 'New absolute value for the field. Omit if using deltaPercent.' },
                deltaPercent: { type: 'number', description: 'Relative change in percent, applied as current * (1 + deltaPercent/100). A 20% improvement in defect density means deltaPercent: -20 (lower is better). Omit if using value.' },
              },
              required: ['field'],
            },
          },
          label: { type: 'string', description: 'Short human-readable scenario label.' },
        },
        required: ['changes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description:
        'Generate and download an audit-grade report package for the active build (PDF, CSV, or JSON) with document ID and integrity hash.',
      parameters: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['pdf', 'csv', 'json'], description: 'Report format.' },
        },
        required: ['format'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate',
      description: 'Navigate the user to a view in the app.',
      parameters: {
        type: 'object',
        properties: {
          tab: { type: 'string', enum: [...CHIPPIE_NAV_TABS], description: 'Destination view.' },
        },
        required: ['tab'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_assumption',
      description:
        'Propose a change to one design assumption with rationale. This NEVER writes data — it returns a structured proposal with an impact preview that the human must apply manually. Use when recommending a specific input change.',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string', description: 'DesignModel field name, e.g. "defectDensity".' },
          proposedValue: { type: 'number', description: 'Proposed new value.' },
          rationale: { type: 'string', description: 'Why this value is more defensible.' },
          sources: { type: 'string', description: 'Optional citation(s) supporting the value.' },
        },
        required: ['field', 'proposedValue', 'rationale'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_builds',
      description:
        'Compare two builds in the workspace side-by-side: deterministic engine metrics for both plus a business-impact analysis (engineering, manufacturing, financial, program). Use when asked to compare builds, weigh alternatives, or contrast the active build with another. Omit buildA to use the active build.',
      parameters: {
        type: 'object',
        properties: {
          buildA: { type: 'string', description: 'Name (or partial name) of the baseline build. Omit to use the active build.' },
          buildB: { type: 'string', description: 'Name (or partial name) of the build to compare against.' },
        },
        required: ['buildB'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sensitivity_drivers',
      description:
        'Rank which design parameters (defect density, wafer cost, ASP, die area, NRE, packaging/test yield, volume, packaging cost) most affect a chosen metric for the active build, by sweeping each ±20% through the deterministic engine. Use for "what matters most", "biggest risk/lever", or sensitivity questions.',
      parameters: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            enum: ['grossMargin', 'roi', 'grossCostPerGoodDie', 'breakEvenVolumeMillion', 'lifetimeNetProfitMillion'],
            description: 'Metric to rank drivers for. Defaults to grossMargin.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_decisions',
      description:
        'List recorded executive decisions (outcome, approver, rationale, follow-up actions) from the Decision Center. Use for questions about what was decided, by whom, why, or outstanding follow-ups.',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['active_build', 'all'], description: 'Limit to decisions involving the active build, or all decisions. Defaults to all.' },
          outcome: {
            type: 'string',
            enum: ['Proceed', 'Proceed with Risk', 'Requires Investigation', 'Hold', 'Reject'],
            description: 'Optional filter by decision outcome.',
          },
        },
      },
    },
  },
] as const;

/** GTM asset kinds Chippie can draft in founder mode. */
export const GTM_ASSET_KINDS = ['teardown_post', 'outreach_email', 'partner_brief', 'objection_response'] as const;
export type GtmAssetKind = (typeof GTM_ASSET_KINDS)[number];

/** Founder-only tool definition — advertised to the model ONLY when the
 * request context carries founderMode (gated client-side by VITE_FOUNDER_MODE
 * and enforced server-side in executeServerTool). */
export const CHIPPIE_GTM_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'draft_gtm_asset',
    description:
      'FOUNDER ONLY. Fetch the go-to-market grounding pack (positioning, ICP tiers, design partner program, pricing, objection handling) plus format instructions for drafting a GTM asset. Call this BEFORE drafting any teardown post, outreach email, partner brief, or objection response. All drafts require founder sign-off before sending.',
    parameters: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: [...GTM_ASSET_KINDS],
          description: 'Type of GTM asset to draft.',
        },
        topic: { type: 'string', description: 'Optional topic or target, e.g. "chiplet cost teardown" or "Tier-1 AI accelerator startup".' },
      },
      required: ['kind'],
    },
  },
} as const;

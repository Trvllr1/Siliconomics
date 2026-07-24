// Chippie server core — shared by api/chippie.ts (Vercel) and server.ts (local dev).
// Talks to NVIDIA NIM (OpenAI-compatible) and orchestrates the tool-calling loop:
//   - server tools (search_docs) execute here, inline;
//   - client tools are returned to the browser for execution.

import { CHIPPIE_KNOWLEDGE, type KnowledgeSection } from '../../src/data/chippieKnowledge.js';
import { tryDirectAnswer } from './chippieDirectAnswer.js';
import {
  CHIPPIE_PLAN_ANALYSIS_TOOL_DEFINITION,
  CHIPPIE_READ_NOTES_TOOL_DEFINITION,
  CHIPPIE_REVIEW_TOOL_DEFINITION,
  CHIPPIE_TOOL_DEFINITIONS,
  CHIPPIE_GTM_TOOL_DEFINITION,
  CHIPPIE_WEBSEARCH_TOOL_DEFINITION,
  CHIPPIE_WRITE_NOTE_TOOL_DEFINITION,
  GTM_ASSET_KINDS,
  SERVER_TOOL_NAMES,
  isServerTool,
  type ChippieMessage,
  type ChippieRequest,
  type ChippieResponse,
  type ChippieToolCall,
  type GtmAssetKind,
} from '../../src/utils/chippieProtocol.js';

const MAX_SERVER_TOOL_ROUNDS = 5;
const MAX_TRANSCRIPT_MESSAGES = 40;

// ---------------------------------------------------------------------------
// System prompt — Chippie's identity and the cite-only provenance rule.
// ---------------------------------------------------------------------------

function buildSystemPrompt(context?: ChippieRequest['context'], webSearchEnabled = false): string {
  const contextLine = context?.buildName
    ? `Active build: "${context.buildName}" (${context.buildVersion ?? 'unversioned'}). Active persona: ${context.persona ?? 'unknown'}.`
    : 'No active build context provided.';

  return `You are Chippie, the embedded program advisor inside Siliconomics — a deterministic silicon economics decision platform. You help semiconductor program teams (architects, manufacturing, finance, program managers, executives) reason about yield, cost, margin, and program risk.

${contextLine}

NON-NEGOTIABLE PROVENANCE RULES:
1. You NEVER compute, estimate, or invent numeric results yourself. Every number you state must come verbatim from a tool result (the deterministic engine, the Formula Library, or a generated report). If you don't have a number from a tool, call the tool or say you don't have it.
2. When citing metrics, mention where they came from (e.g., "engine output for build X", "Formula Library f-murphy-yield v1.2").
3. What-if analysis MUST go through the run_scenario tool. Never extrapolate metric changes in your head. Sign convention: for lower-is-better fields (defectDensity, waferCost, nreCost, tdp), an "improvement" or "reduction" of N% means deltaPercent: -N. "Improves 20%" = deltaPercent: -20.
4. You never modify user data. To recommend an input change, use propose_assumption — a human applies it.

STYLE:
- Be concise and executive-grade. Use short paragraphs, bold key figures, and bullet lists.
- Lead with the answer, then the supporting evidence.
- Use markdown (###, **bold**, bullets). No emojis.
- If a question is outside silicon economics or this product, politely decline.

AFTER A TOOL RETURNS:
- Answer the user's question directly using the numbers from the tool result. NEVER describe the JSON, the function call, or the mechanics of the tool ("this response is a JSON object...", "the output of the function..."). The user only sees your prose — speak to them, not about the data format.
- For scenarios: state each key metric as "X (was Y)" with direction, then one sentence of takeaway.

DIRECT REASONING (no tools needed):
- For follow-up questions about interpretation, strategic implications, positioning, or conceptual analysis — where all relevant data is already in the conversation — reason directly from the conversation context WITHOUT calling tools.
- Examples: "Does this mean we occupy a narrow niche?", "What are the implications of this for our roadmap?", "Is it fair to say those are complements rather than competitors?"
- You have the full conversation history. Use it. Think deeply, consider nuance, and synthesize a substantive response.

TOOL USAGE:
- Call tools to get data you need. Once you have data from tools, SYNTHESIZE immediately — do not call more tools unless you genuinely lack specific information for your answer.
- Never call a tool just to "plan" or "review" — answer directly using the data you have.
- For metric lookups: get_active_build_metrics → answer with the numbers.
- For what-ifs: run_scenario → answer with baseline vs. scenario.
- For research: web_search or search_docs → synthesize findings into your answer.
- For comparisons: compare_builds → summarize the contrast.
- Maximum 2-3 tool calls per question. If you find yourself calling more, stop and synthesize what you have.

MARKET INTELLIGENCE (available via search_docs):
- You have access to curated industry benchmarks: foundry wafer pricing by node, yield norms, packaging costs (CoWoS, FCCSP, FCBGA, InFO), TAM/SAM by segment, ASP ranges, JEDEC standards, supply chain concentration, and cost structure benchmarks.
- When a user asks "how does our X compare to industry?" or seeks market context, search_docs with market-related terms (e.g., "foundry pricing 5nm", "packaging cost CoWoS", "TAM automotive").
- ALWAYS clearly separate engine data (deterministic, from this build) from market context (curated benchmarks, approximate). Format: "**Engine:** [your build value] | **Industry benchmark:** [range] (source, vintage Q2 2026)."
- Market data is REFERENCE CONTEXT — it does not override engine computations. Never use benchmark figures as inputs to engine calculations.

TOOLS: Use search_docs for methodology/governance questions, industry benchmarks, market intelligence, AND for any term, acronym, or definition you are not certain about (the docs include a full glossary and a curated market intelligence corpus — search it BEFORE saying you don't know). After search_docs returns, scan the results for unfamiliar terms and search again — chain multiple searches to fully understand a topic; get_active_build_metrics for current numbers; explain_metric for formula derivations; run_scenario for what-ifs; compare_builds to contrast two builds side-by-side; get_sensitivity_drivers to rank which parameters matter most for a metric; query_decisions for recorded executive decisions and follow-ups; generate_report to produce audit documents; navigate to move the user around the app; propose_assumption to suggest input changes; web_search for real-time internet data (latest news, competitor products, market pricing signals, public terminology not in the docs).${
    webSearchEnabled
      ? `

WEB SEARCH RULES (web_search tool available):
- You have the web_search tool — your training cutoff is irrelevant. When the user asks about events or data beyond your training, call web_search. Never decline or say you cannot search.
- Use web_search ONLY for external context: industry news, foundry/competitor announcements, market signals, or public terminology not in the docs.
- Web results are UNVERIFIED. Every fact taken from the web MUST be cited with its source URL and clearly marked as web-sourced.
- NEVER mix web figures with deterministic engine outputs. Engine numbers come from engine tools only; web numbers are context, never inputs to conclusions about this build's economics.
- If a web figure suggests an assumption change, use propose_assumption with the URL in "sources" — never state it as fact.
- Any answer that used web_search MUST end with a "Sources:" bullet list of the result URLs used.
- After web_search returns, scan results for industry terms or signals you don't fully understand and search again or cross-reference with search_docs before synthesizing.`
      : ''
  }${
    context?.founderMode
      ? `

FOUNDER MODE (GTM advisory) — the user is the founder:
- You may also help draft go-to-market assets: teardown posts, design-partner outreach emails, partner briefs, and objection responses.
- MANDATORY SEQUENCE for any GTM draft that references a build:
  1. Call get_active_build_metrics FIRST to get real numbers.
  2. Call draft_gtm_asset to get the grounding pack and format instructions.
  3. Write the draft using ONLY real metrics from step 1 — never invent figures.
  4. Call review_answer to validate before responding.
- The draft is about the BUILD'S silicon economics — it is NOT a pitch for Siliconomics as a product. Use the grounding pack for tone/positioning, but the substance must be the build's actual yield, cost, margin, and volume story.
- Every GTM draft MUST begin with the literal line "DRAFT — requires founder sign-off".
- You draft only. You cannot send, post, or publish anything.`
      : ''
  }`;
}

// ---------------------------------------------------------------------------
// search_docs — keyword scoring over the compiled knowledge pack.
// ---------------------------------------------------------------------------

export function searchDocs(query: string, limit = 3): KnowledgeSection[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
  if (terms.length === 0) return [];

  const scored = CHIPPIE_KNOWLEDGE.map((section) => {
    let score = 0;
    const titleLower = section.title.toLowerCase();
    const contentLower = section.content.toLowerCase();
    for (const term of terms) {
      if (titleLower.includes(term)) score += 6;
      if (section.keywords.includes(term)) score += 4;
      // Count occurrences in content (capped so long sections don't dominate)
      let idx = 0;
      let hits = 0;
      while (hits < 5 && (idx = contentLower.indexOf(term, idx)) !== -1) {
        hits += 1;
        idx += term.length;
      }
      score += hits;
    }
    return { section, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.section);
}

interface ServerToolOptions {
  founderMode?: boolean;
  tavilyApiKey?: string;
  notes?: Map<string, string>;
}

// ---------------------------------------------------------------------------
// Defensive argument parsing — small models mangle JSON (double-encode,
// send numbers as strings, swap field names).
// ---------------------------------------------------------------------------

/** Return the first value that is a string, or fallback. */
function coerceString(val: unknown, fallback = ''): string {
  if (typeof val === 'string' && val.length > 0) return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

/** Parse a number from a value that may be a string ("-20"), a number, or
 * absent. Returns null (not NaN) when the value cannot be parsed. */
function coerceNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const n = Number(val.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** If val is a JSON string, parse it; otherwise return val as-is. Handles
 * double-encoding (the model wraps an object in a string inside the arg JSON). */
function maybeUnwrap<T>(val: unknown): T {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch { return val as T; }
  }
  return val as T;
}

// ---------------------------------------------------------------------------
// Fuzzy tool-name aliasing — when the 8B model hallucinates a name like
// "write_to_working_memory" instead of "write_note", route it to the
// correct server handler.
// ---------------------------------------------------------------------------

const SERVER_TOOL_KEYWORDS: [string, string][] = SERVER_TOOL_NAMES.map(
  (name) => [name.replace(/_/g, ' ').toLowerCase(), name],
);

function fuzzyMatchServerTool(calledName: string): string | undefined {
  const called = calledName.replace(/[^a-z0-9]+/g, ' ').toLowerCase().trim();
  if (!called) return undefined;

  // 1. Exact match after normalization
  for (const [key, name] of SERVER_TOOL_KEYWORDS) {
    if (called === key) return name;
  }

  // 2. Known name is a subsequence of the called name
  //    e.g. "write_to_working_memory" contains "write" and "note" tokens
  const calledTokens = new Set(called.split(/\s+/).filter((t) => t.length > 2));
  for (const [key, name] of SERVER_TOOL_KEYWORDS) {
    const knownTokens = key.split(/\s+/);
    // Score: how many known tokens also appear in the called tokens
    const matchCount = knownTokens.filter((t) => calledTokens.has(t)).length;
    // Match if at least 2 tokens overlap, or 1 when the known name is short
    if (matchCount >= 2 || (matchCount === 1 && knownTokens.length <= 2 && calledTokens.size >= 1)) {
      return name;
    }
  }

  return undefined;
}

async function executeServerTool(call: ChippieToolCall, opts: ServerToolOptions = {}): Promise<string> {
  try {
    if (call.function.name === 'search_docs') {
      const args = maybeUnwrap<{ query?: unknown }>(call.function.arguments || '{}');
      const results = searchDocs(coerceString(args.query));
      if (results.length === 0) {
        return JSON.stringify({ results: [], note: 'No matching documentation sections found.' });
      }
      return JSON.stringify({
        results: results.map((r) => ({ source: r.source, title: r.title, content: r.content })),
      });
    }
    if (call.function.name === 'draft_gtm_asset') {
      if (!opts.founderMode) {
        return JSON.stringify({ error: 'draft_gtm_asset is only available in founder mode.' });
      }
      const args = maybeUnwrap<{ kind?: unknown; topic?: unknown }>(call.function.arguments || '{}');
      return draftGtmAsset(coerceString(args.kind), coerceString(args.topic));
    }
    if (call.function.name === 'review_answer') {
      const args = maybeUnwrap<{ draft?: unknown }>(call.function.arguments || '{}');
      return JSON.stringify({
        instruction: 'Review the draft above against these criteria. Produce a revised version only if a criterion is not met.',
        criteria: [
          'Every numeric claim is backed by a tool result in this conversation — if you lack a number, say so instead of inventing one.',
          'Web-sourced facts include the source URL and are clearly marked as external.',
          'The answer is concise, executive-grade, and directly addresses the user\'s question.',
          'No JSON, function names, or tool mechanics are described to the user.',
          'For GTM drafts: the post contains at least 3 specific numeric metrics from the engine (yield, margin, cost, ASP, volume, NRE, etc.) — NOT from training data, NOT invented, NOT vague qualitative statements like "high yield" without a number.',
          'For GTM drafts: the draft is about the ACTIVE BUILD\'s economics, not about the Siliconomics platform itself. It must NOT read like a product pitch for Siliconomics.',
        ],
        action: 'If the draft passes all criteria, respond with it as-is. If any criterion fails, produce a corrected version now.',
      });
    }
    if (call.function.name === 'write_note') {
      const args = maybeUnwrap<{ key?: unknown; value?: unknown }>(call.function.arguments || '{}');
      const key = coerceString(args.key);
      const value = coerceString(args.value);
      if (!key || !value) {
        return JSON.stringify({ error: 'write_note requires both "key" and "value".' });
      }
      if (!opts.notes) opts.notes = new Map();
      opts.notes.set(key, value);
      return JSON.stringify({ stored: key, noteCount: opts.notes.size });
    }
    if (call.function.name === 'read_notes') {
      if (!opts.notes || opts.notes.size === 0) {
        return JSON.stringify({ notes: {}, noteCount: 0 });
      }
      const args = maybeUnwrap<{ keys?: unknown }>(call.function.arguments || '{}');
      const keysStr = coerceString(args.keys);
      if (keysStr) {
        const selected = keysStr.split(',').map((k) => k.trim()).filter((k) => opts.notes!.has(k));
        const result: Record<string, string> = {};
        for (const k of selected) result[k] = opts.notes.get(k)!;
        return JSON.stringify({ notes: result, noteCount: selected.length });
      }
      const all: Record<string, string> = {};
      for (const [k, v] of opts.notes) all[k] = v;
      return JSON.stringify({ notes: all, noteCount: opts.notes.size });
    }
    if (call.function.name === 'plan_analysis') {
      const args = maybeUnwrap<{ question?: unknown }>(call.function.arguments || '{}');
      return JSON.stringify({
        instruction: 'Break the question above into 2-4 sub-questions. For each sub-question, list which tool(s) to call and in what order. Write the plan to notes with key "plan" using write_note. Then execute each step in order, reading the plan with read_notes after each step.',
        question: coerceString(args.question),
        template: `## Plan
Step 1: [sub-question] → tool(s): [tool names]
Step 2: [sub-question] → tool(s): [tool names]
...`,
      });
    }
    if (call.function.name === 'web_search') {
      if (!opts.tavilyApiKey) {
        return JSON.stringify({ error: 'web_search is not configured on this server.' });
      }
      const args = maybeUnwrap<{ query?: unknown; maxResults?: unknown }>(call.function.arguments || '{}');
      return await webSearch(coerceString(args.query), args.maxResults as number | string | undefined, opts.tavilyApiKey);
    }
    // Fuzzy alias fallback — catch hallucinated names like "write_to_working_memory"
    const aliased = fuzzyMatchServerTool(call.function.name);
    if (aliased && aliased !== call.function.name) {
      return executeServerTool({ ...call, function: { ...call.function, name: aliased } }, opts);
    }
    return JSON.stringify({ error: `Unknown server tool: ${call.function.name}` });
  } catch (e) {
    return JSON.stringify({ error: `Tool execution failed: ${e instanceof Error ? e.message : String(e)}` });
  }
}

// ---------------------------------------------------------------------------
// web_search — Tavily (LLM-optimized web search). Only advertised when
// TAVILY_API_KEY is configured. Results are external, unverified context:
// the system prompt requires URL citations and forbids mixing web figures
// with engine outputs.
// ---------------------------------------------------------------------------

const TAVILY_TIMEOUT_MS = 10_000;

async function webSearch(query: string | undefined, maxResults: number | string | undefined, apiKey: string): Promise<string> {
  if (!query || typeof query !== 'string') {
    return JSON.stringify({ error: 'web_search requires a "query" string.' });
  }
  // Small models send numbers as strings.
  const parsed = typeof maxResults === 'string' ? Number(maxResults) : maxResults;
  const limit = Math.min(8, Math.max(1, Number.isFinite(parsed as number) ? Math.round(parsed as number) : 5));

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, max_results: limit, search_depth: 'basic' }),
    signal: AbortSignal.timeout(TAVILY_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return JSON.stringify({ error: `Web search failed (${res.status}): ${detail.slice(0, 200)}` });
  }
  const data = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  const results = (data.results ?? []).slice(0, limit).map((r) => ({
    title: r.title ?? 'Untitled',
    url: r.url ?? '',
    snippet: (r.content ?? '').slice(0, 500),
  }));
  return JSON.stringify({
    results,
    note: 'External web results — UNVERIFIED. Cite the URL for every fact used; never present these as engine outputs. Your answer MUST end with a "Sources:" bullet list of the URLs used.',
  });
}

// ---------------------------------------------------------------------------
// draft_gtm_asset — founder-only GTM grounding pack (docs/07-Go-To-Market.md).
// Returns grounding sections + format instructions; the model writes the
// draft, always prefixed "DRAFT — requires founder sign-off". Never sends.
// ---------------------------------------------------------------------------

const GTM_KIND_META: Record<GtmAssetKind, { sectionIdHints: string[]; instructions: string }> = {
  teardown_post: {
    sectionIdHints: ['positioning', 'content-engine', 'icp'],
    instructions:
      'Write a LinkedIn/blog teardown post: hook (a surprising silicon-economics number FROM THE ACTIVE BUILD), 3-5 short analytical paragraphs grounded in deterministic modeling using REAL metrics from get_active_build_metrics, and a soft close pointing to Siliconomics. Educational tone, zero hype, no hard sell. The post MUST cite at least 3 specific numeric values from the engine (yield, margin, cost, volume, NRE, etc.) — never use placeholder or invented numbers.',
  },
  outreach_email: {
    sectionIdHints: ['icp', 'design-partner', 'positioning'],
    instructions:
      'Write a cold outreach email to a design-partner prospect: subject line, under 150 words, one specific pain point from the ICP tier, one concrete capability, one low-friction ask (20-minute call). No buzzwords.',
  },
  partner_brief: {
    sectionIdHints: ['design-partner', 'pricing', 'positioning'],
    instructions:
      'Write a one-page design partner brief: what the program is, what partners get, what we ask of them, pricing posture, and success criteria. Use ### section headers.',
  },
  objection_response: {
    sectionIdHints: ['objections', 'data-compliance', 'positioning'],
    instructions:
      'Write a crisp response to the stated objection: acknowledge the concern honestly, counter with facts from the objection table and compliance stance, end with a proof point. Under 200 words.',
  },
};

function draftGtmAsset(kind: string | undefined, topic: string | undefined): string {
  if (!kind || !(GTM_ASSET_KINDS as readonly string[]).includes(kind)) {
    return JSON.stringify({ error: `"kind" must be one of: ${GTM_ASSET_KINDS.join(', ')}.` });
  }
  const meta = GTM_KIND_META[kind as GtmAssetKind];
  const gtmSections = CHIPPIE_KNOWLEDGE.filter((s) => s.source === '07-Go-To-Market.md');
  const matched = gtmSections.filter((s) => meta.sectionIdHints.some((h) => s.id.includes(h)));
  const grounding = (matched.length > 0 ? matched : gtmSections).slice(0, 3);
  // Truncate content to keep context small for NIM free tier
  const MAX_GROUNDING_CHARS = 400;
  return JSON.stringify({
    kind,
    topic: topic ?? null,
    instructions: meta.instructions,
    hardRules: [
      'The draft MUST begin with the literal line: "DRAFT — requires founder sign-off".',
      'Stay strictly consistent with the grounding sections — never invent positioning, pricing, or claims.',
      'You draft only; you cannot send, post, or publish.',
      'BEFORE writing the draft, you MUST have called get_active_build_metrics in this conversation. If you have not, STOP and call it now — then resume drafting with the real numbers.',
      'Every numeric claim in the draft must come from the engine output (get_active_build_metrics or run_scenario). If you lack a specific number, say "[METRIC NEEDED]" — never invent one.',
      'Do NOT describe what Siliconomics is or repeat positioning copy verbatim. The grounding informs your TONE and framing, but the CONTENT must be the build\'s actual silicon economics story.',
    ],
    grounding: grounding.map((s) => ({ title: s.title, content: s.content.length > MAX_GROUNDING_CHARS ? s.content.slice(0, MAX_GROUNDING_CHARS) + '...' : s.content })),
    provenance: 'docs/07-Go-To-Market.md via compiled knowledge pack.',
  });
}

// ---------------------------------------------------------------------------
// GTM pre-grounding — detect teardown/GTM intent and return inline context
// so the model skips the draft_gtm_asset server call (saves one NIM round).
// ---------------------------------------------------------------------------

function detectGtmIntent(lastUserContent: string): GtmAssetKind | null {
  const text = lastUserContent.toLowerCase();
  if (/teardown/i.test(text)) return 'teardown_post';
  if (/outreach\s*email/i.test(text)) return 'outreach_email';
  if (/partner\s*brief/i.test(text)) return 'partner_brief';
  if (/objection/i.test(text)) return 'objection_response';
  return null;
}

function buildGtmInlineContext(kind: GtmAssetKind): string {
  const meta = GTM_KIND_META[kind];
  const gtmSections = CHIPPIE_KNOWLEDGE.filter((s) => s.source === '07-Go-To-Market.md');
  const matched = gtmSections.filter((s) => meta.sectionIdHints.some((h) => s.id.includes(h)));
  const grounding = (matched.length > 0 ? matched : gtmSections).slice(0, 2);
  const MAX_CHARS = 300;
  const groundingText = grounding.map((s) => `• ${s.title}: ${s.content.slice(0, MAX_CHARS)}`).join('\n');
  return `\n\nGTM GROUNDING (pre-loaded for ${kind}):\nInstructions: ${meta.instructions}\nRules: Begin with "DRAFT — requires founder sign-off". Use ONLY real numbers from get_active_build_metrics. Never invent figures. The draft is about the BUILD's economics, not about Siliconomics.\n${groundingText}\n\nYou already have the grounding — do NOT call draft_gtm_asset. Call get_active_build_metrics NOW to get real numbers, then write the draft.`;
}

// ---------------------------------------------------------------------------
// NVIDIA NIM adapter (OpenAI-compatible /chat/completions).
// ---------------------------------------------------------------------------

interface NimConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getNimConfig(env: Record<string, string | undefined> = process.env): NimConfig | null {
  const apiKey = env.NIM_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (env.CHIPPIE_BASE_URL ?? 'https://integrate.api.nvidia.com/v1').replace(/\/$/, ''),
    model: env.CHIPPIE_MODEL ?? 'meta/llama-3.1-8b-instruct',
  };
}

function getComplexModel(env: Record<string, string | undefined> = process.env): string {
  return env.CHIPPIE_MODEL_COMPLEX ?? 'meta/llama-3.1-70b-instruct';
}

function getWebSearchConfig(env: Record<string, string | undefined> = process.env): NimConfig | null {
  const apiKey = env.CHIPPIE_WEBSEARCH_API_KEY;
  const baseUrl = env.CHIPPIE_WEBSEARCH_BASE_URL;
  const model = env.CHIPPIE_WEBSEARCH_MODEL;
  if (!apiKey || !baseUrl || !model) return null;
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, ''), model };
}

// ---------------------------------------------------------------------------
// Complexity classifier — routes queries to the appropriate tier:
//   simple    → 8B model, base tools
//   complex   → 70B model, full tools
//   websearch → dedicated websearch provider, minimal tools
//   reasoning → 70B model, NO tools (pure synthesis from conversation context)
// ---------------------------------------------------------------------------

type QueryComplexity = 'simple' | 'complex' | 'websearch' | 'reasoning';

// Data-seeking patterns — if ANY match, the question needs tools (not pure reasoning)
const DATA_SEEKING_PATTERN = /what\s*(is|are|was|'s)\s*(the|our|my|this)|how\s*much|\bcost\b|\bprice\b|\byield\b|\bmargin\b|\brevenue\b|\bwafer\b|\bdie\b|\bvolume\b|break.?even|\bmetric|\bnumber|\bcalculate|\bscenario|what.?if|\bsensitivity|\bsearch\b|\blatest\b|\bcurrent\b|\bbenchmark|\blook\s*up|\bfetch|\bget\s+(the|my|our)|\brun\s+(a|the)|\bgenerate\s+(a|the)|\bshow\s+(me|the)|\bnavigate/i;

function classifyComplexity(transcript: ChippieMessage[], founderMode: boolean): QueryComplexity {
  const lastUser = [...transcript].reverse().find((m) => m.role === 'user');
  if (!lastUser || typeof lastUser.content !== 'string') return 'simple';
  const text = lastUser.content.toLowerCase();
  const userCount = transcript.filter((m) => m.role === 'user').length;

  // GTM/founder-mode drafts → always complex
  if (founderMode && /draft|teardown|outreach|partner\s*brief|objection/i.test(text)) return 'complex';

  // Web search / research requests → dedicated websearch provider (fast tool-calling)
  if (/web.?search|search\s+the\s+web|latest\s+news|recent\s+announcement|competitive\s*(landscape|analysis|positioning)|market\s*research|competitor|industry\s*(analysis|overview|report)/i.test(text)) return 'websearch';

  // Market/industry comparison requiring benchmarks + engine data → complex
  if (/industry\s+(benchmark|average|norm|standard)|market\s+(size|tam|sam|comparison)|how\s+does\s+(our|my|this).*compare/i.test(text)) return 'complex';

  // Multi-step analysis patterns → complex
  if (/what\s+(drives|affects|impacts).*and.*(how|can|should)/i.test(text)) return 'complex';
  if (/compare.*and.*recommend/i.test(text)) return 'complex';
  if (/analyze|assessment|evaluate.*portfolio/i.test(text)) return 'complex';
  if (/plan|strategy|roadmap|tradeoff/i.test(text)) return 'complex';

  // Compound questions (multiple question marks or "and" joining verbs)
  if ((text.match(/\?/g) ?? []).length >= 2) return 'complex';

  // Deep conversations: check if the follow-up needs data or is pure reasoning
  if (userCount > 4) {
    // If the follow-up has data-seeking keywords → complex (needs tools)
    if (DATA_SEEKING_PATTERN.test(text)) return 'complex';
    // Pure synthesis / interpretation / follow-up → reasoning (no tools)
    return 'reasoning';
  }

  // Everything else → simple (single-tool dispatch, metric lookups, navigation, what-ifs)
  return 'simple';
}

// ---------------------------------------------------------------------------
// Trimmed system prompt for 8B — keeps provenance rules and tool patterns
// but drops GTM, web search, plan-and-execute, working memory, and self-review
// sections that the 8B can't reliably follow anyway.
// ---------------------------------------------------------------------------

function buildSimpleSystemPrompt(context?: ChippieRequest['context']): string {
  const contextLine = context?.buildName
    ? `Active build: "${context.buildName}" (${context.buildVersion ?? 'unversioned'}). Active persona: ${context.persona ?? 'unknown'}.`
    : 'No active build context provided.';

  return `You are Chippie, the embedded program advisor inside Siliconomics — a deterministic silicon economics decision platform.

${contextLine}

RULES:
1. NEVER invent numbers. Every figure must come from a tool result. If you lack a number, call the tool.
2. Use markdown. Be concise. Lead with the answer.
3. What-if → call run_scenario. Never extrapolate yourself.
4. Sign convention: for lower-is-better fields (defectDensity, waferCost, nreCost, tdp), "improves 20%" = deltaPercent: -20.
5. After a tool returns, answer in natural prose using the numbers. Never describe JSON or tool mechanics.

TOOLS: get_active_build_metrics (current numbers), explain_metric (formula derivation), run_scenario (what-ifs), navigate (move to a tab), get_sensitivity_drivers (rank drivers), compare_builds (contrast two builds), generate_report (audit docs), propose_assumption (suggest changes), query_decisions (decision history), search_docs (governance docs, glossary, AND industry benchmarks — foundry pricing, yield norms, packaging costs, TAM/SAM, JEDEC standards).`;
}

const NIM_ATTEMPT_TIMEOUT_MS = 45_000;
const NIM_COMPLEX_TIMEOUT_MS = 90_000;
const NIM_MAX_ATTEMPTS = 3;
const NIM_COMPLEX_MAX_ATTEMPTS = 3;
const NIM_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// NIM/Llama prompt templates only support single tool-calls per assistant turn.
// When the client returns results for multiple tool_calls (e.g. the model
// previously emitted 2 calls in one turn), we restructure the messages into
// sequential single-tool-call pairs so NIM can process them.
// ---------------------------------------------------------------------------
function flattenParallelToolCalls(messages: ChippieMessage[]): ChippieMessage[] {
  const out: ChippieMessage[] = [];
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 1) {
      // Split into N sequential assistant+tool pairs
      const toolResults = new Map<string, ChippieMessage>();
      // Collect all tool results that follow this assistant message
      for (const m of messages) {
        if (m.role === 'tool' && m.tool_call_id) {
          toolResults.set(m.tool_call_id, m);
        }
      }
      for (const call of msg.tool_calls) {
        out.push({ role: 'assistant', content: null, tool_calls: [call] });
        const result = toolResults.get(call.id);
        if (result) out.push(result);
      }
    } else if (msg.role === 'tool' && msg.tool_call_id) {
      // Only include tool results that aren't already placed by the splitter above
      const alreadyPlaced = out.some(
        (o) => o.role === 'tool' && o.tool_call_id === msg.tool_call_id,
      );
      if (!alreadyPlaced) out.push(msg);
    } else {
      out.push(msg);
    }
  }
  return out;
}

async function callNim(
  config: NimConfig,
  messages: ChippieMessage[],
  opts: { tools?: boolean | readonly unknown[]; temperature?: number; complex?: boolean } = {},
): Promise<ChippieMessage> {
  const { tools = true, temperature = 0, complex = false } = opts;
  const toolDefs = tools === true ? CHIPPIE_TOOL_DEFINITIONS : tools;
  const timeoutMs = complex ? NIM_COMPLEX_TIMEOUT_MS : NIM_ATTEMPT_TIMEOUT_MS;
  const maxAttempts = complex ? NIM_COMPLEX_MAX_ATTEMPTS : NIM_MAX_ATTEMPTS;
  let lastError: Error = new Error('NIM request failed');

  // Flatten any multi-tool-call assistant messages (NIM/Llama only supports one per turn).
  // Skip for providers that natively support parallel tool calls (e.g. Opencode/DeepSeek).
  const isNativeParallel = config.baseUrl.includes('opencode.ai');
  const flatMessages = isNativeParallel ? messages : flattenParallelToolCalls(messages);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: flatMessages,
          ...(toolDefs ? { tools: toolDefs, tool_choice: 'auto' } : {}),
          // Greedy decoding by default — tool-call arguments must be deterministic
          // (0.2 let an 8B flip a deltaPercent sign).
          temperature,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // Network failure or per-attempt timeout — retryable.
      lastError = new Error(
        `NIM request ${err instanceof Error && err.name === 'TimeoutError' ? 'timed out' : 'failed'} (attempt ${attempt}/${maxAttempts}).`,
      );
      if (attempt < maxAttempts) await sleep(500 * attempt);
      continue;
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      lastError = new Error(`NIM request failed (${res.status}): ${detail.slice(0, 300)}`);
      if (NIM_RETRYABLE_STATUSES.has(res.status) && attempt < maxAttempts) {
        await sleep(500 * attempt);
        continue;
      }
      throw lastError;
    }

    const data = (await res.json()) as {
      choices?: { message?: ChippieMessage }[];
    };
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error('NIM response missing choices[0].message');
    // Reasoning-tuned models (Nemotron etc.) can leak chain-of-thought as
    // <think>...</think> blocks — strip them so users only see the answer.
    if (typeof message.content === 'string') {
      message.content = message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }
    return message;
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Demo fallback (no NIM_API_KEY configured).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Streaming NIM adapter — SSE-compatible. Returns an async iterator of token
// chunks for the final prose response. Only used when the model returns a text
// message (not tool calls). Tool-calling turns stay non-streaming.
// ---------------------------------------------------------------------------

async function* callNimStreaming(
  config: NimConfig,
  messages: ChippieMessage[],
  opts: { temperature?: number } = {},
): AsyncGenerator<string, ChippieMessage, undefined> {
  const { temperature = 0 } = opts;
  const isNativeParallel = config.baseUrl.includes('opencode.ai');
  const flatMessages = isNativeParallel ? messages : flattenParallelToolCalls(messages);

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: flatMessages,
      temperature,
      max_tokens: 1024,
      stream: true,
    }),
    signal: AbortSignal.timeout(NIM_ATTEMPT_TIMEOUT_MS * 2), // Longer timeout for streaming
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`NIM streaming request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body for streaming');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const chunk = JSON.parse(payload) as {
            choices?: { delta?: { content?: string }; finish_reason?: string }[];
          };
          const token = chunk.choices?.[0]?.delta?.content;
          if (token) {
            fullContent += token;
            yield token;
          }
        } catch {
          // Malformed chunk — skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Strip reasoning blocks
  const cleaned = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return { role: 'assistant' as const, content: cleaned };
}

// ---------------------------------------------------------------------------
// Streaming handler — runs the tool loop synchronously, then streams the
// final synthesis turn. Returns an async generator of SSE-formatted strings.
// ---------------------------------------------------------------------------

export async function* handleChippieStreaming(
  body: unknown,
  env: Record<string, string | undefined> = process.env,
): AsyncGenerator<string, void, undefined> {
  const req = body as ChippieRequest | null;
  if (!req || !Array.isArray(req.messages) || req.messages.length === 0) {
    yield `data: ${JSON.stringify({ error: 'Request must include a non-empty messages array.' })}\n\n`;
    yield 'data: [DONE]\n\n';
    return;
  }

  const transcript = req.messages.filter((m) => m.role !== 'system');

  // Direct-answer fast path — emit instantly as a single chunk
  const lastUserMsg = [...transcript].reverse().find((m) => m.role === 'user');
  if (lastUserMsg && transcript.filter((m) => m.role === 'user').length === 1) {
    const directAnswer = tryDirectAnswer(
      typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '',
      { buildName: req.context?.buildName, persona: req.context?.persona },
    );
    if (directAnswer) {
      yield `data: ${JSON.stringify({ type: 'message', content: directAnswer.message.content })}\n\n`;
      yield 'data: [DONE]\n\n';
      return;
    }
  }

  const config = getNimConfig(env);
  if (!config) {
    yield `data: ${JSON.stringify({ type: 'message', content: '### Chippie — Demo Mode\n\nNo model backend configured.' })}\n\n`;
    yield 'data: [DONE]\n\n';
    return;
  }

  const founderMode = req.context?.founderMode === true;
  const tavilyApiKey = env.TAVILY_API_KEY;
  const toolOpts: ServerToolOptions = { founderMode, tavilyApiKey, notes: new Map() };

  // GTM shortcut: for teardown/outreach queries, we KNOW the model needs
  // get_active_build_metrics. Skip the first NIM call and return a synthetic
  // tool_call immediately — saves 40+ seconds of NIM latency.
  const lastUserContent = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';
  const gtmIntent = founderMode ? detectGtmIntent(lastUserContent) : null;
  if (gtmIntent && transcript.filter((m) => m.role === 'user').length === 1) {
    const syntheticAssistant: ChippieMessage = {
      role: 'assistant',
      content: null,
      tool_calls: [{ id: `gtm-${Date.now()}`, type: 'function', function: { name: 'get_active_build_metrics', arguments: '{}' } }],
    };
    yield `data: ${JSON.stringify({ type: 'status', status: 'Fetching build metrics for draft...' })}\n\n`;
    yield `data: ${JSON.stringify({ type: 'tool_calls', message: syntheticAssistant, toolCalls: syntheticAssistant.tool_calls })}\n\n`;
    yield 'data: [DONE]\n\n';
    return;
  }

  // ── Model routing for streaming handler ──
  const complexity = classifyComplexity(transcript, founderMode);
  const useComplexModel = complexity === 'complex' || complexity === 'websearch' || complexity === 'reasoning';
  const webSearchConfig = complexity === 'websearch' ? getWebSearchConfig(env) : null;
  const activeModel = useComplexModel ? getComplexModel(env) : config.model;
  const activeConfig: NimConfig = webSearchConfig ?? { ...config, model: activeModel };

  // GTM pre-grounding: reuse gtmIntent from above to inline the grounding
  // so the model skips the slow draft_gtm_asset server call entirely.

  // Websearch tier gets a minimal tool set — only web_search + context tools.
  // This prevents DeepSeek from looping through 16 tools and hitting the depth limit.
  const websearchToolSet = [
    CHIPPIE_TOOL_DEFINITIONS.find((t) => t.function.name === 'search_docs')!,
    CHIPPIE_TOOL_DEFINITIONS.find((t) => t.function.name === 'get_active_build_metrics')!,
    ...(tavilyApiKey ? [CHIPPIE_WEBSEARCH_TOOL_DEFINITION] : []),
  ];

  const toolSet = complexity === 'websearch'
    ? websearchToolSet
    : useComplexModel
      ? [
          ...CHIPPIE_TOOL_DEFINITIONS,
          // Meta-tools (plan_analysis, write_note, read_notes, review) removed:
          // they cause models to loop through prep steps and exhaust rounds.
          ...(founderMode && !gtmIntent ? [CHIPPIE_GTM_TOOL_DEFINITION] : []),
          ...(tavilyApiKey ? [CHIPPIE_WEBSEARCH_TOOL_DEFINITION] : []),
        ]
      : [...CHIPPIE_TOOL_DEFINITIONS];

  let systemPrompt = useComplexModel
    ? buildSystemPrompt(req.context, Boolean(tavilyApiKey))
    : buildSimpleSystemPrompt(req.context);

  // Append inline GTM grounding to system prompt
  if (gtmIntent) {
    systemPrompt += buildGtmInlineContext(gtmIntent);
  }

  const messages: ChippieMessage[] = [
    { role: 'system', content: systemPrompt },
    ...transcript,
  ];

  const SYNTHESIS_REMINDER: ChippieMessage = {
    role: 'system',
    content: 'Answer the user directly in natural prose using the values from the tool results above. Do NOT mention JSON, keys, functions, or tool mechanics.',
  };

  // ── Reasoning fast-path: no tools, stream directly ──
  if (complexity === 'reasoning') {
    console.log(`[chippie:stream] reasoning tier — streaming directly, no tools, model=${activeConfig.model}`);
    try {
      const streamer = callNimStreaming(activeConfig, messages);
      let result = await streamer.next();
      while (!result.done) {
        yield `data: ${JSON.stringify({ type: 'token', token: result.value })}\n\n`;
        result = await streamer.next();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      yield `data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`;
    }
    yield 'data: [DONE]\n\n';
    return;
  }

  try {
    // Run tool-calling rounds synchronously (non-streaming)
    for (let round = 0; round <= MAX_SERVER_TOOL_ROUNDS; round += 1) {
      const assistant = await callNim(activeConfig, messages, { tools: toolSet, complex: useComplexModel });
      const toolCalls = assistant.tool_calls ?? [];

      console.log(`[chippie:stream] round=${round} model=${activeConfig.model} toolCalls=${toolCalls.length} tools=[${toolCalls.map(c => c.function.name).join(',')}] content=${typeof assistant.content === 'string' ? assistant.content.slice(0, 80) : 'null'} reasoning=${(assistant as Record<string, unknown>).reasoning_content ? 'yes' : 'no'}`);

      if (toolCalls.length === 0) {
        // Empty-response guard for streaming — also check reasoning_content (DeepSeek)
        let contentStr = typeof assistant.content === 'string' ? assistant.content.trim() : '';
        // DeepSeek puts answers in reasoning_content when content is empty
        if (contentStr.length === 0) {
          const rc = (assistant as Record<string, unknown>).reasoning_content;
          if (typeof rc === 'string' && rc.trim().length > 0) {
            contentStr = rc.trim();
            assistant.content = contentStr;
          }
        }
        if (contentStr.length === 0 && round > 0 && round < MAX_SERVER_TOOL_ROUNDS) {
          messages.push({ role: 'assistant', content: '' });
          messages.push({
            role: 'system',
            content: 'Your response was empty. You have tool results above — use them to write a substantive answer to the user\'s question.',
          });
          continue;
        }
        // Final response — stream it if this is a synthesis after tools,
        // otherwise emit as a single chunk (it's already complete).
        if (round > 0) {
          // Re-run the final turn as streaming (we already have it, just emit)
          const content = contentStr || 'I wasn\'t able to generate a response for that request. Could you rephrase or try a simpler question?';
          // Emit token-by-token simulation for smooth rendering
          const words = content.split(/(\s+)/);
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join('');
            if (chunk) {
              yield `data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`;
            }
          }
        } else {
          // First round, no tools used — try streaming from NIM directly
          const synthMessages = messages[messages.length - 1]?.role === 'tool'
            ? [...messages, SYNTHESIS_REMINDER]
            : messages;
          try {
            const streamer = callNimStreaming(activeConfig, synthMessages);
            let result = await streamer.next();
            while (!result.done) {
              yield `data: ${JSON.stringify({ type: 'token', token: result.value })}\n\n`;
              result = await streamer.next();
            }
          } catch {
            // Fallback: emit the non-streamed response as a whole
            const content = typeof assistant.content === 'string' ? assistant.content : '';
            yield `data: ${JSON.stringify({ type: 'message', content })}\n\n`;
          }
        }
        yield 'data: [DONE]\n\n';
        return;
      }

      // Handle tool calls
      const serverCalls = toolCalls.filter((c) => isServerTool(c.function.name));
      const clientCalls = toolCalls.filter((c) => !isServerTool(c.function.name));

      if (clientCalls.length > 0) {
        // Client tools needed — emit a tool_calls event and stop streaming
        const serverResults: ChippieMessage[] = [];
        for (const call of serverCalls) {
          serverResults.push({
            role: 'tool',
            tool_call_id: call.id,
            content: await executeServerTool(call, toolOpts),
          });
        }
        yield `data: ${JSON.stringify({ type: 'tool_calls', message: assistant, toolCalls: clientCalls, serverResults: serverResults.length > 0 ? serverResults : undefined })}\n\n`;
        yield 'data: [DONE]\n\n';
        return;
      }

      // Server-only tools — execute and loop
      yield `data: ${JSON.stringify({ type: 'status', status: `Researching (${serverCalls.map((c) => c.function.name).join(', ')})...` })}\n\n`;
      messages.push(assistant);
      for (const call of serverCalls) {
        messages.push({ role: 'tool', tool_call_id: call.id, content: await executeServerTool(call, toolOpts) });
      }
      // After web_search results arrive, nudge the model to synthesize
      if (complexity === 'websearch' && serverCalls.some((c) => c.function.name === 'web_search')) {
        messages.push({
          role: 'system',
          content: 'You have web search results above. Synthesize the findings into a direct answer NOW. Do NOT call more tools — answer the user with the data you have, citing source URLs.',
        });
      }
    }

    yield `data: ${JSON.stringify({ type: 'message', content: 'I hit my research depth limit. Try narrowing the question.' })}\n\n`;
    yield 'data: [DONE]\n\n';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    yield `data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`;
    yield 'data: [DONE]\n\n';
  }
}

function demoResponse(): ChippieResponse {
  return {
    type: 'message',
    isDemo: true,
    message: {
      role: 'assistant',
      content: `### Chippie — Demo Mode

I'm running without a model backend (no \`NIM_API_KEY\` configured), so I can't reason over your question yet. Once connected, I can:

- **Explain any metric** — exact formula, inputs, and provenance from the Formula Library
- **Run what-if scenarios** — deterministic engine re-runs, never guesses
- **Search the governance docs** — FCL, Constitution, Build Object Spec, and more
- **Generate audit reports** — PDF/CSV/JSON with document IDs and integrity hashes
- **Propose assumption changes** — with rationale, for you to apply

*All numbers I ever cite come verbatim from the deterministic engine — I never compute them myself.*`,
    },
  };
}

// ---------------------------------------------------------------------------
// Main handler — framework-agnostic. Returns { status, body }.
// ---------------------------------------------------------------------------

export async function handleChippieRequest(
  body: unknown,
  env: Record<string, string | undefined> = process.env,
): Promise<{ status: number; body: ChippieResponse | { error: string } }> {
  const req = body as ChippieRequest | null;
  if (!req || !Array.isArray(req.messages) || req.messages.length === 0) {
    return { status: 400, body: { error: 'Request must include a non-empty messages array.' } };
  }
  if (req.messages.length > MAX_TRANSCRIPT_MESSAGES) {
    return { status: 400, body: { error: 'Transcript too long. Start a new conversation.' } };
  }
  // Never trust a client-supplied system prompt.
  const transcript = req.messages.filter((m) => m.role !== 'system');

  // ── Direct-answer fast path: intercept known-pattern queries before NIM. ──
  // Only fires on the first user message (not mid-conversation follow-ups)
  // to avoid hijacking contextual questions.
  const lastUserMsg = [...transcript].reverse().find((m) => m.role === 'user');
  if (lastUserMsg && transcript.filter((m) => m.role === 'user').length === 1) {
    const directAnswer = tryDirectAnswer(
      typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '',
      { buildName: req.context?.buildName, persona: req.context?.persona },
    );
    if (directAnswer) {
      return { status: 200, body: directAnswer };
    }
  }

  const config = getNimConfig(env);
  if (!config) {
    return { status: 200, body: demoResponse() };
  }

  const founderMode = req.context?.founderMode === true;
  const tavilyApiKey = env.TAVILY_API_KEY;
  const toolOpts: ServerToolOptions = { founderMode, tavilyApiKey, notes: new Map() };

  // GTM shortcut: for teardown/outreach first-message queries, skip the first
  // NIM call and return a synthetic tool_call for get_active_build_metrics.
  // Only fires when there are no tool results yet (prevents infinite loop).
  const lastUserContent = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';
  const gtmIntent = founderMode ? detectGtmIntent(lastUserContent) : null;
  const hasToolResults = transcript.some((m) => m.role === 'tool');
  if (gtmIntent && transcript.filter((m) => m.role === 'user').length === 1 && !hasToolResults) {
    const syntheticAssistant: ChippieMessage = {
      role: 'assistant',
      content: null,
      tool_calls: [{ id: `gtm-${Date.now()}`, type: 'function', function: { name: 'get_active_build_metrics', arguments: '{}' } }],
    };
    return {
      status: 200,
      body: { type: 'tool_calls', message: syntheticAssistant, toolCalls: syntheticAssistant.tool_calls },
    };
  }

  // ── Model routing: classify query complexity ──
  const complexity = classifyComplexity(transcript, founderMode);
  const useComplexModel = complexity === 'complex' || complexity === 'websearch' || complexity === 'reasoning';
  const webSearchConfig = complexity === 'websearch' ? getWebSearchConfig(env) : null;
  const activeModel = useComplexModel ? getComplexModel(env) : config.model;
  const activeConfig: NimConfig = webSearchConfig ?? { ...config, model: activeModel };

  // GTM pre-grounding: detect teardown/outreach intent and inline the grounding

  // Websearch tier gets a minimal tool set to prevent tool-calling loops.
  const websearchToolSet = [
    CHIPPIE_TOOL_DEFINITIONS.find((t) => t.function.name === 'search_docs')!,
    CHIPPIE_TOOL_DEFINITIONS.find((t) => t.function.name === 'get_active_build_metrics')!,
    ...(tavilyApiKey ? [CHIPPIE_WEBSEARCH_TOOL_DEFINITION] : []),
  ];

  // Simple queries get a trimmed tool set (no review, notes, plan — 8B can't use them reliably)
  const toolSet = complexity === 'websearch'
    ? websearchToolSet
    : useComplexModel
      ? [
          ...CHIPPIE_TOOL_DEFINITIONS,
          // Meta-tools removed — they cause models to loop through prep instead of answering.
          ...(founderMode && !gtmIntent ? [CHIPPIE_GTM_TOOL_DEFINITION] : []),
          ...(tavilyApiKey ? [CHIPPIE_WEBSEARCH_TOOL_DEFINITION] : []),
        ]
      : [
          ...CHIPPIE_TOOL_DEFINITIONS,
        ];

  // Simple queries get a shorter system prompt that the 8B can follow
  let systemPrompt = useComplexModel
    ? buildSystemPrompt(req.context, Boolean(tavilyApiKey))
    : buildSimpleSystemPrompt(req.context);

  // Append inline GTM grounding to system prompt
  if (gtmIntent) {
    systemPrompt += buildGtmInlineContext(gtmIntent);
  }

  const messages: ChippieMessage[] = [
    { role: 'system', content: systemPrompt },
    ...transcript,
  ];

  // Small models drift after tool results and start narrating the JSON.
  // Inject a just-in-time reminder whenever the next turn synthesizes from a tool result.
  const SYNTHESIS_REMINDER: ChippieMessage = {
    role: 'system',
    content:
      'Answer the user directly in natural prose using the values from the tool results above. Do NOT mention JSON, keys, functions, or tool mechanics.',
  };
  const withReminder = (msgs: ChippieMessage[]): ChippieMessage[] =>
    msgs[msgs.length - 1]?.role === 'tool' ? [...msgs, SYNTHESIS_REMINDER] : msgs;

  // Post-hoc hallucination guard: detect GTM drafts that contain positioning
  // fluff without real build metrics. Triggers a correction prompt.
  const GTM_FLUFF_PATTERNS = [
    /siliconomics is the decision system/i,
    /deterministic,?\s*auditable\s*(program)?\s*modeling/i,
    /\$100M\+?\s*chip decisions/i,
    /without\s*\$?100M\s*of\s*tribal\s*knowledge/i,
    /computes,?\s*doesn'?t\s*guess/i,
    /golden.test.locked/i,
  ];
  const NUM_PATTERN = /\b\d[\d,.]*%|\$[\d,.]+[BMK]?|\b\d[\d,.]+\s*(mm²|nm|units|wafers|M\b|B\b)/gi;

  function isGtmHallucination(content: string): boolean {
    if (!content.includes('DRAFT')) return false;
    const fluffHits = GTM_FLUFF_PATTERNS.filter((p) => p.test(content)).length;
    const metricMatches = content.match(NUM_PATTERN) ?? [];
    // If more than 2 positioning phrases and fewer than 3 real numbers → likely hallucinated
    return fluffHits >= 2 && metricMatches.length < 3;
  }

  const GTM_CORRECTION: ChippieMessage = {
    role: 'system',
    content:
      'STOP. Your GTM draft contains generic Siliconomics positioning copy instead of the active build\'s real metrics. This is hallucination. You MUST call get_active_build_metrics now and rewrite the draft using the actual yield, margin, cost, and volume numbers from the engine. The draft should tell the BUILD\'s silicon economics story, not pitch the platform.',
  };

  try {
    // ── Reasoning fast-path: no tools, single call ──
    if (complexity === 'reasoning') {
      console.log(`[chippie] reasoning tier — no tools, model=${activeConfig.model}`);
      const assistant = await callNim(activeConfig, withReminder(messages), { tools: false, complex: true });
      let content = typeof assistant.content === 'string' ? assistant.content.trim() : '';
      // DeepSeek fallback: check reasoning_content
      if (!content) {
        const rc = (assistant as Record<string, unknown>).reasoning_content;
        if (typeof rc === 'string' && rc.trim()) {
          content = rc.trim();
          assistant.content = content;
        }
      }
      if (!content) {
        return { status: 200, body: { type: 'message', message: { role: 'assistant', content: 'I wasn\'t able to generate a response. Could you rephrase?' } } };
      }
      return { status: 200, body: { type: 'message', message: assistant } };
    }

    for (let round = 0; round <= MAX_SERVER_TOOL_ROUNDS; round += 1) {
      const assistant = await callNim(activeConfig, withReminder(messages), { tools: toolSet, complex: useComplexModel });
      const toolCalls = assistant.tool_calls ?? [];

      if (toolCalls.length === 0) {
        // Check for GTM hallucination and force a correction round
        if (founderMode && typeof assistant.content === 'string' && isGtmHallucination(assistant.content) && round < MAX_SERVER_TOOL_ROUNDS) {
          messages.push(assistant);
          messages.push(GTM_CORRECTION);
          continue;
        }
        // Empty-response guard: if the model returned blank content after tool
        // rounds, inject a nudge and retry rather than showing an empty bubble.
        let contentStr = typeof assistant.content === 'string' ? assistant.content.trim() : '';
        // DeepSeek fallback: check reasoning_content
        if (contentStr.length === 0) {
          const rc = (assistant as Record<string, unknown>).reasoning_content;
          if (typeof rc === 'string' && rc.trim().length > 0) {
            contentStr = rc.trim();
            assistant.content = contentStr;
          }
        }
        if (contentStr.length === 0 && round > 0 && round < MAX_SERVER_TOOL_ROUNDS) {
          messages.push({ role: 'assistant', content: '' });
          messages.push({
            role: 'system',
            content: 'Your response was empty. You have tool results above — use them to write a substantive answer to the user\'s question.',
          });
          continue;
        }
        // Quality gate: catch shallow responses (e.g., bare "You should navigate to X")
        // and enrich them from the direct-answer bank when possible.
        if (contentStr.length > 0 && contentStr.length < 120 && lastUserMsg) {
          const enriched = tryDirectAnswer(
            typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '',
            { buildName: req.context?.buildName, persona: req.context?.persona },
          );
          if (enriched) {
            return { status: 200, body: enriched };
          }
        }
        // Final fallback: never return truly empty content
        if (contentStr.length === 0) {
          return {
            status: 200,
            body: { type: 'message', message: { role: 'assistant', content: 'I wasn\'t able to generate a response for that request. Could you rephrase or try a simpler question?' } },
          };
        }
        return { status: 200, body: { type: 'message', message: assistant } };
      }

      const serverCalls = toolCalls.filter((c) => isServerTool(c.function.name));
      const clientCalls = toolCalls.filter((c) => !isServerTool(c.function.name));

      if (clientCalls.length > 0) {
        // Hand the whole assistant message back; client executes its calls and
        // must also echo back results for any server calls we ran here.
        const serverResults: ChippieMessage[] = [];
        for (const call of serverCalls) {
          serverResults.push({
            role: 'tool',
            tool_call_id: call.id,
            content: await executeServerTool(call, toolOpts),
          });
        }
        return {
          status: 200,
          body: {
            type: 'tool_calls',
            message: assistant,
            toolCalls: clientCalls,
            // Piggyback pre-computed server tool results so the client can
            // include them when continuing the conversation.
            ...(serverResults.length > 0 ? { serverResults } : {}),
          },
        };
      }

      // Only server tools — execute and loop.
      messages.push(assistant);
      for (const call of serverCalls) {
        messages.push({ role: 'tool', tool_call_id: call.id, content: await executeServerTool(call, toolOpts) });
      }
      // After web_search results arrive, nudge the model to synthesize
      if (complexity === 'websearch' && serverCalls.some((c) => c.function.name === 'web_search')) {
        messages.push({
          role: 'system',
          content: 'You have web search results above. Synthesize the findings into a direct answer NOW. Do NOT call more tools — answer the user with the data you have, citing source URLs.',
        });
      }
    }
    return {
      status: 200,
      body: {
        type: 'message',
        message: { role: 'assistant', content: 'I hit my research depth limit for this question. Try narrowing it down.' },
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[chippie] upstream error:', msg);
    return { status: 502, body: { error: `Chippie backend error: ${msg}` } };
  }
}

// ---------------------------------------------------------------------------
// One-shot briefings — narrative generation for ComparisonView and
// DecisionCenterView (replaces the retired Gemini proxies). No tool loop:
// deterministic engine metrics arrive in the payload and are embedded in the
// prompt PRE-FORMATTED, so the model quotes figures verbatim.
// ---------------------------------------------------------------------------

interface BriefingBuild {
  name?: string;
  version?: string;
  portfolio?: string;
  designModel?: Record<string, unknown>;
}
interface BriefingComputed {
  snapshot?: Record<string, unknown>;
}

const asNum = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const fmt = (v: unknown, digits = 2, suffix = ''): string => {
  const n = asNum(v);
  return n === null ? 'n/a' : `${n.toFixed(digits)}${suffix}`;
};
const pct = (v: unknown): string => fmt(v, 2, '%');
const usd = (v: unknown): string => {
  const n = asNum(v);
  return n === null ? 'n/a' : `$${n.toFixed(2)}`;
};
const yieldPct = (v: unknown): string => {
  const n = asNum(v);
  return n === null ? 'n/a' : `${(n * 100).toFixed(2)}%`;
};

const BRIEFING_SYSTEM = `You are a world-class principal semiconductor economist and chip architect advising a Fortune 100 board of directors. You write board-ready markdown briefings.
HARD RULE: every numeric figure you state must be quoted EXACTLY as it appears in the data provided — never recompute, re-round, or invent numbers. No emojis.`;

function buildDescription(build: BriefingBuild, computed: BriefingComputed, label?: string): string {
  const dm = build.designModel ?? {};
  const snap = computed.snapshot ?? {};
  return `${label ? `${label}: ` : ''}${build.name ?? 'Unnamed build'} (${build.version ?? 'unversioned'})
- Process Node: ${dm.processNode ?? 'n/a'} | Topology: ${dm.topology ?? 'n/a'} (${dm.chipletCount ?? 'n/a'} chiplet(s))
- Die Area: ${fmt(dm.dieArea, 1, ' mm²')} | Transistors: ${fmt(dm.transistorCount, 1, 'B')} | TDP: ${fmt(dm.tdp, 0, ' W')}
- Defect Density (D0): ${fmt(dm.defectDensity, 3, ' defects/cm²')} | Wafer Cost: ${usd(dm.waferCost)}
- Packaging Yield: ${pct(dm.packagingYield)} | Test Yield: ${pct(dm.testYield)}
- NRE: ${fmt(dm.nreCost, 1, ' $M')} | ASP: ${usd(dm.asp)} | Target Volume: ${fmt(dm.targetVolume, 1, ' M units')}
Engine outputs (deterministic):
- Die Yield: ${yieldPct(snap.dieYield)} | Dies Per Wafer: ${fmt(snap.dpw, 0)}
- Cost per Good Die: ${usd(snap.grossCostPerGoodDie)} | Fully Loaded Cost: ${usd(snap.fullyLoadedCostPerDie)}
- Gross Margin: ${pct(snap.grossMargin)} | Operating Margin: ${pct(snap.operatingMargin)}
- Break-Even Volume: ${fmt(snap.breakEvenVolumeMillion, 2, ' M units')} | Lifetime Net Profit: ${fmt(snap.lifetimeNetProfitMillion, 1, ' $M')} | ROI: ${pct(snap.roi)}`;
}

function demoAnalyze(build: BriefingBuild, computed: BriefingComputed): string {
  const dm = build.designModel ?? {};
  const snap = computed.snapshot ?? {};
  return `### **Executive Briefing**
The **${build.name ?? 'active'}** build on **${dm.processNode ?? 'the selected node'}** posts a die yield of **${yieldPct(snap.dieYield)}** and a gross margin of **${pct(snap.grossMargin)}**, breaking even at **${fmt(snap.breakEvenVolumeMillion, 2)} million units**.

### **Technical Architecture Analysis**
- **Node & Topology**: ${dm.processNode ?? 'n/a'}, ${dm.topology ?? 'n/a'} topology across ${fmt(dm.dieArea, 1)} mm².
- **Power**: TDP ${fmt(dm.tdp, 0)} W at power density ${fmt(snap.tdpPowerDensity, 3)} W/mm².

### **Manufacturing & Risk Report**
- **Defect Density (D0)**: ${fmt(dm.defectDensity, 3)} defects/cm².
- **Assembly**: packaging yield ${pct(dm.packagingYield)}, test yield ${pct(dm.testYield)}.

### **Financial Sensitivity Summary**
- **Break-Even**: amortizing ${fmt(dm.nreCost, 1)} $M NRE requires ${fmt(snap.breakEvenVolumeMillion, 2)} million units at ASP ${usd(dm.asp)}.
- **Unit Economics**: cost per good die ${usd(snap.grossCostPerGoodDie)}, ROI ${pct(snap.roi)}.

*Demo mode — connect a model backend for narrative analysis. All figures above come from the deterministic engine.*`;
}

function demoCompare(a: BriefingBuild, ca: BriefingComputed, b: BriefingBuild, cb: BriefingComputed): string {
  const sa = ca.snapshot ?? {};
  const sb = cb.snapshot ?? {};
  return `### **Executive Trade-Off Summary**
**${a.name ?? 'Build A'}** posts gross margin **${pct(sa.grossMargin)}** and ROI **${pct(sa.roi)}**; **${b.name ?? 'Build B'}** posts gross margin **${pct(sb.grossMargin)}** and ROI **${pct(sb.roi)}**.

### **Architectural Trade-Offs**
- ${a.name ?? 'Build A'}: ${a.designModel?.processNode ?? 'n/a'}, ${a.designModel?.topology ?? 'n/a'} | ${b.name ?? 'Build B'}: ${b.designModel?.processNode ?? 'n/a'}, ${b.designModel?.topology ?? 'n/a'}

### **Operational Risks**
- Wafer cost: ${usd(a.designModel?.waferCost)} vs ${usd(b.designModel?.waferCost)} | D0: ${fmt(a.designModel?.defectDensity, 3)} vs ${fmt(b.designModel?.defectDensity, 3)} defects/cm²

### **Strategic Recommendation**
Lifetime net profit: **${fmt(sa.lifetimeNetProfitMillion, 1)} $M** vs **${fmt(sb.lifetimeNetProfitMillion, 1)} $M**. Review the deterministic comparison grid for the full evidence base.

*Demo mode — connect a model backend for narrative analysis. All figures above come from the deterministic engine.*`;
}

export interface ChippieBriefingResponse {
  content: string;
  isDemo: boolean;
}

export async function handleChippieBriefing(
  body: unknown,
  env: Record<string, string | undefined> = process.env,
): Promise<{ status: number; body: ChippieBriefingResponse | { error: string } }> {
  const req = body as
    | {
        kind?: string;
        build?: BriefingBuild;
        computed?: BriefingComputed;
        buildA?: BriefingBuild;
        computedA?: BriefingComputed;
        buildB?: BriefingBuild;
        computedB?: BriefingComputed;
      }
    | null;

  let prompt: string;
  let demo: string;

  if (req?.kind === 'analyze' && req.build && req.computed) {
    prompt = `Analyze this silicon program build and its deterministic engine outputs.

${buildDescription(req.build, req.computed)}

Generate a board-ready executive report in clean markdown with EXACTLY these H3 sections:
1. ### **Executive Briefing** (3 concise sentences on yield vs. margin, ROI, commercial viability)
2. ### **Technical Architecture Analysis** (node choice, topology trade-offs, power density)
3. ### **Manufacturing & Risk Report** (D0, assembly and test yields, yield-curve risks)
4. ### **Financial Sensitivity Summary** (NRE amortization, break-even volume, ASP sensitivity)

Quote every figure exactly as given above.`;
    demo = demoAnalyze(req.build, req.computed);
  } else if (req?.kind === 'compare' && req.buildA && req.computedA && req.buildB && req.computedB) {
    prompt = `Compare these two silicon program builds side-by-side using their deterministic engine outputs.

${buildDescription(req.buildA, req.computedA, 'BUILD A')}

${buildDescription(req.buildB, req.computedB, 'BUILD B')}

Generate a side-by-side analysis in clean markdown with EXACTLY these H3 sections:
1. ### **Executive Trade-Off Summary** (3 sentences comparing margins, ROI, profit differentials)
2. ### **Architectural Trade-Offs** (node choices, density, monolithic vs chiplet)
3. ### **Operational Risks** (wafer costs, yields, defect densities)
4. ### **Strategic Recommendation** (which build to fund, backed by risk-adjusted figures)

Quote every figure exactly as given above.`;
    demo = demoCompare(req.buildA, req.computedA, req.buildB, req.computedB);
  } else {
    return { status: 400, body: { error: 'Briefing request must be {kind:"analyze",build,computed} or {kind:"compare",buildA,computedA,buildB,computedB}.' } };
  }

  const config = getNimConfig(env);
  if (!config) {
    return { status: 200, body: { content: demo, isDemo: true } };
  }

  try {
    const message = await callNim(
      config,
      [
        { role: 'system', content: BRIEFING_SYSTEM },
        { role: 'user', content: prompt },
      ],
      { tools: false, temperature: 0.2 },
    );
    return { status: 200, body: { content: message.content ?? 'No response generated.', isDemo: false } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[chippie-brief] upstream error:', msg);
    return { status: 502, body: { error: `Chippie briefing error: ${msg}` } };
  }
}

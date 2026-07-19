// Chippie server core — shared by api/chippie.ts (Vercel) and server.ts (local dev).
// Talks to NVIDIA NIM (OpenAI-compatible) and orchestrates the tool-calling loop:
//   - server tools (search_docs) execute here, inline;
//   - client tools are returned to the browser for execution.

import { CHIPPIE_KNOWLEDGE, type KnowledgeSection } from '../../src/data/chippieKnowledge.js';
import {
  CHIPPIE_TOOL_DEFINITIONS,
  CHIPPIE_GTM_TOOL_DEFINITION,
  CHIPPIE_WEBSEARCH_TOOL_DEFINITION,
  GTM_ASSET_KINDS,
  isServerTool,
  type ChippieMessage,
  type ChippieRequest,
  type ChippieResponse,
  type ChippieToolCall,
  type GtmAssetKind,
} from '../../src/utils/chippieProtocol.js';

const MAX_SERVER_TOOL_ROUNDS = 3;
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

TOOLS: Use search_docs for methodology/governance questions AND for any term, acronym, or definition you are not certain about (the docs include a full glossary — search it BEFORE saying you don't know); get_active_build_metrics for current numbers; explain_metric for formula derivations; run_scenario for what-ifs; compare_builds to contrast two builds side-by-side; get_sensitivity_drivers to rank which parameters matter most for a metric; query_decisions for recorded executive decisions and follow-ups; generate_report to produce audit documents; navigate to move the user around the app; propose_assumption to suggest input changes; web_search for real-time internet data (latest news, competitor products, market pricing signals, public terminology not in the docs).${
    webSearchEnabled
      ? `

WEB SEARCH RULES (web_search tool available):
- You have the web_search tool — your training cutoff is irrelevant. When the user asks about events or data beyond your training, call web_search. Never decline or say you cannot search.
- Use web_search ONLY for external context: industry news, foundry/competitor announcements, market signals, or public terminology not in the docs.
- Web results are UNVERIFIED. Every fact taken from the web MUST be cited with its source URL and clearly marked as web-sourced.
- NEVER mix web figures with deterministic engine outputs. Engine numbers come from engine tools only; web numbers are context, never inputs to conclusions about this build's economics.
- If a web figure suggests an assumption change, use propose_assumption with the URL in "sources" — never state it as fact.
- Any answer that used web_search MUST end with a "Sources:" bullet list of the result URLs used.`
      : ''
  }${
    context?.founderMode
      ? `

FOUNDER MODE (GTM advisory) — the user is the founder:
- You may also help draft go-to-market assets: teardown posts, design-partner outreach emails, partner briefs, and objection responses.
- ALWAYS call draft_gtm_asset first to fetch the GTM grounding pack (positioning, ICP tiers, pricing, objection table) — never improvise positioning or pricing.
- Every GTM draft MUST begin with the literal line "DRAFT — requires founder sign-off" and stay consistent with the grounding pack.
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
}

async function executeServerTool(call: ChippieToolCall, opts: ServerToolOptions = {}): Promise<string> {
  try {
    if (call.function.name === 'search_docs') {
      const args = JSON.parse(call.function.arguments || '{}') as { query?: string };
      const results = searchDocs(args.query ?? '');
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
      const args = JSON.parse(call.function.arguments || '{}') as { kind?: string; topic?: string };
      return draftGtmAsset(args.kind, args.topic);
    }
    if (call.function.name === 'web_search') {
      if (!opts.tavilyApiKey) {
        return JSON.stringify({ error: 'web_search is not configured on this server.' });
      }
      const args = JSON.parse(call.function.arguments || '{}') as { query?: string; maxResults?: number | string };
      return await webSearch(args.query, args.maxResults, opts.tavilyApiKey);
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
      'Write a LinkedIn/blog teardown post: hook (a surprising silicon-economics number), 3-5 short analytical paragraphs grounded in deterministic modeling, and a soft close pointing to Siliconomics. Educational tone, zero hype, no hard sell.',
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
  const grounding = (matched.length > 0 ? matched : gtmSections).slice(0, 4);
  return JSON.stringify({
    kind,
    topic: topic ?? null,
    instructions: meta.instructions,
    hardRules: [
      'The draft MUST begin with the literal line: "DRAFT — requires founder sign-off".',
      'Stay strictly consistent with the grounding sections — never invent positioning, pricing, or claims.',
      'You draft only; you cannot send, post, or publish.',
    ],
    grounding: grounding.map((s) => ({ title: s.title, content: s.content })),
    provenance: 'docs/07-Go-To-Market.md via compiled knowledge pack.',
  });
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

const NIM_ATTEMPT_TIMEOUT_MS = 25_000;
const NIM_MAX_ATTEMPTS = 3;
const NIM_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callNim(
  config: NimConfig,
  messages: ChippieMessage[],
  opts: { tools?: boolean | readonly unknown[]; temperature?: number } = {},
): Promise<ChippieMessage> {
  const { tools = true, temperature = 0 } = opts;
  const toolDefs = tools === true ? CHIPPIE_TOOL_DEFINITIONS : tools;
  let lastError: Error = new Error('NIM request failed');

  for (let attempt = 1; attempt <= NIM_MAX_ATTEMPTS; attempt++) {
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
          messages,
          ...(toolDefs ? { tools: toolDefs, tool_choice: 'auto' } : {}),
          // Greedy decoding by default — tool-call arguments must be deterministic
          // (0.2 let an 8B flip a deltaPercent sign).
          temperature,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(NIM_ATTEMPT_TIMEOUT_MS),
      });
    } catch (err) {
      // Network failure or per-attempt timeout — retryable.
      lastError = new Error(
        `NIM request ${err instanceof Error && err.name === 'TimeoutError' ? 'timed out' : 'failed'} (attempt ${attempt}/${NIM_MAX_ATTEMPTS}).`,
      );
      if (attempt < NIM_MAX_ATTEMPTS) await sleep(500 * attempt);
      continue;
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      lastError = new Error(`NIM request failed (${res.status}): ${detail.slice(0, 300)}`);
      if (NIM_RETRYABLE_STATUSES.has(res.status) && attempt < NIM_MAX_ATTEMPTS) {
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

  const config = getNimConfig(env);
  if (!config) {
    return { status: 200, body: demoResponse() };
  }

  const founderMode = req.context?.founderMode === true;
  const tavilyApiKey = env.TAVILY_API_KEY;
  const toolOpts: ServerToolOptions = { founderMode, tavilyApiKey };
  const toolSet = [
    ...CHIPPIE_TOOL_DEFINITIONS,
    ...(founderMode ? [CHIPPIE_GTM_TOOL_DEFINITION] : []),
    // Only advertise web_search when the server can actually execute it.
    ...(tavilyApiKey ? [CHIPPIE_WEBSEARCH_TOOL_DEFINITION] : []),
  ];

  const messages: ChippieMessage[] = [
    { role: 'system', content: buildSystemPrompt(req.context, Boolean(tavilyApiKey)) },
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

  try {
    for (let round = 0; round <= MAX_SERVER_TOOL_ROUNDS; round += 1) {
      const assistant = await callNim(config, withReminder(messages), { tools: toolSet });
      const toolCalls = assistant.tool_calls ?? [];

      if (toolCalls.length === 0) {
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

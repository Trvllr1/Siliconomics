// Chippie server core — shared by api/chippie.ts (Vercel) and server.ts (local dev).
// Talks to NVIDIA NIM (OpenAI-compatible) and orchestrates the tool-calling loop:
//   - server tools (search_docs) execute here, inline;
//   - client tools are returned to the browser for execution.

import { CHIPPIE_KNOWLEDGE, type KnowledgeSection } from '../../src/data/chippieKnowledge.js';
import {
  CHIPPIE_TOOL_DEFINITIONS,
  isServerTool,
  type ChippieMessage,
  type ChippieRequest,
  type ChippieResponse,
  type ChippieToolCall,
} from '../../src/utils/chippieProtocol.js';

const MAX_SERVER_TOOL_ROUNDS = 3;
const MAX_TRANSCRIPT_MESSAGES = 40;

// ---------------------------------------------------------------------------
// System prompt — Chippie's identity and the cite-only provenance rule.
// ---------------------------------------------------------------------------

function buildSystemPrompt(context?: ChippieRequest['context']): string {
  const contextLine = context?.buildName
    ? `Active build: "${context.buildName}" (${context.buildVersion ?? 'unversioned'}). Active persona: ${context.persona ?? 'unknown'}.`
    : 'No active build context provided.';

  return `You are Chippie, the embedded program advisor inside Siliconomics — a deterministic silicon economics decision platform. You help semiconductor program teams (architects, manufacturing, finance, program managers, executives) reason about yield, cost, margin, and program risk.

${contextLine}

NON-NEGOTIABLE PROVENANCE RULES:
1. You NEVER compute, estimate, or invent numeric results yourself. Every number you state must come verbatim from a tool result (the deterministic engine, the Formula Library, or a generated report). If you don't have a number from a tool, call the tool or say you don't have it.
2. When citing metrics, mention where they came from (e.g., "engine output for build X", "Formula Library f-murphy-yield v1.2").
3. What-if analysis MUST go through the run_scenario tool. Never extrapolate metric changes in your head.
4. You never modify user data. To recommend an input change, use propose_assumption — a human applies it.

STYLE:
- Be concise and executive-grade. Use short paragraphs, bold key figures, and bullet lists.
- Lead with the answer, then the supporting evidence.
- Use markdown (###, **bold**, bullets). No emojis.
- If a question is outside silicon economics or this product, politely decline.

AFTER A TOOL RETURNS:
- Answer the user's question directly using the numbers from the tool result. NEVER describe the JSON, the function call, or the mechanics of the tool ("this response is a JSON object...", "the output of the function..."). The user only sees your prose — speak to them, not about the data format.
- For scenarios: state each key metric as "X (was Y)" with direction, then one sentence of takeaway.

TOOLS: Use search_docs for methodology/governance questions; get_active_build_metrics for current numbers; explain_metric for formula derivations; run_scenario for what-ifs; generate_report to produce audit documents; navigate to move the user around the app; propose_assumption to suggest input changes.`;
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

function executeServerTool(call: ChippieToolCall): string {
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
    return JSON.stringify({ error: `Unknown server tool: ${call.function.name}` });
  } catch (e) {
    return JSON.stringify({ error: `Tool execution failed: ${e instanceof Error ? e.message : String(e)}` });
  }
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

async function callNim(config: NimConfig, messages: ChippieMessage[]): Promise<ChippieMessage> {
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
          tools: CHIPPIE_TOOL_DEFINITIONS,
          tool_choice: 'auto',
          temperature: 0.2,
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

  const messages: ChippieMessage[] = [
    { role: 'system', content: buildSystemPrompt(req.context) },
    ...transcript,
  ];

  try {
    for (let round = 0; round <= MAX_SERVER_TOOL_ROUNDS; round += 1) {
      const assistant = await callNim(config, messages);
      const toolCalls = assistant.tool_calls ?? [];

      if (toolCalls.length === 0) {
        return { status: 200, body: { type: 'message', message: assistant } };
      }

      const serverCalls = toolCalls.filter((c) => isServerTool(c.function.name));
      const clientCalls = toolCalls.filter((c) => !isServerTool(c.function.name));

      if (clientCalls.length > 0) {
        // Hand the whole assistant message back; client executes its calls and
        // must also echo back results for any server calls we ran here.
        const serverResults: ChippieMessage[] = serverCalls.map((call) => ({
          role: 'tool',
          tool_call_id: call.id,
          content: executeServerTool(call),
        }));
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
        messages.push({ role: 'tool', tool_call_id: call.id, content: executeServerTool(call) });
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

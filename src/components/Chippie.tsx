/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Chippie — Siliconomics' embedded program advisor.
// Multi-turn, tool-calling chat backed by NVIDIA-hosted open models via /api/chippie.
// Chippie never computes numbers: every figure is cited from the deterministic
// engine, the Formula Library, or the report engine via tool calls.

import React, { useState, useEffect, useRef } from 'react';
import { Build, Decision, PersonaType } from '../types';
import { ComputedBuildMetrics } from '../utils/mathEngine';
import type { ChippieMessage, ChippieResponse } from '../utils/chippieProtocol';
import { executeClientTool, type ChippieToolActivity } from '../utils/chippieTools';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, RefreshCw, Wrench } from 'lucide-react';

interface ChippieProps {
  activeBuild: Build;
  computedMetrics: ComputedBuildMetrics;
  activePersona: PersonaType;
  decisions?: Decision[];
  onNavigate?: (tab: string) => void;
}

interface DisplayMessage {
  id: string;
  sender: 'user' | 'assistant' | 'tools';
  text: string;
  activities?: ChippieToolActivity[];
  timestamp: string;
}

const MAX_TOOL_ROUNDS = 5;

// Simple custom markdown renderer to format structured responses safely and beautifully
function RenderCustomMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-3 font-sans text-xs leading-relaxed text-art-ink/80">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Headers: ### **Title** or ### Title
        if (trimmed.startsWith('###')) {
          const content = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '');
          return (
            <h4 key={idx} className="text-xs font-serif italic font-bold text-art-ink border-b border-art-ink/10 pb-1.5 pt-3 uppercase tracking-wider first:pt-0">
              {content}
            </h4>
          );
        }

        // Bold headers in normal lines or list items
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const listContent = trimmed.replace(/^[-*]\s*/, '');
          const boldMatch = listContent.match(/^\*\*(.*?)\*\*:(.*)$/);
          if (boldMatch) {
            return (
              <div key={idx} className="flex items-start space-x-1.5 pl-2">
                <span className="text-art-rust mt-1">•</span>
                <p className="text-art-ink/80">
                  <strong className="text-art-ink font-bold">{boldMatch[1]}:</strong>
                  {boldMatch[2]}
                </p>
              </div>
            );
          }

          const parts = listContent.split('**');
          return (
            <div key={idx} className="flex items-start space-x-1.5 pl-2">
              <span className="text-art-rust mt-1">•</span>
              <p className="text-art-ink/80">
                {parts.map((part, pIdx) => (
                  pIdx % 2 === 1 ? <strong key={pIdx} className="text-art-ink font-bold">{part}</strong> : part
                ))}
              </p>
            </div>
          );
        }

        // Regular paragraphs with bold text split
        if (trimmed.length > 0) {
          const parts = trimmed.split('**');
          return (
            <p key={idx} className="text-art-ink/80">
              {parts.map((part, pIdx) => (
                pIdx % 2 === 1 ? <strong key={pIdx} className="text-art-ink font-bold">{part}</strong> : part
              ))}
            </p>
          );
        }

        return <div key={idx} className="h-1" />;
      })}
    </div>
  );
}

function nowStamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chippie({ activeBuild, computedMetrics, activePersona, decisions, onNavigate }: ChippieProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusLine, setStatusLine] = useState('Thinking...');
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // OpenAI-format transcript (no system message — server owns it)
  const transcriptRef = useRef<ChippieMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = [
    'Explain how die yield is computed',
    'What if defect density improves 20%?',
    'Where does most of our unit cost come from?',
    'Generate the audit PDF for this build',
  ];

  // Reset conversation when the active build changes
  useEffect(() => {
    transcriptRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional conversation reset on build switch, mirrors prior AiAdvisor behavior
    setIsDemo(false);
    setError(null);
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `### **Chippie — Program Advisor**
I'm wired into the deterministic engine, the validated Formula Library, and the governance docs for this workspace. Every number I cite comes straight from the engine — I never estimate.

Reviewing **${activeBuild.name}** as **${activePersona}**. Ask me to explain a metric, run a what-if, or generate an audit report.`,
        timestamp: nowStamp(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBuild.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const callApi = async (): Promise<ChippieResponse> => {
    const response = await fetch('/api/chippie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: transcriptRef.current,
        context: {
          buildName: activeBuild.name,
          buildVersion: activeBuild.version,
          persona: activePersona,
        },
      }),
    });
    const raw = await response.text();
    const data = ((): (ChippieResponse & { error?: string }) | null => {
      try {
        return raw ? (JSON.parse(raw) as ChippieResponse & { error?: string }) : null;
      } catch {
        return null;
      }
    })();
    if (!response.ok || !data) {
      throw new Error(
        data?.error ||
          `Chippie API unreachable (${response.status}). In local dev, start the API with \`npm run dev:server\`.`,
      );
    }
    return data;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    setLoading(true);
    setStatusLine('Thinking...');
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(), sender: 'user', text: textToSend, timestamp: nowStamp() },
    ]);
    setInputText('');
    transcriptRef.current = [...transcriptRef.current, { role: 'user', content: textToSend }];

    try {
      for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
        const data = await callApi();
        if (data.isDemo) setIsDemo(true);

        transcriptRef.current = [...transcriptRef.current, data.message];

        if (data.type === 'message' || !data.toolCalls || data.toolCalls.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'assistant',
              text: data.message.content ?? '(no response)',
              timestamp: nowStamp(),
            },
          ]);
          break;
        }

        // Execute client tools, include any server results piggybacked this round
        const toolMessages: ChippieMessage[] = [...(data.serverResults ?? [])];
        const activities: ChippieToolActivity[] = [];
        for (const call of data.toolCalls) {
          setStatusLine(`Running ${call.function.name.replace(/_/g, ' ')}...`);
          const { content, activity } = await executeClientTool(call, {
            activeBuild,
            computedMetrics,
            activePersona,
            decisions,
            onNavigate,
          });
          toolMessages.push({ role: 'tool', tool_call_id: call.id, content });
          activities.push(activity);
        }

        transcriptRef.current = [...transcriptRef.current, ...toolMessages];
        setMessages((prev) => [
          ...prev,
          { id: Math.random().toString(), sender: 'tools', text: '', activities, timestamp: nowStamp() },
        ]);
        setStatusLine('Synthesizing answer...');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Connection lost. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-art-ink/10 rounded-xl shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-white flex items-center justify-between border-b border-art-ink/10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-art-rust fill-art-rust/20 animate-pulse" />
          <span className="text-xs font-serif font-bold uppercase tracking-wider text-art-ink">Chippie</span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
            isDemo
              ? 'bg-art-cream text-art-ink/60 border-art-ink/20'
              : 'bg-art-rust/20 text-art-rust border-art-rust/30'
          }`}
        >
          {isDemo ? 'Demo Mode' : 'Engine-Grounded'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-art-cream/25">
        {messages.map((msg) => {
          if (msg.sender === 'tools') {
            return (
              <div key={msg.id} className="flex flex-wrap gap-1.5 pl-9">
                {(msg.activities ?? []).map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center space-x-1 text-[9px] font-mono bg-art-ink/5 text-art-ink/60 border border-art-ink/10 rounded-full px-2 py-0.5"
                  >
                    <Wrench className="w-2.5 h-2.5 text-art-rust" />
                    <span>{a.summary}</span>
                  </span>
                ))}
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className={`flex space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender !== 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-art-ink border border-art-ink/10 flex items-center justify-center text-art-cream shadow-sm">
                  <Bot className="w-4 h-4 text-art-rust" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 shadow-sm border ${
                  msg.sender === 'user'
                    ? 'bg-art-rust text-white border-art-rust rounded-tr-none'
                    : 'bg-white text-art-ink border-2 border-art-ink/5 rounded-tl-none'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="text-xs whitespace-pre-wrap font-medium">{msg.text}</p>
                ) : (
                  <RenderCustomMarkdown text={msg.text} />
                )}
                <span
                  className={`block text-[9px] mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-white/85' : 'text-art-ink/40 font-mono'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-art-cream border border-art-ink/10 flex items-center justify-center text-art-ink shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex space-x-2.5 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-art-ink border border-art-ink/10 flex items-center justify-center text-art-rust animate-spin">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[80%] rounded-xl p-3 bg-white border-2 border-art-ink/5 shadow-sm flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 text-art-rust animate-spin" />
              <span className="text-xs text-art-ink/50 italic font-mono">{statusLine}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Consultation Interrupted</p>
              <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Data-flow disclosure */}
      <div className="px-3 py-1.5 bg-art-cream/60 border-t border-art-ink/5">
        <p className="text-[9px] font-mono text-art-ink/40 leading-relaxed">
          Chippie sends your question and build context to NVIDIA-hosted open models via our proxy — opt-in per message, never automatic. All figures are cited from the deterministic engine.
        </p>
      </div>

      {/* Suggested Quick Consults */}
      <div className="px-3 py-2.5 bg-art-cream border-t border-b border-art-ink/10">
        <span className="text-[9px] font-mono font-bold text-art-ink/40 uppercase tracking-widest block mb-1.5">
          Tactical Analysis Shortcuts
        </span>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[10px] bg-white hover:bg-art-cream/60 text-art-ink/80 border border-art-ink/10 hover:border-art-ink/20 rounded-lg px-2.5 py-1 font-semibold transition duration-150 disabled:opacity-55 cursor-pointer shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="p-2.5 bg-white flex space-x-2 border-t border-art-ink/10"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask Chippie about ${activeBuild.name}...`}
          disabled={loading}
          className="flex-1 bg-art-cream/30 hover:bg-art-cream/50 focus:bg-white text-xs border border-art-ink/10 focus:border-art-rust focus:ring-1 focus:ring-art-rust/20 rounded-lg px-3 py-2 outline-none transition duration-150 disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="bg-art-rust hover:bg-art-rust/90 disabled:bg-art-cream disabled:text-art-ink/20 text-white rounded-lg p-2.5 transition duration-150 cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

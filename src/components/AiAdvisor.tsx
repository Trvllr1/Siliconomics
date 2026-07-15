/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Build } from '../types';
import { ComputedBuildMetrics } from '../utils/mathEngine';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface AiAdvisorProps {
  activeBuild: Build;
  computedMetrics: ComputedBuildMetrics;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

// Simple custom markdown renderer to format Gemini's structured response safely and beautifully
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
          // Parse bold markers: **Text**: Content
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
          
          // Regular list item with just bold text anywhere
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

export default function AiAdvisor({ activeBuild, computedMetrics }: AiAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = [
    'Analyze NRE amortization constraints',
    'Assess chiplet yield advantages',
    'Review gross margin sensitivity',
    'Generate full executive report'
  ];

  // Initialize with expert welcome
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `### **Manhattan Strategic Consultant**
Welcome to the Siliconomics Strategic Advisory module. I am configured with reference models for leading-edge foundry nodes (**3nm** to **10nm**) and standard industry cost formulas.

How can I assist in reviewing **${activeBuild.name}** today? Select a tactical audit query below or input a custom strategic question.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [activeBuild.id]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          build: activeBuild,
          computed: computedMetrics,
          customQuestion: textToSend
        }),
      });

      if (!response.ok) {
        throw new Error('Consultation request failed. Verify API key configurations.');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Connection lost. Please retry.');
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
          <span className="text-xs font-serif font-bold uppercase tracking-wider text-art-ink">AI Strategic Advisor</span>
        </div>
        <span className="text-[10px] bg-art-rust/20 text-art-rust border border-art-rust/30 px-2 py-0.5 rounded-full font-mono">
          Gemini Active
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-art-cream/25">
        {messages.map((msg) => (
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
        ))}

        {loading && (
          <div className="flex space-x-2.5 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-art-ink border border-art-ink/10 flex items-center justify-center text-art-rust animate-spin">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[80%] rounded-xl p-3 bg-white border-2 border-art-ink/5 shadow-sm flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 text-art-rust animate-spin" />
              <span className="text-xs text-art-ink/50 italic font-mono">Computing scenario consequences...</span>
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
          placeholder={`Inquire about ${activeBuild.name}...`}
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

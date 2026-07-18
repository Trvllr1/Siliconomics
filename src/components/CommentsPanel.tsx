import React, { useState } from 'react';
import { Comment, PersonaType } from '../types';
import { PERSONA_CONFIG } from '../data/personaConfig';
import { X, Send, MessageSquare } from 'lucide-react';

interface CommentsPanelProps {
  comments: Comment[];
  buildId: string;
  elementId: string | null;
  elementLabel: string;
  activePersona: PersonaType;
  onAddComment: (buildId: string, elementId: string, content: string) => void;
  onClose: () => void;
}

export default function CommentsPanel({
  comments,
  buildId,
  elementId,
  elementLabel,
  onAddComment,
  onClose,
}: CommentsPanelProps) {
  const [input, setInput] = useState('');

  const filtered = comments.filter(
    c => c.buildId === buildId && (!elementId || c.elementId === elementId)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || !elementId) return;
    onAddComment(buildId, elementId, trimmed);
    setInput('');
  };

  return (
    <div className="bg-white border-2 border-art-ink/10 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-art-cream/30 border-b border-art-ink/10">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-art-rust" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-art-ink">Comments</span>
          <span className="text-[9px] font-mono text-art-ink/40">on {elementLabel}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-art-cream rounded cursor-pointer">
          <X className="w-3.5 h-3.5 text-art-ink/50" />
        </button>
      </div>

      {/* Comment list */}
      <div className="max-h-64 overflow-y-auto space-y-2 px-4 py-3">
        {filtered.length === 0 ? (
          <p className="text-xs text-art-ink/40 text-center py-6 italic">No comments yet. Add the first annotation.</p>
        ) : (
          filtered.map((c) => {
            const cfg = PERSONA_CONFIG[c.role as PersonaType] || PERSONA_CONFIG.architect;
            return (
              <div key={c.id} className="bg-art-cream/20 rounded-lg p-3 border border-art-ink/5">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className="text-[8px] font-mono text-art-ink/30">
                    {new Date(c.timestamp).toLocaleString()}
                  </span>
                  {c.elementId && <span className="text-[8px] font-mono text-art-ink/20 ml-auto">#{c.elementId}</span>}
                </div>
                <p className="text-xs text-art-ink/80 leading-relaxed">{c.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      {elementId && (
        <div className="border-t border-art-ink/10 px-4 py-3 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Add a comment..."
            className="flex-1 bg-art-cream border border-art-ink/15 rounded-lg px-3 py-2 text-xs outline-none focus:border-art-rust"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="p-2 bg-art-rust text-white rounded-lg hover:bg-art-rust/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

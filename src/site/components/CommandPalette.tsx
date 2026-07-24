import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const COMMANDS = [
  { label: 'Launch Demo', action: '/app' },
  { label: 'Apply for partnership', action: '/partners' },
  { label: 'Compare monolithic vs chiplet', action: '/platform' },
  { label: 'Read the methodology', action: '/methodology' },
  { label: 'View pricing', action: '/pricing' },
  { label: 'Security posture', action: '/trust' },
  { label: 'All insights', action: '/insights' },
  { label: 'About the company', action: '/company' },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  const execute = useCallback((action: string) => {
    onClose();
    navigate(action);
  }, [onClose, navigate]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        execute(filtered[selectedIndex]!.action);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selectedIndex, execute]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-lg bg-surface-1 border border-art-ink/15 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-art-ink/10">
          <Search className="w-4 h-4 text-art-ink/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, commands..."
            className="flex-1 bg-transparent text-sm text-art-ink outline-none placeholder:text-art-ink/30"
          />
          <span className="text-[10px] font-mono text-art-ink/30 uppercase">ESC</span>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.action}
              onClick={() => execute(cmd.action)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                i === selectedIndex
                  ? 'bg-art-rust/10 text-art-rust'
                  : 'text-art-ink/70 hover:bg-art-ink/5'
              }`}
            >
              {cmd.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-4 text-sm text-art-ink/30">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}

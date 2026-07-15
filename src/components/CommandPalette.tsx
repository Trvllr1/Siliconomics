/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Build, PersonaType } from '../types';
import { Search, Monitor, Cpu, Database, Award, Settings, Terminal, Zap, ArrowRight, User } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  builds: Build[];
  activeBuildId: string;
  onSelectBuild: (id: string) => void;
  activePersona: PersonaType;
  onChangePersona: (persona: PersonaType) => void;
  onNavigate: (tab: string) => void;
  onQuickCompare: (idA: string, idB: string) => void;
}

interface CommandItem {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  action: () => void;
  icon: React.ReactNode;
}

export default function CommandPalette({
  isOpen,
  onClose,
  builds,
  activeBuildId,
  onSelectBuild,
  activePersona,
  onChangePersona,
  onNavigate,
  onQuickCompare,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const personaLabel = (p: PersonaType): string => {
    switch (p) {
      case 'architect': return 'Silicon Architect';
      case 'manufacturing': return 'Manufacturing Yield Eng';
      case 'finance': return 'Principal Financial Analyst';
      case 'program': return 'Program Director';
      case 'executive': return 'Executive Board Member';
    }
  };

  // Compile all commands
  const commands: CommandItem[] = [];

  // 1. Build Switching
  builds.forEach((b) => {
    commands.push({
      id: `build-${b.id}`,
      category: 'Select Semiconductor Build',
      label: `Open ${b.name} (${b.version}) - ${b.portfolio}`,
      shortcut: b.id === activeBuildId ? 'Active' : undefined,
      action: () => {
        onSelectBuild(b.id);
        onNavigate('build');
        onClose();
      },
      icon: <Cpu className="w-4 h-4 text-art-ink/60" />
    });
  });

  // 2. Persona Switching
  const personas: PersonaType[] = ['architect', 'manufacturing', 'finance', 'program', 'executive'];
  personas.forEach((p) => {
    commands.push({
      id: `persona-${p}`,
      category: 'Switch Persona Lens',
      label: `Switch to ${personaLabel(p)} View`,
      shortcut: p === activePersona ? 'Active' : undefined,
      action: () => {
        onChangePersona(p);
        onClose();
      },
      icon: <User className="w-4 h-4 text-art-ink/60" />
    });
  });

  // 3. Navigation
  const tabs = [
    { id: 'dashboard', label: 'Executive Command Dashboard', icon: <Monitor className="w-4 h-4 text-art-ink/60" /> },
    { id: 'build', label: 'Build Engineering Workspace', icon: <Cpu className="w-4 h-4 text-art-ink/60" /> },
    { id: 'compare', label: 'Side-by-Side Comparison Desk', icon: <Terminal className="w-4 h-4 text-art-ink/60" /> },
  ];
  tabs.forEach((t) => {
    commands.push({
      id: `nav-${t.id}`,
      category: 'Navigate Systems',
      label: `Go to ${t.label}`,
      action: () => {
        onNavigate(t.id);
        onClose();
      },
      icon: t.icon
    });
  });

  // 4. Advanced operations
  if (builds.length >= 2) {
    commands.push({
      id: 'op-compare-m1-m2',
      category: 'Advanced Strategic Tools',
      label: 'Compare Manhattan-X1 with Manhattan-X2',
      shortcut: 'Auto',
      action: () => {
        onQuickCompare('manhattan-x1', 'manhattan-x2');
        onNavigate('compare');
        onClose();
      },
      icon: <Zap className="w-4 h-4 text-art-rust" />
    });
  }

  // Filter commands by query
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Handle arrow navigation inside menu
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  // Group filtered commands by category
  const grouped: { [category: string]: CommandItem[] } = {};
  filteredCommands.forEach((cmd) => {
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = [];
    }
    grouped[cmd.category].push(cmd);
  });

  // Flat list index for hover matching
  let flatIndex = 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 overflow-hidden bg-art-ink/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl bg-white border-2 border-art-ink rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[55vh]"
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-art-ink/10 bg-art-cream/40">
          <Search className="w-5 h-5 text-art-rust mr-3 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, switch builds, change roles, or search workspace..."
            className="w-full text-xs text-art-ink bg-transparent outline-none placeholder-art-ink/40 font-sans"
          />
          <span className="text-[9px] bg-art-ink/10 text-art-ink/60 font-mono px-1.5 py-0.5 rounded flex-shrink-0">
            ESC to exit
          </span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 bg-white">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-art-ink/40 font-mono text-xs">
              No semiconductor commands found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="px-3 py-1 text-[9px] font-mono font-bold text-art-ink/50 uppercase tracking-widest bg-art-cream/60 rounded">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isSelected = selectedIndex === flatIndex;
                    const currentIndex = flatIndex;
                    flatIndex++; // Advance index across groups

                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        onClick={item.action}
                        className={`w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-lg font-medium transition-colors duration-100 ${
                          isSelected
                            ? 'bg-art-rust text-white'
                            : 'text-art-ink/80 hover:bg-art-cream/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={isSelected ? 'text-white font-bold' : 'text-art-ink/50'}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        
                        {item.shortcut && (
                          <span className={`text-[9px] font-mono rounded px-1.5 py-0.5 ${
                            isSelected ? 'bg-art-rust/20 text-white border border-white/20' : 'bg-art-cream border border-art-ink/10 text-art-ink/60'
                          }`}>
                            {item.shortcut}
                          </span>
                        )}
                        
                        {isSelected && !item.shortcut && (
                          <ArrowRight className="w-3.5 h-3.5 text-white animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-art-cream px-4 py-2.5 border-t border-art-ink/10 text-[10px] text-art-ink/50 flex items-center justify-between font-mono">
          <div className="flex space-x-4">
            <span>↑↓ Navigation</span>
            <span>↵ Enter to select</span>
          </div>
          <span>Siliconomics Command Central v1.0</span>
        </div>
      </div>
    </div>
  );
}

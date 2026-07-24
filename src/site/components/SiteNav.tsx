import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import CommandPalette from './CommandPalette';
import { NAV_ITEMS, STAKEHOLDER_SOLUTIONS } from '../content/pages';

export default function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);
  useLocation();

  // Scroll progress tracker
  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  // Focus trap for mobile menu
  const handleMobileKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileOpen(false);
      return;
    }
    if (e.key !== 'Tab' || !mobileMenuRef.current) return;
    const focusable = mobileMenuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Focus first element when mobile menu opens
  useEffect(() => {
    if (mobileOpen && mobileMenuRef.current) {
      const first = mobileMenuRef.current.querySelector<HTMLElement>('a[href], button');
      first?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!solutionsOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!solutionsMenuRef.current?.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSolutionsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [solutionsOpen]);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <nav className="sticky top-0 z-50 border-b border-art-ink/10 bg-surface-1/80 backdrop-blur-md" aria-label="Main navigation">
        {/* Scroll progress hairline */}
        <div
          className="absolute top-0 left-0 h-0.5 bg-art-rust transition-all duration-150"
          style={{ width: `${scrollProgress * 100}%` }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 focus-visible:outline-none">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" className="text-art-rust"/>
                <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.5" className="text-art-rust"/>
              </svg>
              <span className="font-sans font-bold text-sm text-art-ink">Siliconomics</span>
              <span className="text-[9px] font-mono text-art-ink/50 bg-art-ink/5 px-1.5 py-0.5 rounded">
                MANHATTAN
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-5">
              {NAV_ITEMS.map(item => item.href === '/solutions' ? (
                <div key={item.href} ref={solutionsMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setSolutionsOpen(open => !open)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-art-ink/70 hover:text-art-rust transition-colors"
                    aria-expanded={solutionsOpen}
                    aria-haspopup="menu"
                    aria-controls="stakeholder-solutions-menu"
                  >
                    {item.label}
                    <ChevronDown className={`h-3 w-3 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {solutionsOpen && (
                    <div id="stakeholder-solutions-menu" role="menu" className="absolute left-1/2 top-full z-50 mt-4 w-80 -translate-x-1/2 border border-art-ink/10 bg-surface-1 p-2 shadow-[0_20px_45px_rgba(0,0,0,0.22)]">
                      <Link
                        to="/solutions"
                        role="menuitem"
                        onClick={() => setSolutionsOpen(false)}
                        className="block border-b border-art-ink/10 px-3 py-3 text-xs font-bold text-art-ink hover:bg-art-ink/5"
                      >
                        All stakeholder solutions
                      </Link>
                      <div className="py-1">
                        {STAKEHOLDER_SOLUTIONS.map(solution => (
                          <Link
                            key={solution.slug}
                            to={`/solutions/${solution.slug}`}
                            role="menuitem"
                            onClick={() => setSolutionsOpen(false)}
                            className="block px-3 py-2.5 transition-colors hover:bg-art-ink/5"
                          >
                            <span className="block text-xs font-bold text-art-ink">{solution.navLabel}</span>
                            <span className="mt-0.5 block text-[10px] leading-relaxed text-art-ink/55">{solution.eyebrow}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-xs font-medium text-art-ink/70 hover:text-art-rust transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Cmd+K search hint */}
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-art-ink/40 border border-art-ink/10 rounded hover:border-art-ink/20 hover:text-art-ink/60 transition-colors"
                aria-label="Open command palette (Ctrl+K)"
              >
                <kbd className="text-[10px]">⌘K</kbd>
              </button>

              <Link
                to="/app"
                className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors"
              >
                Launch Demo
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-1 text-art-ink/70 hover:text-art-ink"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div
              id="mobile-menu"
              ref={mobileMenuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              onKeyDown={handleMobileKeyDown}
              className="md:hidden border-t border-art-ink/10 py-4 space-y-3"
            >
                {NAV_ITEMS.map(item => item.href === '/solutions' ? (
                  <div key={item.href}>
                    <button
                      type="button"
                      onClick={() => setMobileSolutionsOpen(open => !open)}
                      className="flex w-full items-center justify-between text-sm font-medium text-art-ink/70 hover:text-art-rust transition-colors"
                      aria-expanded={mobileSolutionsOpen}
                      aria-controls="mobile-stakeholder-solutions"
                    >
                      {item.label}
                      <ChevronDown className={`h-4 w-4 transition-transform ${mobileSolutionsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {mobileSolutionsOpen && (
                      <div id="mobile-stakeholder-solutions" className="mt-3 space-y-3 border-l border-art-ink/10 pl-4">
                        <Link to="/solutions" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-art-rust">
                          All stakeholder solutions
                        </Link>
                        {STAKEHOLDER_SOLUTIONS.map(solution => (
                          <Link
                            key={solution.slug}
                            to={`/solutions/${solution.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block text-xs font-medium text-art-ink/65 hover:text-art-rust transition-colors"
                          >
                            {solution.navLabel}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium text-art-ink/70 hover:text-art-rust transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              <div className="pt-2 border-t border-art-ink/10">
                <button
                  onClick={() => { setMobileOpen(false); setPaletteOpen(true); }}
                  className="text-xs font-mono text-art-ink/40 hover:text-art-ink/60 transition-colors"
                >
                  Search... <kbd className="text-[10px]">⌘K</kbd>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

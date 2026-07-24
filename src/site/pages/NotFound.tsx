import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="bg-art-cream min-h-screen flex items-center justify-center">
      <SEO title="404 — Not Found" description="The requested page does not exist." noindex />
      <div className="text-center">
        <div className="bg-surface-2 border border-art-ink/10 rounded-lg p-8 inline-block mb-6 font-mono">
          <div className="text-risk-crimson text-lg font-bold mb-2">ROUTE NOT FOUND</div>
          <div className="text-art-ink/50 text-sm mb-4">exit code 1</div>
          <div className="text-art-ink/30 text-xs">
            The requested path does not exist in the Siliconomics namespace.
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-mono text-art-ink/40">
            Try searching with <span className="text-art-rust">⌘K</span> or go to the homepage.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-md bg-art-rust text-white hover:bg-art-rust/90 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center px-4 py-2 text-xs font-medium border border-art-ink/10 rounded-md text-art-ink/70 hover:border-art-ink/20 transition-colors"
            >
              Launch Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

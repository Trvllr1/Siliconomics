import { Link } from 'react-router-dom';

interface PricingCardProps {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}

export default function PricingCard({ title, price, subtitle, features, cta, ctaHref, highlighted }: PricingCardProps) {
  return (
    <div
      className={`rounded-lg border p-6 flex flex-col relative ${
        highlighted
          ? 'border-art-rust bg-art-rust/5 shadow-[0_0_0_1px_rgba(0,191,166,0.2)]'
          : 'border-art-ink/10 bg-surface-1'
      }`}
      aria-label={`${title} tier: ${price}`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[9px] font-mono font-bold text-art-rust bg-art-rust/10 border border-art-rust/20 px-3 py-0.5 rounded-full uppercase tracking-wider">
            Recommended
          </span>
        </div>
      )}
      <h3 className="text-lg font-bold text-art-ink mb-1">{title}</h3>
      <div className="text-2xl font-mono font-bold text-art-ink mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{price}</div>
      <p className="text-xs font-mono text-art-ink/50 mb-4">{subtitle}</p>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map(f => (
          <li key={f} className="text-xs text-art-ink/70 flex items-start gap-2">
            <span className="text-ver-green mt-0.5" aria-hidden="true">▸</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={ctaHref}
        className={`block text-center text-xs font-bold py-2 px-4 rounded-md transition-colors ${
          highlighted
            ? 'bg-art-rust text-white hover:bg-art-rust/90'
            : 'bg-surface-2 text-art-ink border border-art-ink/10 hover:border-art-ink/20'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
